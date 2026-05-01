import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import ItemSmallView from "../../components/boxes/ItemViewSmall";
import ItemViewUsable from "../../components/boxes/ItemViewUsable";
import { useItems } from "../../hooks/useItems";
import { useChest } from "../../hooks/useChest";
import { useNotification } from "../../contexts/NotificationContext";
import { ID_CHEST_ITEMS, ID_POTION_ITEMS, ID_INVENTORY_MENUS } from "../../constants/app_ids";
import ChestRollingDialog from "./ChestRollingDialog";
import ProduceListDialog from "../../components/boxes/ItemViewMarketplace";
import { getInventoryBags, getInventoryMaxSlots, getProduceUsedSlots, SLOTS_PER_BAG } from "../../utils/inventorySlots";

const FILTERS = [
  { id: 'ALL',                        label: 'All' },
  { id: ID_INVENTORY_MENUS.SEEDS,     label: 'Seeds' },
  { id: ID_INVENTORY_MENUS.PRODUCE,   label: 'Produce' },
];

const USABLE_FILTERS = new Set([ID_INVENTORY_MENUS.CHESTS]);

// --- Image lookup tables (must match PlayerPullNotification) ---
const CROP_SEED_PATHS = {
  Apple:        { folder: 'appleseed', prefix: 'apple' },
  Avocado:      { folder: 'avocadoseed', prefix: 'avocado' },
  Banana:       { folder: 'bananaseed', prefix: 'ban' },
  Blueberry:    { folder: 'blueberryseed', prefix: 'blueberry' },
  'Bok Choy':   { folder: 'bochoyseed', prefix: 'boc' },
  Bokchoy:      { folder: 'bochoyseed', prefix: 'boc' },
  Broccoli:     { folder: 'brocseed', prefix: 'broc' },
  Cauliflower:  { folder: 'califlowerseed', prefix: 'califlower' },
  Carrot:       { folder: 'carrotseed', prefix: 'carrot' },
  Celery:       { folder: 'celseed', prefix: 'cel' },
  Cabbage:      { folder: 'celseed', prefix: 'cel' },
  Corn:         { folder: 'cornseed', prefix: 'corn' },
  'Dragon Fruit':{ folder: 'dragonfruitseed', prefix: 'drag' },
  Dragonfruit:  { folder: 'dragonfruitseed', prefix: 'drag' },
  Eggplant:     { folder: 'eggplantseed', prefix: 'egg' },
  Grape:        { folder: 'grapeseed', prefix: 'grape' },
  Grapes:       { folder: 'grapeseed', prefix: 'grape' },
  Lavender:     { folder: 'lavendarseed', prefix: 'lav' },
  Lettuce:      { folder: 'lettuceseed', prefix: 'lettuce' },
  Lychee:       { folder: 'lycheeseed', prefix: 'ly' },
  Lichi:        { folder: 'lycheeseed', prefix: 'ly' },
  Mango:        { folder: 'mangoseed', prefix: 'mango' },
  Onion:        { folder: 'onseed', prefix: 'on' },
  Papaya:       { folder: 'papyaseed', prefix: 'pap' },
  Pepper:       { folder: 'pepperseed', prefix: 'pepper' },
  Pineapple:    { folder: 'pineseed', prefix: 'pine' },
  Pomegranate:  { folder: 'pomseed', prefix: 'pom' },
  Potato:       { folder: 'potseed', prefix: 'pot' },
  Pumpkin:      { folder: 'pumpkinseed', prefix: 'pumpkin' },
  Radish:       { folder: 'raddishseed', prefix: 'raddish' },
  Tomato:       { folder: 'tomatoseed', prefix: 'tom' },
  Turnip:       { folder: 'turnipseed', prefix: 'turnip' },
  Wheat:        { folder: 'wheatseed', prefix: 'wheat' },
};

const CROP_DEFAULT_IMAGES = {
  Apple:         '/images/crops/new/apple/defultapple.png',
  Avocado:       '/images/crops/new/avocado/defultavocado.png',
  Banana:        '/images/crops/new/banana/defultbanaa.png',
  Blueberry:     '/images/crops/new/blueberry/defultblueberry.png',
  'Bok Choy':    '/images/crops/new/wheat/defultbokchoy.png',
  Bokchoy:       '/images/crops/new/wheat/defultbokchoy.png',
  Broccoli:      '/images/crops/new/brocoli/defultbroc.png',
  Cauliflower:   '/images/crops/new/califlower/defultcaliflower.png',
  Carrot:        '/images/crops/new/carrot/defultcarrot.png',
  Celery:        '/images/crops/new/cellary/defultcellary.png',
  Cabbage:       '/images/crops/new/cellary/defultcellary.png',
  Corn:          '/images/crops/new/corn/defultcorn.png',
  'Dragon Fruit':'/images/crops/new/dragonfruit/defultdragon.png',
  Dragonfruit:   '/images/crops/new/dragonfruit/defultdragon.png',
  Eggplant:      '/images/crops/new/eggplant/defulteggplant.png',
  Grape:         '/images/crops/new/grape/defultgrape.png',
  Grapes:        '/images/crops/new/grape/defultgrape.png',
  Lavender:      '/images/crops/new/lavendar/defultlavendar.png',
  Lettuce:       '/images/crops/new/lettuce/defultlettuce.png',
  Lychee:        '/images/crops/new/lychee/defultlychee.png',
  Lichi:         '/images/crops/new/lychee/defultlychee.png',
  Mango:         '/images/crops/new/mango/defultmango.png',
  Onion:         '/images/crops/new/onion/defultonion.png',
  Papaya:        '/images/crops/new/papaya/defultpapaya.png',
  Pepper:        '/images/crops/new/pepper/defultpepper.png',
  Pineapple:     '/images/crops/new/pineapple/defultpineapple.png',
  Pomegranate:   '/images/crops/new/pomagrante/defultpom.png',
  Potato:        '/images/crops/new/potato/defultpotato.png',
  Pumpkin:       '/images/crops/new/pumpkin/defultpumpkin.png',
  Radish:        '/images/crops/new/raddish/defultraddish.png',
  Tomato:        '/images/crops/new/tomato/defulttomato.png',
  Turnip:        '/images/crops/new/turnip/defultturnip.png',
  Wheat:         '/images/crops/new/wheat/defultwheat.png',
};

// Decode rarity tier from a seed id (rarity is encoded in bits 12+).
const getRarityCode = (seedId) => {
  const rarityLevel = (Number(seedId) >> 12) & 0xF;
  // 1 = common, 2 = uncommon, 3 = rare, 4 = epic, 5 = legendary
  // Default to common (level 1 or 0) for plain ids.
  if (rarityLevel <= 1) return 'com';
  return ['', 'com', 'uncom', 'rare', 'epic', 'leg'][rarityLevel] || 'com';
};

// Build a case-insensitive lookup so seed labels like "POTATO" still match the "Potato" key.
const SEED_PATHS_CI = Object.fromEntries(
  Object.entries(CROP_SEED_PATHS).map(([k, v]) => [k.toLowerCase(), v])
);

const getInventorySeedImage = (label, seedId) => {
  if (!label) return null;
  // Normalize the label: lowercase, strip "F." (feeble) prefix.
  const normalized = label.toString().replace(/^F\./i, '').trim().toLowerCase();
  const data = SEED_PATHS_CI[normalized];
  if (!data) return null;
  const code = getRarityCode(seedId);
  return `/images/seeds/${data.folder}/${data.prefix}${code}.png`;
};

// Case-insensitive default-image lookup (mirrors SEED_PATHS_CI).
const DEFAULT_IMAGES_CI = Object.fromEntries(
  Object.entries(CROP_DEFAULT_IMAGES).map(([k, v]) => [k.toLowerCase(), v])
);

const getInventoryItemImage = (item) => {
  if (!item) return null;
  const label = item.label || '';
  const normalized = label.replace(/^F\./i, '').trim().toLowerCase();
  // Produce → default per-crop crop image
  if (item.category === 'ID_ITEM_CROP' || item.category === 'PRODUCE' || (typeof item.category === 'number' && item.category === 2)) {
    return DEFAULT_IMAGES_CI[normalized] || null;
  }
  // Seed → rarity-tier seed image
  return getInventorySeedImage(label, item.id);
};

const InventoryDialog = ({ onClose }) => {
  const [filter, setFilter] = useState('ALL');
  const { seeds, productions, baits, fish, chests, potions, items, refetch } = useItems();
  const { openChest } = useChest();
  const { show } = useNotification();

  const [usingItemId, setUsingItemId] = useState(null);
  const [chestResult, setChestResult] = useState(null);
  const [showChestDialog, setShowChestDialog] = useState(false);
  const [selectedProduce, setSelectedProduce] = useState(null);
  const [trashItem, setTrashItem] = useState(null);
  const [trashMode, setTrashMode] = useState(false);
  const [trashHover, setTrashHover] = useState(false);
  const [bagCount, setBagCount] = useState(getInventoryBags);
  const [usedSlots, setUsedSlots] = useState(getProduceUsedSlots);

  useEffect(() => {
    const refresh = () => {
      setBagCount(getInventoryBags());
      setUsedSlots(getProduceUsedSlots());
    };
    window.addEventListener('sandboxGoldChanged', refresh);
    return () => window.removeEventListener('sandboxGoldChanged', refresh);
  }, []);

  const maxSlots = bagCount * SLOTS_PER_BAG;

  // Only show items the user actually owns (count > 0).
  const ownedSeeds   = (seeds || []).filter((s) => (s.count || 0) > 0);
  const ownedProduce = (productions || []).filter((p) => (p.count || 0) > 0);
  const displayItems = (() => {
    if (filter === 'SEEDS')   return ownedSeeds;
    if (filter === 'PRODUCE') return ownedProduce;
    return [...ownedSeeds, ...ownedProduce];
  })();

  const isOnFarmPage = () =>
    window.location.pathname === '/farm' || window.location.pathname.endsWith('/farm');

  const onUseItem = async (itemId) => {
    setUsingItemId(itemId);
    try {
      if (Number(itemId) === ID_CHEST_ITEMS.CHEST_WOOD ||
          Number(itemId) === ID_CHEST_ITEMS.CHEST_BRONZE ||
          Number(itemId) === ID_CHEST_ITEMS.CHEST_SILVER ||
          Number(itemId) === ID_CHEST_ITEMS.CHEST_GOLD) {
        show("Opening chest...", "info");
        const result = await openChest(Number(itemId) & 0xFF);
        if (result.success && result.results?.length > 0) {
          setChestResult({ rewardId: result.results[0], chestType: Number(itemId) & 0xFF });
          setShowChestDialog(true);
          await refetch();
          const retry = async (attempt = 1) => {
            await refetch();
            if (attempt < 5) setTimeout(() => retry(attempt + 1), 1000 * attempt);
          };
          setTimeout(() => retry(), 1000);
        } else if (result.success) {
          show("Chest opened successfully!", "success");
          await refetch();
        }
        return;
      }

      const potionEvents = {
        [ID_POTION_ITEMS.POTION_GROWTH_ELIXIR]: 'Growth Elixir',
        [ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_II]: 'Growth Elixir',
        [ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III]: 'Growth Elixir',
        [ID_POTION_ITEMS.POTION_PESTICIDE]: 'Pesticide',
        [ID_POTION_ITEMS.POTION_PESTICIDE_II]: 'Pesticide',
        [ID_POTION_ITEMS.POTION_PESTICIDE_III]: 'Pesticide',
        [ID_POTION_ITEMS.POTION_FERTILIZER]: 'Fertilizer',
        [ID_POTION_ITEMS.POTION_FERTILIZER_II]: 'Fertilizer',
        [ID_POTION_ITEMS.POTION_FERTILIZER_III]: 'Fertilizer',
        [ID_POTION_ITEMS.SCARECROW]: 'Scarecrow',
        [ID_POTION_ITEMS.LADYBUG]: 'Ladybug',
        9998: 'Water Sprinkler',
        9999: 'Umbrella',
        9955: 'Yarn',
      };

      if (potionEvents[itemId]) {
        if (isOnFarmPage()) {
          window.dispatchEvent(new CustomEvent('startPotionUsage', { detail: { id: itemId, name: potionEvents[itemId] } }));
          onClose();
        } else {
          show("Go to the Farm to use this item.", "info");
        }
        return;
      }

      show("This item cannot be used directly from inventory.", "warning");
    } catch (error) {
      show(`Error: ${error.message}`, "error");
    } finally {
      setUsingItemId(null);
    }
  };

  const allItems = [
    ...seeds.filter(i => i.count > 0),
    ...productions.filter(i => i.count > 0),
  ];

  const filterMap = {
    'ALL': allItems,
    [ID_INVENTORY_MENUS.SEEDS]:   seeds.filter(i => i.count > 0),
    [ID_INVENTORY_MENUS.PRODUCE]: productions.filter(i => i.count > 0),
  };

  const visibleItems = filterMap[filter] || allItems;
  const isUsableFilter = USABLE_FILTERS.has(filter);

  const handleTrash = (item) => {
    if (!item) return;
    try {
      const key = `sandbox_item_${item.id}`;
      localStorage.removeItem(key);
      // Also remove from seeds/produce sandbox storage
      const seedsKey = 'sandbox_seeds';
      const produceKey = 'sandbox_produce';
      [seedsKey, produceKey].forEach(k => {
        try {
          const stored = JSON.parse(localStorage.getItem(k) || '[]');
          const updated = stored.filter(i => String(i.id) !== String(item.id));
          localStorage.setItem(k, JSON.stringify(updated));
        } catch {}
      });
      window.dispatchEvent(new CustomEvent('sandboxGoldChanged'));
      refetch();
      show(`Discarded ${item.label || 'item'}`, 'info');
    } catch {}
    setTrashItem(null);
    setTrashMode(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
      >
        <img
          src="/images/inventory/inventory.png"
          alt="Inventory"
          draggable={false}
          style={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
        />
        {/* Close (X) button */}
        <img
          src="/images/inventory/x.png"
          alt="Close"
          draggable={false}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'calc(8% + 60px)',
            right: 'calc(4% - 54px)',
            width: '70px',
            height: 'auto',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'none';
          }}
        />
        {/* Filter tabs (All / Seeds / Produce) — clickable image buttons */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(14% + 120px)',
            left: '50%',
            transform: 'translateX(calc(-50% + 130px))',
            display: 'flex',
            gap: '12px',
            pointerEvents: 'none',
          }}
        >
          {[
            { id: 'ALL',     src: '/images/inventory/all.png',     alt: 'All'     },
            { id: 'SEEDS',   src: '/images/inventory/seeds.png',   alt: 'Seeds'   },
            { id: 'PRODUCE', src: '/images/inventory/produce.png', alt: 'Produce' },
          ].map((tab) => (
            <img
              key={tab.id}
              src={tab.src}
              alt={tab.alt}
              draggable={false}
              onClick={() => setFilter(tab.id)}
              style={{
                width: '110px', height: 'auto', objectFit: 'contain',
                cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none',
                transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                filter: filter === tab.id
                  ? 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                if (filter !== tab.id) {
                  e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 4px rgba(255,220,100,0.7))';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = filter === tab.id
                  ? 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))'
                  : 'none';
              }}
            />
          ))}
        </div>
        {/* 3 rows × 5 boxes overlaid on the inventory image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            // Fixed cell sizes so boxes stay the same size regardless of how close they sit.
            gridTemplateColumns: 'repeat(5, 95px)',
            gridTemplateRows: 'repeat(3, 95px)',
            justifyContent: 'center',
            alignContent: 'center',
            columnGap: '6px',
            rowGap: '6px',
            padding: '28% 12%',
            pointerEvents: 'none',
            transform: 'translate(132.5px, 65px)',
          }}
        >
          {Array.from({ length: 15 }).map((_, i) => {
            const item = displayItems[i];
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'auto', cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const wrap = e.currentTarget.querySelector('.box-wrap');
                  if (wrap) {
                    wrap.style.transform = 'scale(1.1)';
                    wrap.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))';
                  }
                }}
                onMouseLeave={(e) => {
                  const wrap = e.currentTarget.querySelector('.box-wrap');
                  if (wrap) {
                    wrap.style.transform = 'scale(1)';
                    wrap.style.filter = 'none';
                  }
                }}
              >
                <div
                  className="box-wrap"
                  style={{
                    position: 'relative', width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                  }}
                >
                  <img
                    src="/images/inventory/box.png"
                    alt=""
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }}
                  />
                  {item && (() => {
                    const imgSrc = getInventoryItemImage(item) || item.image;
                    return (
                    <>
                      <img
                        src={imgSrc}
                        alt={item.label || ''}
                        draggable={false}
                        style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '70%', height: '70%', objectFit: 'contain',
                          userSelect: 'none', pointerEvents: 'none',
                        }}
                      />
                      {item.count > 1 && (
                        <span
                          style={{
                            position: 'absolute', right: '8%', bottom: '6%',
                            fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                            fontSize: '14px', color: '#fff',
                            textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
                            pointerEvents: 'none',
                          }}
                        >
                          {item.count}
                        </span>
                      )}
                    </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* eslint-disable */
  // Legacy UI kept below for reference; not rendered.
  // eslint-disable-next-line no-unreachable
  return (
    <>
      <style>{`
        .inv-filter-btn {
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: #aaa;
          font-family: GROBOLD, Cartoonist, sans-serif;
          font-size: 10px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .inv-filter-btn.active {
          background: rgba(245,216,122,0.2);
          border-color: rgba(245,216,122,0.5);
          color: #f5d87a;
        }
        .inv-filter-btn:hover:not(.active) {
          background: rgba(255,255,255,0.1);
          color: #ddd;
        }
        img[src*="rock.png"], img[src*="wood.png"], img[src*="axe.png"], img[src*="picaxe.png"] { transform: scale(0.1); }
        img[src*="yarn.png"] { transform: scale(0.5); }
      `}</style>

      <BaseDialog onClose={onClose} title="INVENTORY" header="/images/dialog/modal-header-inventory.png" headerOffset={10}>
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Banner image — shown at the top when the inventory dialog opens */}
          <img
            src="/images/inventory/inventory.png"
            alt="Inventory"
            draggable={false}
            style={{ width: '100%', display: 'block', objectFit: 'contain', userSelect: 'none' }}
          />

          {/* Slot bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${Math.min(100, (usedSlots / maxSlots) * 100)}%`,
                background: usedSlots >= maxSlots ? '#ff5555' : usedSlots / maxSlots > 0.75 ? '#f5a623' : '#5dbb63',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              color: usedSlots >= maxSlots ? '#ff7777' : '#aaa',
              fontSize: 10, fontFamily: 'monospace', whiteSpace: 'nowrap',
            }}>
              {usedSlots}/{maxSlots} slots
            </span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`inv-filter-btn${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div style={{ position: 'relative', minHeight: 300, maxHeight: 380, overflowY: 'auto', paddingRight: 4, paddingBottom: 48 }}>
            {visibleItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', fontSize: 12, paddingTop: 60 }}>
                Nothing here yet
              </div>
            ) : isUsableFilter ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                {visibleItems.map((item, i) => (
                  <ItemViewUsable
                    key={i}
                    itemId={item.id}
                    count={item.count}
                    onUse={onUseItem}
                    usable={item.usable}
                    buttonLabel={Number(usingItemId) === Number(item.id) ? "Using..." : "Use"}
                    disabled={Number(usingItemId) === Number(item.id)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: '8px 4px 16px 4px', justifyContent: 'flex-start' }}>
                {visibleItems.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      cursor: trashMode ? 'crosshair' : 'pointer',
                      outline: trashMode ? '1px dashed rgba(204,51,51,0.4)' : 'none',
                      borderRadius: 6,
                      transition: 'outline 0.1s',
                    }}
                    onClick={() => {
                      if (trashMode) {
                        setTrashItem(item);
                        return;
                      }
                      if (item.category && (String(item.category).includes('CROP') || String(item.category).includes('PRODUCE') || String(item.category).includes('FISH')))
                        setSelectedProduce(item);
                    }}
                  >
                    <ItemSmallView itemId={item.id} count={item.count} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trash confirm overlay */}
          {trashItem && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 99999,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #1a0a0a, #2a1010)',
                border: '2px solid #cc3333',
                borderRadius: 12, padding: '24px 32px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                fontFamily: 'GROBOLD, Cartoonist, sans-serif',
              }}>
                <div style={{ fontSize: 40 }}>🗑️</div>
                <div style={{ color: '#fff', fontSize: 14 }}>Discard <span style={{ color: '#f5d87a' }}>{trashItem.label || 'this item'}</span>?</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => handleTrash(trashItem)} style={{ padding: '6px 20px', background: '#cc3333', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Discard</button>
                  <button onClick={() => { setTrashItem(null); setTrashMode(false); }} style={{ padding: '6px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Trash can — bottom right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <div
            onMouseEnter={() => setTrashHover(true)}
            onMouseLeave={() => setTrashHover(false)}
            onClick={() => setTrashMode(m => !m)}
            style={{
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: trashMode ? 'rgba(204,51,51,0.35)' : trashHover ? 'rgba(204,51,51,0.2)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${trashMode || trashHover ? '#cc3333' : 'rgba(255,255,255,0.12)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontSize: 22,
              userSelect: 'none',
              boxShadow: trashMode ? '0 0 10px rgba(204,51,51,0.5)' : 'none',
            }}
            title={trashMode ? 'Click an item to delete it — click here to cancel' : 'Click to enter delete mode'}
          >
            🗑️
          </div>
        </div>

      </BaseDialog>

      {selectedProduce && (
        <ProduceListDialog item={selectedProduce} onClose={() => setSelectedProduce(null)} />
      )}

      {showChestDialog && chestResult && (
        <ChestRollingDialog
          rollingInfo={chestResult}
          onClose={() => { setShowChestDialog(false); setChestResult(null); refetch(); }}
          onBack={() => { setShowChestDialog(false); setChestResult(null); refetch(); }}
        />
      )}
    </>
  );
};

export default InventoryDialog;
