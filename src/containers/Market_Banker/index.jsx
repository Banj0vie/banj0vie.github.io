import React, { useState, useEffect, useMemo } from "react";
import BaseDialog from "../_BaseDialog";
import { useItems } from "../../hooks/useItems";
import { useNotification } from "../../contexts/NotificationContext";
import { ALL_ITEMS } from "../../constants/item_data";
import { ID_ITEM_CATEGORIES } from "../../constants/app_ids";
import { CARD_FRONT_IMAGES, getBaseAndRarity } from "../Market_Vendor/PokemonPackRipDialog";

// --- Inventory-image lookup tables (kept in sync with Menu_Inventory). Used so the bank's
// item rendering matches the bag inventory's icons exactly.
const CROP_SEED_PATHS = {
  Apple: { folder: 'appleseed', prefix: 'apple' }, Avocado: { folder: 'avocadoseed', prefix: 'avocado' },
  Banana: { folder: 'bananaseed', prefix: 'ban' }, Blueberry: { folder: 'blueberryseed', prefix: 'blueberry' },
  'Bok Choy': { folder: 'bochoyseed', prefix: 'boc' }, Bokchoy: { folder: 'bochoyseed', prefix: 'boc' },
  Broccoli: { folder: 'brocseed', prefix: 'broc' }, Cauliflower: { folder: 'califlowerseed', prefix: 'califlower' },
  Carrot: { folder: 'carrotseed', prefix: 'carrot' }, Celery: { folder: 'celseed', prefix: 'cel' },
  Cabbage: { folder: 'celseed', prefix: 'cel' }, Corn: { folder: 'cornseed', prefix: 'corn' },
  'Dragon Fruit': { folder: 'dragonfruitseed', prefix: 'drag' }, Dragonfruit: { folder: 'dragonfruitseed', prefix: 'drag' },
  Eggplant: { folder: 'eggplantseed', prefix: 'egg' }, Grape: { folder: 'grapeseed', prefix: 'grape' },
  Grapes: { folder: 'grapeseed', prefix: 'grape' }, Lavender: { folder: 'lavendarseed', prefix: 'lav' },
  Lettuce: { folder: 'lettuceseed', prefix: 'lettuce' }, Lychee: { folder: 'lycheeseed', prefix: 'ly' },
  Lichi: { folder: 'lycheeseed', prefix: 'ly' }, Mango: { folder: 'mangoseed', prefix: 'mango' },
  Onion: { folder: 'onseed', prefix: 'on' }, Papaya: { folder: 'papyaseed', prefix: 'pap' },
  Pepper: { folder: 'pepperseed', prefix: 'pepper' }, Pineapple: { folder: 'pineseed', prefix: 'pine' },
  Pomegranate: { folder: 'pomseed', prefix: 'pom' }, Potato: { folder: 'potseed', prefix: 'pot' },
  Pumpkin: { folder: 'pumpkinseed', prefix: 'pumpkin' }, Radish: { folder: 'raddishseed', prefix: 'raddish' },
  Tomato: { folder: 'tomatoseed', prefix: 'tom' }, Turnip: { folder: 'turnipseed', prefix: 'turnip' },
  Wheat: { folder: 'wheatseed', prefix: 'wheat' },
};
const CROP_DEFAULT_IMAGES = {
  Apple: '/images/crops/new/apple/defultapple.png', Avocado: '/images/crops/new/avocado/defultavocado.png',
  Banana: '/images/crops/new/banana/defultbanaa.png', Blueberry: '/images/crops/new/blueberry/defultblueberry.png',
  'Bok Choy': '/images/crops/new/wheat/defultbokchoy.png', Bokchoy: '/images/crops/new/wheat/defultbokchoy.png',
  Broccoli: '/images/crops/new/brocoli/defultbroc.png', Cauliflower: '/images/crops/new/califlower/defultcaliflower.png',
  Carrot: '/images/crops/new/carrot/defultcarrot.png', Celery: '/images/crops/new/cellary/defultcellary.png',
  Cabbage: '/images/crops/new/cellary/defultcellary.png', Corn: '/images/crops/new/corn/defultcorn.png',
  'Dragon Fruit': '/images/crops/new/dragonfruit/defultdragon.png', Dragonfruit: '/images/crops/new/dragonfruit/defultdragon.png',
  Eggplant: '/images/crops/new/eggplant/defulteggplant.png', Grape: '/images/crops/new/grape/defultgrape.png',
  Grapes: '/images/crops/new/grape/defultgrape.png', Lavender: '/images/crops/new/lavendar/defultlavendar.png',
  Lettuce: '/images/crops/new/lettuce/defultlettuce.png', Lychee: '/images/crops/new/lychee/defultlychee.png',
  Lichi: '/images/crops/new/lychee/defultlychee.png', Mango: '/images/crops/new/mango/defultmango.png',
  Onion: '/images/crops/new/onion/defultonion.png', Papaya: '/images/crops/new/papaya/defultpapaya.png',
  Pepper: '/images/crops/new/pepper/defultpepper.png', Pineapple: '/images/crops/new/pineapple/defultpineapple.png',
  Pomegranate: '/images/crops/new/pomagrante/defultpom.png', Potato: '/images/crops/new/potato/defultpotato.png',
  Pumpkin: '/images/crops/new/pumpkin/defultpumpkin.png', Radish: '/images/crops/new/raddish/defultraddish.png',
  Tomato: '/images/crops/new/tomato/defulttomato.png', Turnip: '/images/crops/new/turnip/defultturnip.png',
  Wheat: '/images/crops/new/wheat/defultwheat.png',
};
const SEED_PATHS_CI = Object.fromEntries(Object.entries(CROP_SEED_PATHS).map(([k, v]) => [k.toLowerCase(), v]));
const DEFAULT_IMAGES_CI = Object.fromEntries(Object.entries(CROP_DEFAULT_IMAGES).map(([k, v]) => [k.toLowerCase(), v]));
const getRarityCode = (seedId) => {
  const rarityLevel = (Number(seedId) >> 12) & 0xF;
  if (rarityLevel <= 1) return 'com';
  return ['', 'com', 'uncom', 'rare', 'epic', 'leg'][rarityLevel] || 'com';
};
const getInventoryItemImage = (item) => {
  if (!item) return null;
  const label = (item.label || '').replace(/^F\./i, '').trim().toLowerCase();
  if (item.category === 'ID_ITEM_CROP' || item.category === 'PRODUCE' || (typeof item.category === 'number' && item.category === 2)) {
    return DEFAULT_IMAGES_CI[label] || item.image || null;
  }
  const data = SEED_PATHS_CI[label];
  if (data) return `/images/seeds/${data.folder}/${data.prefix}${getRarityCode(item.id)}.png`;
  return item.image || null;
};

// Tier 1 (default account) capacity. Higher tiers (e.g. tier 2 → 100) come later.
const BANK_MAX_SLOTS = 50;
// Max items per single stack/slot (any seed or crop). Beyond this the item spills into
// a fresh slot.
const BANK_MAX_PER_STACK = 5;

// Number of slots a given total count occupies, given the per-stack cap.
const stacksForCount = (count) => Math.ceil(Math.max(0, Number(count) || 0) / BANK_MAX_PER_STACK);
// Total stacks currently used across all bank items.
const computeBankStacks = (bank) => Object.values(bank || {}).reduce(
  (sum, c) => sum + stacksForCount(c), 0,
);

const getBank = () => {
  try { return JSON.parse(localStorage.getItem('sandbox_bank_items') || '{}'); }
  catch { return {}; }
};
const setBank = (bank) => {
  localStorage.setItem('sandbox_bank_items', JSON.stringify(bank));
};

// Determine which sandbox bucket an item lives in. Produce → sandbox_produce,
// everything else (loot, baits, fish, chests, potions, etc.) → sandbox_loot.
const isProduceItem = (itemId) => {
  const cat = ALL_ITEMS[itemId]?.category;
  return cat === ID_ITEM_CATEGORIES?.PRODUCE
      || cat === ID_ITEM_CATEGORIES?.CROP
      || cat === 'PRODUCE'
      || cat === 'ID_ITEM_CROP';
};

// Move 1 unit between player inventory and bank. Returns true on success.
const transferOne = (itemId, fromBank) => {
  const bank = getBank();
  const produce = (() => { try { return JSON.parse(localStorage.getItem('sandbox_produce') || '{}'); } catch { return {}; } })();
  const loot = (() => { try { return JSON.parse(localStorage.getItem('sandbox_loot') || '{}'); } catch { return {}; } })();

  if (fromBank) {
    // Withdraw: bank → player
    if ((bank[itemId] || 0) <= 0) return false;
    bank[itemId] = (bank[itemId] || 0) - 1;
    if (bank[itemId] <= 0) delete bank[itemId];
    if (isProduceItem(itemId)) produce[itemId] = (produce[itemId] || 0) + 1;
    else loot[itemId] = (loot[itemId] || 0) + 1;
  } else {
    // Deposit: player → bank. Stacks are capped at BANK_MAX_PER_STACK; a deposit that
    // would push the item past a multiple of the cap creates a fresh stack and must
    // fit within BANK_MAX_SLOTS total stacks.
    const stacksBefore = computeBankStacks(bank);
    const currentItemStacks = stacksForCount(bank[itemId] || 0);
    const newItemStacks = stacksForCount((bank[itemId] || 0) + 1);
    const stacksAfter = stacksBefore - currentItemStacks + newItemStacks;
    if (stacksAfter > BANK_MAX_SLOTS) return false; // bank full

    let from = null;
    if ((produce[itemId] || 0) > 0) from = 'produce';
    else if ((loot[itemId] || 0) > 0) from = 'loot';
    if (!from) return false;

    if (from === 'produce') {
      produce[itemId] = produce[itemId] - 1;
      if (produce[itemId] <= 0) delete produce[itemId];
    } else {
      loot[itemId] = loot[itemId] - 1;
      if (loot[itemId] <= 0) delete loot[itemId];
    }
    bank[itemId] = (bank[itemId] || 0) + 1;
  }

  setBank(bank);
  localStorage.setItem('sandbox_produce', JSON.stringify(produce));
  localStorage.setItem('sandbox_loot', JSON.stringify(loot));
  window.dispatchEvent(new CustomEvent('sandboxGoldChanged'));
  return true;
};

const ChoiceButton = ({ label, sublabel, onClick, disabled = false, highlight = false }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      padding: '18px 28px', borderRadius: 10,
      border: `2px solid ${highlight ? '#f5d87a' : disabled ? 'rgba(200,130,26,0.35)' : '#c8821a'}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: highlight
        ? 'linear-gradient(135deg, rgba(245,216,122,0.30), rgba(245,166,35,0.30))'
        : disabled
          ? 'linear-gradient(135deg, rgba(120,90,40,0.12), rgba(160,120,60,0.10))'
          : 'linear-gradient(135deg, rgba(200,130,26,0.18), rgba(245,166,35,0.18))',
      color: highlight ? '#fff' : disabled ? '#888' : '#fff',
      fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 18, letterSpacing: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      transition: 'transform 0.15s ease, filter 0.15s ease',
      opacity: disabled && !highlight ? 0.6 : 1,
      animation: highlight ? 'bankActionHighlight 1.1s ease-in-out infinite' : 'none',
    }}
    onMouseEnter={(e) => {
      if (disabled) return;
      e.currentTarget.style.filter = 'brightness(1.15)';
      e.currentTarget.style.transform = 'scale(1.03)';
    }}
    onMouseLeave={(e) => {
      if (disabled) return;
      e.currentTarget.style.filter = 'brightness(1)';
      e.currentTarget.style.transform = highlight ? '' : 'scale(1)';
    }}
  >
    {label}
    {sublabel && <span style={{ fontSize: 11, color: disabled && !highlight ? '#666' : '#ccc', letterSpacing: 0.5 }}>{sublabel}</span>}
  </button>
);

const BankerDialog = ({ onClose, label = "BANKER", header = "" }) => {
  const [mode, setMode] = useState('choice'); // 'choice' | 'account'
  const [accountOpened, setAccountOpened] = useState(
    () => localStorage.getItem('sandbox_bank_account_opened') === 'true'
  );

  // Mark the body while the banker popup is open so PlayerPullNotification suppresses
  // pull notifications (mirrors the data-letter-open / data-cutscene-active patterns).
  // Also tear down any visible notification on mount, same as the mailbox does.
  useEffect(() => {
    document.body.setAttribute('data-bank-open', 'true');
    window.dispatchEvent(new CustomEvent('letterOpened'));
    return () => document.body.removeAttribute('data-bank-open');
  }, []);
  // Track the bank cutscene step (-1 if not active) so we can gate the "Open an Account"
  // button: locked until the cutscene reaches step 8 (the "tap on open an account" prompt).
  // Outside of the cutscene the button is always enabled.
  const [cutsceneStep, setCutsceneStep] = useState(() => {
    const raw = localStorage.getItem('sandbox_bank_cutscene_step');
    return raw == null ? -1 : parseInt(raw, 10);
  });
  useEffect(() => {
    const update = () => {
      const raw = localStorage.getItem('sandbox_bank_cutscene_step');
      setCutsceneStep(raw == null ? -1 : parseInt(raw, 10));
    };
    window.addEventListener('questStateChanged', update);
    return () => window.removeEventListener('questStateChanged', update);
  }, []);

  const cutsceneActive = cutsceneStep >= 0;
  const canOpenAccount = !cutsceneActive || cutsceneStep === 8;

  const openAccount = () => {
    if (!canOpenAccount) return;
    localStorage.setItem('sandbox_bank_account_opened', 'true');
    setAccountOpened(true);
    // Drop straight into the unified account view so the rest of the cutscene plays
    // over the bank + player inventory popups (where the banker's deposit/withdraw
    // explanations make visual sense).
    setMode('account');
    // Tell market.jsx to advance the bank cutscene if it's still running.
    window.dispatchEvent(new CustomEvent('bankAccountOpened'));
  };

  const username = (typeof window !== 'undefined' && localStorage.getItem('sandbox_username')) || 'Farmer';
  // Once the account is opened, the dialog title shows "{name}'s Account" instead of BANKER.
  const dialogTitle = accountOpened ? `${username}'s Account` : label;

  if (mode === 'account') {
    return (
      <BankInventoryView
        onBack={() => setMode('choice')}
        onClose={onClose}
        label={dialogTitle}
        header={header}
      />
    );
  }

  // Choice screen — pre-account: only "Open an account" is shown. Post-account:
  // a single "{name}'s Account" button opens the unified deposit/withdraw view.
  return (
    <BaseDialog onClose={onClose} title={dialogTitle} header={header}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0', minWidth: 320 }}>
        <div style={{ textAlign: 'center', color: '#f5d87a', fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 14, letterSpacing: 1, marginBottom: 4 }}>
          {accountOpened ? 'What would you like to do?' : 'Welcome to the Bank!'}
        </div>
        {!accountOpened && (
          <div style={{ textAlign: 'center', color: '#ccc', fontSize: 12, fontFamily: 'monospace', maxWidth: 300, alignSelf: 'center', lineHeight: 1.5 }}>
            You'll need to open an account before you can deposit or withdraw items.
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          {accountOpened ? (
            <ChoiceButton
              label={`${username}'s Account`}
              sublabel="Deposit & withdraw"
              onClick={() => setMode('account')}
            />
          ) : (
            <ChoiceButton
              label="Open an Account"
              sublabel={canOpenAccount ? 'Get started' : 'Listen to the banker first…'}
              onClick={openAccount}
              disabled={!canOpenAccount}
            />
          )}
        </div>
      </div>
    </BaseDialog>
  );
};

// Deposit/Withdraw inventory view — grid of items, click to transfer 1 unit.
// Renders the inventory-popup look (inventory.png + box.png slots) for an arbitrary item
// list. Used by both the centered bank popup and the floating top-left player-inventory
// panel during deposit mode.
const InventoryStylePopup = ({
  items,           // array of {id, count, label, category, image}
  capacity,        // number of slots to render (15 = single page; 50 = paginated)
  page,            // current page (0-indexed)
  totalPages,      // computed total pages
  onPagePrev,
  onPageNext,
  onItemClick,     // (itemId) => void; pass null for read-only
  title,
  showClose,       // whether to render the inventory X button
  onClose,
  showBack,
  onBack,
  scale = 1,       // overall popup scale (1 = full size, 0.5 = half size for the floating panel)
  slotSize = 95,   // px size of each box.png slot inside the grid
  gridGap = 6,     // px gap between slots
  gridPadding = '28% 12%',
  gridTransform = 'translate(132.5px, 65px)',
  actionLabel = null, // optional badge ("WITHDRAW" / "DEPOSIT") shown below the title
  actionLabelStyle = null, // override styles merged onto the badge (position tweaks etc.)
  actionOnClick = null, // optional click handler that turns the badge into a real button
  previewImage = null, // optional image rendered in the left preview panel area
  selectedItemId = null, // highlights ANY slot containing this item id (legacy)
  selectedSlotIndex = null, // highlights ONLY the slot at this absolute index
  onPreviewPrev = null, // callback for the left arrow on the preview card
  onPreviewNext = null, // callback for the right arrow on the preview card
  previewIndicator = null, // optional small "1 / 3" badge over the card
  positionStyle = {}, // any extra positioning overrides
  zIndex = 100000,
}) => {
  const slotsPerPage = 15;
  const start = page * slotsPerPage;
  const visibleItems = items.slice(start, start + slotsPerPage);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        // CSS zoom (vs transform: scale) shrinks the layout box and hit area too, so a
        // scaled popup doesn't invisibly cover other UI. Supported in Chrome/Edge/Safari
        // and Firefox 126+.
        zoom: scale !== 1 ? scale : undefined,
        ...positionStyle,
      }}
    >
      <img
        src="/images/inventory/inventory.png"
        alt={title || 'Inventory'}
        draggable={false}
        style={{ display: 'block', maxWidth: scale === 1 ? '90vw' : 'none', maxHeight: scale === 1 ? '90vh' : 'none', objectFit: 'contain', userSelect: 'none' }}
      />

      {/* Title overlay (e.g. BANK / DEPOSIT / WITHDRAW / YOUR INVENTORY) */}
      {title && (
        <div style={{
          position: 'absolute', top: 'calc(8% + 10px)', left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 22, color: '#f5d87a',
          textShadow: '2px 2px 0 rgba(0,0,0,0.6)', letterSpacing: 2, pointerEvents: 'none', userSelect: 'none',
        }}>
          {title}
        </div>
      )}

      {/* Preview image — rendered in the empty left panel area of the inventory frame.
          Used by the bank popup to show the seed-pack card-front of whichever item the
          user most recently clicked in the bank grid. */}
      {previewImage && (
        <div style={{
          position: 'absolute',
          top: 'calc(24% + 30px)', left: 'calc(12% - 50px)',
          width: '34%', pointerEvents: 'none',
        }}>
          <img
            src={previewImage}
            alt=""
            draggable={false}
            style={{
              width: '100%', height: 'auto', objectFit: 'contain',
              userSelect: 'none', display: 'block',
              filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
            }}
          />
          {/* Prev / Next arrows overlaid on the card. The parent uses pointerEvents: none
              so the card itself doesn't capture clicks; the arrows re-enable pointer
              events on themselves. Each is rendered only if the corresponding callback
              is provided (so first item shows only →, last shows only ←). */}
          {onPreviewPrev && (
            <div
              onClick={onPreviewPrev}
              style={{
                position: 'absolute', top: '50%', left: '-6%',
                transform: 'translateY(-50%)',
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(20,10,5,0.85)', border: '2px solid #c8821a',
                color: '#f5d87a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 20, lineHeight: 1,
                cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
                transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.2) drop-shadow(0 0 6px rgba(245,216,122,0.7))';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              ‹
            </div>
          )}
          {onPreviewNext && (
            <div
              onClick={onPreviewNext}
              style={{
                position: 'absolute', top: '50%', right: '-6%',
                transform: 'translateY(-50%)',
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(20,10,5,0.85)', border: '2px solid #c8821a',
                color: '#f5d87a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 20, lineHeight: 1,
                cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
                transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.2) drop-shadow(0 0 6px rgba(245,216,122,0.7))';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'translateY(-50%)';
              }}
            >
              ›
            </div>
          )}
          {/* "1 / 3" instance indicator — small badge near the top of the card showing
              which card in the stack the user is currently viewing. */}
          {previewIndicator && (
            <div style={{
              position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
              padding: '3px 10px', borderRadius: 10,
              background: 'rgba(20,10,5,0.85)', border: '2px solid #c8821a',
              color: '#f5d87a',
              fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 12, letterSpacing: 1,
              textShadow: '1px 1px 0 #000',
              pointerEvents: 'none', userSelect: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap',
            }}>
              {previewIndicator}
            </div>
          )}
        </div>
      )}

      {/* Action badge — labels the popup's purpose ("WITHDRAW" / "DEPOSIT"). Becomes a
          real clickable button when actionOnClick is provided; otherwise it's just a
          visual cue with pointerEvents: none. */}
      {actionLabel && (
        <div
          onClick={actionOnClick || undefined}
          style={{
            position: 'absolute',
            top: 'calc(8% + 60px)', left: '50%', transform: 'translateX(-50%)',
            padding: '6px 22px', borderRadius: 8,
            background: 'rgba(20,10,5,0.92)', color: '#f5d87a',
            border: '2px solid #c8821a',
            fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 14, letterSpacing: 2,
            textShadow: '1px 1px 0 #000',
            pointerEvents: actionOnClick ? 'auto' : 'none',
            cursor: actionOnClick ? 'pointer' : 'default',
            userSelect: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
            ...(actionLabelStyle || {}),
          }}
          onMouseEnter={(e) => {
            if (!actionOnClick) return;
            e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(245,216,122,0.85))';
            const baseTransform = (actionLabelStyle && actionLabelStyle.transform) || 'translateX(-50%)';
            e.currentTarget.style.transform = `${baseTransform} scale(1.05)`;
          }}
          onMouseLeave={(e) => {
            if (!actionOnClick) return;
            e.currentTarget.style.filter = 'none';
            const baseTransform = (actionLabelStyle && actionLabelStyle.transform) || 'translateX(-50%)';
            e.currentTarget.style.transform = baseTransform;
          }}
        >
          {actionLabel}
        </div>
      )}

      {/* Close (X) button */}
      {showClose && (
        <img
          src="/images/inventory/x.png"
          alt="Close"
          draggable={false}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'calc(8% + 60px)', right: 'calc(4% - 54px)',
            width: 70, height: 'auto', cursor: 'pointer', userSelect: 'none',
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
      )}

      {/* 3 rows × 5 boxes overlaid on the inventory image. Slot size + spacing are
          configurable per-instance so the small floating popup can use larger boxes
          without affecting the centered bank popup. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(5, ${slotSize}px)`,
          gridTemplateRows: `repeat(3, ${slotSize}px)`,
          justifyContent: 'center',
          alignContent: 'center',
          columnGap: gridGap, rowGap: gridGap,
          padding: gridPadding,
          pointerEvents: 'none',
          transform: gridTransform,
        }}
      >
        {Array.from({ length: slotsPerPage }).map((_, i) => {
          const item = visibleItems[i];
          const absoluteIndex = start + i;
          const clickable = !!(item && onItemClick);
          const isSelected = !!item && (
            (selectedSlotIndex != null && absoluteIndex === selectedSlotIndex) ||
            (selectedItemId != null && item.id === selectedItemId)
          );
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'auto', cursor: 'pointer',
              }}
              onClick={clickable ? () => onItemClick(item.id, absoluteIndex) : undefined}
              onMouseEnter={(e) => {
                const wrap = e.currentTarget.querySelector('.box-wrap');
                if (wrap && !isSelected) {
                  wrap.style.transform = 'scale(1.1)';
                  wrap.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))';
                }
              }}
              onMouseLeave={(e) => {
                const wrap = e.currentTarget.querySelector('.box-wrap');
                if (wrap && !isSelected) {
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
                  // Persistent highlight when this slot is the selected bank item.
                  ...(isSelected ? {
                    transform: 'scale(1.08)',
                    filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(255,220,100,1)) drop-shadow(0 0 16px rgba(255,180,40,0.9))',
                  } : {}),
                }}
              >
                <img
                  src="/images/inventory/box.png"
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }}
                />
                {item && (() => {
                  const imgSrc = getInventoryItemImage({ ...item, label: ALL_ITEMS[item.id]?.label, category: ALL_ITEMS[item.id]?.category, image: ALL_ITEMS[item.id]?.image }) || ALL_ITEMS[item.id]?.image;
                  return (
                    <>
                      {imgSrc && (
                        <img
                          src={imgSrc}
                          alt={ALL_ITEMS[item.id]?.label || ''}
                          draggable={false}
                          style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '70%', height: '70%', objectFit: 'contain',
                            userSelect: 'none', pointerEvents: 'none',
                          }}
                        />
                      )}
                      {item.count > 1 && (
                        <span style={{
                          position: 'absolute', right: '8%', bottom: '6%',
                          fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                          fontSize: 14, color: '#fff',
                          textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
                          pointerEvents: 'none',
                        }}>
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

      {/* Pagination + Back button (only on the bank popup; the floating panel hides them) */}
      {(totalPages > 1 || showBack) && (
        <div style={{
          position: 'absolute', bottom: 'calc(8% - 10px)', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto',
        }}>
          {showBack && (
            <button
              onClick={onBack}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '2px solid #c8821a',
                background: 'rgba(20,10,5,0.85)', color: '#f5d87a',
                fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 13, letterSpacing: 1, cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
          {totalPages > 1 && (
            <>
              <button
                onClick={onPagePrev}
                disabled={page === 0}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  border: `2px solid ${page === 0 ? 'rgba(200,130,26,0.35)' : '#c8821a'}`,
                  background: 'rgba(20,10,5,0.85)',
                  color: page === 0 ? '#666' : '#f5d87a',
                  fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 13, letterSpacing: 1,
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                ‹ Prev
              </button>
              <span style={{ color: '#f5d87a', fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 13 }}>
                Page {page + 1} / {totalPages}
              </span>
              <button
                onClick={onPageNext}
                disabled={page >= totalPages - 1}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  border: `2px solid ${page >= totalPages - 1 ? 'rgba(200,130,26,0.35)' : '#c8821a'}`,
                  background: 'rgba(20,10,5,0.85)',
                  color: page >= totalPages - 1 ? '#666' : '#f5d87a',
                  fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 13, letterSpacing: 1,
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Next ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const BankInventoryView = ({ onBack, onClose, label, header }) => {
  // Match the regular bag inventory: it shows seeds + productions, so the bank's deposit
  // panel pulls from the same two arrays for parity (chests/potions/baits/fish stay in
  // their dedicated UIs and aren't depositable here).
  const { seeds, productions, refetch } = useItems();
  const [bankState, setBankState] = useState(getBank);
  const [feedback, setFeedback] = useState('');
  const [bankPage, setBankPage] = useState(0);
  // Tracks the absolute index (into bankSlots, the chunked stack list) of the slot the
  // user clicked. This is what the highlight + preview + WITHDRAW button operate on.
  // Stacks of the same item id can occupy multiple slots (cap = BANK_MAX_PER_STACK).
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  // Index of which "instance" within the selected slot the user is viewing (0-based).
  // For a slot of 3 corn cards, 0 = card 1/3, 1 = card 2/3, etc. Arrows cycle this.
  const [instanceIndex, setInstanceIndex] = useState(0);
  const { show } = useNotification();

  useEffect(() => {
    const update = () => setBankState(getBank());
    window.addEventListener('sandboxGoldChanged', update);
    return () => window.removeEventListener('sandboxGoldChanged', update);
  }, []);

  const bankItems = useMemo(() => (
    Object.entries(bankState)
      .filter(([_, count]) => Number(count) > 0)
      .map(([id, count]) => ({ id: Number(id), count: Number(count) }))
      .filter((it) => ALL_ITEMS[it.id])
  ), [bankState]);

  // Chunk bank items into stacks of at most BANK_MAX_PER_STACK so the grid renders one
  // box per stack. 8 corn → [{corn,5}, {corn,3}].
  const bankSlots = useMemo(() => {
    const out = [];
    bankItems.forEach((it) => {
      let remaining = it.count;
      while (remaining > 0) {
        const stackCount = Math.min(BANK_MAX_PER_STACK, remaining);
        out.push({ id: it.id, count: stackCount });
        remaining -= stackCount;
      }
    });
    return out;
  }, [bankItems]);

  const playerItems = useMemo(() => {
    const all = [...(seeds || []), ...(productions || [])];
    return all
      .filter((it) => (it.count || 0) > 0)
      .map((it) => ({ id: Number(it.id), count: Number(it.count) }));
  }, [seeds, productions]);

  const bankUsedSlots = bankSlots.length;
  const bankTotalPages = Math.max(1, Math.ceil(BANK_MAX_SLOTS / 15));

  // Bank-side click receives the absolute slot index from InventoryStylePopup; floating
  // (deposit) side receives the item id. We branch on the second arg so one handler
  // works for both.
  const onItemClick = (idOrSlotIndex, fromBank) => {
    if (fromBank === true) {
      setSelectedSlotIndex(idOrSlotIndex);
      setInstanceIndex(0);
      return;
    }
    // Floating-popup deposits still happen on click.
    const itemId = idOrSlotIndex;
    const ok = transferOne(itemId, false);
    if (!ok) {
      // Distinguish "bank stack capacity hit" from "you have none of that item".
      const stacksBefore = computeBankStacks(bankState);
      const before = stacksForCount(bankState[itemId] || 0);
      const after = stacksForCount((bankState[itemId] || 0) + 1);
      const wouldOverflow = (stacksBefore - before + after) > BANK_MAX_SLOTS;
      setFeedback(wouldOverflow ? 'Bank is full!' : 'Cannot deposit (no items).');
      setTimeout(() => setFeedback(''), 1800);
      return;
    }
    setBankState(getBank());
    refetch && refetch();
  };

  // Selected slot info (id + count for that specific stack).
  const selectedSlot = (selectedSlotIndex != null) ? bankSlots[selectedSlotIndex] : null;
  const selectedSlotCount = selectedSlot?.count || 0;

  // Withdraw 1 from the selected stack via the WITHDRAW button.
  const withdrawSelected = () => {
    if (!selectedSlot) {
      setFeedback('Pick a bank item first.');
      setTimeout(() => setFeedback(''), 1800);
      return;
    }
    const ok = transferOne(selectedSlot.id, true);
    if (!ok) {
      setFeedback('Cannot withdraw (out of stock).');
      setTimeout(() => setFeedback(''), 1800);
      return;
    }
    const next = getBank();
    setBankState(next);
    refetch && refetch();
    // Re-chunk to figure out if our slot is still there. If the slot vanished or the
    // count shrank below our instance pointer, adjust.
    const nextSlots = [];
    Object.entries(next).forEach(([id, c]) => {
      const num = Number(c) || 0;
      if (!ALL_ITEMS[Number(id)]) return;
      let remaining = num;
      while (remaining > 0) {
        nextSlots.push({ id: Number(id), count: Math.min(BANK_MAX_PER_STACK, remaining) });
        remaining -= BANK_MAX_PER_STACK;
      }
    });
    const stillThere = nextSlots[selectedSlotIndex];
    if (!stillThere || stillThere.id !== selectedSlot.id) {
      setSelectedSlotIndex(null);
      setInstanceIndex(0);
    } else {
      setInstanceIndex((idx) => Math.min(idx, Math.max(0, stillThere.count - 1)));
    }
  };

  // Arrows cycle through the SELECTED STACK's count: 0..selectedSlotCount-1.
  // First card = right arrow only. Last card = left arrow only. Single = neither.
  const cycleInstance = (delta) => {
    setInstanceIndex((idx) => {
      const next = idx + delta;
      if (next < 0 || next >= selectedSlotCount) return idx;
      return next;
    });
  };
  const canCyclePrev = selectedSlotCount > 1 && instanceIndex > 0;
  const canCycleNext = selectedSlotCount > 1 && instanceIndex < selectedSlotCount - 1;

  // Resolve the card-front image for the currently-selected stack, if any.
  const selectedCardImage = useMemo(() => {
    if (!selectedSlot) return null;
    const { baseId, rarityLevel } = getBaseAndRarity(Number(selectedSlot.id));
    return CARD_FRONT_IMAGES?.[baseId]?.[rarityLevel] || null;
  }, [selectedSlot]);

  return (
    <>
      {/* Backdrop dim — same overlay treatment the regular inventory popup uses. */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {/* Centered bank popup — chunked stacks, click to select, WITHDRAW button to act. */}
        <InventoryStylePopup
          items={bankSlots}
          capacity={BANK_MAX_SLOTS}
          page={bankPage}
          totalPages={bankTotalPages}
          onPagePrev={() => setBankPage((p) => Math.max(0, p - 1))}
          onPageNext={() => setBankPage((p) => Math.min(bankTotalPages - 1, p + 1))}
          onItemClick={(id, slotIndex) => onItemClick(slotIndex, true)}
          title={`${label} (${bankUsedSlots}/${BANK_MAX_SLOTS})`}
          actionLabel="WITHDRAW"
          actionLabelStyle={{ top: 'calc(8% + 480px)', transform: 'translateX(calc(-50% - 235px))' }}
          actionOnClick={withdrawSelected}
          previewImage={selectedCardImage}
          selectedSlotIndex={selectedSlotIndex}
          onPreviewPrev={canCyclePrev ? () => cycleInstance(-1) : null}
          onPreviewNext={canCycleNext ? () => cycleInstance(1) : null}
          previewIndicator={selectedSlotCount > 1 ? `${instanceIndex + 1} / ${selectedSlotCount}` : null}
          showClose
          onClose={onClose}
          showBack
          onBack={onBack}
        />

        {/* Floating player-inventory popup — anchored top-left, scaled via CSS zoom so
            its hit area also shrinks. Click an item to deposit 1 unit. */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: 12, left: -3, zIndex: 100002, pointerEvents: 'auto' }}
        >
          <InventoryStylePopup
            items={playerItems}
            capacity={15}
            page={0}
            totalPages={1}
            onItemClick={(id) => onItemClick(id, false)}
            scale={0.25}
            slotSize={180}
            gridGap={5}
            gridTransform="translate(242.5px, 65px)"
            actionLabel="DEPOSIT"
          />
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 100003,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(80,20,20,0.95)', color: '#ff9977',
            fontFamily: 'monospace', fontSize: 13,
          }}>
            {feedback}
          </div>
        )}
      </div>
    </>
  );
};

export default BankerDialog;
