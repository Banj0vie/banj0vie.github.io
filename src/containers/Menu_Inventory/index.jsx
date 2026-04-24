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
