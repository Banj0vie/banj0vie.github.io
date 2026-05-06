import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { MARKET_VIEWPORT, MARKET_HOTSPOTS, MARKET_BEES, MARKET_STUFFS } from "../constants/scene_market";
import DexDialog from "../containers/Market_Dex";
import VendorDialog from "../containers/Market_Vendor";
import BankerDialog from "../containers/Market_Banker";
import { ID_MARKET_HOTSPOTS } from "../constants/app_ids";
import MarketPlaceDialog from "../containers/Market_Marketplace";
import LeaderboardDialog from "../containers/Market_Leaderboard";
import SageDialog from "../containers/Market_Sage";
import AdminPanel from "./index";
import { navigateWithClouds } from "../components/RouteCloudTransition";
import WeatherOverlay from "../components/WeatherOverlay";
import Shop from "../containers/Shop";

// Step 0 is the silhouette intro — text computed dynamically with the saved username.
// Steps 1+ are the revealed mayor's regular dialogue.
const getMayorCutsceneLine = (step) => {
  if (step === 0) {
    const name = (typeof window !== 'undefined' && localStorage.getItem('sandbox_username')) || 'friend';
    return `${name}, is that you?`;
  }
  return MAYOR_CUTSCENE_DIALOGUE[step - 1];
};
const MAYOR_CUTSCENE_DIALOGUE = [
  "Hey, its me. Mayor Bee!",
  "Happy we could finnally meet! Welcome to the market, it can get very buszee sometimes so lets get moving!",
  "Your're here to get some more seeds right, well let me introduce to you our local seed vendor",
  "Now that you know where to get more seeds lets go get some! Click on the vendor to enter the shop!",
  "",  // step 6 — vendor interaction; cutscene UI is fully hidden, user interacts with vendor normally
  "Nice! Looks like you got some good seeds!",  // step 7 — mayor returns after pack flow finishes
  "Alright, now you know how to get more seeds",  // step 8
  "Happy Farming!",  // step 9 — last line; bubble click completes the cutscene
];
const MAYOR_CUTSCENE_TOTAL_STEPS = 1 + MAYOR_CUTSCENE_DIALOGUE.length; // silhouette + revealed dialogue lines

// Bank-intro cutscene — plays the first time the user reaches the market AFTER folding the
// q_mayor_bank_intro letter. Mayor revealed from step 0; steps 2-3 shift the bubble + mayor
// up and to the left so the bank is visible, with a bright spotlight circle on the bank.
// Step 3 advances when the user clicks the bank hotspot (which opens the bank popup).
// Step 4 plays over the bank popup: the banker bee silhouette + "???" bubble — same hidden
// effect the mayor uses on his step-0 silhouette in the vendor cutscene.
const BANK_CUTSCENE_DIALOGUE = [
  // step 0 — interpolated dynamically with username via getBankCutsceneLine
  "",
  "I saw your bag is getting pretty full and wanted to show you the bank",
  "Here is the Bank, here you can deposit any and all items",
  "Tap on it to check it out!",
  // step 4 — silhouette + "Welcome!" via getBankCutsceneLine.
  "",
  // step 5 — banker revealed; bubble swaps to bankerbubble.png. Username-interpolated.
  "",
  "Mayor Bee told me about you, welcome to the valley!",
  "Well this is the bank where you can deposit any items you want and withdraw them too",
  "First we need to open an account for you, tap on open an account and we will get you all set up",
  // After the user opens the account, the popup transitions to deposit/withdraw view —
  // these steps walk through the new options. Steps 9-10 highlight DEPOSIT, step 11
  // highlights WITHDRAW.
  "First we have the deposit option, this allows you to bring items into your bank",
  "This way you can free up some room in your bag",
  "Then we have withdraw which allows you to take items out of your bank and put it in your bag",
  "And thats pretty much it!",
  "Just so you know it costs 1,000 Gold a week to keep your account open",
  "Ill send you a letter when its time to pay up!",
  "The longer you are as a customer the more likely I am to allow you to be apart of our next tier membership...",
  "That gives you 100 slots",
  "Well it was nice meeting you, speak soon!",
];
const BANK_CUTSCENE_TOTAL_STEPS = BANK_CUTSCENE_DIALOGUE.length;

const Market = () => {
  const navigate = useNavigate();
  const { width, height } = MARKET_VIEWPORT;
  const hotspots = MARKET_HOTSPOTS;
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [showShop, setShowShop] = useState(false);
  const [showLockedPopup, setShowLockedPopup] = useState(false);
  const [tutMarketPage, setTutMarketPage] = useState(() => {
    if (localStorage.getItem('sandbox_tut_market') !== 'true') return 0;
    return parseInt(localStorage.getItem('sandbox_tut_market_page') || '11', 10);
  });

  // Mayor cutscene — plays on first market arrival after the user has read the
  // q_mayor_market_intro letter. -1 means hidden, otherwise it's the current line index.
  // We deliberately START at -1 and bump to 0 after the route-loading splash clears
  // (~950ms) so the silhouette intro doesn't render behind the loading screen.
  const [mayorCutsceneStep, setMayorCutsceneStep] = useState(-1);
  useEffect(() => {
    let read = [];
    try { read = JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]'); } catch (_) {}
    const introRead = Array.isArray(read) && read.includes('q_mayor_market_intro');
    const introSeen = localStorage.getItem('sandbox_mayor_market_intro_seen') === 'true';
    if (!introRead || introSeen) return;
    // App.jsx's route-loading splash holds for 900ms — start the cutscene just after
    // it clears so the player sees the silhouette + bubble on a settled scene.
    const t = setTimeout(() => setMayorCutsceneStep(0), 950);
    return () => clearTimeout(t);
  }, []);

  // Bank cutscene — plays the first time the user reaches the market AFTER folding the
  // q_mayor_bank_intro letter. Reads sandbox_market_pulse_bank synchronously on init so
  // we can decide *before* the existing effect clears that flag. The "active" flag persists
  // the cutscene across reloads so we can also clear the pulse flag (which scales the
  // market nav icon) without losing the cutscene's resume state.
  const [bankCutsceneStep, setBankCutsceneStep] = useState(() => {
    const pending = localStorage.getItem('sandbox_market_pulse_bank') === 'true';
    const active = localStorage.getItem('sandbox_bank_cutscene_active') === 'true';
    const seen = localStorage.getItem('sandbox_bank_cutscene_seen') === 'true';
    return ((pending || active) && !seen) ? 0 : -1;
  });

  // First market arrival → flip the visited flag (stops the nav-icon pulse immediately).
  // Also clears the bank-intro re-pulse flag whenever the user gets to the market, AND
  // auto-folds the mayor's "Looks Like You Need More Seeds" letter so the player doesn't
  // have to manually dismiss it after walking to the market.
  useEffect(() => {
    let dispatched = false;
    if (localStorage.getItem('sandbox_mayor_market_visited') !== 'true') {
      localStorage.setItem('sandbox_mayor_market_visited', 'true');
      dispatched = true;
    }
    // If the bank cutscene is starting (or resuming), set the active flag (so reloads
    // restore it) and clear the pulse flag so the market nav icon stops scaling.
    const pulseSet = localStorage.getItem('sandbox_market_pulse_bank') === 'true';
    const cutsceneSeen = localStorage.getItem('sandbox_bank_cutscene_seen') === 'true';
    if (pulseSet && !cutsceneSeen) {
      localStorage.setItem('sandbox_bank_cutscene_active', 'true');
      localStorage.removeItem('sandbox_market_pulse_bank');
      dispatched = true;
    } else if (pulseSet && cutsceneSeen) {
      // Stale pulse from a prior session — clear it.
      localStorage.removeItem('sandbox_market_pulse_bank');
      dispatched = true;
    }
    // Auto-discard + complete q_mayor_market_intro on market arrival so it disappears from
    // the inbox.
    try {
      const completed = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
      const discarded = JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]');
      if (!completed.includes('q_mayor_market_intro')) {
        completed.push('q_mayor_market_intro');
        localStorage.setItem('sandbox_completed_quests', JSON.stringify(completed));
        dispatched = true;
      }
      if (!discarded.includes('q_mayor_market_intro')) {
        discarded.push('q_mayor_market_intro');
        localStorage.setItem('sandbox_discarded_quests', JSON.stringify(discarded));
        dispatched = true;
      }
    } catch (_) {}
    if (dispatched) window.dispatchEvent(new CustomEvent('questStateChanged'));
  }, []);

  // After the mayor cutscene is finished, the vendor label stays permanently visible
  // (overrides the hide-all-labels CSS). Reactive to questStateChanged so it flips on
  // immediately the moment the cutscene completes.
  const [mayorIntroSeen, setMayorIntroSeen] = useState(
    () => localStorage.getItem('sandbox_mayor_market_intro_seen') === 'true'
  );
  // Same pattern for the bank cutscene — once it's complete, the BANKER label stays up
  // permanently and the clerk bee returns to the market screen.
  const [bankCutsceneSeen, setBankCutsceneSeen] = useState(
    () => localStorage.getItem('sandbox_bank_cutscene_seen') === 'true'
  );
  useEffect(() => {
    const update = () => {
      setMayorIntroSeen(localStorage.getItem('sandbox_mayor_market_intro_seen') === 'true');
      setBankCutsceneSeen(localStorage.getItem('sandbox_bank_cutscene_seen') === 'true');
    };
    window.addEventListener('questStateChanged', update);
    return () => window.removeEventListener('questStateChanged', update);
  }, []);

  // Track day/night (Eastern Time, 18:00-06:00 = night) so the vendor + banker bees
  // can be hidden after dark, matching the rest of the night atmosphere in SkyOverlay.
  const computeIsNight = () => {
    try {
      const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false })
        .formatToParts(new Date()).find((p) => p.type === 'hour').value, 10);
      return h >= 18 || h < 6;
    } catch (_) { return false; }
  };
  const [isNight, setIsNight] = useState(computeIsNight);
  useEffect(() => {
    const id = setInterval(() => setIsNight(computeIsNight()), 60000);
    return () => clearInterval(id);
  }, []);

  // Mark the body while the mayor OR bank cutscene is showing so PlayerPullNotification
  // can suppress popups (mirrors the data-letter-open behavior used by mailbox).
  useEffect(() => {
    if (mayorCutsceneStep >= 0 || bankCutsceneStep >= 0) {
      document.body.setAttribute('data-cutscene-active', 'true');
      // Also tear down any visible notification immediately, same way letters do.
      window.dispatchEvent(new CustomEvent('letterOpened'));
    } else {
      document.body.removeAttribute('data-cutscene-active');
    }
    return () => document.body.removeAttribute('data-cutscene-active');
  }, [mayorCutsceneStep, bankCutsceneStep]);

  // Bank cutscene dialogue — text shows in full immediately (no typewriter).
  // Step 0 — username-interpolated greeting; later steps come from BANK_CUTSCENE_DIALOGUE.
  // Step 4 — silhouette intro of the banker; bubble shows "???".
  const getBankCutsceneLine = (step) => {
    const name = (typeof window !== 'undefined' && localStorage.getItem('sandbox_username')) || 'friend';
    if (step === 0) return `Hey ${name}, great to see you again!`;
    if (step === 4) return 'Welcome!';
    if (step === 5) return `Oh are you ${name}?`;
    return BANK_CUTSCENE_DIALOGUE[step] || '';
  };
  const bankCurrentLine = bankCutsceneStep >= 0 ? getBankCutsceneLine(bankCutsceneStep) : '';

  const advanceBankCutscene = () => {
    // Step 3 advances ONLY when the user clicks the bank hotspot (handled in
    // onHotspotClick below). Background clicks must not advance.
    if (bankCutsceneStep === 3) return;
    // Step 8 (last step) advances ONLY when the user clicks "Open an Account" in the
    // bank popup (handled by the openBankAccount event listener below).
    if (bankCutsceneStep === 8) return;
    if (bankCutsceneStep === BANK_CUTSCENE_TOTAL_STEPS - 1) {
      completeBankCutscene();
      return;
    }
    setBankCutsceneStep(bankCutsceneStep + 1);
  };

  const completeBankCutscene = () => {
    localStorage.setItem('sandbox_bank_cutscene_seen', 'true');
    localStorage.removeItem('sandbox_market_pulse_bank');
    localStorage.removeItem('sandbox_bank_cutscene_active');
    localStorage.removeItem('sandbox_bank_cutscene_step');
    setBankCutsceneStep(-1);
    window.dispatchEvent(new CustomEvent('questStateChanged'));
  };

  // Mirror the live cutscene step into localStorage so BankerDialog (rendered as a hotspot
  // dialog) can gate the "Open an Account" button on the cutscene reaching step 8. Cleared
  // on completion in completeBankCutscene above.
  useEffect(() => {
    if (bankCutsceneStep < 0) {
      localStorage.removeItem('sandbox_bank_cutscene_step');
    } else {
      localStorage.setItem('sandbox_bank_cutscene_step', String(bankCutsceneStep));
    }
    window.dispatchEvent(new CustomEvent('questStateChanged'));
  }, [bankCutsceneStep]);

  // BankerDialog dispatches this when the user clicks the "Open an Account" button while
  // the cutscene is on its open-account prompt step. Advances to step 9 so the banker can
  // walk the user through deposit/withdraw; the dialog handles the account-opened flag.
  useEffect(() => {
    const onOpen = () => {
      if (localStorage.getItem('sandbox_bank_cutscene_active') === 'true') {
        setBankCutsceneStep((s) => (s === 8 ? 9 : s));
      }
    };
    window.addEventListener('bankAccountOpened', onOpen);
    return () => window.removeEventListener('bankAccountOpened', onOpen);
  }, []);

  // Mayor cutscene dialogue — text shows in full immediately (no typewriter).
  const mayorCurrentLine = mayorCutsceneStep >= 0 ? getMayorCutsceneLine(mayorCutsceneStep) : '';

  const advanceMayorCutscene = () => {
    // Step 5 (vendor-click step) advances only via the vendor hotspot, not background clicks.
    if (mayorCutsceneStep === 4) return;
    // Step 6 (vendor interaction) advances only when the user finishes the pack flow.
    if (mayorCutsceneStep === 5) return;
    // Step 9 — last cutscene line ("Happy Farming!"). Bubble click completes the cutscene.
    if (mayorCutsceneStep === MAYOR_CUTSCENE_TOTAL_STEPS - 1) {
      completeMayorCutscene();
      return;
    }
    setMayorCutsceneStep(mayorCutsceneStep + 1);
  };

  // Step 6: watch for the vendor pack flow to complete. Same .card-inner pattern used by
  // the tutorial farewell pack — a pack appears (.card-inner mounts) then closes; once we've
  // seen both, advance to step 7 and clear the pico-only flag.
  useEffect(() => {
    if (mayorCutsceneStep !== 5) return;
    let packEverOpened = false;
    const pollId = setInterval(() => {
      const packOpen = !!document.querySelector('.card-inner');
      if (packOpen) {
        packEverOpened = true;
      } else if (packEverOpened) {
        clearInterval(pollId);
        setMayorCutsceneStep(6);
        localStorage.removeItem('sandbox_cutscene_pico_only');
        // Close the vendor dialog so the user sees the default market view on step 7.
        window.dispatchEvent(new CustomEvent('closeDialog'));
      }
    }, 400);
    return () => clearInterval(pollId);
  }, [mayorCutsceneStep]);

  // Scale-out → swap position → scale-in transition for the mayor + bubble when shiftLeft changes.
  // Visual goal: the elements shrink to nothing IN PLACE at the old spot, then pop back in at the
  // new one as a single smooth motion, instead of sliding across.
  const targetShiftLeft = mayorCutsceneStep >= 3 ? 650 : 0;
  const [displayShiftLeft, setDisplayShiftLeft] = useState(0);
  const [displayScale, setDisplayScale] = useState(1);
  // Use a ref to track the previous target so the effect only re-runs when the target itself
  // changes — including displayShiftLeft in deps would cancel the scale-back-up timer mid-flight.
  const prevTargetShiftRef = useRef(0);
  useEffect(() => {
    if (targetShiftLeft === prevTargetShiftRef.current) return;
    prevTargetShiftRef.current = targetShiftLeft;
    setDisplayScale(0);
    const tSwap  = setTimeout(() => setDisplayShiftLeft(targetShiftLeft), 220);
    const tBack  = setTimeout(() => setDisplayScale(1), 240);
    return () => { clearTimeout(tSwap); clearTimeout(tBack); };
  }, [targetShiftLeft]);

  const completeMayorCutscene = () => {
    localStorage.setItem('sandbox_mayor_market_intro_seen', 'true');
    setMayorCutsceneStep(-1);
    window.dispatchEvent(new CustomEvent('questStateChanged'));
  };

  useEffect(() => {
    if (tutorialStep === 10) {
      setTutorialStep(11);
      localStorage.setItem('sandbox_tutorial_step', '11');
    }
    
    const stepHandler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', stepHandler);
    return () => {
      window.removeEventListener('tutorialStepChanged', stepHandler);
    };
  }, [tutorialStep]);

  // Sync tutMarketPage to localStorage so index.jsx can react
  useEffect(() => {
    localStorage.setItem('sandbox_tut_market_page', String(tutMarketPage));
    window.dispatchEvent(new CustomEvent('tutMarketPageChanged'));
  }, [tutMarketPage]);

  // When tutMarketPage 16: clicking the house icon starts the house tutorial
  useEffect(() => {
    if (tutMarketPage !== 16) return;
    const handler = (e) => {
      if (e.target.closest('a[href*="/house"]')) {
        localStorage.setItem('sandbox_tutorial_step', '17');
        localStorage.removeItem('sandbox_tut_market');
        setTutMarketPage(0);
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [tutMarketPage]);

  const NEXT_STEP_MAP = { 11: 13, 13: 14, 14: 15, 15: 16, 16: 12, 12: 17 };

  const advanceTutorial = () => {
    const nextStep = NEXT_STEP_MAP[tutorialStep] ?? tutorialStep + 1;
    setTutorialStep(nextStep);
    localStorage.setItem('sandbox_tutorial_step', nextStep.toString());
  };

  const getActiveHotspots = () => {
    if (tutorialStep >= 36) return hotspots;
    const makeDummy = (arr) => arr.map(h => ({ ...h, id: h.id + '_dummy' }));
    // New tutMarketPage flow (tutorialStep === 3)
    if (tutMarketPage === 12) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.BANKER));
    if (tutMarketPage === 13) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.VENDOR));
    if (tutMarketPage === 14) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.MARKET));
    if (tutMarketPage === 15) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.SAGE));
    // Legacy tutorialStep flow
    if (tutorialStep === 11) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.DEX));
    if (tutorialStep === 13) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.MARKET));
    if (tutorialStep === 14) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.SAGE));
    if (tutorialStep === 15) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.LEADERBOARD));
    if (tutorialStep === 16) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.BANKER));
    if (tutorialStep === 12) return makeDummy(hotspots.filter(h => h.id === ID_MARKET_HOTSPOTS.VENDOR));
    return [];
  };

  const dialogs = [
    {
      id: ID_MARKET_HOTSPOTS.DEX,
      component: DexDialog,
      label: "EXCHANGE",
      header: "/images/dialog/modal-header-dex.png",
    },
    {
      id: ID_MARKET_HOTSPOTS.VENDOR,
      component: VendorDialog,
      label: "VENDOR",
      header: "/images/dialog/modal-header-vendor.png",
      headerOffset: 10,
    },
    {
      id: ID_MARKET_HOTSPOTS.BANKER,
      component: BankerDialog,
      label: "BANKER",
      header: "/images/dialog/modal-header-dex.png",
    },
    {
      id: ID_MARKET_HOTSPOTS.MARKET,
      component: MarketPlaceDialog,
      label: "MARKETPLACE",
      header: "/images/dialog/modal-header-vendor.png",
      headerOffset: 10,
    },
    {
      id: ID_MARKET_HOTSPOTS.LEADERBOARD,
      component: LeaderboardDialog,
      label: "LEADERBOARD",
      header: "/images/dialog/modal-header-leaderboard.png",
      headerOffset: 22,
    },
    {
      id: ID_MARKET_HOTSPOTS.SAGE,
      component: SageDialog,
      label: "QUEEN",
      header: "/images/dialog/modal-header-queen.png",
      headerOffset: 10,
    },
  ];
  const TUT_PAGE_BEE_MAP = { 11: null, 12: 3, 13: 4, 14: 1, 15: 0 };
  const activeBeeIdx = TUT_PAGE_BEE_MAP[tutMarketPage];
  const bees = (tutMarketPage >= 11 && tutMarketPage <= 15)
    ? (activeBeeIdx != null ? [MARKET_BEES[activeBeeIdx]] : MARKET_BEES)
    : MARKET_BEES;

  // Synchronous spotlight: compute screen position from fixed scale/center math
  // panzoom-layer uses transform-origin: 0 0, initialScale=1.3, viewport 960x480
  const SPOT_STEP_MAP = { 11: 'DEX', 12: 'VENDOR', 13: 'MARKET', 14: 'QUEEN', 15: 'LEADERBOARD', 16: 'BANKER' };
  const SPOT_PAGE_MAP = { 12: 'BANKER', 13: 'VENDOR', 14: 'MARKET', 15: 'QUEEN' };
  const _spotLabel = SPOT_STEP_MAP[tutorialStep] || SPOT_PAGE_MAP[tutMarketPage];
  const _spotHs = _spotLabel ? MARKET_HOTSPOTS.find(h => h.label === _spotLabel) : null;
  const _tx = window.innerWidth / 2 - 960 * 1.7 / 2;
  const _ty = window.innerHeight / 2 - 480 * 1.7 / 2;
  const _isbanker = _spotLabel === 'BANKER';
  const _isvendor = _spotLabel === 'VENDOR';
  const _ismarket = _spotLabel === 'MARKET';
  const _isqueen = _spotLabel === 'QUEEN';
  const _spotX = _tx + _spotHs?.x * 1.7 + (_isbanker ? 130 : _isvendor ? 120 : _ismarket ? 85 : _isqueen ? 100 : 0);
  const _spotY = _ty + _spotHs?.y * 1.7 + (_isbanker ? 130 : _isvendor ? 130 : _ismarket ? 110 : _isqueen ? 200 : 0);

  return (
    <>
      <style>{`
        .map-btn { animation-duration: 6s !important; }
        /* Hidden hotspot labels on the market screen — visually hidden AND non-interactive.
           Re-enabled on a per-hotspot basis below (e.g. VENDOR after the mayor cutscene,
           BANKER after the bank cutscene). Cutscene step CSS overrides this for the
           specific hotspot being highlighted at that moment. */
        .map-btn span { display: none !important; }
        .map-btn img { display: none !important; }
        .map-btn { background-image: none !important; pointer-events: none !important; }
      `}</style>
      {/* Subtle floating bob shared by visible hotspot labels. Smaller amplitude than
          the default .map-btn mapFloat so the label feels alive without scaling. */}
      <style>{`
        @keyframes hotspotLabelFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
      `}</style>
      {/* Permanent VENDOR label override — once the mayor cutscene is finished, the vendor's
          label/banner stay visible. The mapFloat scaling is replaced with a subtle vertical
          bob (hotspotLabelFloat). Other hotspots stay hidden by the base rule above. */}
      {mayorIntroSeen && (
        <style>{`
          .map-btn[title="VENDOR"] { background-image: url(/images/backgrounds/tooltip_bg.png) !important; animation: hotspotLabelFloat 3.2s ease-in-out infinite !important; pointer-events: auto !important; }
          .map-btn[title="VENDOR"] span { display: inline !important; }
          .map-btn[title="VENDOR"] img { display: inline !important; }
        `}</style>
      )}
      {/* Permanent BANKER label override — same pattern, gated on bank cutscene completion. */}
      {bankCutsceneSeen && (
        <style>{`
          .map-btn[title="BANKER"] { background-image: url(/images/backgrounds/tooltip_bg.png) !important; animation: hotspotLabelFloat 3.2s ease-in-out infinite !important; pointer-events: auto !important; }
          .map-btn[title="BANKER"] span { display: inline !important; }
          .map-btn[title="BANKER"] img { display: inline !important; }
        `}</style>
      )}
      {/* Permanent LEADERBOARD label override — visible post-tutorial. */}
      {tutorialStep >= 36 && (
        <style>{`
          .map-btn[title="LEADERBOARD"] { background-image: url(/images/backgrounds/tooltip_bg.png) !important; animation: hotspotLabelFloat 3.2s ease-in-out infinite !important; pointer-events: auto !important; }
          .map-btn[title="LEADERBOARD"] span { display: inline !important; }
          .map-btn[title="LEADERBOARD"] img { display: inline !important; }
        `}</style>
      )}
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/market.webp"
        hotspots={getActiveHotspots()}
        dialogs={tutorialStep >= 36 ? dialogs : []}
        width={width}
        height={height}
        stuffs={MARKET_STUFFS}
        bees={(() => {
          // MARKET_BEES indices: 0 queen, 1 farmer, 2 bee, 3 clerk (banker), 4 vendor.
          // Vendor + clerk bees only return after their respective cutscenes finish,
          // and they hide entirely at night (matches the rest of the night atmosphere).
          if (isNight) return [];
          const out = [];
          if (mayorIntroSeen) out.push(MARKET_BEES[4]);
          if (bankCutsceneSeen) out.push(MARKET_BEES[3]);
          return out;
        })()}
        initialScale={1.7}
        initialOffsetX={-77}
        backgroundOffsetX={44}
        backgroundOffsetY={-41}
        disablePanZoom
        hotspotScale={0.75}
        onHotspotClick={(id) => {
          // First click on the VENDOR hotspot → mark as seen so the attention pulse stops.
          if (id === ID_MARKET_HOTSPOTS.VENDOR && localStorage.getItem('sandbox_vendor_label_seen') !== 'true') {
            localStorage.setItem('sandbox_vendor_label_seen', 'true');
            window.dispatchEvent(new CustomEvent('questStateChanged'));
          }
          // Step 5: user clicks VENDOR → advance to step 6 (vendor interaction). Sets the
          // pico-only flag so VendorMenu hides the Basic/Premium tiers during this beat.
          // Returning false lets the vendor dialog open through the normal flow.
          if (mayorCutsceneStep === 4 && id === ID_MARKET_HOTSPOTS.VENDOR) {
            localStorage.setItem('sandbox_cutscene_pico_only', 'true');
            setMayorCutsceneStep(5);
            return false;
          }
          // Bank cutscene step 3: user clicks BANKER → opens the banker dialog AND
          // advances to step 4 (banker silhouette intro over the popup). Returning false
          // lets the dialog open normally.
          if (bankCutsceneStep === 3 && id === ID_MARKET_HOTSPOTS.BANKER) {
            setBankCutsceneStep(4);
            return false;
          }
          const LOCKED_IDS = [ID_MARKET_HOTSPOTS.SAGE, ID_MARKET_HOTSPOTS.DEX, ID_MARKET_HOTSPOTS.MARKET];
          if (LOCKED_IDS.includes(id)) {
            setShowLockedPopup(true);
            return true;
          }
          return false;
        }}
      />
      {showShop && <Shop onClose={() => setShowShop(false)} />}

      {showLockedPopup && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowLockedPopup(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', textAlign: 'center', background: 'rgba(20,10,5,0.97)', border: '2px solid #5a402a', borderRadius: '16px', padding: '40px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
          >
            <div style={{ fontSize: '48px' }}>🔒</div>
            <div style={{ fontSize: '26px', color: '#f5d87a', textShadow: '2px 2px 0 #000' }}>Coming Soon</div>
            <div style={{ fontSize: '14px', color: '#aaa', maxWidth: '260px', lineHeight: 1.5 }}>This feature is not yet available. Check back soon!</div>
            <div
              onClick={() => setShowLockedPopup(false)}
              style={{ marginTop: '6px', fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '14px', color: '#ccc', background: 'rgba(255,255,255,0.1)', padding: '8px 28px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Close
            </div>
          </div>
        </div>
      )}

      <AdminPanel />

      {tutorialStep >= 11 && tutorialStep <= 17 && (
        <>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
            div[title], button[title], .hotspot, .map-btn { pointer-events: none !important; }
            @keyframes marketHighlightBox { 0%, 100% { box-shadow: 0 0 20px 5px #00ff41; background-color: rgba(0, 255, 65, 0.2); } 50% { box-shadow: 0 0 5px 2px #00ff41; background-color: transparent; } }
            @keyframes mapIconHighlight { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1); } }
            ${tutorialStep === 11 ? `div[title*="EXCHANGE" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 13 ? `div[title*="MARKET" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 14 ? `div[title*="QUEEN" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 15 ? `div[title*="LEADERBOARD" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 16 ? `div[title*="BANKER" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 12 ? `div[title*="VENDOR" i], div[title*="SEED" i] { animation: marketHighlightBox 1.5s infinite !important; border-radius: 12px; }` : ''}
            ${tutorialStep === 17 ? `a[href*="/house"], img[src*="house" i] { animation: mapIconHighlight 1.5s infinite !important; position: relative; z-index: 100001; pointer-events: auto !important; }` : ''}
          `}</style>
          <div style={{ position: 'fixed', right: '0px', bottom: '0px', zIndex: 100000 }}>
            <div style={{ position: 'relative', width: '666px' }}>
              <img src="/images/tutorial/temptut.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: 'calc(10% + 45px)', left: '22%', right: '10%', bottom: '22%', display: 'flex', alignItems: 'flex-start' }}>
                {tutorialStep === 11 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Welcome to the Town Market! Take a look around — head to the Vendor to grab some seed packs for your farm.
                  </p>
                )}
              </div>
              {tutorialStep === 11 && (
                <div style={{ position: 'absolute', bottom: '13%', left: '22%', right: '5%' }}>
                  <div
                    style={{ position: 'relative', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s, filter 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.filter = 'brightness(0.85)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
                    onClick={advanceTutorial}
                  >
                    <img src="/images/tutorial/tutbluebar.png" alt="" style={{ width: '100%', display: 'block' }} draggable={false} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'Cartoonist', fontSize: '14px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap', pointerEvents: 'none' }}>NEXT!</span>
                  </div>
                </div>
              )}
              <div style={{ position: 'absolute', top: 'calc(10% + 45px)', left: '22%', right: '10%', bottom: '22%', display: tutorialStep === 11 ? 'none' : 'flex', alignItems: 'flex-start' }}>
                {tutorialStep === 12 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Finally, to wrap things up here is the Vendor! You can buy Seed Packs to plant on your farm.
                  </p>
                )}
                {tutorialStep === 13 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    This is the Marketplace. You can trade items with other players here!
                  </p>
                )}
                {tutorialStep === 14 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    That's the Queen Sage. She can help you upgrade your Worker Bees!
                  </p>
                )}
                {tutorialStep === 15 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Check the Leaderboard to see who the top farmers are!
                  </p>
                )}
                {tutorialStep === 16 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    The Banker can securely store your tokens.
                  </p>
                )}
                {tutorialStep === 17 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Now, let's head to your House! Click the House icon on the map.
                  </p>
                )}
              </div>
              {[12, 13, 14, 15, 16].includes(tutorialStep) && (
                <div style={{ position: 'absolute', bottom: '13%', left: '22%', right: '5%' }}>
                  <div
                    style={{ position: 'relative', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s, filter 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.filter = 'brightness(0.85)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
                    onClick={advanceTutorial}
                  >
                    <img src="/images/tutorial/tutbluebar.png" alt="" style={{ width: '100%', display: 'block' }} draggable={false} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'Cartoonist', fontSize: '14px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap', pointerEvents: 'none' }}>NEXT!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mayor cutscene — first market visit after q_mayor_market_intro letter is read.
          Step 0: silhouetted mayor + "(name), is that you?" bubble at TOP-right with a question-mark bubble.
          Step 1+: revealed mayor + regular bubble at bottom-right. Click anywhere to advance / dismiss. */}
      {mayorCutsceneStep >= 0 && (() => {
        const isSilhouette = mayorCutsceneStep === 0;
        const shiftLeft = displayShiftLeft;
        // Bright circle around the vendor on display steps 4 and 5 only.
        const showVendorSpotlight = mayorCutsceneStep === 3 || mayorCutsceneStep === 4;
        // Vendor label / scaling pulse on display step 5 only.
        const highlightVendor = mayorCutsceneStep === 4;
        // Display step 5 — bubble click does NOT advance, only vendor click does.
        const isVendorClickStep = mayorCutsceneStep === 4;
        // Display step 6 — vendor is open, cutscene UI is fully hidden, dim removed.
        const isVendorWaitingStep = mayorCutsceneStep === 5;
        // Display step 7 — last cutscene line. Bubble click here completes the cutscene.
        const isLastStep = mayorCutsceneStep === MAYOR_CUTSCENE_TOTAL_STEPS - 1;
        // Overlay must let clicks pass through on steps 5 (so vendor can be clicked) and 6.
        const overlayPassThrough = isVendorClickStep || isVendorWaitingStep;
        return (
        <div
          onClick={advanceMayorCutscene}
          style={{
            position: 'fixed', inset: 0, zIndex: 100001, cursor: 'pointer',
            pointerEvents: overlayPassThrough ? 'none' : 'auto',
          }}
        >
          {/* Dim background — radial-gradient hole around the vendor on step 4+ so the vendor
              appears just as bright as the mayor/bubble (which sit above the dim already).
              Step 6 has no dim at all — user is interacting with the vendor dialog. */}
          {!isVendorWaitingStep && (
            <div style={{
              position: 'absolute', inset: 0,
              background: showVendorSpotlight
                ? 'radial-gradient(circle at calc(50% + 390px) calc(50% + 175px), transparent 0px, transparent 160px, rgba(0,0,0,0.45) 300px)'
                : 'rgba(0,0,0,0.45)',
              pointerEvents: 'none',
            }} />
          )}

          {/* Step-5 vendor highlight — restore the existing VENDOR label and a subtle scaling
              pulse. The brightness comes from the dim-overlay's circular hole above. */}
          {highlightVendor && (
            <style>{`
              .map-btn[title="VENDOR"] { background-image: url(/images/backgrounds/tooltip_bg.png) !important; animation: vendorCutscenePulse 1.1s ease-in-out infinite !important; pointer-events: auto !important; }
              .map-btn[title="VENDOR"] span { display: inline !important; }
              .map-btn[title="VENDOR"] img { display: inline !important; }
              @keyframes vendorCutscenePulse {
                0%, 100% { transform: scale(0.75); }
                50%      { transform: scale(0.9); }
              }
            `}</style>
          )}

          {/* Step indicator — top-right tag so we know which cutscene step we're on while testing. */}
          <div
            style={{
              position: 'fixed',
              top: '12px',
              right: '20px',
              padding: '6px 14px',
              background: 'rgba(20,10,5,0.85)',
              border: '2px solid #c8821a',
              borderRadius: '8px',
              fontFamily: 'GROBOLD, Cartoonist, monospace',
              fontSize: '14px',
              color: '#f5d87a',
              textShadow: '1px 1px 0 #000',
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 100004,
            }}
          >
            STEP {mayorCutsceneStep + 1} / {MAYOR_CUTSCENE_TOTAL_STEPS}
          </div>

          {/* Mayor character — silhouette on step 0, revealed afterward.
              Wrapper handles scale; img inside handles the float animation so they don't fight.
              Each element scales "into itself" (origin at its own center) but uses the same
              displayScale so the mayor and bubble timing stays in lockstep.
              Hidden entirely on step 6 (vendor interaction). */}
          <style>{`@keyframes mayorBeeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
          {!isVendorWaitingStep && (
            <div
              style={{
                position: 'fixed',
                right: `${485 + shiftLeft}px`,
                bottom: '230px',
                zIndex: 100002,
                pointerEvents: 'none',
                transform: `scale(${displayScale})`,
                transformOrigin: 'center',
                transition: 'transform 0.22s ease-in-out',
              }}
            >
              <img
                src="/images/tutorial/themayorbee.png"
                alt="Mayor Bee"
                draggable={false}
                style={{
                  width: '280px',
                  objectFit: 'contain',
                  userSelect: 'none',
                  animation: 'mayorBeeFloat 2.4s ease-in-out infinite',
                  filter: isSilhouette
                    ? 'brightness(0.05) blur(2.5px) drop-shadow(0 0 12px rgba(255,255,255,0.6)) drop-shadow(0 0 4px rgba(255,255,255,0.9))'
                    : 'none',
                  transition: 'filter 0.4s ease-out',
                }}
              />
            </div>
          )}

          {/* Speech bubble + line — bottom-right for every step; only the bubble image swaps
              (question-mark on the silhouette step, mayor bubble afterward). Scales into
              itself with the same timing as the mayor. Hidden on step 6 (vendor interaction).
              Step 1 (silhouette) uses a slightly different anchor: right 10, bottom -50 (10 right, 20 up). */}
          {!isVendorWaitingStep && (
          <div
            style={{
              position: 'fixed',
              right: `${(isSilhouette ? 10 : 20) + shiftLeft}px`,
              bottom: isSilhouette ? '-50px' : '-70px',
              width: '820px',
              userSelect: 'none',
              zIndex: 100003,
              pointerEvents: 'auto',
              transform: `scale(${displayScale})`,
              // Anchor on the visible upper portion of the bubble (the container extends
              // 70px below the viewport) so it shrinks into its own visible center.
              transformOrigin: 'center 25%',
              transition: 'transform 0.22s ease-in-out',
            }}
          >
            <img
              src={isSilhouette ? '/images/tutorial/questionmarkrealbubble.png' : '/images/tutorial/mayorbeebubble.png'}
              alt=""
              draggable={false}
              style={{
                width: '100%', display: 'block', objectFit: 'contain',
                // Mayor PNG has the crown ornament above the bubble body, pushing the body lower
                // in the canvas — so it needs an upward shift to render at the right Y. The
                // question-mark PNG already sits at the right level, so no offset.
                transform: isSilhouette ? 'none' : 'translateY(-28px)',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(38% + 10px)',
              left: 'calc(44% - 245px)',
              fontFamily: '"Cartoonist", "GROBOLD", "Courier New", monospace',
              fontSize: '22px',
              color: '#3b1f0a',
              fontWeight: 'bold',
              textShadow: '2px 2px 0 rgba(0,0,0,0.12)',
              whiteSpace: 'normal',
              maxWidth: '620px',
              lineHeight: 1.15,
              letterSpacing: '2px',
              pointerEvents: 'none',
            }}>
              {mayorCurrentLine}
            </div>
            {/* Click-to-continue triangle — hidden on the vendor-click step (5), where
                bubble click does nothing (the user must click the vendor instead).
                Visible on step 7 where bubble click completes the cutscene. */}
            {!isVendorClickStep && (
              <>
                <style>{`@keyframes mayorCutscenePulse { 0%,100% { transform: translateY(0) scale(1); opacity: 0.85; } 50% { transform: translateY(4px) scale(1.08); opacity: 1; } }`}</style>
                <img
                  src="/images/tutorial/click.png"
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    right: '100px',
                    bottom: '238px',
                    width: '64px',
                    height: 'auto',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    animation: 'mayorCutscenePulse 1.1s ease-in-out infinite',
                  }}
                />
              </>
            )}
          </div>
          )}
        </div>
        );
      })()}

      {/* Bank cutscene — first market visit after q_mayor_bank_intro letter is folded.
          Steps 0-1: mayor at default bottom-right. Steps 2-3: shifted up 300 / left 250 +
          bright circle hole around the bank label. Step 3: no click triangle, advance only
          when the user clicks the bank hotspot (which also opens the bank popup). */}
      {bankCutsceneStep >= 0 && (() => {
        const isShifted = bankCutsceneStep >= 2;
        const showBankSpotlight = bankCutsceneStep >= 2;
        const highlightBank = bankCutsceneStep === 3;
        const isBankClickStep = bankCutsceneStep === 3;
        // Banker layout covers steps 4-17 — silhouette intro through the post-account
        // walkthrough. The bank popup is open underneath; the banker stays at right.
        const isBankerIntroStep = bankCutsceneStep >= 4 && bankCutsceneStep <= 17;
        const isBankerSilhouette = bankCutsceneStep === 4;
        const isOpenAccountPrompt = bankCutsceneStep === 8;
        // Hide the persistent vendor label override during the bank cutscene (covered by a
        // higher-specificity rule below).
        // Position: defaults match the mayor cutscene base; shifted variants per user spec.
        const mayorRight = 485 + (isShifted ? 250 + 150 : 0);
        const mayorBottom = 230 + (isShifted ? 300 : 0);
        const bubbleRight = 20 + (isShifted ? 250 + 150 : 0);
        const bubbleBottom = -70 + (isShifted ? 300 : 0);

        // Step 4 — banker silhouette intro over the open bank popup. Separate layout so the
        // dim/spotlight/mayor render path doesn't fight with the popup interaction.
        if (isBankerIntroStep) {
          return (
            <div
              onClick={advanceBankCutscene}
              style={{
                position: 'fixed', inset: 0, zIndex: 100001, cursor: 'pointer',
                pointerEvents: 'none', // popup stays interactive; only the bubble re-enables clicks
              }}
            >
              {/* Step indicator */}
              <div
                style={{
                  position: 'fixed',
                  top: '12px',
                  right: '20px',
                  padding: '6px 14px',
                  background: 'rgba(20,10,5,0.85)',
                  border: '2px solid #c8821a',
                  borderRadius: '8px',
                  fontFamily: 'GROBOLD, Cartoonist, monospace',
                  fontSize: '14px',
                  color: '#f5d87a',
                  textShadow: '1px 1px 0 #000',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  zIndex: 100004,
                }}
              >
                BANK STEP {bankCutsceneStep + 1} / {BANK_CUTSCENE_TOTAL_STEPS}
              </div>

              {/* Banker bee silhouette — clerkbee.gif with the same darken+glow filter the
                  mayor uses on his step-0 silhouette. */}
              <style>{`@keyframes bankBankerFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
              <div
                style={{
                  position: 'fixed',
                  right: '1185px',
                  bottom: '100px',
                  zIndex: 100002,
                  pointerEvents: 'none',
                }}
              >
                <img
                  src="/images/bees/clerkbee.gif"
                  alt="Banker Bee"
                  draggable={false}
                  style={{
                    width: '280px',
                    objectFit: 'contain',
                    userSelect: 'none',
                    animation: 'bankBankerFloat 2.4s ease-in-out infinite',
                    filter: isBankerSilhouette
                      ? 'brightness(0.05) blur(2.5px) drop-shadow(0 0 12px rgba(255,255,255,0.6)) drop-shadow(0 0 4px rgba(255,255,255,0.9))'
                      : 'none',
                    transition: 'filter 0.4s ease-out',
                  }}
                />
              </div>

              {/* Question-mark bubble */}
              <div
                style={{
                  position: 'fixed',
                  right: '710px',
                  bottom: '-150px',
                  width: '820px',
                  userSelect: 'none',
                  zIndex: 100003,
                  // At the "tap on Open an Account" prompt the bubble overlaps
                  // the popup's button — disable clicks here so they reach the
                  // button instead of being swallowed by the bubble div.
                  pointerEvents: isOpenAccountPrompt ? 'none' : 'auto',
                }}
              >
                <img
                  src={isBankerSilhouette ? '/images/tutorial/questionmarkrealbubble.png' : '/images/tutorial/bankerbubble.png'}
                  alt=""
                  draggable={false}
                  style={{
                    width: '100%', display: 'block', objectFit: 'contain',
                    // bankerbubble.png renders with extra empty space at the top — nudge it
                    // up so the speech anchor sits where the silhouette bubble does.
                    transform: isBankerSilhouette ? 'none' : 'translateY(-28px)',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 'calc(38% + 10px)',
                  left: 'calc(44% - 245px)',
                  fontFamily: '"Cartoonist", "GROBOLD", "Courier New", monospace',
                  fontSize: '22px',
                  color: '#3b1f0a',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 0 rgba(0,0,0,0.12)',
                  whiteSpace: 'normal',
                  maxWidth: '620px',
                  lineHeight: 1.15,
                  letterSpacing: '2px',
                  pointerEvents: 'none',
                }}>
                  {bankCurrentLine}
                </div>
                {!isOpenAccountPrompt && (
                  <>
                    <style>{`@keyframes bankBankerClickPulse { 0%,100% { transform: translateY(0) scale(1); opacity: 0.85; } 50% { transform: translateY(4px) scale(1.08); opacity: 1; } }`}</style>
                    <img
                      src="/images/tutorial/click.png"
                      alt=""
                      draggable={false}
                      style={{
                        position: 'absolute',
                        right: '100px',
                        bottom: '238px',
                        width: '64px',
                        height: 'auto',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        animation: 'bankBankerClickPulse 1.1s ease-in-out infinite',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          );
        }

        return (
        <div
          onClick={advanceBankCutscene}
          style={{
            position: 'fixed', inset: 0, zIndex: 100001, cursor: 'pointer',
            // Step 3 must let clicks pass through to the bank hotspot.
            pointerEvents: isBankClickStep ? 'none' : 'auto',
          }}
        >
          {/* Dim everything — radial-gradient hole around the bank on steps 2-3 so the bank
              shines through. Banker is at scene coords (682, 124) under scale 1.7 → screen
              position approx calc(50% + 473px) calc(50% - 67px). */}
          <div style={{
            position: 'absolute', inset: 0,
            background: showBankSpotlight
              ? 'radial-gradient(circle at calc(50% + 453px) calc(50% - 82px), transparent 0px, transparent 130px, rgba(0,0,0,0.55) 280px)'
              : 'rgba(0,0,0,0.55)',
            pointerEvents: 'none',
          }} />

          {/* Hide the persistent vendor label during the bank cutscene. */}
          <style>{`
            .map-btn[title="VENDOR"] { background-image: none !important; }
            .map-btn[title="VENDOR"] span { display: none !important; }
            .map-btn[title="VENDOR"] img { display: none !important; }
          `}</style>

          {/* Bank label override — show the banker label + scaling pulse on step 3.
              Brightness comes from the spotlight hole above. Other hotspots are locked. */}
          {highlightBank && (
            <style>{`
              .map-btn { pointer-events: none !important; }
              .map-btn[title="BANKER"] { background-image: url(/images/backgrounds/tooltip_bg.png) !important; animation: bankCutscenePulse 1.1s ease-in-out infinite !important; pointer-events: auto !important; }
              .map-btn[title="BANKER"] span { display: inline !important; }
              .map-btn[title="BANKER"] img { display: inline !important; }
              @keyframes bankCutscenePulse {
                0%, 100% { transform: scale(0.75); }
                50%      { transform: scale(0.9); }
              }
            `}</style>
          )}

          {/* Step indicator */}
          <div
            style={{
              position: 'fixed',
              top: '12px',
              right: '20px',
              padding: '6px 14px',
              background: 'rgba(20,10,5,0.85)',
              border: '2px solid #c8821a',
              borderRadius: '8px',
              fontFamily: 'GROBOLD, Cartoonist, monospace',
              fontSize: '14px',
              color: '#f5d87a',
              textShadow: '1px 1px 0 #000',
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 100004,
            }}
          >
            BANK STEP {bankCutsceneStep + 1} / {BANK_CUTSCENE_TOTAL_STEPS}
          </div>

          {/* Mayor character — revealed from step 0; shifts up/left on steps 2-3. */}
          <style>{`@keyframes bankMayorFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
          <div
            style={{
              position: 'fixed',
              right: `${mayorRight}px`,
              bottom: `${mayorBottom}px`,
              zIndex: 100002,
              pointerEvents: 'none',
              transition: 'right 0.35s ease, bottom 0.35s ease',
            }}
          >
            <img
              src="/images/tutorial/themayorbee.png"
              alt="Mayor Bee"
              draggable={false}
              style={{
                width: '280px',
                objectFit: 'contain',
                userSelect: 'none',
                animation: 'bankMayorFloat 2.4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Speech bubble + line — shifts up/left on steps 2-3 alongside the mayor. */}
          <div
            style={{
              position: 'fixed',
              right: `${bubbleRight}px`,
              bottom: `${bubbleBottom}px`,
              width: '820px',
              userSelect: 'none',
              zIndex: 100003,
              pointerEvents: isBankClickStep ? 'none' : 'auto',
              transition: 'right 0.35s ease, bottom 0.35s ease',
            }}
          >
            <img
              src="/images/tutorial/mayorbeebubble.png"
              alt=""
              draggable={false}
              style={{
                width: '100%', display: 'block', objectFit: 'contain',
                transform: 'translateY(-28px)',
              }}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(38% + 10px)',
              left: 'calc(44% - 245px)',
              fontFamily: '"Cartoonist", "GROBOLD", "Courier New", monospace',
              fontSize: '22px',
              color: '#3b1f0a',
              fontWeight: 'bold',
              textShadow: '2px 2px 0 rgba(0,0,0,0.12)',
              whiteSpace: 'normal',
              maxWidth: '620px',
              lineHeight: 1.15,
              letterSpacing: '2px',
              pointerEvents: 'none',
            }}>
              {bankCurrentLine}
            </div>
            {/* Click-to-continue triangle — hidden on step 3 (user must click the bank). */}
            {!isBankClickStep && (
              <>
                <style>{`@keyframes bankBubbleClickPulse { 0%,100% { transform: translateY(0) scale(1); opacity: 0.85; } 50% { transform: translateY(4px) scale(1.08); opacity: 1; } }`}</style>
                <img
                  src="/images/tutorial/click.png"
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    right: '100px',
                    bottom: '238px',
                    width: '64px',
                    height: 'auto',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    animation: 'bankBubbleClickPulse 1.1s ease-in-out infinite',
                  }}
                />
              </>
            )}
          </div>
        </div>
        );
      })()}

      {/* Market tutorial flow: pages 11–15 with tutp11–tutp15 images, page 16 with dock pulse */}
      {tutMarketPage >= 11 && tutMarketPage <= 15 && (
        <>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
          `}</style>
          <div style={{ position: 'fixed', right: tutMarketPage === 12 ? '670px' : tutMarketPage === 14 ? '370px' : tutMarketPage === 15 ? '290px' : '20px', bottom: tutMarketPage === 12 ? '320px' : tutMarketPage === 14 ? '30px' : tutMarketPage === 15 ? '420px' : '20px', zIndex: 100000 }}>
            <div style={{ position: 'relative', width: '490px' }}>
              <div style={{ position: 'absolute', top: '-28px', right: '4px', fontFamily: 'Cartoonist', fontSize: '16px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', pointerEvents: 'none', userSelect: 'none' }}>{tutMarketPage - 10} / 5</div>
              <img
                src={`/images/tutorial/tutp${tutMarketPage}.png`}
                alt="Tutorial"
                style={{ width: '490px', objectFit: 'contain', display: 'block' }}
              />
              <div
                className="tut-arrow"
                style={tutMarketPage === 12 ? { top: 'calc(50% + 40px)', right: '15px' } : { top: 'calc(50% + 50px)' }}
                onClick={() => {
                  if (tutMarketPage === 15) {
                    localStorage.setItem('sandbox_dock_tut_page', '23');
                    localStorage.setItem('sandbox_tutorial_step', '25');
                    window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
                    navigateWithClouds(navigate, '/valley');
                  } else {
                    setTutMarketPage(prev => prev + 1);
                  }
                }}
              ><img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div>
            </div>
          </div>
        </>
      )}

    </>
  );
};

export default Market;
