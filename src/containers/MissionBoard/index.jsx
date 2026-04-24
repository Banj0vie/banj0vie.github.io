import React, { useState, useEffect, useCallback, useRef } from "react";
import "./style.css";
import { ID_PRODUCE_ITEMS, ID_FISH_ITEMS, ID_SEEDS, getRaritySeedId } from "../../constants/app_ids";

const BRONZE_SEED_POOL = [
  ID_SEEDS.CARROT, ID_SEEDS.TOMATO, ID_SEEDS.CORN,
  ID_SEEDS.CELERY, ID_SEEDS.POTATO, ID_SEEDS.ONION,
  ID_SEEDS.RADISH, ID_SEEDS.LETTUCE,
];
const pickBronzeSeeds = (count = 3) => {
  const pool = [...BRONZE_SEED_POOL].sort(() => Math.random() - 0.5);
  return pool.slice(0, count).map(id => getRaritySeedId(id, 1));
};

const SKIP_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const MISSIONS_PER_TIER = 10;
const MAX_TIER = 3;


const M = (f) => `/images/Missionboard/missions/${f}`;
const MISSION_IMAGES = {
  // Tier 1 — exact matches only
  t1_carrot_1:  M('carrotgrab.png'),
  t1_carrot_2:  M('carrotdelivery.png'),
  t1_potato_1:  M('potatopick.png'),
  t1_potato_2:  M('potatosupply.png'),
  t1_tomato_1:  M('tomatotoss.png'),
  t1_tomato_2:  M('tomatohaul.png'),
  t1_corn_1:    M('corncob.png'),
  t1_corn_2:    M('cornrun.png'),
  t1_lettuce_1: M('lettuceleaf.png'),
  t1_lettuce_2: M('lettuceload.png'),
  t1_onion_1:   M('onionerrand.png'),
  t1_onion_2:   M('onionorder.png'),
  t1_radish_1:  M('radishrun.png'),
  t1_radish_2:  M('radishbash.png'),
  t1_celery_1:  M('celerysnap.png'),
  t1_celery_2:  M('celerystash.png'),
  // Tier 2 — only reuse images where crop + quantity match exactly
  t2_carrot_2:  M('carrotdelivery.png'),
  t2_potato_2:  M('potatosupply.png'),
  t2_tomato_2:  M('tomatohaul.png'),
};

const SLOT_FALLBACK = [
  '/images/Missionboard/carrotmission.png',
  '/images/Missionboard/potatomission.png',
  '/images/Missionboard/spicemission.png',
];

const SLOT_TOPS = [
  'calc(15% + 140px)',
  'calc(34% + 140px)',
  'calc(53% + 140px)',
];

// ── Tier 1: Easy pico crops only (1-2 items) — rewards ~350-650 gold ──────────
const TIER1_POOL = [
  { id: "t1_carrot_1",   title: "Carrot Grab",      desc: "Turn in 1 Carrot.",    itemId: ID_PRODUCE_ITEMS.CARROT,  amount: 1, reward: 350,  rewardLabel: "350 Gold",  type: "pico" },
  { id: "t1_carrot_2",   title: "Carrot Delivery",  desc: "Turn in 2 Carrots.",   itemId: ID_PRODUCE_ITEMS.CARROT,  amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_potato_1",   title: "Potato Pick",      desc: "Turn in 1 Potato.",    itemId: ID_PRODUCE_ITEMS.POTATO,  amount: 1, reward: 350,  rewardLabel: "350 Gold",  type: "pico" },
  { id: "t1_potato_2",   title: "Potato Supply",    desc: "Turn in 2 Potatoes.",  itemId: ID_PRODUCE_ITEMS.POTATO,  amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_tomato_1",   title: "Tomato Toss",      desc: "Turn in 1 Tomato.",    itemId: ID_PRODUCE_ITEMS.TOMATO,  amount: 1, reward: 375,  rewardLabel: "375 Gold",  type: "pico" },
  { id: "t1_tomato_2",   title: "Tomato Haul",      desc: "Turn in 2 Tomatoes.",  itemId: ID_PRODUCE_ITEMS.TOMATO,  amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_corn_1",     title: "Corn Cob",         desc: "Turn in 1 Corn.",      itemId: ID_PRODUCE_ITEMS.CORN,    amount: 1, reward: 375,  rewardLabel: "375 Gold",  type: "pico" },
  { id: "t1_corn_2",     title: "Corn Run",         desc: "Turn in 2 Corn.",      itemId: ID_PRODUCE_ITEMS.CORN,    amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_lettuce_1",  title: "Lettuce Leaf",     desc: "Turn in 1 Lettuce.",   itemId: ID_PRODUCE_ITEMS.LETTUCE, amount: 1, reward: 350,  rewardLabel: "350 Gold",  type: "pico" },
  { id: "t1_lettuce_2",  title: "Lettuce Load",     desc: "Turn in 2 Lettuce.",   itemId: ID_PRODUCE_ITEMS.LETTUCE, amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_onion_1",    title: "Onion Errand",     desc: "Turn in 1 Onion.",     itemId: ID_PRODUCE_ITEMS.ONION,   amount: 1, reward: 350,  rewardLabel: "350 Gold",  type: "pico" },
  { id: "t1_onion_2",    title: "Onion Order",      desc: "Turn in 2 Onions.",    itemId: ID_PRODUCE_ITEMS.ONION,   amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_radish_1",   title: "Radish Run",       desc: "Turn in 1 Radish.",    itemId: ID_PRODUCE_ITEMS.RADISH,  amount: 1, reward: 350,  rewardLabel: "350 Gold",  type: "pico" },
  { id: "t1_radish_2",   title: "Radish Batch",     desc: "Turn in 2 Radishes.",  itemId: ID_PRODUCE_ITEMS.RADISH,  amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
  { id: "t1_celery_1",   title: "Celery Snap",      desc: "Turn in 1 Celery.",    itemId: ID_PRODUCE_ITEMS.CELERY,  amount: 1, reward: 350,  rewardLabel: "350 Gold",  type: "pico" },
  { id: "t1_celery_2",   title: "Celery Stash",     desc: "Turn in 2 Celery.",    itemId: ID_PRODUCE_ITEMS.CELERY,  amount: 2, reward: 650,  rewardLabel: "650 Gold",  type: "pico" },
];

// ── Tier 2: Easy fish + pico crops (2) + basic crops — rewards ~1500-4500 gold ──
// Basic seed pack = 3500 HNY / 5 seeds = 700/seed; reward targets 2-3× seed cost
const TIER2_POOL = [
  // pico overlaps (150/seed, 2 items = 300 cost → ~2.5× = 750)
  { id: "t2_carrot_2",   title: "Carrot Delivery",  desc: "Turn in 2 Carrots.",      itemId: ID_PRODUCE_ITEMS.CARROT,   amount: 2, reward: 750,  rewardLabel: "750 Gold",  type: "pico" },
  { id: "t2_potato_2",   title: "Potato Supply",    desc: "Turn in 2 Potatoes.",     itemId: ID_PRODUCE_ITEMS.POTATO,   amount: 2, reward: 750,  rewardLabel: "750 Gold",  type: "pico" },
  { id: "t2_tomato_2",   title: "Tomato Haul",      desc: "Turn in 2 Tomatoes.",     itemId: ID_PRODUCE_ITEMS.TOMATO,   amount: 2, reward: 800,  rewardLabel: "800 Gold",  type: "pico" },
  // basic crops (700/seed, 3 items = 2100 cost → ~2× = 4200)
  { id: "t2_lettuce_3",  title: "Lettuce Load",     desc: "Turn in 3 Lettuce.",      itemId: ID_PRODUCE_ITEMS.LETTUCE,  amount: 3, reward: 4000, rewardLabel: "4000 Gold", type: "crop" },
  { id: "t2_onion_3",    title: "Onion Order",      desc: "Turn in 3 Onions.",       itemId: ID_PRODUCE_ITEMS.ONION,    amount: 3, reward: 4000, rewardLabel: "4000 Gold", type: "crop" },
  { id: "t2_celery_3",   title: "Celery Stash",     desc: "Turn in 3 Celery.",       itemId: ID_PRODUCE_ITEMS.CELERY,   amount: 3, reward: 4000, rewardLabel: "4000 Gold", type: "crop" },
  { id: "t2_corn_3",     title: "Corn Surplus",     desc: "Turn in 3 Corn.",         itemId: ID_PRODUCE_ITEMS.CORN,     amount: 3, reward: 4200, rewardLabel: "4200 Gold", type: "crop" },
  { id: "t2_wheat_3",    title: "Wheat Harvest",    desc: "Turn in 3 Wheat.",        itemId: ID_PRODUCE_ITEMS.WHEAT,    amount: 3, reward: 4500, rewardLabel: "4500 Gold", type: "crop" },
  { id: "t2_pepper_2",   title: "Spice Trade",      desc: "Turn in 2 Peppers.",      itemId: ID_PRODUCE_ITEMS.PEPPER,   amount: 2, reward: 3500, rewardLabel: "3500 Gold", type: "crop" },
  { id: "t2_broccoli_2", title: "Broccoli Batch",   desc: "Turn in 2 Broccoli.",     itemId: ID_PRODUCE_ITEMS.BROCCOLI, amount: 2, reward: 3500, rewardLabel: "3500 Gold", type: "crop" },
  // easy fish (no seed cost, ~2000-3000 range)
  { id: "t2_anchovy_2",  title: "Anchovy Catch",    desc: "Turn in 2 Anchovies.",    itemId: ID_FISH_ITEMS.ANCHOVY,     amount: 2, reward: 2000, rewardLabel: "2000 Gold", type: "fish" },
  { id: "t2_sardine_2",  title: "Sardine Haul",     desc: "Turn in 2 Sardines.",     itemId: ID_FISH_ITEMS.SARDINE,     amount: 2, reward: 2000, rewardLabel: "2000 Gold", type: "fish" },
  { id: "t2_herring_2",  title: "Herring Run",      desc: "Turn in 2 Herring.",      itemId: ID_FISH_ITEMS.HERRING,     amount: 2, reward: 2500, rewardLabel: "2500 Gold", type: "fish" },
  { id: "t2_trout_1",    title: "Trout Trade",      desc: "Turn in 1 Small Trout.",  itemId: ID_FISH_ITEMS.SMALL_TROUT, amount: 1, reward: 2500, rewardLabel: "2500 Gold", type: "fish" },
];

// ── Tier 3: Easy-medium fish + basic crops + premium — rewards ~5500-18000 gold ─
// Premium seed pack = 15000 HNY / 5 seeds = 3000/seed; basic = 700/seed; ~2× seed cost min
const TIER3_POOL = [
  // basic crop overlaps (700/seed, 4 items = 2800 cost → 2× = 5600)
  { id: "t3_wheat_4",    title: "Wheat Surplus",    desc: "Turn in 4 Wheat.",        itemId: ID_PRODUCE_ITEMS.WHEAT,      amount: 4, reward: 6000,  rewardLabel: "6000 Gold",  type: "crop" },
  { id: "t3_corn_4",     title: "Corn Stockpile",   desc: "Turn in 4 Corn.",         itemId: ID_PRODUCE_ITEMS.CORN,       amount: 4, reward: 6000,  rewardLabel: "6000 Gold",  type: "crop" },
  { id: "t3_pepper_3",   title: "Pepper Haul",      desc: "Turn in 3 Peppers.",      itemId: ID_PRODUCE_ITEMS.PEPPER,     amount: 3, reward: 5500,  rewardLabel: "5500 Gold",  type: "crop" },
  // premium crops (3000/seed; 2 items = 6000 cost → 2× = 12000; 3 items = 9000 → 18000)
  { id: "t3_pumpkin_2",  title: "Pumpkin Patch",    desc: "Turn in 2 Pumpkins.",     itemId: ID_PRODUCE_ITEMS.PUMPKIN,    amount: 2, reward: 12000, rewardLabel: "12000 Gold", type: "premium" },
  { id: "t3_pumpkin_3",  title: "Pumpkin Haul",     desc: "Turn in 3 Pumpkins.",     itemId: ID_PRODUCE_ITEMS.PUMPKIN,    amount: 3, reward: 18000, rewardLabel: "18000 Gold", type: "premium" },
  { id: "t3_grapes_2",   title: "Grape Harvest",    desc: "Turn in 2 Grapes.",       itemId: ID_PRODUCE_ITEMS.GRAPES,     amount: 2, reward: 12000, rewardLabel: "12000 Gold", type: "premium" },
  { id: "t3_grapes_3",   title: "Grape Surplus",    desc: "Turn in 3 Grapes.",       itemId: ID_PRODUCE_ITEMS.GRAPES,     amount: 3, reward: 18000, rewardLabel: "18000 Gold", type: "premium" },
  { id: "t3_broccoli_4", title: "Broccoli Bounty",  desc: "Turn in 4 Broccoli.",     itemId: ID_PRODUCE_ITEMS.BROCCOLI,   amount: 4, reward: 7500,  rewardLabel: "7500 Gold",  type: "premium" },
  { id: "t3_radish_4",   title: "Radish Bounty",    desc: "Turn in 4 Radishes.",     itemId: ID_PRODUCE_ITEMS.RADISH,     amount: 4, reward: 7000,  rewardLabel: "7000 Gold",  type: "premium" },
  // easy-medium fish (no seed cost, scaled to match basic/premium effort)
  { id: "t3_herring_3",  title: "Herring Haul",     desc: "Turn in 3 Herring.",      itemId: ID_FISH_ITEMS.HERRING,       amount: 3, reward: 4500,  rewardLabel: "4500 Gold",  type: "fish" },
  { id: "t3_trout_2",    title: "Trout Catch",      desc: "Turn in 2 Small Trout.",  itemId: ID_FISH_ITEMS.SMALL_TROUT,   amount: 2, reward: 5000,  rewardLabel: "5000 Gold",  type: "fish" },
  { id: "t3_perch_1",    title: "Perch Platter",    desc: "Turn in 1 Yellow Perch.", itemId: ID_FISH_ITEMS.YELLOW_PERCH,  amount: 1, reward: 4000,  rewardLabel: "4000 Gold",  type: "fish" },
  { id: "t3_salmon_1",   title: "Salmon Supply",    desc: "Turn in 1 Salmon.",       itemId: ID_FISH_ITEMS.SALMON,        amount: 1, reward: 5500,  rewardLabel: "5500 Gold",  type: "fish" },
];

const TIER_POOLS = [TIER1_POOL, TIER2_POOL, TIER3_POOL];

const STORAGE_KEY = "sandbox_mission_board_state";

const getLoot = () => {
  try {
    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    const merged = { ...loot };
    Object.entries(produce).forEach(([id, val]) => {
      const count = Array.isArray(val) ? val.length : (Number(val) || 0);
      merged[id] = (merged[id] || 0) + count;
    });
    return merged;
  } catch { return {}; }
};
const getGold = () => {
  try { return parseInt(localStorage.getItem('sandbox_gold') || '0', 10); } catch { return 0; }
};

const pickOne = (pool, excludeIds) => {
  const available = pool.filter(m => !excludeIds.includes(m.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled[0] || null;
};

const pickThree = (pool, excludeIds = []) => {
  const available = pool.filter(m => !excludeIds.includes(m.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const loadState = () => {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
};
const saveState = (state) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};

const formatCountdown = (ms) => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const getTier = (totalCompleted) => Math.min(Math.floor(totalCompleted / MISSIONS_PER_TIER) + 1, MAX_TIER);


// ── Component ─────────────────────────────────────────────────────────────────
const MissionBoard = ({ onClose }) => {
  const [missions, setMissions] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [loot, setLoot] = useState({});
  const [gold, setGold] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [skipTimers, setSkipTimers] = useState({});
  const [now, setNow] = useState(Date.now());
  const [fadingSlots, setFadingSlots] = useState(new Set());
  const [freshSlots, setFreshSlots] = useState(new Set());
  const tickRef = useRef(null);
  const totalCompletedRef = useRef(0);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => { totalCompletedRef.current = totalCompleted; }, [totalCompleted]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setNow(Date.now());
      setLoot(getLoot());
      setGold(getGold());
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  useEffect(() => {
    setSkipTimers(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.entries(updated).forEach(([slotIdx, timer]) => {
        if (now >= timer.replacesAt) {
          changed = true;
          const idx = parseInt(slotIdx);
          setMissions(prevMissions => {
            const next = [...prevMissions];
            next[idx] = timer.pendingMission;
            saveState({ missions: next, totalCompleted: totalCompletedRef.current });
            return next;
          });
          delete updated[slotIdx];
        }
      });
      return changed ? updated : prev;
    });
  }, [now]);

  useEffect(() => {
    setLoot(getLoot());
    setGold(getGold());
    const saved = loadState();
    const total = saved?.totalCompleted || 0;
    const validMissions = (saved?.missions || []).filter(m => m.itemId != null && m.amount != null);
    if (validMissions.length === 3) {
      setMissions(validMissions);
      setTotalCompleted(total);
      if (saved.skipTimers) setSkipTimers(saved.skipTimers);
    } else {
      const pool = TIER_POOLS[getTier(total) - 1];
      const initial = pickThree(pool, []);
      setMissions(initial);
      saveState({ missions: initial, totalCompleted: total });
      setTotalCompleted(total);
    }
  }, []);

  const skipMission = useCallback((slotIdx, missionId) => {
    setMissions(prev => {
      const pool = TIER_POOLS[getTier(totalCompletedRef.current) - 1];
      const excludeIds = [...prev.map(m => m.id), missionId];
      const pending = pickOne(pool, excludeIds);
      if (!pending) return prev;

      const replacesAt = Date.now() + SKIP_COOLDOWN_MS;
      const timer = { replacesAt, pendingMission: pending };

      setSkipTimers(t => {
        const updated = { ...t, [slotIdx]: timer };
        saveState({ missions: prev, totalCompleted: totalCompletedRef.current, skipTimers: updated });
        return updated;
      });

      return prev;
    });
  }, []);

  const turnIn = useCallback((mission, slotIdx) => {
    const currentLoot = getLoot();
    const have = currentLoot[mission.itemId] || 0;

    if (have < mission.amount) {
      setFeedback(f => ({ ...f, [mission.id]: `Need ${mission.amount - have} more!` }));
      setTimeout(() => setFeedback(f => { const n = { ...f }; delete n[mission.id]; return n; }), 2000);
      return;
    }

    // Fade out the card first
    setFadingSlots(prev => new Set([...prev, slotIdx]));

    setTimeout(() => {
      let remaining = mission.amount;
      const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
      const produceVal = produce[mission.itemId];
      if (produceVal !== undefined) {
        const produceCount = Array.isArray(produceVal) ? produceVal.length : (Number(produceVal) || 0);
        const deduct = Math.min(remaining, produceCount);
        if (Array.isArray(produce[mission.itemId])) {
          produce[mission.itemId].splice(0, deduct);
        } else {
          produce[mission.itemId] = Math.max(0, produceCount - deduct);
        }
        remaining -= deduct;
        localStorage.setItem('sandbox_produce', JSON.stringify(produce));
      }
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      if (remaining > 0 && sandboxLoot[mission.itemId]) {
        sandboxLoot[mission.itemId] = Math.max(0, (sandboxLoot[mission.itemId] || 0) - remaining);
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      }

      const newGold = getGold() + mission.reward;
      localStorage.setItem('sandbox_gold', String(newGold));
      window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: String(newGold) }));
      setLoot(getLoot());
      setGold(newGold);

      const curTotal = totalCompletedRef.current;
      const newTotal = curTotal + 1;
      const prevTier = getTier(curTotal);
      const completedInTier = newTotal % MISSIONS_PER_TIER;
      const tierJustCompleted = completedInTier === 0 && prevTier < MAX_TIER;
      const finalTierCompleted = prevTier === MAX_TIER && completedInTier === 0;

      if (tierJustCompleted || finalTierCompleted) {
        const seeds = pickBronzeSeeds(3);
        onCloseRef.current();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('charPackOpen', { detail: { seeds } }));
        }, 300);
      }

      setMissions(prev => {
        const newTier = getTier(newTotal);
        const pool = TIER_POOLS[newTier - 1];
        const excludeIds = [...prev.map(m => m.id), mission.id];
        const replacement = pickOne(pool, excludeIds);
        const next = [...prev];
        next[slotIdx] = replacement || prev[slotIdx];
        saveState({ missions: next, totalCompleted: newTotal });
        setTotalCompleted(newTotal);
        totalCompletedRef.current = newTotal;
        return next;
      });

      // Remove fade-out, add fresh slot (opacity 0), then remove to trigger fade-in
      setFadingSlots(prev => {
        const next = new Set(prev);
        next.delete(slotIdx);
        return next;
      });
      setFreshSlots(prev => new Set([...prev, slotIdx]));
      setTimeout(() => {
        setFreshSlots(prev => {
          const next = new Set(prev);
          next.delete(slotIdx);
          return next;
        });
      }, 50);
    }, 550);
  }, []);

  const tier = getTier(totalCompleted);
  const missionsIntoTier = totalCompleted % MISSIONS_PER_TIER;

  return (
    <div className="mission-board-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src="/images/Missionboard/missionboardbackground.png"
          alt="Mission Board"
          draggable={false}
          style={{ maxHeight: '90vh', maxWidth: '95vw', display: 'block' }}
        />

        {/* Tier progress text */}
        <div style={{
          position: 'absolute', top: '23%', left: '58%', transform: 'translateX(-50%)',
          textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <div style={{
            fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '14px', color: '#ffffff',
            textShadow: '1px 1px 0 #031542, -1px 1px 0 #031542, 1px -1px 0 #031542, -1px -1px 0 #031542, 0 1px 0 #031542, 0 -1px 0 #031542, 1px 0 0 #031542, -1px 0 0 #031542',
            letterSpacing: '1px',
          }}>
            {missionsIntoTier}/10 Missions Completed
          </div>
        </div>

        {/* Mission card slots */}
        {SLOT_TOPS.map((top, i) => {
          const mission = missions[i];
          const isFading = fadingSlots.has(i);
          const isFresh = freshSlots.has(i);
          const isSkipped = !!skipTimers[i];
          const cardSrc = mission ? (MISSION_IMAGES[mission.id] || SLOT_FALLBACK[i]) : SLOT_FALLBACK[i];

          const have = mission ? Math.min(loot[mission.itemId] || 0, mission.amount) : 0;
          const canTurnIn = mission ? (loot[mission.itemId] || 0) >= mission.amount : false;

          return (
            <div
              key={i}
              style={{
                position: 'absolute', top, left: '50%', transform: 'translateX(-50%)', width: '70%',
                opacity: isFading || isFresh ? 0 : 1,
                transition: 'opacity 0.5s ease',
              }}
            >
              <img src={cardSrc} alt="Mission" draggable={false} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} />

              {/* Progress x/x badge */}
              {mission && !isSkipped && (
                <div style={{
                  position: 'absolute', bottom: 'calc(30% + 30px)', left: '50%', transform: 'translateX(calc(-50% + 100px))',
                  background: 'rgba(0,0,0,0.65)', borderRadius: '20px',
                  padding: '2px 10px', pointerEvents: 'none', zIndex: 4,
                  fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                  fontSize: '15px', fontWeight: 'bold',
                  color: canTurnIn ? '#7dff7d' : '#fff',
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000',
                  border: canTurnIn ? '1px solid #7dff7d' : '1px solid rgba(255,255,255,0.2)',
                  whiteSpace: 'nowrap',
                }}>
                  {have}/{mission.amount}
                </div>
              )}

              {/* Checkmark when enough items in inventory */}
              {mission && !isSkipped && canTurnIn && (
                <img
                  src="/images/farming/checkmark.png"
                  alt="Ready"
                  draggable={false}
                  style={{
                    position: 'absolute', top: '5%', right: '2%',
                    width: '9%', pointerEvents: 'none', zIndex: 4,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))',
                  }}
                />
              )}

              {/* OUT OF ORDER overlay when slot is skipped */}
              {isSkipped && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0, 0, 0, 0.68)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}>
                  <div style={{
                    background: '#d92b2b',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '900',
                    letterSpacing: '3px',
                    padding: '8px 14px',
                    transform: 'rotate(-12deg)',
                    boxShadow: '3px 3px 0 rgba(0,0,0,0.4), -1px -1px 0 rgba(0,0,0,0.2)',
                    border: '2px dashed rgba(255,255,255,0.4)',
                    textShadow: '1px 1px 0 #000',
                    userSelect: 'none',
                  }}>OUT OF ORDER</div>
                  <div style={{ fontSize: '12px', color: '#c8a46a', textAlign: 'center', lineHeight: 1.6 }}>
                    New mission in<br />
                    <span style={{ fontSize: '18px', color: '#f5d87a', fontWeight: 'bold', display: 'block' }}>
                      {formatCountdown(skipTimers[i].replacesAt - now)}
                    </span>
                  </div>
                </div>
              )}

              {/* Turn in / Skip buttons */}
              {mission && !isSkipped && (
                <>
                  <img
                    src="/images/Missionboard/turnin.png"
                    alt="Turn In"
                    draggable={false}
                    onClick={() => turnIn(mission, i)}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    style={{ position: 'absolute', bottom: 'calc(8% - 30px)', left: 'calc(22% - 25px)', width: '31%', cursor: 'pointer', transition: 'transform 0.1s', userSelect: 'none' }}
                  />
                  <img
                    src="/images/Missionboard/skip.png"
                    alt="Skip"
                    draggable={false}
                    onClick={() => skipMission(i, mission.id)}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1.08)'}
                    style={{ position: 'absolute', bottom: 'calc(8% - 30px)', left: 'calc(57% - 25px)', width: '31%', cursor: 'pointer', transition: 'transform 0.1s', userSelect: 'none' }}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* X close button */}
        <img
          src="/images/Missionboard/x.png"
          alt="Close"
          draggable={false}
          onClick={onClose}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1.1)'}
          style={{ position: 'absolute', top: 'calc(2% + 60px)', right: 'calc(2% - 30px)', width: '11%', cursor: 'pointer', transition: 'transform 0.1s', userSelect: 'none' }}
        />
      </div>
    </div>
  );
};

export default MissionBoard;
