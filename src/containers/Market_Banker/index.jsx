import React, { useState, useEffect, useMemo } from "react";
import BaseDialog from "../_BaseDialog";
import { useItems } from "../../hooks/useItems";
import { ALL_ITEMS } from "../../constants/item_data";
import { ID_ITEM_CATEGORIES } from "../../constants/app_ids";
import { CARD_FRONT_IMAGES, getBaseAndRarity } from "../Market_Vendor/PokemonPackRipDialog";
import { CROP_CARD_IMAGES } from "../../components/HarvestCardReveal";

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

// Bank capacity is split across 3 pages of a 4×6 grid (24 stacks each).
// 3 × 24 = 72 stacks × 10 items per stack = 720 items total.
const BANK_SLOTS_PER_PAGE = 24;
const BANK_PAGE_COUNT = 3;
const BANK_MAX_SLOTS = BANK_SLOTS_PER_PAGE * BANK_PAGE_COUNT;
// Max items per single stack/slot (any seed or crop). Beyond this the item spills into
// a fresh slot.
const BANK_MAX_PER_STACK = 10;

// Number of slots a given total count occupies, given the per-stack cap.
const stacksForCount = (count) => Math.ceil(Math.max(0, Number(count) || 0) / BANK_MAX_PER_STACK);

// Storage model: array of length BANK_MAX_SLOTS, each entry either {id, count} or null.
// Slot index encodes WHICH page a stack lives on, so deposits can target the player's
// current page even when earlier pages still have empty slots.
const blankSlots = () => new Array(BANK_MAX_SLOTS).fill(null);

const normalizeSlots = (raw) => {
  const out = blankSlots();
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < Math.min(raw.length, BANK_MAX_SLOTS); i++) {
    const s = raw[i];
    if (s && typeof s === 'object' && s.id != null && Number(s.count) > 0) {
      out[i] = { id: Number(s.id), count: Math.min(BANK_MAX_PER_STACK, Number(s.count) || 0) };
    }
  }
  return out;
};

// Migrate the legacy {itemId: count} dict format → packed slot array.
const migrateDictToSlots = (dict) => {
  const slots = blankSlots();
  let idx = 0;
  for (const [id, count] of Object.entries(dict || {})) {
    let remaining = Number(count) || 0;
    while (remaining > 0 && idx < BANK_MAX_SLOTS) {
      const stackCount = Math.min(BANK_MAX_PER_STACK, remaining);
      slots[idx++] = { id: Number(id), count: stackCount };
      remaining -= stackCount;
    }
  }
  return slots;
};

const getBank = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('sandbox_bank_items') || 'null');
    if (Array.isArray(raw)) return normalizeSlots(raw);
    if (raw && typeof raw === 'object') return migrateDictToSlots(raw);
  } catch {}
  return blankSlots();
};
const setBank = (slots) => {
  localStorage.setItem('sandbox_bank_items', JSON.stringify(slots));
};

// Total stacks currently used (number of non-null slots).
const computeBankStacks = (slots) => (slots || []).filter((s) => s != null).length;

// Aggregate counts by item id for "how many of itemId in the bank?" lookups.
const totalsByItem = (slots) => {
  const out = {};
  for (const s of slots || []) {
    if (!s) continue;
    out[s.id] = (out[s.id] || 0) + s.count;
  }
  return out;
};

// Find first empty slot at or after fromIndex, wrapping back to start if needed.
const findEmptySlot = (slots, fromIndex) => {
  const start = Math.max(0, Math.min(BANK_MAX_SLOTS - 1, fromIndex || 0));
  for (let i = start; i < BANK_MAX_SLOTS; i++) if (!slots[i]) return i;
  for (let i = 0; i < start; i++) if (!slots[i]) return i;
  return -1;
};

// Find an existing stack of itemId that still has room. Prefer slots at or after
// fromIndex (so depositing on page 2 tops up a page-2 stack first), then wrap.
const findStackWithRoom = (slots, itemId, fromIndex = 0) => {
  const id = Number(itemId);
  const start = Math.max(0, Math.min(BANK_MAX_SLOTS - 1, fromIndex || 0));
  for (let i = start; i < BANK_MAX_SLOTS; i++) {
    if (slots[i] && slots[i].id === id && slots[i].count < BANK_MAX_PER_STACK) return i;
  }
  for (let i = 0; i < start; i++) {
    if (slots[i] && slots[i].id === id && slots[i].count < BANK_MAX_PER_STACK) return i;
  }
  return -1;
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
// `depositPage` is the page index the user is currently viewing — new stacks
// (when no existing stack has room) are placed in that page first so deposits
// don't backfill into earlier pages.
const transferOne = (itemId, fromBank, depositPage = 0) => {
  const slots = getBank();
  const id = Number(itemId);
  const produce = (() => { try { return JSON.parse(localStorage.getItem('sandbox_produce') || '{}'); } catch { return {}; } })();
  const loot = (() => { try { return JSON.parse(localStorage.getItem('sandbox_loot') || '{}'); } catch { return {}; } })();

  if (fromBank) {
    // Withdraw: pull from the lowest-indexed slot containing this id.
    let slotIdx = -1;
    for (let i = 0; i < BANK_MAX_SLOTS; i++) {
      if (slots[i] && slots[i].id === id) { slotIdx = i; break; }
    }
    if (slotIdx === -1) return false;
    slots[slotIdx].count -= 1;
    if (slots[slotIdx].count <= 0) slots[slotIdx] = null;
    if (isProduceItem(id)) produce[id] = (produce[id] || 0) + 1;
    else loot[id] = (loot[id] || 0) + 1;
  } else {
    // Deposit: confirm the player has the item before touching the bank.
    let from = null;
    if ((produce[id] || 0) > 0) from = 'produce';
    else if ((loot[id] || 0) > 0) from = 'loot';
    if (!from) return false;

    const pageStart = Math.max(0, depositPage | 0) * BANK_SLOTS_PER_PAGE;
    // 1. Try to top up an existing stack of same id, preferring current page.
    let stackIdx = findStackWithRoom(slots, id, pageStart);
    if (stackIdx === -1) {
      // 2. Allocate a new stack starting at the current page; wraps if full.
      stackIdx = findEmptySlot(slots, pageStart);
      if (stackIdx === -1) return false; // bank full
      slots[stackIdx] = { id, count: 0 };
    }
    slots[stackIdx].count += 1;

    if (from === 'produce') {
      produce[id] = produce[id] - 1;
      if (produce[id] <= 0) delete produce[id];
    } else {
      loot[id] = loot[id] - 1;
      if (loot[id] <= 0) delete loot[id];
    }
  }

  setBank(slots);
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
    // Door-chime "ding-dong" on entering the bank.
    try {
      const a = new Audio('/sounds/dingdong.wav');
      a.volume = 0.7;
      a.play().catch(() => {});
    } catch (_) {}
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
  page,            // current page (0-indexed)
  totalPages,      // computed total pages
  onPagePrev,
  onPageNext,
  onItemClick,     // (itemId, slotIndex) => void; pass null for read-only
  title,
  showClose,       // whether to render the inventory X button
  onClose,
  showBack,
  onBack,
  scale = 1,       // overall popup scale (1 = full size, 0.5 = half size for the floating panel)
  slotSize = 88,   // px size of each box.png slot inside the grid
  gridGap = 6,     // px gap between slots
  gridPadding = '28% 12%',
  gridTransform = 'translate(122.5px, 65px)',
  actionLabel = null, // optional badge ("WITHDRAW" / "DEPOSIT") shown below the title
  actionLabelStyle = null, // override styles merged onto the badge (position tweaks etc.)
  actionOnClick = null, // optional click handler that turns the badge into a real button
  actionLabel2 = null, // optional second badge sitting next to the first
  actionLabelStyle2 = null, // override styles for the second badge
  actionOnClick2 = null, // click handler for the second badge
  actionLabel3 = null, // optional third badge
  actionLabelStyle3 = null,
  actionOnClick3 = null,
  previewImage = null, // optional image rendered in the left preview panel area
  previewWeightInfo = null, // optional { w, d } for the weight/date overlay on the card
  previewShowWeight = false, // whether to render the weight/date overlay (produce only)
  selectedSlotIndex = null, // highlights ONLY the slot at this absolute index
  onPreviewPrev = null, // callback for the left arrow on the preview card
  onPreviewNext = null, // callback for the right arrow on the preview card
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
      }}
    >
      <img
        src="/images/inventory/inventory.png"
        alt={title || 'Inventory'}
        draggable={false}
        style={{ display: 'block', maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', userSelect: 'none' }}
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
          top: 'calc(50% - 83.5px)', left: 'calc(12% - 30px)',
          pointerEvents: 'none',
        }}>
          <img
            src={previewImage}
            alt=""
            draggable={false}
            style={{
              display: 'block',
              height: '297px', width: 'auto',
              userSelect: 'none',
              filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.55))',
            }}
          />
          {/* Weight + Date Obtained overlay — produce only. Hidden for seed packs. */}
          {previewShowWeight && (
            <div style={{
              position: 'absolute', bottom: 'calc(6% + 14px)', left: 0, right: 0,
              textAlign: 'center',
              fontFamily: 'GROBOLD, Cartoonist, sans-serif',
              color: '#fff',
              textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
              lineHeight: 1.3,
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '11px', letterSpacing: 1 }}>
                Weight: {previewWeightInfo
                  ? (previewWeightInfo.w >= 1000 ? `${(previewWeightInfo.w / 1000).toFixed(2)} kg` : `${previewWeightInfo.w} g`)
                  : 'Unknown'}
              </div>
              <div style={{ fontSize: '11px', letterSpacing: 1 }}>
                Date Obtained: {(() => {
                  const ts = previewWeightInfo ? previewWeightInfo.d : Date.now();
                  const d = new Date(ts);
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${m}/${day}/${d.getFullYear()}`;
                })()}
              </div>
            </div>
          )}
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

      {/* Optional secondary action badge — same look, different label/handler. */}
      {actionLabel2 && (
        <div
          onClick={actionOnClick2 || undefined}
          style={{
            position: 'absolute',
            top: 'calc(8% + 60px)', left: '50%', transform: 'translateX(-50%)',
            padding: '6px 22px', borderRadius: 8,
            background: 'rgba(20,10,5,0.92)', color: '#f5d87a',
            border: '2px solid #c8821a',
            fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 14, letterSpacing: 2,
            textShadow: '1px 1px 0 #000',
            pointerEvents: actionOnClick2 ? 'auto' : 'none',
            cursor: actionOnClick2 ? 'pointer' : 'default',
            userSelect: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
            ...(actionLabelStyle2 || {}),
          }}
          onMouseEnter={(e) => {
            if (!actionOnClick2) return;
            e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(245,216,122,0.85))';
            const baseTransform = (actionLabelStyle2 && actionLabelStyle2.transform) || 'translateX(-50%)';
            e.currentTarget.style.transform = `${baseTransform} scale(1.05)`;
          }}
          onMouseLeave={(e) => {
            if (!actionOnClick2) return;
            e.currentTarget.style.filter = 'none';
            const baseTransform = (actionLabelStyle2 && actionLabelStyle2.transform) || 'translateX(-50%)';
            e.currentTarget.style.transform = baseTransform;
          }}
        >
          {actionLabel2}
        </div>
      )}

      {/* Optional tertiary action badge. */}
      {actionLabel3 && (
        <div
          onClick={actionOnClick3 || undefined}
          style={{
            position: 'absolute',
            top: 'calc(8% + 60px)', left: '50%', transform: 'translateX(-50%)',
            padding: '6px 22px', borderRadius: 8,
            background: 'rgba(20,10,5,0.92)', color: '#f5d87a',
            border: '2px solid #c8821a',
            fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 14, letterSpacing: 2,
            textShadow: '1px 1px 0 #000',
            pointerEvents: actionOnClick3 ? 'auto' : 'none',
            cursor: actionOnClick3 ? 'pointer' : 'default',
            userSelect: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
            ...(actionLabelStyle3 || {}),
          }}
          onMouseEnter={(e) => {
            if (!actionOnClick3) return;
            e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(245,216,122,0.85))';
            const baseTransform = (actionLabelStyle3 && actionLabelStyle3.transform) || 'translateX(-50%)';
            e.currentTarget.style.transform = `${baseTransform} scale(1.05)`;
          }}
          onMouseLeave={(e) => {
            if (!actionOnClick3) return;
            e.currentTarget.style.filter = 'none';
            const baseTransform = (actionLabelStyle3 && actionLabelStyle3.transform) || 'translateX(-50%)';
            e.currentTarget.style.transform = baseTransform;
          }}
        >
          {actionLabel3}
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
          const isSelected = !!item && selectedSlotIndex != null && absoluteIndex === selectedSlotIndex;
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
  // Which 24-slot bank page the player is currently viewing (0..BANK_PAGE_COUNT-1).
  const [bankViewPage, setBankViewPage] = useState(0);
  // Tracks the absolute index (into bankSlots, the chunked stack list) of the slot the
  // user clicked. This is what the highlight + preview + WITHDRAW button operate on.
  // Stacks of the same item id can occupy multiple slots (cap = BANK_MAX_PER_STACK).
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  // Index of which "instance" within the selected slot the user is viewing (0-based).
  // For a slot of 3 corn cards, 0 = card 1/3, 1 = card 2/3, etc. Arrows cycle this.
  const [instanceIndex, setInstanceIndex] = useState(0);

  // Player-side selection — which item id in the left inventory the user is
  // currently previewing on the card. Mirrors Menu_Inventory's pattern.
  const [playerSelectedItemId, setPlayerSelectedItemId] = useState(null);
  const [playerInstanceIndex, setPlayerInstanceIndex] = useState(0);

  useEffect(() => {
    const update = () => setBankState(getBank());
    window.addEventListener('sandboxGoldChanged', update);
    return () => window.removeEventListener('sandboxGoldChanged', update);
  }, []);

  // Auto-select the first item in the player inventory the moment items load,
  // so the card preview is populated by default (mirrors Menu_Inventory).
  useEffect(() => {
    if (playerSelectedItemId != null) return;
    const all = [...(seeds || []), ...(productions || [])];
    const first = all.find((it) => (it.count || 0) > 0);
    if (first) {
      setPlayerSelectedItemId(Number(first.id));
      setPlayerInstanceIndex(0);
    }
  }, [seeds, productions, playerSelectedItemId]);

  // Reads fresh localStorage and finds the next item the player still has,
  // skipping any id passed in `excludeId`. Used after a successful deposit
  // to auto-jump the selection to a still-available item instead of leaving
  // the player on a now-empty stack (which then misreports as "Bank is full!").
  const findFirstAvailableItem = (excludeId = null) => {
    let produce = {};
    let loot = {};
    try { produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}'); } catch (_) {}
    try { loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}'); } catch (_) {}
    // Loot first (seeds), then produce — mirrors playerItems' ordering.
    for (const [idStr, count] of Object.entries(loot)) {
      const id = Number(idStr);
      if (excludeId != null && id === Number(excludeId)) continue;
      if (Number(count) > 0) return id;
    }
    for (const [idStr, count] of Object.entries(produce)) {
      const id = Number(idStr);
      if (excludeId != null && id === Number(excludeId)) continue;
      if (Number(count) > 0) return id;
    }
    return null;
  };

  // Withdraw the entire selected bank stack back to the player inventory.
  // Loops transferOne(...withdraw=true) until the slot is empty. Auto-clears
  // the slot selection once nothing's left to display, and re-points the
  // player-side selection at the first available inventory item so the card
  // preview always shows whatever's in box 1.
  const withdrawSelectedStack = () => {
    if (selectedSlotIndex == null) return;
    const slot = bankSlots[selectedSlotIndex];
    if (!slot || slot.count <= 0) return;
    let any = false;
    const cap = slot.count + 1;
    for (let i = 0; i < cap; i++) {
      if (!transferOne(slot.id, true)) break;
      any = true;
    }
    if (!any) return;
    const next = getBank();
    setBankState(next);
    refetch && refetch();
    // Selected slot may have collapsed or emptied — drop the highlight.
    setSelectedSlotIndex(null);
    setInstanceIndex(0);
    // Anything new in the inventory → auto-select the first box.
    const firstId = findFirstAvailableItem(null);
    if (firstId != null) {
      setPlayerSelectedItemId(firstId);
      setPlayerInstanceIndex(0);
    }
  };

  // After a deposit, if the previously-selected item is now empty, auto-jump
  // the selection to the first remaining stack the player still has.
  const autoAdvanceSelectionIfEmpty = (depositedId) => {
    let produce = {};
    let loot = {};
    try { produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}'); } catch (_) {}
    try { loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}'); } catch (_) {}
    const remaining = (Number(produce[depositedId]) || 0) + (Number(loot[depositedId]) || 0);
    if (remaining <= 0) {
      const next = findFirstAvailableItem(depositedId);
      setPlayerSelectedItemId(next);
      setPlayerInstanceIndex(0);
    }
  };

  // bankSlots is now the storage itself — slot index = grid index.
  const bankSlots = bankState;

  const playerItems = useMemo(() => {
    const all = [...(seeds || []), ...(productions || [])];
    return all
      .filter((it) => (it.count || 0) > 0)
      .map((it) => ({ id: Number(it.id), count: Number(it.count) }));
  }, [seeds, productions]);

  const bankUsedSlots = computeBankStacks(bankState);
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
    const ok = transferOne(itemId, false, bankViewPage);
    if (!ok) {
      // Distinguish "bank full" from "you have none of that item".
      const slotsNow = getBank();
      const hasRoom = (findStackWithRoom(slotsNow, itemId, 0) !== -1) || (findEmptySlot(slotsNow, 0) !== -1);
      setFeedback(hasRoom ? 'Cannot deposit (no items).' : 'Bank is full!');
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
    // The selected slot may have emptied, or its count dropped below the
    // currently-displayed instanceIndex — clamp/clear as needed.
    const stillThere = next[selectedSlotIndex];
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

  // Total count for the selected id across ALL of its slots (bank chunks at 5 each).
  const selectedTotalCount = useMemo(() => {
    if (!selectedSlot) return 0;
    return bankSlots.reduce((sum, s) => (s && s.id === selectedSlot.id ? sum + (s.count || 0) : sum), 0);
  }, [bankSlots, selectedSlot]);

  // Number of items in earlier slots of the same id — used as an offset into the
  // weight log so each individual card maps to its own log entry.
  const stackOffset = useMemo(() => {
    if (!selectedSlot || selectedSlotIndex == null) return 0;
    let off = 0;
    for (let i = 0; i < selectedSlotIndex; i++) {
      if (bankSlots[i] && bankSlots[i].id === selectedSlot.id) off += bankSlots[i].count;
    }
    return off;
  }, [selectedSlot, selectedSlotIndex, bankSlots]);

  // Per-instance weight + harvest date for the selected bank slot. Indexed by stack
  // offset + instanceIndex so each card has its own stats.
  const selectedWeightInfo = useMemo(() => {
    if (!selectedSlot) return null;
    try {
      const log = JSON.parse(localStorage.getItem('sandbox_produce_weights') || '{}');
      const entries = log[Number(selectedSlot.id)];
      if (!Array.isArray(entries) || entries.length === 0) return null;
      // Window the log to the most recent `selectedTotalCount` entries (older entries
      // belong to crops the player has already used up).
      const startIdx = Math.max(0, entries.length - selectedTotalCount);
      const idx = startIdx + stackOffset + Math.max(0, instanceIndex);
      if (idx < 0 || idx >= entries.length) return null;
      return entries[idx];
    } catch (_) { return null; }
  }, [selectedSlot, selectedTotalCount, stackOffset, instanceIndex]);

  // Resolve the preview image for the currently-selected stack:
  //   1. SEED packs → CARD_FRONT_IMAGES (the seed-pack art).
  //   2. PRODUCE → CROP_CARD_IMAGES (the crop card), keyed by the matching seed id.
  //   3. Fall back to the inventory icon / base ALL_ITEMS image.
  const selectedCardImage = useMemo(() => {
    if (!selectedSlot) return null;
    const id = Number(selectedSlot.id);
    const { baseId, rarityLevel } = getBaseAndRarity(id);
    const cat = (baseId >> 8) & 0xF;
    let cardImg = null;
    if (cat >= 5 && cat <= 7) {
      const seedBaseId = ((cat - 3) << 8) | (baseId & 0xFF);
      cardImg = CROP_CARD_IMAGES?.[seedBaseId]?.[rarityLevel] || CROP_CARD_IMAGES?.[seedBaseId]?.[1];
    } else {
      cardImg = CARD_FRONT_IMAGES?.[baseId]?.[rarityLevel];
    }
    if (cardImg) return cardImg;
    const data = ALL_ITEMS[id];
    return getInventoryItemImage({ id, label: data?.label, category: data?.category, image: data?.image })
        || data?.image
        || null;
  }, [selectedSlot]);

  // Find the player-side selected item's slot index in the rendered grid.
  const playerSelectedSlotIndex = useMemo(() => {
    if (playerSelectedItemId == null) return null;
    return playerItems.findIndex((it) => Number(it.id) === Number(playerSelectedItemId));
  }, [playerSelectedItemId, playerItems]);

  // Card image for the player-side selection — same lookup the bank side
  // uses, so produce shows its crop-card art and seeds show pack art.
  const playerSelectedCardImage = useMemo(() => {
    if (playerSelectedItemId == null) return null;
    const id = Number(playerSelectedItemId);
    const { baseId, rarityLevel } = getBaseAndRarity(id);
    const cat = (baseId >> 8) & 0xF;
    let cardImg = null;
    if (cat >= 5 && cat <= 7) {
      const seedBaseId = ((cat - 3) << 8) | (baseId & 0xFF);
      cardImg = CROP_CARD_IMAGES?.[seedBaseId]?.[rarityLevel] || CROP_CARD_IMAGES?.[seedBaseId]?.[1];
    } else {
      cardImg = CARD_FRONT_IMAGES?.[baseId]?.[rarityLevel];
    }
    if (cardImg) return cardImg;
    const data = ALL_ITEMS[id];
    return getInventoryItemImage({ id, label: data?.label, category: data?.category, image: data?.image })
        || data?.image
        || null;
  }, [playerSelectedItemId]);

  // How many of the selected player item exist (for the prev/next cap on the
  // card preview arrows).
  const playerSelectedCount = useMemo(() => {
    if (playerSelectedItemId == null) return 0;
    const found = playerItems.find((it) => Number(it.id) === Number(playerSelectedItemId));
    return found ? Number(found.count) || 0 : 0;
  }, [playerSelectedItemId, playerItems]);

  // Per-instance weight + harvest date for the selected player item.
  const playerSelectedWeightInfo = useMemo(() => {
    if (playerSelectedItemId == null) return null;
    try {
      const log = JSON.parse(localStorage.getItem('sandbox_produce_weights') || '{}');
      const entries = log[Number(playerSelectedItemId)];
      if (!Array.isArray(entries) || entries.length === 0) return null;
      const startIdx = Math.max(0, entries.length - playerSelectedCount);
      const idx = startIdx + Math.max(0, playerInstanceIndex);
      if (idx < 0 || idx >= entries.length) return null;
      return entries[idx];
    } catch (_) { return null; }
  }, [playerSelectedItemId, playerSelectedCount, playerInstanceIndex]);

  const playerSelectedIsProduce = useMemo(() => {
    if (playerSelectedItemId == null) return false;
    const cat = (Number(playerSelectedItemId) >> 8) & 0xF;
    return cat >= 5 && cat <= 7;
  }, [playerSelectedItemId]);

  const canCyclePlayerPrev = playerSelectedCount > 1 && playerInstanceIndex > 0;
  const canCyclePlayerNext = playerSelectedCount > 1 && playerInstanceIndex < playerSelectedCount - 1;

  // Card art lookup for any item id (seed pack or produce). Used by the bank
  // box grid to render the seed/crop image inside each occupied slot.
  const lookupCardArt = (itemId) => {
    if (itemId == null) return null;
    const id = Number(itemId);
    const { baseId, rarityLevel } = getBaseAndRarity(id);
    const cat = (baseId >> 8) & 0xF;
    let cardImg = null;
    if (cat >= 5 && cat <= 7) {
      const seedBaseId = ((cat - 3) << 8) | (baseId & 0xFF);
      cardImg = CROP_CARD_IMAGES?.[seedBaseId]?.[rarityLevel] || CROP_CARD_IMAGES?.[seedBaseId]?.[1];
    } else {
      cardImg = CARD_FRONT_IMAGES?.[baseId]?.[rarityLevel];
    }
    if (cardImg) return cardImg;
    const data = ALL_ITEMS[id];
    return getInventoryItemImage({ id, label: data?.label, category: data?.category, image: data?.image })
        || data?.image
        || null;
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
      {/* Player inventory panel — anchored top-left, scaled via CSS zoom so
          its hit area also shrinks. Click an item to deposit 1 unit (handler
          will be wired once deposit flow is restored). */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'fixed', top: '50%', left: 12, transform: 'translateY(-50%)', zIndex: 100002, pointerEvents: 'auto' }}
      >
        <InventoryStylePopup
          items={playerItems}
          page={0}
          totalPages={1}
          scale={0.8}
          onItemClick={(id) => {
            setPlayerSelectedItemId(id);
            setPlayerInstanceIndex(0);
          }}
          actionLabel="DEPOSIT"
          actionLabelStyle={{ top: 'calc(8% + 550px)', left: 'calc(50% - 170px)' }}
          actionOnClick={() => {
            if (playerSelectedItemId == null) return;
            const id = playerSelectedItemId;
            const ok = transferOne(id, false, bankViewPage);
            if (!ok) {
              // Distinguish "bank full" from "no items of this type left".
              const slotsNow = getBank();
              const hasRoom = (findStackWithRoom(slotsNow, id, 0) !== -1) || (findEmptySlot(slotsNow, 0) !== -1);
              if (!hasRoom) {
                setFeedback('Bank is full!');
                setTimeout(() => setFeedback(''), 1800);
              } else {
                // No items of this id — must have been the last one; auto-advance.
                autoAdvanceSelectionIfEmpty(id);
              }
              return;
            }
            setBankState(getBank());
            refetch && refetch();
            // Always snap back to the first remaining card so the preview
            // shows the new "card 1" and not a stale instanceIndex that's
            // now out of range.
            setPlayerInstanceIndex(0);
            autoAdvanceSelectionIfEmpty(id);
          }}
          actionLabel2="DEPOSIT STACK"
          actionLabelStyle2={{ top: 'calc(8% + 550px)', left: '50%' }}
          actionOnClick2={() => {
            if (playerSelectedItemId == null) return;
            const id = playerSelectedItemId;
            // Loop transferOne until it fails (bank full / no more items).
            let any = false;
            const cap = playerSelectedCount + 1;
            for (let i = 0; i < cap; i++) {
              if (!transferOne(id, false, bankViewPage)) break;
              any = true;
            }
            if (!any) {
              setFeedback('Bank is full!');
              setTimeout(() => setFeedback(''), 1800);
              return;
            }
            setBankState(getBank());
            refetch && refetch();
            autoAdvanceSelectionIfEmpty(id);
          }}
          actionLabel3="DEPOSIT ALL"
          actionLabelStyle3={{ top: 'calc(8% + 550px)', left: 'calc(50% + 190px)' }}
          actionOnClick3={() => {
            // Walk every player item and deposit until the bank is full or
            // every stack is empty. Player items are produce + seeds combined.
            let any = false;
            const itemList = playerItems.map((it) => ({ id: Number(it.id), count: Number(it.count) || 0 }));
            for (const it of itemList) {
              for (let i = 0; i < it.count; i++) {
                if (!transferOne(it.id, false, bankViewPage)) {
                  // Bank is full — stop trying entirely.
                  i = it.count;
                  break;
                }
                any = true;
              }
              // Re-check bank capacity after each item; if any deposit just
              // failed for "bank full", break the outer loop too.
              const stacksLeft = BANK_MAX_SLOTS - computeBankStacks(getBank());
              if (stacksLeft <= 0) break;
            }
            if (!any) {
              setFeedback('Bank is full!');
              setTimeout(() => setFeedback(''), 1800);
              return;
            }
            setBankState(getBank());
            refetch && refetch();
            // After deposit-all, the originally-selected item is most likely
            // empty — auto-advance so the player isn't stuck on a dead stack.
            autoAdvanceSelectionIfEmpty(playerSelectedItemId);
          }}
          previewImage={playerSelectedCount > 0 ? playerSelectedCardImage : null}
          previewWeightInfo={playerSelectedCount > 0 ? playerSelectedWeightInfo : null}
          previewShowWeight={playerSelectedCount > 0 && playerSelectedIsProduce}
          selectedSlotIndex={playerSelectedCount > 0 ? playerSelectedSlotIndex : null}
          onPreviewPrev={canCyclePlayerPrev ? () => setPlayerInstanceIndex((i) => Math.max(0, i - 1)) : null}
          onPreviewNext={canCyclePlayerNext ? () => setPlayerInstanceIndex((i) => Math.min(playerSelectedCount - 1, i + 1)) : null}
        />
      </div>

      {/* Banker room — fresh deposit/withdraw UI built on bankerroom1.png.
          Slots, item grid, deposit/withdraw actions etc. will layer on top
          of this background as we iterate. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', display: 'inline-block', cursor: 'default', marginLeft: '500px' }}
      >
        <img
          src="/images/bank/bankerroom1.png"
          alt={label || 'Banker'}
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />

        {/* Bank-box grid — 4 rows × 6 columns of empty deposit slots overlaid
            on the bankerroom1 background. Each cell is bankbox.png; item icons
            will land on top of these as we wire deposits up. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '8px',
            padding: 'calc(24% + 30px) 14% 22% 14%',
            transform: 'translate(20px, 50px)',
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: BANK_SLOTS_PER_PAGE }).map((_, i) => {
            const absoluteIndex = bankViewPage * BANK_SLOTS_PER_PAGE + i;
            const slot = bankSlots[absoluteIndex] || null;
            // Use the small inventory-style icon (seed bag for seeds, crop
            // sprite for produce) — same lookup the player inventory uses.
            const data = slot ? ALL_ITEMS[slot.id] : null;
            const itemImg = slot
              ? (getInventoryItemImage({
                  id: slot.id,
                  label: data?.label,
                  category: data?.category,
                  image: data?.image,
                }) || data?.image)
              : null;
            const isSelected = slot && selectedSlotIndex === absoluteIndex;
            return (
              <div
                key={i}
                onClick={slot ? () => { setSelectedSlotIndex(absoluteIndex); setInstanceIndex(0); } : undefined}
                onMouseEnter={(e) => {
                  if (!slot || isSelected) return;
                  const wrap = e.currentTarget.querySelector('.bank-box-wrap');
                  if (wrap) {
                    wrap.style.transform = 'scale(1.1)';
                    wrap.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!slot || isSelected) return;
                  const wrap = e.currentTarget.querySelector('.bank-box-wrap');
                  if (wrap) {
                    wrap.style.transform = 'scale(1)';
                    wrap.style.filter = 'none';
                  }
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'auto',
                  cursor: slot ? 'pointer' : 'default',
                }}
              >
                <div
                  className="bank-box-wrap"
                  style={{
                    position: 'relative',
                    width: '100%', height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                    ...(isSelected ? {
                      transform: 'scale(1.08)',
                      filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(255,220,100,1)) drop-shadow(0 0 16px rgba(255,180,40,0.9))',
                    } : {}),
                  }}
                >
                <img
                  src="/images/bank/bankbox.png"
                  alt=""
                  draggable={false}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                    userSelect: 'none',
                  }}
                />
                {slot && itemImg && (
                  <img
                    src={itemImg}
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '70%', height: '70%',
                      objectFit: 'contain',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {slot && slot.count > 1 && (
                  <span style={{
                    position: 'absolute',
                    right: '8%', bottom: '6%',
                    fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                    fontSize: 16, color: '#fff',
                    textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
                    pointerEvents: 'none',
                  }}>
                    {slot.count}
                  </span>
                )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bank page selector — room1/room2/room3 image buttons. Active room
            scales up to indicate the page being viewed. */}
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(6% + 506px)', left: 'calc(50% + 25px)', transform: 'translateX(-50%)',
            display: 'flex', gap: 16,
            pointerEvents: 'auto',
          }}
        >
          {Array.from({ length: BANK_PAGE_COUNT }).map((_, p) => {
            const isActive = bankViewPage === p;
            return (
              <img
                key={p}
                src={`/images/bank/room${p + 1}.png`}
                alt={`Page ${p + 1}`}
                draggable={false}
                onClick={() => { setBankViewPage(p); setSelectedSlotIndex(null); setInstanceIndex(0); }}
                onMouseEnter={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.filter = 'brightness(0.95) drop-shadow(0 0 6px rgba(255,220,100,0.6))';
                }}
                onMouseLeave={(e) => {
                  if (isActive) return;
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.filter = 'brightness(0.55) saturate(0.7)';
                }}
                style={{
                  width: 180, height: 'auto',
                  cursor: 'pointer',
                  userSelect: 'none',
                  objectFit: 'contain',
                  transform: 'scale(1)',
                  filter: isActive
                    ? 'brightness(1.15) drop-shadow(0 0 8px rgba(255,220,100,1))'
                    : 'brightness(0.55) saturate(0.7)',
                  transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                }}
              />
            );
          })}
        </div>

        {/* WITHDRAW STACK — pulls the entire selected bank box back into the
            player inventory. Disabled (greyed) when no slot is selected. */}
        {(() => {
          const enabled = selectedSlotIndex != null && bankSlots[selectedSlotIndex]?.count > 0;
          return (
            <div
              onClick={enabled ? withdrawSelectedStack : undefined}
              style={{
                position: 'absolute',
                bottom: '6%', left: '50%', transform: 'translateX(-50%)',
                padding: '8px 24px', borderRadius: 10,
                background: 'rgba(20,10,5,0.92)',
                color: enabled ? '#f5d87a' : '#7a6650',
                border: `2px solid ${enabled ? '#c8821a' : '#6a4f30'}`,
                fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                fontSize: 16, letterSpacing: 2,
                textShadow: '1px 1px 0 #000',
                pointerEvents: enabled ? 'auto' : 'none',
                cursor: enabled ? 'pointer' : 'default',
                userSelect: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
                whiteSpace: 'nowrap',
                transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                opacity: enabled ? 1 : 0.55,
              }}
              onMouseEnter={(e) => {
                if (!enabled) return;
                e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(245,216,122,0.85))';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                if (!enabled) return;
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'translateX(-50%)';
              }}
            >
              WITHDRAW STACK
            </div>
          );
        })()}

        {/* Close (X) — keeps the cutscene bank flow exitable while the new view is built up. */}
        <img
          src="/images/inventory/x.png"
          alt="Close"
          draggable={false}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 6px rgba(255,220,100,0.9))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'none';
          }}
          style={{
            position: 'absolute',
            top: 'calc(8% + 5px)',
            right: 'calc(4% - 54px)',
            width: 70, height: 'auto',
            cursor: 'pointer', userSelect: 'none',
            transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
          }}
        />

        {/* Feedback toast */}
        {feedback && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 2,
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(80,20,20,0.95)', color: '#ff9977',
            fontFamily: 'monospace', fontSize: 13,
            pointerEvents: 'none',
          }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
};

export default BankerDialog;
