import React, { useState, useEffect, useRef } from "react";
import BaseButton from "../../components/buttons/BaseButton";
import { ALL_ITEMS, IMAGE_URL_CROP } from "../../constants/item_data";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../../constants/item_seed";
import { ID_SEEDS, ID_RARE_TYPE, ID_CROP_CATEGORIES } from "../../constants/app_ids";

// Card front images keyed by [baseId][rarityLevel]
export const CARD_FRONT_IMAGES = {
  [ID_SEEDS.ONION]: {
    1: "/images/cardfront/onioncard/onionseedcom.png",
    2: "/images/cardfront/onioncard/onionseeduncom.png",
    3: "/images/cardfront/onioncard/onionseedrare.png",
    4: "/images/cardfront/onioncard/onionseedepic.png",
    5: "/images/cardfront/onioncard/onionseedleg.png",
  },
  [ID_SEEDS.POTATO]: {
    1: "/images/cardfront/potatocard/potatoseedcom.png",
    2: "/images/cardfront/potatocard/potatoseeduncom.png",
    3: "/images/cardfront/potatocard/potatoseedrare.png",
    4: "/images/cardfront/potatocard/potatoseedepic.png",
    5: "/images/cardfront/potatocard/potatoseedleg.png",
  },
  [ID_SEEDS.BLUEBERRY]: {
    1: "/images/cardfront/blueberry/blueberrycomseed.png",
    2: "/images/cardfront/blueberry/blueberryseeduncom.png",
    3: "/images/cardfront/blueberry/blueberryseedrare.png",
    4: "/images/cardfront/blueberry/blueberryseedepic.png",
    5: "/images/cardfront/blueberry/blueberryseedleg.png",
  },
  [ID_SEEDS.BROCCOLI]: {
    1: "/images/cardfront/broccoli/Brocoloiseed.png",
    2: "/images/cardfront/broccoli/brocoliseeduncom.png",
    3: "/images/cardfront/broccoli/brocoliseedrare.png",
    4: "/images/cardfront/broccoli/brocoliseedepic.png",
    5: "/images/cardfront/broccoli/broclieseedleg.png",
  },
  [ID_SEEDS.CELERY]: {
    1: "/images/cardfront/celery/cellaryseedcom.png",
    2: "/images/cardfront/celery/cellaryseeduncom.png",
    3: "/images/cardfront/celery/cellaryseedrare.png",
    4: "/images/cardfront/celery/cellaryseedepic.png",
    5: "/images/cardfront/celery/cellaryseedleg.png",
  },
  [ID_SEEDS.GRAPES]: {
    1: "/images/cardfront/grape/grapeseedcom.png",
    2: "/images/cardfront/grape/grapeseeduncom.png",
    3: "/images/cardfront/grape/grapeseedrare.png",
    4: "/images/cardfront/grape/grapeseedepic.png",
    5: "/images/cardfront/grape/grapeseedleg.png",
  },
  [ID_SEEDS.PEPPER]: {
    1: "/images/cardfront/pepper/pepperseedcom.png",
    2: "/images/cardfront/pepper/pepperseeduncom.png",
    3: "/images/cardfront/pepper/pepperseedrare.png",
    4: "/images/cardfront/pepper/pepperseedepic.png",
    5: "/images/cardfront/pepper/pepperseedleg.png",
  },
  [ID_SEEDS.PINEAPPLE]: {
    1: "/images/cardfront/pineapplecard/pineappleseedcom.png",
    2: "/images/cardfront/pineapplecard/pineappleseeduncom.png",
    3: "/images/cardfront/pineapplecard/pineappleseedrare.png",
    4: "/images/cardfront/pineapplecard/pineappleseedepic.png",
    5: "/images/cardfront/pineapplecard/pineappleseedleg.png",
  },
  [ID_SEEDS.MANGO]: {
    1: "/images/cardfront/mango/mangoseedcom.png",
    2: "/images/cardfront/mango/mangoseeduncom.png",
    3: "/images/cardfront/mango/mangoseedrare.png",
    4: "/images/cardfront/mango/mangoseedepic.png",
    5: "/images/cardfront/mango/mangoseedleg.png",
  },
  [ID_SEEDS.PAPAYA]: {
    1: "/images/cardfront/papaya/papayaseedcom.png",
    2: "/images/cardfront/papaya/papayaseeduncom.png",
    3: "/images/cardfront/papaya/papayaseedrare.png",
    4: "/images/cardfront/papaya/papayaseedepic.png",
    5: "/images/cardfront/papaya/papayaseedleg.png",
  },
  [ID_SEEDS.PUMPKIN]: {
    1: "/images/cardfront/pumpkin/pumpkinseedcom.png",
    2: "/images/cardfront/pumpkin/pumpkinseeduncom.png",
    3: "/images/cardfront/pumpkin/pumpkinseedrare.png",
    4: "/images/cardfront/pumpkin/pumpkinseedepic.png",
    5: "/images/cardfront/pumpkin/pumpkinseedleg.png",
  },
  [ID_SEEDS.TOMATO]: {
    1: "/images/cardfront/tomato/tomatoseedcom.png",
    2: "/images/cardfront/tomato/tomatoseeduncom.png",
    3: "/images/cardfront/tomato/tomatoseedrare.png",
    4: "/images/cardfront/tomato/tomatoseedepic.png",
    5: "/images/cardfront/tomato/tomatoseedleg.png",
  },
  [ID_SEEDS.TURNIP]: {
    1: "/images/cardfront/turnip/turnipseedcom.png",
    2: "/images/cardfront/turnip/turnipseeduncom.png",
    3: "/images/cardfront/turnip/turnipseedrare.png",
    4: "/images/cardfront/turnip/turnipseedepic.png",
    5: "/images/cardfront/turnip/turnipseedleg.png",
  },
  [ID_SEEDS.DRAGON_FRUIT]: {
    1: "/images/cardfront/dragonfruit/dragonseedcom.png",
    2: "/images/cardfront/dragonfruit/dragonseeduncom.png",
    3: "/images/cardfront/dragonfruit/dragonfruitseedrare.png",
    4: "/images/cardfront/dragonfruit/dragonfruitseedepic.png",
    5: "/images/cardfront/dragonfruit/dragonfruitseedleg.png",
  },
  [ID_SEEDS.LETTUCE]: {
    1: "/images/cardfront/lettuce/lettuceseedcom.png",
    2: "/images/cardfront/lettuce/lettuceseeduncom.png",
    3: "/images/cardfront/lettuce/lettuceseedrare.png",
    4: "/images/cardfront/lettuce/lettuceseedepic.png",
    5: "/images/cardfront/lettuce/lettuceseedleg.png",
  },
  [ID_SEEDS.LICHI]: {
    1: "/images/cardfront/lychee/lycheeseedcom.png",
    2: "/images/cardfront/lychee/lycheeseeduncom.png",
    3: "/images/cardfront/lychee/lycheeseedrare.png",
    4: "/images/cardfront/lychee/lycheeseedepic.png",
    5: "/images/cardfront/lychee/lycheeseedleg.png",
  },
  [ID_SEEDS.RADISH]: {
    1: "/images/cardfront/radish/raddishseedcom.png",
    2: "/images/cardfront/radish/raddishseeduncom.png",
    3: "/images/cardfront/radish/raddishseedrare.png",
    4: "/images/cardfront/radish/raddishseedepic.png",
    5: "/images/cardfront/radish/raddishseedleg.png",
  },
  [ID_SEEDS.AVOCADO]: {
    1: "/images/cardfront/avocado/avocadoseedom.png",
    2: "/images/cardfront/avocado/avocadoseedcuncom.png",
    3: "/images/cardfront/avocado/avocadoseedrare.png",
    4: "/images/cardfront/avocado/avocadoseedepic.png",
    5: "/images/cardfront/avocado/avocadoseedleg.png",
  },
  [ID_SEEDS.BANANA]: {
    1: "/images/cardfront/banana/bananaseedcom.png",
    2: "/images/cardfront/banana/bananaseeduncom.png",
    3: "/images/cardfront/banana/bananaseedrare.png",
    4: "/images/cardfront/banana/bananaseedepic.png",
    5: "/images/cardfront/banana/bananaseedleg.png",
  },
  [ID_SEEDS.CAULIFLOWER]: {
    1: "/images/cardfront/califlower/calicom.png",
    2: "/images/cardfront/califlower/caliuncom.png",
    3: "/images/cardfront/califlower/calirare.png",
    4: "/images/cardfront/califlower/caliepic.png",
    5: "/images/cardfront/califlower/calileg.png",
  },
  [ID_SEEDS.CORN]: {
    1: "/images/cardfront/corn/cornseedcom.png",
    2: "/images/cardfront/corn/cornseeduncom.png",
    3: "/images/cardfront/corn/cornseedrare.png",
    4: "/images/cardfront/corn/cornseedepic.png",
    5: "/images/cardfront/corn/cornseedleg.png",
  },
  [ID_SEEDS.BOKCHOY]: {
    1: "/images/cardfront/bokchoy/bokchoyseedcom.png",
    2: "/images/cardfront/bokchoy/bokchoyseeduncom.png",
    3: "/images/cardfront/bokchoy/bokchoyseedrare.png",
    4: "/images/cardfront/bokchoy/bokchoyseedepic.png",
    5: "/images/cardfront/bokchoy/bokchoyseedleg.png",
  },
  [ID_SEEDS.CARROT]: {
    1: "/images/cardfront/carrot/carrotseedcom.png",
    2: "/images/cardfront/carrot/carrotseeduncom.png",
    3: "/images/cardfront/carrot/carrotseedrare.png",
    4: "/images/cardfront/carrot/carrotseedepic.png",
    5: "/images/cardfront/carrot/carrotseedleg.png",
  },
  [ID_SEEDS.LAVENDER]: {
    1: "/images/cardfront/lavender/lavenderseedcom.png",
    2: "/images/cardfront/lavender/lavenderseeduncom.png",
    3: "/images/cardfront/lavender/lavenderseedrare.png",
    4: "/images/cardfront/lavender/lavendarseedepic.png",
    5: "/images/cardfront/lavender/lavendarseedleg.png",
  },
  [ID_SEEDS.WHEAT]: {
    1: "/images/cardfront/wheat/wheatseedcom.png",
    2: "/images/cardfront/wheat/wheatseeduncom.png",
    3: "/images/cardfront/wheat/wheetseedrare.png",
    4: "/images/cardfront/wheat/wheatseedepic.png",
    5: "/images/cardfront/wheat/wheatseedleg.png",
  },
  [ID_SEEDS.POMEGRANATE]: {
    1: "/images/cardfront/pomegranate/pomogranteseedcom.png",
    2: "/images/cardfront/pomegranate/pomogranteseeduncom.png",
    3: "/images/cardfront/pomegranate/pomogranteseedrare.png",
    4: "/images/cardfront/pomegranate/pomogranteseedepic.png",
    5: "/images/cardfront/pomegranate/pomogranteseedleg.png",
  },
  [ID_SEEDS.APPLE]: {
    1: "/images/cardfront/apple/appleseedcom.png",
    2: "/images/cardfront/apple/appleseeduncom.png",
    3: "/images/cardfront/apple/appleseedrare.png",
    4: "/images/cardfront/apple/appleseedepic.png",
    5: "/images/cardfront/apple/appleseedleg.png",
  },
  [ID_SEEDS.EGGPLANT]: {
    1: "/images/cardfront/eggplant/eggplantseedcom.png",
    2: "/images/cardfront/eggplant/eggplantseeduncom.png",
    3: "/images/cardfront/eggplant/eggplantseedrare.png",
    4: "/images/cardfront/eggplant/eggplantseedepic.png",
    5: "/images/cardfront/eggplant/eggplantseedleg.png",
  },
};

// Extracts the base seed ID (strips rarity bits 12-14) and rarity level
export const getBaseAndRarity = (seedId) => {
  const rarity = (seedId >> 12) & 0xF;
  const baseId = seedId & 0xFFF;
  return { baseId, rarityLevel: rarity || 1 };
};

const CARD_BACK_IMAGES = {
  [ID_RARE_TYPE.COMMON]:    "/images/cardback/commonback.png",
  [ID_RARE_TYPE.UNCOMMON]:  "/images/cardback/uncommonback.png",
  [ID_RARE_TYPE.RARE]:      "/images/cardback/rareback.png",
  [ID_RARE_TYPE.EPIC]:      "/images/cardback/epicback.png",
  [ID_RARE_TYPE.LEGENDARY]: "/images/cardback/legendaryback.png",
};

const CARD_GLOW_TYPES = new Set([ID_RARE_TYPE.LEGENDARY]);

const PACK_IDLE_FRAMES = 11;
const PACK_IDLE_FPS = 12;
const OPEN_FRAMES = 15;
const OPEN_FRAME_OFFSET = 13;
const DRAG_PX_FULL = 600;

const PACK_CONFIGS = {
  pico_pack: { idleDir: 'card1idle/idle_1',         idlePrefix: 'idle_1',                idleFrames: 11, openDir: 'card1open/open_1',           openPrefix: 'open_1',                openFrames: 15, openFrameOffset: 13, sep: '_', alt: 'Pico Seeds Pack' },
  tutorial_farewell_pack: { idleDir: 'card1idle/idle_1', idlePrefix: 'idle_1',           idleFrames: 11, openDir: 'card1open/open_1',           openPrefix: 'open_1',                openFrames: 15, openFrameOffset: 13, sep: '_', alt: 'Pico Seeds Pack' },
  pabee_pack: { idleDir: 'card1idle/chest_wood',      idlePrefix: 'New_idle_chest_wood_',  idleFrames: 21, openDir: 'card1open/new_open_chest_wood',  openPrefix: 'NEW_open_chest_wood_',  openFrames: 27, openFrameOffset: 21, sep: '', alt: 'Seeds Pack' },
  2:         { idleDir: 'card1idle/idle_1',         idlePrefix: 'idle_1',                idleFrames: 11, openDir: 'card1open/open_1',           openPrefix: 'open_1',                openFrames: 15, openFrameOffset: 13, sep: '_', alt: 'Pico Seeds Pack' },
  3:         { idleDir: 'basicseedidle/idle_2',      idlePrefix: 'idle_2',                openDir: 'basicseedopen/open_2',       openPrefix: 'open_2',                sep: '_', alt: 'Basic Seeds Pack' },
  4:         { idleDir: 'premseedidle/idle_3',       idlePrefix: 'idle_3',                openDir: 'premseedopen/open_3',        openPrefix: 'open_3',                sep: '_', alt: 'Premium Seeds Pack' },
  LEVEL_UP:  { idleDir: 'levelupidle/Idle_levelUP', idlePrefix: 'Idle_LevelUP',          idleFrames: 11, openDir: 'levelupopen/Open_LevelUP',   openPrefix: 'Open_LevelUP',          openFrames: 15, openFrameOffset: 13, sep: '_', alt: 'Level Up!' },
};

// Customize rewards per skill and level here
// Gems: 250 + (level-1)*50, Gold: 250 + (level-1)*200
export const LEVEL_UP_REWARDS = {
  Farming:  (level) => [
    { label: `${250 + (level - 1) * 200} Gold`, image: '/images/profile_bar/hny.png', color: '#ffea00' },
    { label: `${250 + (level - 1) * 50} Gems`,  image: '/images/profile_bar/diamond.png',               color: '#00bfff' },
  ],
  Mining:   (level) => [
    { label: `${250 + (level - 1) * 200} Gold`, image: '/images/profile_bar/hny.png', color: '#ffea00' },
    { label: `${250 + (level - 1) * 50} Gems`,  image: '/images/profile_bar/diamond.png',               color: '#00bfff' },
  ],
  Foraging: (level) => [
    { label: `${250 + (level - 1) * 200} Gold`, image: '/images/profile_bar/hny.png', color: '#ffea00' },
    { label: `${250 + (level - 1) * 50} Gems`,  image: '/images/profile_bar/diamond.png',               color: '#00bfff' },
  ],
  Fishing:  (level) => [
    { label: `${250 + (level - 1) * 200} Gold`, image: '/images/profile_bar/hny.png', color: '#ffea00' },
    { label: `${250 + (level - 1) * 50} Gems`,  image: '/images/profile_bar/diamond.png',               color: '#00bfff' },
  ],
  Crafting: (level) => [
    { label: `${250 + (level - 1) * 200} Gold`, image: '/images/profile_bar/hny.png', color: '#ffea00' },
    { label: `${250 + (level - 1) * 50} Gems`,  image: '/images/profile_bar/diamond.png',               color: '#00bfff' },
  ],
};

const PackIdle = ({ packId }) => {
  const [frame, setFrame] = useState(0);
  const cfg = PACK_CONFIGS[packId] || PACK_CONFIGS[2];
  const totalIdleFrames = cfg.idleFrames ?? PACK_IDLE_FRAMES;
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % totalIdleFrames), 1000 / PACK_IDLE_FPS);
    return () => clearInterval(interval);
  }, [totalIdleFrames]);
  const frameStr = String(frame).padStart(5, '0');
  return (
    <img
      src={`/images/cardfront/${cfg.idleDir}/${cfg.idlePrefix}${cfg.sep ?? '_'}${frameStr}.png`}
      alt={cfg.alt}
      draggable={false}
      style={{ height: '80vh', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
    />
  );
};

const PokemonPackRipDialog = ({ rollingInfo, onClose, onBack, onBuyAgain }) => {
  const [showCards, setShowCards] = useState(false);
  const [packFading, setPackFading] = useState(false);
  const [packSlid, setPackSlid] = useState(false);
  const [cardPhase, setCardPhase] = useState('hidden'); // 'hidden'|'behind'|'flyup'|'floatdown'
  const [dealt, setDealt] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [flipDone, setFlipDone] = useState(new Set());
  const [flashing, setFlashing] = useState(false);
  const [floatReady, setFloatReady] = useState(false);
  const PACK_SLIDE_Y = 150;

  const CARD_W = 220;
  const CARD_GAP = 28;

  // Pack-opening scrub state
  const [phase, setPhase] = useState('idle'); // 'idle' | 'opening' | 'reversing'
  const [openFrame, setOpenFrame] = useState(0);
  const phaseRef = useRef('idle');
  const openFrameRef = useRef(0);
  const startXRef = useRef(0);
  const reverseRafRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pathPointsRef = useRef([]);
  const fadeRafRef = useRef(null);

  const syncPhase = (p) => { phaseRef.current = p; setPhase(p); };
  const syncFrame = (f) => { openFrameRef.current = f; setOpenFrame(f); };
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('packOpened'));
  }, []);

  // Mark the body so PlayerPullNotification suppresses pull notifications across the
  // entire pack-opening experience (pack rip + card reveal). Also tear down any
  // notification currently on screen so it doesn't sit on top.
  useEffect(() => {
    document.body.setAttribute('data-pack-open', 'true');
    window.dispatchEvent(new CustomEvent('letterOpened'));
    return () => document.body.removeAttribute('data-pack-open');
  }, []);

  const cfg = PACK_CONFIGS[rollingInfo.id] || PACK_CONFIGS[2];
  const packOpenFrames = cfg.openFrames ?? OPEN_FRAMES;
  const packOpenFrameOffset = cfg.openFrameOffset ?? OPEN_FRAME_OFFSET;

  // Dispense sandbox rewards once on mount
  const rewardGiven = useRef(false);
  useEffect(() => {
    if (rewardGiven.current) return;
    rewardGiven.current = true;
    if (rollingInfo.id === 'LEVEL_UP') {
      const level = rollingInfo.level || 1;
      const gems = 250 + (level - 1) * 50;
      const gold = 250 + (level - 1) * 200;
      const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      localStorage.setItem('sandbox_gems', String(currentGems + gems));
      window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
      const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
      localStorage.setItem('sandbox_gold', String(currentGold + gold));
      window.dispatchEvent(new CustomEvent('goldChanged', { detail: String(currentGold + gold) }));
    } else if (rollingInfo.id === 'pabee_pack') {
      const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
      localStorage.setItem('sandbox_gold', String(currentGold + 1000));
      window.dispatchEvent(new CustomEvent('goldChanged', { detail: String(currentGold + 1000) }));
      const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      localStorage.setItem('sandbox_gems', String(currentGems + 250));
      window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
    }
  }, []);

  const revealCards = () => {
    const numCards = (rollingInfo.revealedSeeds?.length || 0) + (rollingInfo.id === 'pabee_pack' ? 2 : 0);
    // flyup stagger: 70ms per card + 380ms fly duration
    const FLY_DONE = 900 + numCards * 70 + 380;

    // 1. Pack slides down
    setPackSlid(true);

    // 2. Cards appear as stack of card backs behind the pack
    setTimeout(() => {
      setShowCards(true);
      setCardPhase('behind');
    }, 450);

    // 3. Cards fly up off-screen one by one
    setTimeout(() => setCardPhase('flyup'), 900);

    // 4. Screen flashes bright — pack fades simultaneously so it's gone before flash clears
    setTimeout(() => {
      setFlashing(true);
      setPackFading(true);
    }, FLY_DONE);

    // 5. Cards snap to final X above screen (during flash)
    setTimeout(() => {
      setCardPhase('floatdown');
    }, FLY_DONE + 380);

    // 6. Cards float down (after snap, double-rAF handled by 50ms gap)
    setTimeout(() => setFloatReady(true), FLY_DONE + 430);

    // 7. Flash done, pack removed from DOM
    setTimeout(() => {
      setFlashing(false);
      setDealt(true);
    }, FLY_DONE + 980);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  useEffect(() => {
    return () => {
      if (reverseRafRef.current) cancelAnimationFrame(reverseRafRef.current);
      if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);
    };
  }, []);

  const drawTraceLine = (points, alpha = 1) => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = alpha;
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = 'rgba(255, 234, 0, 0.5)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 234, 0, 0.9)';
    ctx.shadowBlur = 20;
    ctx.stroke();
    // Bright core
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(255, 255, 255, 1)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handlePointerDown = (e) => {
    if (phaseRef.current === 'complete') return;
    if (reverseRafRef.current) { cancelAnimationFrame(reverseRafRef.current); reverseRafRef.current = null; }
    if (fadeRafRef.current) { cancelAnimationFrame(fadeRafRef.current); fadeRafRef.current = null; }
    startXRef.current = e.clientX;
    pathPointsRef.current = [{ x: e.clientX, y: e.clientY }];
    clearCanvas();
    syncPhase('opening');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (phaseRef.current !== 'opening') return;
    const dx = Math.max(0, e.clientX - startXRef.current);
    const frame = Math.min(packOpenFrames - 1, Math.floor((dx / DRAG_PX_FULL) * packOpenFrames));
    syncFrame(frame);
    pathPointsRef.current.push({ x: e.clientX, y: e.clientY });
    drawTraceLine(pathPointsRef.current);
  };

  const handlePointerUp = () => {
    if (phaseRef.current !== 'opening') return;
    if (openFrameRef.current >= packOpenFrames - 1) {
      syncPhase('complete');
      clearCanvas();
      const packsOpened = parseInt(localStorage.getItem('sandbox_packs_opened') || '0', 10);
      localStorage.setItem('sandbox_packs_opened', String(packsOpened + 1));
      setTimeout(revealCards, 300);
    } else {
      syncPhase('reversing');
      // Fade out the trace
      let alpha = 1;
      const pts = [...pathPointsRef.current];
      const fade = () => {
        alpha -= 0.07;
        if (alpha <= 0) { clearCanvas(); fadeRafRef.current = null; return; }
        drawTraceLine(pts, alpha);
        fadeRafRef.current = requestAnimationFrame(fade);
      };
      fadeRafRef.current = requestAnimationFrame(fade);

      const reverse = () => {
        if (openFrameRef.current <= 0) {
          syncPhase('idle');
          syncFrame(0);
          reverseRafRef.current = null;
          return;
        }
        syncFrame(openFrameRef.current - 1);
        reverseRafRef.current = requestAnimationFrame(reverse);
      };
      reverseRafRef.current = requestAnimationFrame(reverse);
    }
  };


  const isLevelUp = rollingInfo.id === 'LEVEL_UP';
  const revealedSeeds = isLevelUp ? [] : (rollingInfo.revealedSeeds || []);
  const bonusCards = isLevelUp
    ? (LEVEL_UP_REWARDS[rollingInfo.skill]?.(rollingInfo.level) || []).map((r, i) => ({ ...r, type: `reward_${i}` }))
    : rollingInfo.id === 'pabee_pack' ? [
        { type: 'gold', label: '1000 HONEY', image: '/images/profile_bar/hny.png', color: '#ffea00', cardImage: '/images/cardfront/goldcard/goldcard.png', cardBack: '/images/cardback/legendaryback.png' },
        { type: 'gems', label: '250 Gems', image: '/images/profile_bar/diamond.png', color: '#00bfff', cardImage: '/images/cardfront/gemcard/gemcard.png', cardBack: '/images/cardback/rareback.png' },
      ]
    : rollingInfo.id === 'tutorial_farewell_pack' ? [
        { type: 'gold', label: '2000 HONEY', image: '/images/profile_bar/hny.png', color: '#ffea00', cardImage: '/images/cardfront/goldcard/goldcard.png', cardBack: '/images/cardback/legendaryback.png' },
        { type: 'gems', label: '250 Gems', image: '/images/profile_bar/diamond.png', color: '#00bfff', cardImage: '/images/cardfront/gemcard/gemcard.png', cardBack: '/images/cardback/rareback.png' },
      ]
    : [];
  const totalCards = revealedSeeds.length + bonusCards.length;

  const flipCard = (idx) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    // Fire the rarity pull notification when a rare/epic/legendary card is revealed.
    const seedId = revealedSeeds[idx];
    if (seedId) {
      const { rarityLevel } = getBaseAndRarity(seedId);
      const rarityName = rarityLevel === 5 ? 'legendary' : rarityLevel === 4 ? 'epic' : rarityLevel === 3 ? 'rare' : null;
      if (rarityName) {
        const item = ALL_ITEMS[seedId];
        // Delay slightly so the flip animation reads first.
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('playerPullNoti', {
            detail: {
              rarity: rarityName,
              itemImage: item?.image,
              itemName: item?.label,
              username: localStorage.getItem('sandbox_username') || 'Player',
              action: 'pulled',
            },
          }));
        }, 700);
      }
    }
  };

  const flipAll = () => {
    let delay = 0;
    for (let i = 0; i < totalCards; i++) {
      if (flippedCards.has(i)) continue;
      const interval = Math.max(250, 800 - i * 130);
      setTimeout(() => {
        setFlippedCards(prev => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
      }, delay);
      delay += interval;
    }
  };

  const allFlipped = flippedCards.size === totalCards && totalCards > 0;

  const renderBonusCard = (bonus, idx) => {
    const flipped = flippedCards.has(idx);
    return (
      <div
        key={`bonus-${idx}`}
        onClick={() => { if (!flipped) flipCard(idx); }}
        draggable={false}
        onDragStart={e => e.preventDefault()}
        style={{ width: '220px', height: '310px', position: 'relative', cursor: flipped ? 'default' : 'pointer', flexShrink: 0, perspective: '600px', userSelect: 'none' }}
      >
        <div
          className={`card-inner${flipped ? ' flipped' : ''}`}
          onTransitionEnd={() => {
            if (flipped) setFlipDone(prev => { const n = new Set(prev); n.add(idx); return n; });
          }}
        >
          {/* Back face */}
          <div className="card-face card-back-face">
            <img src={bonus.cardBack || "/images/cardback/commonback.png"} alt="Card Back" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />
          </div>
          {/* Front face */}
          {bonus.cardImage ? (
            <div className="card-face card-front-face">
              <img src={bonus.cardImage} alt={bonus.label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />
              <span style={{
                position: 'absolute',
                bottom: '10%',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontFamily: 'Cartoonist, GROBOLD, sans-serif',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 8px rgba(0,0,0,0.6)',
                letterSpacing: 1,
                pointerEvents: 'none',
              }}>{bonus.label}</span>
            </div>
          ) : (
            <div className="card-face card-front-face" style={{ backgroundColor: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              {bonus.emoji
                ? <span style={{ fontSize: '64px', lineHeight: 1, filter: `drop-shadow(0 0 12px ${bonus.color})` }}>{bonus.emoji}</span>
                : <img src={bonus.image} alt={bonus.label} style={{ width: '80px', height: '80px', objectFit: 'contain', filter: `drop-shadow(0 0 12px ${bonus.color})` }} />
              }
              <span style={{ fontFamily: 'Cartoonist', fontSize: '20px', color: bonus.color, textShadow: '1px 1px 0 #000', textAlign: 'center' }}>{bonus.label}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCardFront = (seedId) => {
    const { baseId, rarityLevel } = getBaseAndRarity(seedId);
    const item = ALL_ITEMS[seedId];
    const customCardFront = CARD_FRONT_IMAGES[baseId]?.[rarityLevel];

    if (customCardFront) {
      return <img src={customCardFront} alt={item?.label} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />;
    }

    return null;
  };

  const renderCard = (seedId, idx) => {
    const { rarityLevel } = getBaseAndRarity(seedId);
    // Map rarityLevel (1–5) to ID_RARE_TYPE so back image matches front rarity
    const rarityLevelToType = { 1: ID_RARE_TYPE.COMMON, 2: ID_RARE_TYPE.UNCOMMON, 3: ID_RARE_TYPE.RARE, 4: ID_RARE_TYPE.EPIC, 5: ID_RARE_TYPE.LEGENDARY };
    const rarityType = rarityLevelToType[rarityLevel] || ID_RARE_TYPE.COMMON;
    const backImg = CARD_BACK_IMAGES[rarityType] || CARD_BACK_IMAGES[ID_RARE_TYPE.COMMON];
    const hasGlow = CARD_GLOW_TYPES.has(rarityType);
    const flipped = flippedCards.has(idx);
    const showGlow = hasGlow && (!flipped || flipDone.has(idx));

    return (
      <div
        key={idx}
        onClick={() => !flipped && flipCard(idx)}
        draggable={false}
        onDragStart={e => e.preventDefault()}
        style={{ width: '220px', height: '310px', position: 'relative', cursor: flipped ? 'default' : 'pointer', flexShrink: 0, perspective: '600px', userSelect: 'none' }}
      >
        {showGlow && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '340px', height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(255,200,30,0.55) 0%, rgba(255,140,0,0.3) 35%, rgba(255,80,0,0.1) 60%, transparent 75%)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: -1,
            animation: 'legGlow 2.4s ease-in-out infinite',
          }} />
        )}
        <div
          className={`card-inner${flipped ? ' flipped' : ''}`}
          onTransitionEnd={() => {
            if (flipped) setFlipDone(prev => { const n = new Set(prev); n.add(idx); return n; });
          }}
        >
          {/* Back face */}
          <div className="card-face card-back-face">
            <img src={backImg} alt="Card Back" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }} />
          </div>
          {/* Front face */}
          <div className="card-face card-front-face">
            {renderCardFront(seedId)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.75)' }}>

      {/* Pack — stays visible, fades+scales out when cards emerge */}
      {!dealt && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          opacity: packFading ? 0 : 1,
          transform: packSlid
            ? `translateY(${PACK_SLIDE_Y}px)${packFading ? ' scale(1.15)' : ''}`
            : 'none',
          transition: packFading
            ? 'opacity 0.4s ease, transform 0.4s ease'
            : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: packFading ? 'none' : 'auto',
        }}>
          <div
            ref={containerRef}
            style={{ userSelect: 'none', touchAction: 'none', position: 'relative', display: 'inline-block' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <style>{`
              @keyframes swipeHintBob {
                0%, 100% { opacity: 0.85; transform: translateX(-50%) translateY(0px); }
                50%       { opacity: 1;    transform: translateX(-50%) translateY(-5px); }
              }
              @keyframes glowSweep {
                0%   { left: -80px; }
                100% { left: calc(100% + 80px); }
              }
              @keyframes swipeFingerMove {
                0%   { left: 8%;  opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
                12%  { left: 12%; opacity: 1; transform: translate(-50%, -50%) scale(1); }
                88%  { left: 86%; opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { left: 88%; opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
              }
              @keyframes fingerTrail {
                0%   { left: 8%;  width: 0px; opacity: 0; }
                12%  { opacity: 0.5; }
                88%  { opacity: 0.5; }
                100% { left: 8%;  width: 80%; opacity: 0; }
              }
            `}</style>
            {(() => {
              return phase === 'idle'
                ? <PackIdle packId={rollingInfo.id} />
                : <img
                    src={`/images/cardfront/${cfg.openDir}/${cfg.openPrefix}${cfg.sep ?? '_'}${String(packOpenFrameOffset + openFrame).padStart(5, '0')}.png`}
                    draggable={false}
                    style={{ height: '80vh', objectFit: 'contain', display: 'block', imageRendering: 'pixelated' }}
                  />;
            })()}

            {/* Swipe hint — only while idle */}
            {phase === 'idle' && (
              <>
                <div style={{
                  position: 'absolute', top: '-14px', left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Cartoonist', fontSize: '51px',
                  color: '#fff',
                  textShadow: '0 0 12px #ffea00, 0 0 24px #ffea00, 1px 1px 0 #000, -1px -1px 0 #000',
                  pointerEvents: 'none',
                  animation: 'swipeHintBob 1.6s ease-in-out infinite',
                }}>
                  ← SWIPE TO OPEN →
                </div>

                {/* Tear line across the pack */}
                <div style={{
                  position: 'absolute', top: 'calc(10% + 62.5px)', left: '8%', right: '8%',
                  height: '3px',
                  background: 'rgba(255,234,0,0.3)',
                  boxShadow: '0 0 6px 2px rgba(255,234,0,0.25)',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: '-3px',
                    width: '80px', height: '9px',
                    background: 'linear-gradient(to right, transparent, rgba(255,234,0,0.9), white, rgba(255,234,0,0.9), transparent)',
                    filter: 'blur(2px)',
                    animation: 'glowSweep 1.6s ease-in-out infinite',
                  }} />
                </div>

                {/* Animated finger touch indicator sweeping along tear line */}
                <div style={{
                  position: 'absolute',
                  top: 'calc(10% + 62.5px)',
                  left: 0, right: 0, height: 0,
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute',
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,234,0,0.6) 60%, transparent 100%)',
                    boxShadow: '0 0 18px 7px rgba(255,234,0,0.7), 0 0 6px 2px rgba(255,255,255,0.9)',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    animation: 'swipeFingerMove 1.6s ease-in-out infinite',
                  }} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Swipe trace canvas */}
      {!dealt && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed', inset: 0,
            width: '100vw', height: '100vh',
            zIndex: 11,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Screen flash */}
      {flashing && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          backgroundColor: 'white',
          pointerEvents: 'none',
          animation: 'screenFlash 0.98s ease forwards',
        }} />
      )}

      {/* Cards — emerge from behind pack, fly up, float back down */}
      {showCards && (() => {
        const COLS = 5;
        const CARD_H = 310;
        const ROW_GAP = 20;
        const numRows = Math.ceil(totalCards / COLS);
        const containerW = COLS * CARD_W + (COLS - 1) * CARD_GAP; // 1212px
        const containerH = numRows * CARD_H + (numRows - 1) * ROW_GAP;

        const cards = [
          ...revealedSeeds.map((seedId, idx) => ({ type: 'seed', seedId, idx })),
          ...bonusCards.map((bonus, i) => ({ type: 'bonus', bonus, idx: revealedSeeds.length + i })),
        ];

        return (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden' }}>
            <style>{`
              .card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.5s ease; }
              .card-inner.flipped { transform: rotateY(180deg); }
              /* Each face sits 1px in front of its rotation plane so the two never z-fight at z=0,
                 which is what causes the back's corners to peek past the front at certain flip angles. */
              .card-face { position: absolute; top: 0; left: 0; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); overflow: hidden; box-sizing: border-box; transform: translateZ(1px); }
              .card-front-face { transform: rotateY(180deg) translateZ(1px); }
              /* Inherit the hidden-backface behavior into the inner img so it can't bleed through. */
              .card-face img { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
              @keyframes legGlow {
                0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
                50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.12); }
              }
              @keyframes screenFlash {
                0%   { opacity: 0; }
                30%  { opacity: 1; }
                100% { opacity: 0; }
              }
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(14px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {cards.map(({ type, seedId, bonus, idx }) => {
              const col = idx % COLS;
              const row = Math.floor(idx / COLS);
              const cardsInRow = row < numRows - 1 ? COLS : totalCards - row * COLS;
              const rowOffset = (containerW - (cardsInRow * CARD_W + (cardsInRow - 1) * CARD_GAP)) / 2;

              // Final position: translate from viewport center (card anchored at 50vw-110, 50vh-155)
              const finalX = -496 + rowOffset + col * (CARD_W + CARD_GAP);
              const finalYCalc = -containerH / 2 + row * (CARD_H + ROW_GAP) + CARD_H / 2 - 70;

              let transform, transition;
              if (cardPhase === 'hidden') {
                // Stacked at (slid-down) pack center, invisible
                transform = `translate(0, ${PACK_SLIDE_Y}px) scale(0)`;
                transition = 'none';
              } else if (cardPhase === 'behind') {
                // Stacked behind the pack — slight offset so you can see them layered
                transform = `translate(${idx * 1}px, ${PACK_SLIDE_Y - idx * 2}px) scale(1)`;
                transition = `transform 0.3s ease ${idx * 0.04}s`;
              } else if (cardPhase === 'flyup') {
                // Fly up one by one off the top of the screen
                const rot = idx % 2 === 0 ? -6 : 6;
                transform = `translate(0, -130vh) scale(0.8) rotate(${rot}deg)`;
                transition = `transform 0.38s cubic-bezier(0.55, 0, 0.85, 0.35) ${idx * 0.07}s`;
              } else { // floatdown
                if (!floatReady) {
                  // Snap to correct X column, off-screen above (no transition)
                  transform = `translate(${finalX}px, -130vh)`;
                  transition = 'none';
                } else {
                  // Float down with spring + stagger
                  transform = `translate(${finalX}px, ${finalYCalc}px)`;
                  transition = `transform 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.11}s`;
                }
              }

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `calc(50% - ${CARD_W / 2}px)`,
                    top: `calc(50% - ${CARD_H / 2}px)`,
                    width: CARD_W,
                    height: CARD_H,
                    transform,
                    transition,
                    opacity: cardPhase === 'hidden' ? 0 : 1,
                    zIndex: cardPhase === 'floatdown' ? 1 : totalCards - idx,
                  }}
                >
                  {type === 'seed' ? renderCard(seedId, idx) : renderBonusCard(bonus, idx)}
                </div>
              );
            })}

            {/* Buttons — appear after cards have floated down */}
            {cardPhase === 'floatdown' && floatReady && (
              <div
                style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', animation: 'fadeInUp 0.4s ease 1.3s both' }}
                onClick={e => e.stopPropagation()}
              >
                {!allFlipped && (
                  <img src="/images/button/flipallbutton.png" alt="Flip All" onClick={flipAll}
                    style={{ height: '104px', marginTop: '-5px', cursor: 'pointer', userSelect: 'none', transition: 'transform 0.08s, filter 0.08s' }}
                    draggable={false}
                    onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.15)'; e.currentTarget.style.transform='scale(1.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter='brightness(1)';    e.currentTarget.style.transform='scale(1)'; }}
                    onMouseDown={e =>  { e.currentTarget.style.transform='scale(0.95)';   e.currentTarget.style.filter='brightness(0.85)'; }}
                    onMouseUp={e =>    { e.currentTarget.style.transform='scale(1.04)';   e.currentTarget.style.filter='brightness(1.15)'; }}
                  />
                )}
                {flipDone.size === totalCards && totalCards > 0 && (
                  <>
                    <img src="/images/button/donebutton.png" alt="Done" onClick={onClose}
                      style={{ height: '104px', marginTop: '-5px', cursor: 'pointer', userSelect: 'none', transition: 'transform 0.08s, filter 0.08s' }}
                      draggable={false}
                      onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.15)'; e.currentTarget.style.transform='scale(1.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.filter='brightness(1)';    e.currentTarget.style.transform='scale(1)'; }}
                      onMouseDown={e =>  { e.currentTarget.style.transform='scale(0.95)';   e.currentTarget.style.filter='brightness(0.85)'; }}
                      onMouseUp={e =>    { e.currentTarget.style.transform='scale(1.04)';   e.currentTarget.style.filter='brightness(1.15)'; }}
                    />
                    {onBuyAgain && (
                      <img src="/images/button/buyagainbutton.png" alt="Buy Again" onClick={onBuyAgain}
                        style={{ height: '104px', marginTop: '-5px', cursor: 'pointer', userSelect: 'none', transition: 'transform 0.08s, filter 0.08s' }}
                        draggable={false}
                        onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.15)'; e.currentTarget.style.transform='scale(1.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.filter='brightness(1)';    e.currentTarget.style.transform='scale(1)'; }}
                        onMouseDown={e =>  { e.currentTarget.style.transform='scale(0.95)';   e.currentTarget.style.filter='brightness(0.85)'; }}
                        onMouseUp={e =>    { e.currentTarget.style.transform='scale(1.04)';   e.currentTarget.style.filter='brightness(1.15)'; }}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
export default PokemonPackRipDialog;
