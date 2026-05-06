import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { claimPfp, trackGemSpend } from "../utils/pfpUnlocks";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_BEES, FARM_HOTSPOTS, FARM_VIEWPORT, FARM_POSITIONS } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farm_Farmer";
import FarmInterface from "../layouts/FarmInterface";
import FarmMenu from "../layouts/FarmInterface/FarmMenu";
import SelectSeedDialog from "../containers/Farm_SelectSeedDialog";
import { useItems } from "../hooks/useItems";
import { useFarming } from "../hooks/useContracts";
import { useNotification } from "../contexts/NotificationContext";
import { CropItemArrayClass } from "../models/crop";
import { handleContractError } from "../utils/errorHandler";
import { ID_POTION_ITEMS, ID_PRODUCE_ITEMS, ID_CHEST_ITEMS, ID_FISH_ITEMS, ID_SEEDS, ID_BAIT_ITEMS, ID_ITEM_CATEGORIES } from "../constants/app_ids";
import { ALL_ITEMS, IMAGE_URL_CROP } from "../constants/item_data";
import { clampVolume, getGrowthTime, getSubtype } from "../utils/basic";
import { rollCropWeight, getWeeklyFeaturedCrop, CROP_WEIGHTS } from "../constants/crop_weights";
import { canHarvestProduce } from "../utils/inventorySlots";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../constants/item_seed";
import { useAppSelector } from "../store";
import { selectSettings } from "../store/slices/uiSlice";
import { defaultSettings } from "../utils/settings";
import BaseDialog from "../containers/_BaseDialog";
import BaseButton from "../components/buttons/BaseButton";
import AdminPanel from "./index";
import WeatherOverlay, { getSimulatedDateInfo, getWeatherForDay } from "../components/WeatherOverlay";
import { useNavigate } from "react-router-dom";
import { navigateWithClouds } from "../components/RouteCloudTransition";
import { withIris } from "../components/IrisTransition";
import MissionBoard from "../containers/MissionBoard";
import Shop from "../containers/Shop";
import FarmCustomizePanel from "../containers/FarmCustomizePanel";
import PokemonPackRipDialog from "../containers/Market_Vendor/PokemonPackRipDialog";
import { getRaritySeedId } from "../constants/app_ids";
const FestivalsDialog = React.lazy(() => import("../containers/FestivalsDialog"));

// Renders bright X/hole overlays at the exact position of the starter plots (6, 7, 8).
// On step 11: always render Xs (staggered). On step 13: render X or hole depending on plot status (no stagger).
// Full-screen dim with circular cutouts at any dirt plots — keeps the real dirt bright
const TutorialDirtSpotlight = () => {
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    const measure = () => {
      const STARTER = [6, 7, 8];
      const next = STARTER.map((idx) => {
        const el = document.querySelector(`.plot-dirt-marker[data-plot-dirt='${idx}']`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { idx, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: Math.max(r.width, r.height) * 0.65 };
      }).filter(Boolean);
      setCenters(next);
    };
    measure();
    // 250ms (was 80) — tutorial highlight follow doesn't need 12fps polling, 4fps is fine.
    const timer = setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => { clearInterval(timer); window.removeEventListener('resize', measure); };
  }, []);

  if (centers.length === 0) {
    return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 100000 }} />;
  }

  const maskLayers = centers
    .map(p => `radial-gradient(circle ${p.r}px at ${p.cx}px ${p.cy}px, transparent ${p.r - 8}px, black ${p.r}px)`)
    .join(', ');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        pointerEvents: 'none',
        zIndex: 100000,
        WebkitMaskImage: maskLayers,
        maskImage: maskLayers,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
      }}
    />
  );
};

// Typewriter effect for queen letter body — types out paragraphs character-by-character on first open only
const QueenLetterTypewriter = ({ body, instant = false }) => {
  const fullText = body.join('\n\n');
  const [typed, setTyped] = useState(instant ? fullText : '');

  useEffect(() => {
    if (instant) {
      setTyped(fullText);
      return;
    }
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [fullText, instant]);

  return (
    <div style={{ whiteSpace: 'pre-wrap', color: '#2a1a08' }}>{typed}</div>
  );
};

// Persistent Papabee — stays mounted across tutorial steps so the float animation doesn't reset.
const TutorialPapabee = ({ step, dimmedBehind = false }) => {
  const silhouette = step === 0 || step === 2;
  const reveal = step === 3;
  // Papabee visible on all tutorial bubble steps (hidden on step 7 name prompt + post-tutorial)
  const visible = step >= 0 && step <= 35 && step !== 1 && step !== 7;
  // During the pack-opening step (32), push papabee behind the pack dialog and blur it
  const dimmedBehindPack = step === 32;
  const effectiveDimmed = dimmedBehind || dimmedBehindPack;
  const shiftX = step === 11 ? 600 : step === 25 ? 660 : 0;
  const shiftY = step === 11 ? 50 : step === 25 ? -160 : 0;

  const [revealed, setRevealed] = useState(!reveal);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    if (!reveal) { setRevealed(true); return; }
    setRevealed(false);
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [reveal, step]);
  useEffect(() => {
    const onExit = () => setExiting(true);
    window.addEventListener('tutorialExit', onExit);
    return () => window.removeEventListener('tutorialExit', onExit);
  }, []);
  useEffect(() => { if (step < 35) setExiting(false); }, [step]);

  if (!visible) return null;

  return (
    <>
      <style>{`@keyframes papabeeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`}</style>
      <img
        src="/images/tutorial/papabee.png"
        alt="Papabee"
        draggable={false}
        style={{
          position: 'fixed',
          right: `${550 + shiftX}px`,
          bottom: `${200 + shiftY}px`,
          width: '180px',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: effectiveDimmed ? 500 : 200000,
          animation: exiting ? 'none' : 'papabeeFloat 2.4s ease-in-out infinite',
          transform: exiting ? 'scale(0)' : undefined,
          transformOrigin: 'center bottom',
          transition: 'filter 0.25s ease-out, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: effectiveDimmed
            ? 'blur(4px) brightness(0.6)'
            : (silhouette || (reveal && !revealed))
              ? 'brightness(0.05) blur(2.5px) drop-shadow(0 0 12px rgba(255,255,255,0.6)) drop-shadow(0 0 4px rgba(255,255,255,0.9))'
              : 'none',
        }}
      />
    </>
  );
};

const TutorialStarterPlotsBright = ({ staggered = false, onlyHoles = false, onlyDirt = false, allowHover = false }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const measure = () => {
      const STARTER = [8, 7, 6]; // left → right order
      const next = STARTER.map((idx) => {
        const plotEl = document.querySelector(`.crop-item[data-plot-index='${idx}']`);
        const status = plotEl ? parseInt(plotEl.getAttribute('data-plot-prep-status') || '0', 10) : 0;
        const holeEl = document.querySelector(`.plot-hole-marker[data-plot-hole='${idx}']`);
        const xEl    = document.querySelector(`.plot-x-marker[data-plot-x='${idx}']`);
        let el = null;
        let type = null;
        // Detect a planted override (e.g. potato sign) — prefer the data attribute set by CropItem,
        // since the in-plot background may be hidden during tutorial steps.
        let plantedImage = null;
        if (plotEl) {
          const dataAttr = plotEl.getAttribute('data-planted-image');
          if (dataAttr) plantedImage = dataAttr;
          else {
            const cs = window.getComputedStyle(plotEl);
            const bgImg = cs.backgroundImage || '';
            const m = bgImg.match(/url\(["']?(\/images\/crops\/new\/[^"')]+\.(?:png|webp))["']?\)/);
            if (m) plantedImage = m[1];
          }
        }
        if (status === 3 && plotEl) {
          el = plotEl;
          // If the plot has a planted override image, treat it as 'planted' so we render the sign brightly.
          type = (plantedImage && !plantedImage.endsWith('/dirt.png')) ? 'planted' : 'dirt';
        }
        else if (holeEl) { el = holeEl; type = 'hole'; }
        else if (xEl)    { el = xEl;    type = 'x'; }
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const hoverAttr = (type === 'dirt' || type === 'planted')
          ? (plotEl && plotEl.getAttribute('data-plot-hover') === 'true')
          : (el.getAttribute('data-hover') === 'true');
        const hovered = allowHover && !!hoverAttr;
        if (onlyHoles && type !== 'hole') return null;
        if (onlyDirt  && type !== 'dirt' && type !== 'planted') return null;
        const needsWater = plotEl?.getAttribute('data-needs-water') === 'true';
        const hasPest = plotEl?.getAttribute('data-has-pest') === 'true';
        return { idx, type, hovered, plantedImage, needsWater, hasPest, left: r.left, top: r.top, width: r.width, height: r.height };
      }).filter(Boolean);
      setItems(next);
    };
    measure();
    // 250ms (was 50) — re-measuring 20× per second was constant DOM work for visuals
    // that don't move that fast. 4fps follow is plenty for tutorial pulse alignment.
    const timer = setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', measure);
    };
  }, [onlyHoles, onlyDirt, allowHover]);

  return (
    <>
      <style>{`
        @keyframes tutXPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.18); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes tutXPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes tutWaterBounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-10px); } }
      `}</style>
      {items.map((p, i) => (
        <div
          key={p.idx}
          style={{
            position: 'fixed',
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
            pointerEvents: 'none',
            zIndex: 100002,
            transformOrigin: 'center',
            transform: (p.hovered && p.type === 'dirt' && !p.hasPest) ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {(p.type === 'dirt' || p.type === 'planted') ? (
            <div
              key={`${p.idx}-${p.type}`}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                backgroundImage: p.type === 'planted'
                  ? `url(${p.plantedImage})`
                  : 'url(/images/crops/new/dirt.png)',
                backgroundSize: p.type === 'planted'
                  ? ((p.plantedImage || '').endsWith('sign.png') ? 'auto 96%' : '65% auto')
                  : '64% auto',
                backgroundPosition: p.type === 'planted'
                  ? ((p.plantedImage || '').endsWith('sign.png')
                      ? 'calc(50% - 13px) calc(50% + 1.5px)'
                      : `${(p.plantedImage || '').endsWith('p1.png') ? 'calc(50% - 8px)' : 'calc(50% - 13px)'} calc(50% + ${(p.plantedImage || '').endsWith('p5.png') ? 9 : ((p.plantedImage || '').endsWith('p4.png') ? 16 : ((p.plantedImage || '').endsWith('p1.png') ? 59 : 19))}px)`)
                  : 'calc(50% - 8px) bottom',
                backgroundRepeat: 'no-repeat',
                pointerEvents: 'none',
                filter: (() => {
                  const ts = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
                  if (ts === 20 || ts === 22 || p.hasPest) return 'none';
                  // Only the empty dirt gets the hover glow — planted overrides stay static.
                  if (p.type === 'planted') return 'none';
                  return p.hovered
                    ? 'brightness(1.2) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))'
                    : 'none';
                })(),
                transition: 'filter 0.15s ease-out',
                // Only run the pop-in for the empty dirt (first appearance). Planted overrides
                // shouldn't re-pop every step transition — they should stay still.
                animation: p.type === 'planted'
                  ? 'none'
                  : (staggered
                      ? `tutXPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.3}s both`
                      : `tutXPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both`),
              }}
            />
          ) : (
            <img
              key={`${p.idx}-${p.type}`}
              src={p.type === 'hole' ? '/images/farming/hole.png' : (p.hovered ? '/images/farming/xhover.png' : '/images/farming/x.png')}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                transformOrigin: 'center',
                filter: (p.type === 'hole' && p.hovered)
                  ? 'brightness(1.2) drop-shadow(0 0 6px rgba(255,220,100,0.9)) drop-shadow(0 0 12px rgba(255,180,40,0.7))'
                  : 'none',
                transition: 'filter 0.15s ease-out',
                animation: p.type === 'x'
                  ? (staggered
                      ? `tutXPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.3}s both, tutXPulse 1.4s ease-in-out ${0.4 + i * 0.3}s infinite`
                      : `tutXPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both, tutXPulse 1.4s ease-in-out 0.4s infinite`)
                  : (staggered
                      ? `tutXPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.3}s both`
                      : `tutXPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both`),
              }}
            />
          )}
          {/* Status indicator on planted plots — pest "!" badge wins, otherwise water-needed icon. */}
          {p.type === 'planted' && (p.hasPest || p.needsWater) && (
            <div style={{ position: 'absolute', top: '6px', left: 'calc(50% + 17px)', pointerEvents: 'none', animation: 'tutWaterBounce 1.5s infinite', transform: 'translateX(-50%)' }}>
              <img
                src={p.hasPest ? '/images/mail/!.png' : '/images/farming/waterneeded.png'}
                alt={p.hasPest ? '!' : 'Needs Water'}
                draggable={false}
                style={{
                  width: '30px',
                  height: '30px',
                  display: 'block',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0px 2px 2px black)',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
};

const TutorialNamePrompt = ({ setTutorialStep, advanceTo }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a name.'); return; }
    if (trimmed.length > 12) { setError('Max 12 characters.'); return; }
    localStorage.setItem('sandbox_username', trimmed);
    window.dispatchEvent(new CustomEvent('sandboxUsernameChanged', { detail: trimmed }));
    setTutorialStep(advanceTo);
    localStorage.setItem('sandbox_tutorial_step', String(advanceTo));
    window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'none' }}>
      {/* Dim overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 1 }} />

      {/* The username.png image IS the entire UI — input + buttons are positioned
          invisibly on top of it via percentage-based offsets. */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto', zIndex: 2,
      }}>
        <img
          src="/images/tutorial/username.png"
          alt="Username"
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '90vw', maxHeight: '90vh',
            objectFit: 'contain', userSelect: 'none',
            imageRendering: 'pixelated',
          }}
        />

        {/* Invisible input overlaid on the image's input rectangle. */}
        <input
          ref={inputRef}
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          maxLength={12}
          style={{
            // All offsets are percentages of the wrapper, which auto-sizes to
            // the username.png image — so the input stays in the same spot on
            // the artwork regardless of viewport size. Font size scales with
            // the image too (clamped so it never gets ridiculous).
            position: 'absolute',
            top: '48%', left: '14%', width: '72%', height: '14%',
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'GROBOLD, Cartoonist, sans-serif',
            fontSize: 'min(50px, 5.5vmin)', color: '#3b1f0a', fontWeight: 'bold',
            textAlign: 'center',
            padding: 0, margin: 0,
          }}
        />

        {/* Confirm button — uses the confirm.png art from /images/tutorial/. */}
        <img
          src="/images/tutorial/confirm.png"
          alt="Confirm"
          draggable={false}
          onClick={submit}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.15) drop-shadow(0 0 8px rgba(255,220,100,0.7))';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.transform = 'translateX(-50%)';
          }}
          style={{
            position: 'absolute',
            top: '70%', left: '50%', transform: 'translateX(-50%)',
            width: '24%', height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer',
            userSelect: 'none',
            imageRendering: 'pixelated',
            transition: 'transform 0.15s ease, filter 0.15s ease',
          }}
        />

        {/* Error toast under the image if validation fails. */}
        {error && (
          <div style={{
            position: 'absolute', top: '102%', left: 0, right: 0,
            textAlign: 'center', color: '#ff6b6b', fontSize: 13,
            fontFamily: 'GROBOLD, Cartoonist, sans-serif', textShadow: '1px 1px 0 #000',
            pointerEvents: 'none',
          }}>{error}</div>
        )}
      </div>
    </div>
  );
};

const TutorialBubbleOverlay = ({ setTutorialStep, fullText, advanceTo, bubbleSrc = '/images/tutorial/questionmarkrealbubble.png', showPapabee = false, papabeeSilhouette = false, papabeeReveal = false, fontSize = '56px', textMaxWidth = null, shiftX = 0, shiftY = 0, textShiftY = 0, noDim = false, noAdvance = false, exitOnAdvance = false, advanceOnAnyClick = false, dismissHarvestRevealOnAdvance = false }) => {
  const [revealed, setRevealed] = useState(!papabeeReveal);
  const [revealComplete, setRevealComplete] = useState(!papabeeReveal);

  useEffect(() => {
    if (!papabeeReveal) return;
    setRevealed(false);
    setRevealComplete(false);
    const t1 = setTimeout(() => setRevealed(true), 600);
    const t2 = setTimeout(() => setRevealComplete(true), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [papabeeReveal]);

  const [exiting, setExiting] = useState(false);
  const advance = () => {
    if (noAdvance) return;
    if (papabeeReveal && !revealComplete) return;
    if (dismissHarvestRevealOnAdvance) {
      window.dispatchEvent(new CustomEvent('dismissHarvestReveal'));
    }
    if (exitOnAdvance) {
      setExiting(true);
      window.dispatchEvent(new CustomEvent('tutorialExit'));
      setTimeout(() => {
        setTutorialStep(advanceTo);
        localStorage.setItem('sandbox_tutorial_step', String(advanceTo));
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 600);
      return;
    }
    setTutorialStep(advanceTo);
    localStorage.setItem('sandbox_tutorial_step', String(advanceTo));
    window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
  };

  return (
    <>
      {/* Dim overlay at root stacking context — papabee (z 100002) sits above this, bubble (z 100003) above papabee.
          If advanceOnAnyClick is set, the dim catches clicks and advances the tutorial. */}
      {!noDim && (
        <div
          onClick={advanceOnAnyClick ? advance : undefined}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            pointerEvents: advanceOnAnyClick ? 'auto' : 'none',
            cursor: advanceOnAnyClick ? 'pointer' : 'default',
            zIndex: 100001,
          }}
        />
      )}

      {/* Bubble — above papabee and any tutorial bright overlays */}
      <div
        onClick={advance}
        style={{ position: 'fixed', right: `${20 + shiftX}px`, bottom: `${-70 + shiftY}px`, width: '820px', cursor: 'pointer', pointerEvents: 'auto', userSelect: 'none', zIndex: 200000, transform: exiting ? 'scale(0)' : 'scale(1)', transformOrigin: 'center bottom', transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {(() => {
          const resolvedSrc = (papabeeReveal && !revealComplete) ? '/images/tutorial/questionmarkrealbubble.png' : bubbleSrc;
          // The papabee/mayor bubble PNGs include leaves/crown above the body, pushing the
          // visible bubble lower in their canvas than the questionmark bubble. Shift those
          // images up so the bubble body lands in the same screen position regardless of which is shown.
          const isPapabee = resolvedSrc?.includes('papabeebubble.png');
          const isMayor   = resolvedSrc?.includes('mayorbeebubble.png');
          const yOffset   = isPapabee ? -28 : (isMayor ? -28 : 0);
          return (
            <img
              src={resolvedSrc}
              alt="Papabee says..."
              draggable={false}
              style={{ width: '100%', display: 'block', objectFit: 'contain', transform: yOffset ? `translateY(${yOffset}px)` : undefined }}
            />
          );
        })()}
        {/* Bubble text — shown in full immediately (no typewriter). During the papabee
            reveal it stays hidden until the silhouette → reveal transition is done so
            text doesn't sit on top of the questionmark bubble. */}
        {(!papabeeReveal || revealComplete) && (
          <div style={{
            position: 'absolute',
            top: `calc(38% + ${10 + textShiftY}px)`,
            left: 'calc(44% - 245px)',
            fontFamily: '"Cartoonist", "GROBOLD", "Courier New", monospace',
            fontSize,
            color: '#3b1f0a',
            fontWeight: 'bold',
            textShadow: '2px 2px 0 rgba(0,0,0,0.12)',
            whiteSpace: textMaxWidth ? 'normal' : 'nowrap',
            maxWidth: textMaxWidth || 'none',
            lineHeight: 1.15,
            letterSpacing: '2px',
            pointerEvents: 'none',
          }}>
            {fullText}
          </div>
        )}
        {/* "Click to continue" indicator — visible immediately on advancing bubbles
            (or once the reveal transition is done, when present). */}
        {!noAdvance && (!papabeeReveal || revealComplete) && (
          <>
            <style>{`@keyframes tutClickPulse { 0%,100% { transform: translateY(0) scale(1); opacity: 0.85; } 50% { transform: translateY(4px) scale(1.08); opacity: 1; } }`}</style>
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
                animation: 'tutClickPulse 1.1s ease-in-out infinite',
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

export const getQuestData = () => [

  // Wave 1: Early Bliss (0-60 min)

  {
    id: "q1_beejamin",
    type: "main",
    sender: "Beejamin",
    subject: "YO! New Farmer Alert!",
    mailImage: "/images/mail/mailbeejamin.png",
    body: [
      "YO! Heard you moved into the old farm! That's SICK!",
      "I'm Beejamin. I lift boulders and stuff. Big supporter of the hustle!",
      "Take these potato seeds — plant 'em, grow 'em, then come back and show me a couple! Potatoes are nature's dumbbells, BRO."
    ],
    starterPack: { seeds: [getRaritySeedId(ID_SEEDS.POTATO, 1), getRaritySeedId(ID_SEEDS.POTATO, 1)] },
    rewards: [
      { id: 'honey', count: 7500, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 100, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.POTATO, count: 4, name: "Potatoes", pos: 24 }
    ],
    unlockCondition: (step, completed) => completed.includes("q1_queen")
  },

  {
    id: "q1_potionmaster",
    type: "main",
    sender: "The Potion Master",
    subject: "A Most Exciting Development!",
    mailImage: "/images/mail/mailpotionmaster.png",
    body: [
      "OH! A new farmer! Wonderful! Spectacular!",
      "I'm Zim — the Potion Master. I've been cataloguing the botanical resonance frequencies of local crops for seventeen years and let me tell you, RADISHES are criminally underrated.",
      "Take these radish seeds — plant them, grow them, and bring me a couple when they're ready. For science! And friendship!"
    ],
    starterPack: { seeds: [getRaritySeedId(ID_SEEDS.RADISH, 1), getRaritySeedId(ID_SEEDS.RADISH, 1)] },
    rewards: [
      { id: 'honey', count: 7500, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 100, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.RADISH, count: 3, name: "Radishes", pos: 28 }
    ],
    unlockCondition: (step, completed) => completed.includes("q1_beejamin")
  },

  {
    id: "q1_queen",
    type: "main",
    sender: "Queen Beeatrice",
    subject: "A Letter from the Queen",
    mailImage: "/images/mail/mailqueen.png",
    body: [
      "My dear child,",
      "I heard you've taken on your grandfather's old farm and my heart just swelled with pride for you.",
      "I've sent along some lettuce seeds from my personal garden — please take them with my blessing. Plant them, water them well, and let me know when you've harvested some. I'd love to see how your garden is coming."
    ],
    // Starter gift — given on first read of the letter via the "Take Seeds" button.
    starterPack: { seeds: [getRaritySeedId(ID_SEEDS.LETTUCE, 1), getRaritySeedId(ID_SEEDS.LETTUCE, 1)] },
    // Completion reward — claimed when the harvest is brought back.
    rewards: [
      { id: 'honey', count: 7000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 100, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.LETTUCE, count: 3, name: "Lettuce", pos: 26 }
    ],
    unlockCondition: (step, completed) => step >= 36
  },

  // Wave 2: Growing Up (60-120 min) — Basic seeds & bigger harvests

  {
    id: "q2_basic_intro",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "Time to Level Up",
    mailImage: "/images/mail/mailmayor.png",
    body: [
      "Farmer,",
      "I've been keeping an eye on your progress and I must say — you've handled those starter crops admirably.",
      "The Harvest Market has Basic seed packs available now. I strongly recommend you invest in one. Better seeds mean better harvests, and the valley rewards those who push their limits."
    ],
    rewards: [
      { id: 'honey', count: 3000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 80, name: "Gems" },
    ],
    reqs: [],
    unlockCondition: (step, completed) => completed.includes("q2_missionboard_intro")
  },

  {
    id: "q2b_wheat_harvest",
    type: "main",
    sender: "Farmer Bob",
    subject: "First of the Basics",
    body: [
      "Howdy! Now that you've been at it for a while, it's time to get into the good stuff.",
      "Basic seeds grow into proper farm staples — wheat, tomatoes, carrots, corn.",
      "Bring me 3 bundles of Wheat and I'll set you up with a little something. You can grab Basic seeds at the market."
    ],
    rewards: [
      { id: 'honey', count: 20000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 100, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.WHEAT, count: 3, name: "Wheat" }
    ],
    unlockCondition: (step, completed) => step >= 36 && completed.includes("q2_basic_intro")
  },

  {
    id: "q3_pabee_grow_tip",
    type: "main",
    sender: "Pabee",
    subject: "A Few Farming Secrets",
    mailImage: "/images/mail/mailpapabee.png",
    body: [
      "Hey son, just wanted to share a few things I've learned over the years.",
      "Water your crops whenever you can — they grow faster and come out bigger. And the rarer the seed, the more valuable the harvest.",
      "Also keep an eye on the weekly crop challenge at the Leaderboard in the market. Whoever grows the heaviest featured crop that week gets serious bragging rights.",
      "Proud of you. Keep growing."
    ],
    rewards: [
      { id: 'honey', count: 3000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 80, name: "Gems" },
    ],
    reqs: [],
    unlockCondition: (step, completed) => completed.includes("q2b_wheat_harvest")
  },

  {
    id: "q5_pumpkin_king",
    type: "main",
    sender: "The Potion Master",
    subject: "PUMPKIN EMERGENCY",
    mailImage: "/images/mail/mailpotionmaster.png",
    body: [
      "FARMER! It is I, Zim! I require pumpkins with the UTMOST urgency!",
      "My latest botanical formula requires pumpkin extract and I have run completely out. The science cannot wait!",
      "Bring me 3 Pumpkins and I will reward you handsomely. The fate of knowledge depends on it!"
    ],
    rewards: [
      { id: 'honey', count: 30000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 150, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.PUMPKIN, count: 3, name: "Pumpkins" }
    ],
    unlockCondition: (step, completed) => step >= 36 && completed.includes("q3_pabee_grow_tip")
  },

  {
    id: "q6_beejamin_gains",
    type: "main",
    sender: "Beejamin",
    subject: "GAINS SEASON",
    mailImage: "/images/mail/mailbeejamin.png",
    body: [
      "FARMER! It's gains season and I need my vegetables!",
      "Carrots for the eyes, tomatoes for the gains — I need BOTH.",
      "Bring me 5 Carrots and 5 Tomatoes and I'll make sure you get something good. LET'S GOOO!"
    ],
    rewards: [
      { id: 'honey', count: 25000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 120, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.CARROT, count: 5, name: "Carrots", pos: 3 },
      { id: ID_PRODUCE_ITEMS?.TOMATO, count: 5, name: "Tomatoes" }
    ],
    unlockCondition: (step, completed) => step >= 36 && completed.includes("q5_pumpkin_king")
  },

  {
    id: "q7_queen_broccoli",
    type: "main",
    sender: "Queen Beeatrice",
    subject: "A Royal Request",
    mailImage: "/images/mail/mailqueen.png",
    body: [
      "My dear farmer,",
      "You have grown so much since those first lettuce seeds I sent you. I am truly proud.",
      "The royal garden committee is hosting its annual showcase and I would be honored to include your produce. Would you bring me 3 Broccoli? They are quite the showpiece vegetable.",
      "I shall reward you generously, of course."
    ],
    rewards: [
      { id: 'honey', count: 20000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 100, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.BROCCOLI, count: 3, name: "Broccoli" }
    ],
    unlockCondition: (step, completed) => step >= 36 && completed.includes("q6_beejamin_gains")
  },

  {
    id: "q8_first_harvest",
    type: "farming",
    sender: "Farmer Bob",
    subject: "Your First Big Harvest",
    body: [
      "Howdy neighbor!",
      "I see you've got the plots cleared out. Let's get to work.",
      "Grow 10 Potatoes and bring them to me. I'll give you some seeds to keep you going!"
    ],
    rewards: [
      { id: 'honey', count: 5000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 80, name: "Gems" },
      { id: ID_SEEDS?.CARROT || 131848, count: 5, name: "Carrot Seeds", image: "/images/items/seeds.png" }
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.POTATO || 131586, count: 10, name: "Potatoes", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.POTATO]?.image || "/images/items/potato.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q2_missionboard_intro")
  },

  {
    id: "q9_cornucopia",
    type: "farming",
    sender: "Farmer Bob",
    subject: "Salad Days",
    body: [
      "We're stocking up the kitchen and we need fresh greens!",
      "Can you supply us with 5 Corn and 5 Tomatoes?",
      "I'll trade you some gold and a couple of chests for them."
    ],
    rewards: [
      { id: 'honey', count: 25000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 120, name: "Gems" },
      { id: ID_CHEST_ITEMS?.CHEST_BRONZE || 20001, count: 2, name: "Bronze Chests", image: "/images/items/chest.png" }
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.CORN || 131590, count: 5, name: "Corn", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.CORN]?.image || "/images/items/corn.png" },
      { id: ID_PRODUCE_ITEMS?.TOMATO || 131589, count: 5, name: "Tomatoes", image: ALL_ITEMS[ID_PRODUCE_ITEMS?.TOMATO]?.image || "/images/items/tomato.png" }
    ],
    unlockCondition: (step, completed) => completed.includes("q8_first_harvest")
  },

  {
    id: "q9c_pico_harvest",
    type: "farming",
    sender: "Farmer Bob",
    subject: "Root Veggies Needed",
    body: [
      "You've been putting those pico seeds to good use, I can tell.",
      "How about supplying me with some onions and radishes? Good stuff for the table.",
      "I'll make it worth your while!"
    ],
    rewards: [
      { id: 'honey', count: 8000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 80, name: "Gems" },
    ],
    reqs: [
      { id: ID_PRODUCE_ITEMS?.ONION, count: 5, name: "Onions", pos: 27 },
      { id: ID_PRODUCE_ITEMS?.RADISH, count: 5, name: "Radishes", pos: 28 },
    ],
    unlockCondition: (step, completed) => completed.includes("q2_missionboard_intro")
  },

  {
    id: "q_mayor_bank_intro",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "Your Bag's Filling Up",
    mailImage: "/images/mail/mailmayor.png",
    body: [
      "Farmer,",
      "I noticed your inventory's getting awfully full — wouldn't want you running out of room mid-harvest.",
      "Stop by the Banker at the Harvest Market when you can. They'll help you store anything you don't need to carry around. A clean bag is a happy farmer."
    ],
    rewards: [],
    reqs: [],
    // Unlocks once the user's used produce/loot slots reach 70% of their bag capacity,
    // BUT only while they're on the farm screen — the letter is meant to land in the
    // mailbox during normal farming, not while they're already at the market.
    unlockCondition: (step, completed) => {
      if (step < 36) return false;
      try {
        const path = (typeof window !== 'undefined' ? window.location.pathname : '') || '';
        if (!path.endsWith('/farm')) return false;
        const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
        const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        const bags = parseInt(localStorage.getItem('sandbox_inventory_bags') || '1', 10);
        const used = Object.values(produce).filter((c) => Number(c) > 0).length
                   + Object.values(loot).filter((c) => Number(c) > 0).length;
        const max = Math.max(1, bags * 15);
        return (used / max) >= 0.7;
      } catch (_) { return false; }
    }
  },

  {
    id: "q_mayor_market_intro",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "Looks Like You Need More Seeds",
    mailImage: "/images/mail/mailmayor.png",
    body: [
      "Farmer,",
      "Looks like you're settling in nicely — but I noticed you're running low on seeds.",
      "Head over to the Harvest Market when you can. I'll meet you there and show you how to stock up properly. The valley takes care of those who plan ahead."
    ],
    // No reward + no harvest req — this is just an informational nudge. The mailbox shows
    // a single "Fold Letter" button, and folding marks it discarded + completed so the
    // letter disappears from the inbox once the user dismisses it.
    rewards: [],
    reqs: [],
    unlockCondition: (step, completed) => {
      const WAVE1_QUESTS = ['q1_beejamin','q1_potionmaster','q1_queen'];
      return WAVE1_QUESTS.every((id) => completed.includes(id));
    }
  },

  {
    id: "q2_missionboard_intro",
    type: "main",
    sender: "Mayor Prezibee",
    subject: "The Valley Mission Board",
    mailImage: "/images/mail/mailmayor.png",
    body: [
      "Now that you're settling in, I wanted to make you aware of a key town resource: the Valley Mission Board.",
      "Local residents post tasks there regularly — harvests they need, crops to be grown, all manner of farming requests. Complete them and you'll be compensated well.",
      "To formally recognize your commitment to Harvest Valley, complete three tasks from the board and I'll make sure you're well rewarded. The valley looks after those who look after it."
    ],
    rewards: [
      { id: 'honey', count: 5000, name: "Gold", image: "/images/profile_bar/hny.png" },
      { id: 'gems', count: 100, name: "Gems" },
    ],
    reqs: [
      {
        id: 'mission_board_3',
        count: 3,
        name: "Mission Board Tasks",
        image: null,
        fn: () => {
          try {
            const state = JSON.parse(localStorage.getItem('sandbox_mission_board_state') || '{}');
            return state.totalCompleted || 0;
          } catch { return 0; }
        }
      }
    ],
    unlockCondition: (step, completed) => completed.includes("q_mayor_market_intro")
  },

  {
    id: "q_beejamin_dock_intro",
    type: "main",
    sender: "Beejamin",
    subject: "More Plots, More Crops",
    mailImage: "/images/mail/mailbeejamin.png",
    body: [
      "yo bro sorry I forgot to tell you...",
      "you can actually unlock more plots so you can grow more crops, meet me at the dock and ill introduce you to our local gardener expert!",
    ],
    rewards: [],
    reqs: [],
    unlockCondition: (step, completed) => completed.includes("q2_missionboard_intro")
  },

  {
    id: "q_beejamin_daily_chest_intro",
    type: "main",
    sender: "Beejamin",
    subject: "Valley's Daily Chest",
    mailImage: "/images/mail/mailbeejamin.png",
    body: [
      "yo bro, level 10! you're cookin out there.",
      "swing by the dock when you can — I'll show you the Valley's Daily Chest. Free goodies for showing up, easy money.",
    ],
    rewards: [],
    reqs: [],
    // Unlocks once farming level reaches 10. Level formula: floor(sqrt(xp/150)) + 1,
    // so level 10 = xp >= 9*9*150 = 12150.
    unlockCondition: (step, completed) => {
      try {
        const xp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
        const level = Math.floor(Math.sqrt(xp / 150)) + 1;
        return level >= 10;
      } catch (_) { return false; }
    }
  },

  // PFP Unlock Letters from Pabee
  {
    id: "pfp_farmerpfp_letter",
    type: "main",
    sender: "Pabee",
    subject: "You're a Real Farmer Now",
    mailImage: "/images/mail/mailpapabee.png",
    pfpImage: "/images/pfp/famerpfp.png",
    pfpLabel: "Farmer",
    pfpHow: "Completed your first farming steps",
    body: [
      "Hey son, word got around that you've been getting the hang of things out there.",
      "I'm proud of you — when I left that farm, I wasn't sure it'd survive a week without me. But here you are, doing great.",
      "Keep at it. The land rewards patience. I figured you earned a little something for officially becoming a farmer."
    ],
    rewards: [], reqs: [],
    unlockCondition: () => JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]').includes('farmerpfp')
  },
  {
    id: "pfp_crowattackpfp_letter",
    type: "main",
    sender: "Pabee",
    subject: "About Those Crows...",
    mailImage: "/images/mail/mailpapabee.png",
    pfpImage: "/images/pfp/crowattackpfp.png",
    pfpLabel: "Crow Attack",
    pfpHow: "Had a crop destroyed by a crow",
    body: [
      "Hey son, heard you're dealing with crows... sucks. I had a whole patch of corn taken out once by a single crow — nasty creatures, bold as anything.",
      "I heard they're ordering some scarecrows to come and at least help with the problem. I think you'll be able to buy them at the store eventually. I don't know, just do your best to keep an eye out.",
      "Anyway, I figured you earned something for surviving the ordeal. Don't let it get you down — every farmer loses a crop sooner or later."
    ],
    rewards: [], reqs: [],
    unlockCondition: () => JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]').includes('crowattackpfp')
  },
  {
    id: "pfp_flyattackpfp_letter",
    type: "main",
    sender: "Pabee",
    subject: "Bug Season, Huh?",
    mailImage: "/images/mail/mailpapabee.png",
    pfpImage: "/images/pfp/flyattackpfp.png",
    pfpLabel: "Fly Attack",
    pfpHow: "Had crops attacked by bugs 10 times",
    body: [
      "Son, I heard the bugs have been at it again. Ten times?! That's rough, even for a seasoned farmer.",
      "I'll be honest, back in my day we just learned to live with 'em. But keep squashing them — every bug you kill is a crop saved.",
      "You're tougher than those little pests, I know that much. Here's something to remember the battle by."
    ],
    rewards: [], reqs: [],
    unlockCondition: () => JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]').includes('flyattackpfp')
  },
  {
    id: "pfp_potatopfp_letter",
    type: "main",
    sender: "Pabee",
    subject: "The Potato King",
    mailImage: "/images/mail/mailpapabee.png",
    pfpImage: "/images/pfp/potatopfp.png",
    pfpLabel: "Potato",
    pfpHow: "Harvested 10 potatoes",
    body: [
      "Ten potatoes, son! You know, my grandfather always said 'whoever masters the potato masters the farm.' I don't know if that's true but it sounds nice.",
      "Potatoes keep better than anything else in that soil — you picked a good crop to master. There's a reason they fed half the world.",
      "Keep it up and maybe one day they'll name a dish after you."
    ],
    rewards: [], reqs: [],
    unlockCondition: () => JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]').includes('potatopfp')
  },
  {
    id: "pfp_spendingfirstgem_letter",
    type: "main",
    sender: "Pabee",
    subject: "Easy on the Gems, Son",
    mailImage: "/images/mail/mailpapabee.png",
    pfpImage: "/images/pfp/spendingfirstgem.png",
    pfpLabel: "Gem Spender",
    pfpHow: "Spent 1000 gems on the farm",
    body: [
      "Hey, I heard you've been spending gems. Nothing wrong with investing in the farm — I always said you gotta spend it to make it.",
      "Just make sure you're getting value out of it. The valley's got a lot to offer if you know where to look.",
      "Take care of your wallet and your farm will take care of you. Here's a little badge for the commitment."
    ],
    rewards: [], reqs: [],
    unlockCondition: () => JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]').includes('spendingfirstgem')
  },
  {
    id: "pfp_rodpfp_letter",
    type: "main",
    sender: "Pabee",
    subject: "The Dock Is Fixed!",
    mailImage: "/images/mail/mailpapabee.png",
    pfpImage: "/images/pfp/rodpfp.png",
    pfpLabel: "Angler",
    pfpHow: "Repaired the old dock",
    body: [
      "Son! The old dock is finally fixed! I was there when your grandfather built it, back before the great storm took it out.",
      "Dewey's been trying to get it repaired for years — glad it finally happened. Now you can get out on the water proper.",
      "There's good fishing to be had out there if you know the spots. Dewey might have some tips for you. Welcome to the angler's life."
    ],
    rewards: [], reqs: [],
    unlockCondition: () => JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]').includes('rodpfp')
  },

];

// Shared Protection Logic Map
const protectedPlotsBySpot = {
  1: [8, 9], // Spot 1 protects 8 and 9
  2: [0, 1], // Spot 2 protects these plots
  3: [7, 8], 
  10: [5, 6],
  11: [2, 3],
  4: [], // Spot 4
  5: [6, 7], // Spot 5
  6: [10, 11], // Spot 6
  7: [11, 12], // Spot 7
  8: [13, 14]  // Spot 8
};

const MOCK_LEADERBOARD = [
  { name: "FarmerBob", weight: "2.85" },
  { name: "AliceGrows", weight: "2.61" },
  { name: "CryptoVeggies", weight: "2.40" },
  { name: "OnionKing", weight: "2.15" },
];

// Dialog to prepare a plot for planting
const PlotPrepDialog = ({ onClose, onPlaceDirt, onAddFish, availableFish, farmingLevel }) => {
  const [showFish, setShowFish] = useState(false);

  return (
    <BaseDialog onClose={onClose} title="HOLE" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#00ff41', margin: '0' }}>Inspect Hole</h2>
        <p style={{ margin: 0, color: '#ccc', textAlign: 'center' }}>
          {farmingLevel >= 5 ? "Do you want to add a fish to fertilize the hole, or place dirt directly?" : "Place dirt in the hole to prepare it for planting."}
        </p>
        
        {!showFish ? (
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            {farmingLevel >= 5 && <BaseButton label="Add Fish" onClick={() => setShowFish(true)} />}
            <BaseButton label="Place Dirt" onClick={onPlaceDirt} />
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: '0', color: '#ffea00' }}>Select a Fish</h3>
            {availableFish.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '200px', overflowY: 'auto', width: '100%' }}>
                {availableFish.map(fish => (
                  <div 
                    key={fish.id} 
                    onClick={() => onAddFish(fish.id)}
                    style={{ border: '2px solid #5a402a', borderRadius: '8px', padding: '10px', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '80px' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#5a402a'}
                  >
                    <img src={fish.image} alt={fish.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '12px', color: '#fff', textAlign: 'center' }}>{fish.label}</span>
                    <span style={{ fontSize: '10px', color: '#aaa' }}>x{fish.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#ff4444' }}>You have no fish!</p>
            )}
            <BaseButton small label="Back" onClick={() => setShowFish(false)} />
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

const SkipGrowthDialog = ({ onClose, onConfirm }) => {
  return (
    <BaseDialog onClose={onClose} title="SPEED UP" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#ffea00', margin: '0', textAlign: 'center' }}>Speed Up Growth?</h2>
        <p style={{ margin: 0, color: '#ccc', textAlign: 'center' }}>Spend 50 💎 Gems to instantly grow this crop?</p>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
          <BaseButton label="Pay 50 Gems 💎" onClick={onConfirm} />
          <BaseButton label="Cancel" onClick={onClose} isError />
        </div>
      </div>
    </BaseDialog>
  );
};

// Inline the dialog to avoid any import/module resolution errors!

export const WeightContestDialog = ({ onClose, simulatedDay, targetProduceId, targetFishId, onProduceChange, onFishChange, targetProduceData, targetFishData, refetchItems }) => {
  const { show } = useNotification();
  
  const [chestResult, setChestResult] = useState(null);
  const [showChestDialog, setShowChestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('produce'); // 'produce' or 'fish'
  
  const targetCropId = activeTab === 'produce' ? targetProduceId : targetFishId;
  const targetCropData = activeTab === 'produce' ? targetProduceData : targetFishData;
  const onCropChange = activeTab === 'produce' ? onProduceChange : onFishChange;
  const submissionKey = `weight_contest_submission_${activeTab}`;

  const [submission, setSubmission] = useState(() => {
    const saved = localStorage.getItem(submissionKey);
    if (!saved && activeTab === 'produce') {
      const legacy = localStorage.getItem('weight_contest_submission');
      if (legacy) return JSON.parse(legacy);
    }
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    let saved = localStorage.getItem(submissionKey);
    if (!saved && activeTab === 'produce') {
      const legacy = localStorage.getItem('weight_contest_submission');
      if (legacy) saved = legacy;
    }
    setSubmission(saved ? JSON.parse(saved) : null);
  }, [activeTab, submissionKey]);

  const targetCropName = targetCropData ? targetCropData.label : "Crop";

  const individualCrops = useMemo(() => {
    if (!targetCropData) return [];
    return Array.from({ length: targetCropData.count || 0 }).map((_, index) => {
      const randomFactor = Math.pow(Math.random(), 2.5);
      const weight = (0.5 + randomFactor * 1.5).toFixed(2);
      return {
        id: `crop-${index}`,
        name: `${targetCropName} ${index + 1}`,
        weight: weight,
      };
    });
  }, [targetCropData?.count, targetCropName]);

  const handleSelect = (crop) => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    let deducted = false;
    
    let produceCount = 0;
    if (Array.isArray(sandboxProduce[targetCropId])) {
      produceCount = sandboxProduce[targetCropId].length;
    } else {
      produceCount = Number(sandboxProduce[targetCropId]) || 0;
    }

    if (produceCount > 0) {
      if (Array.isArray(sandboxProduce[targetCropId])) {
        sandboxProduce[targetCropId].pop();
      } else {
        sandboxProduce[targetCropId] -= 1;
      }
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
      deducted = true;
    } else if (sandboxLoot[targetCropId] > 0) {
      sandboxLoot[targetCropId] -= 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      deducted = true;
    }

    if (!deducted) {
      show(`You don't have any ${targetCropName}s to submit!`, "error");
      return;
    }

    if (refetchItems) refetchItems();

    const newSubmission = { weight: crop.weight, name: "You" };
    setSubmission(newSubmission);
    localStorage.setItem(submissionKey, JSON.stringify(newSubmission));
  };

  const isSunday = simulatedDay === 0;
  const daysUntilSunday = isSunday ? 0 : 7 - simulatedDay;

  const handleClaimPrize = () => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const chestId = ID_CHEST_ITEMS.CHEST_BRONZE || ID_CHEST_ITEMS.BRONZE_CHEST;
    
    const mockRewards = [ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.POTATO, ID_PRODUCE_ITEMS.CORN];
    const mockRewardId = mockRewards[Math.floor(Math.random() * mockRewards.length)];
    
    sandboxLoot[mockRewardId] = (sandboxLoot[mockRewardId] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    setChestResult({
      rewardId: mockRewardId,
      chestType: chestId,
      image: ALL_ITEMS[mockRewardId]?.image,
      label: ALL_ITEMS[mockRewardId]?.label || "Produce"
    });
    setShowChestDialog(true);

    setSubmission(null);
    localStorage.removeItem(submissionKey);
    if (activeTab === 'produce') localStorage.removeItem('weight_contest_submission');

    const isFish = activeTab === 'fish';
    let eligible;
    if (isFish) {
      eligible = Object.values(ID_FISH_ITEMS).filter(id => typeof id === 'number');
      if (eligible.length === 0) eligible = [ID_PRODUCE_ITEMS.ONION]; 
    } else {
      eligible = [ID_PRODUCE_ITEMS.ONION, ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.POTATO, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.CORN];
    }

    const nextCrops = eligible.filter(id => id !== targetCropId);
    const newCrop = nextCrops.length > 0 ? nextCrops[Math.floor(Math.random() * nextCrops.length)] : eligible[0];
    onCropChange(newCrop);
    localStorage.setItem(isFish ? 'weight_contest_fish' : 'weight_contest_produce', newCrop.toString());

    show("Prize claimed! Opening chest...", "success");
  };

  const currentLeaderboard = useMemo(() => {
    let board = [...MOCK_LEADERBOARD];
    if (submission) board.push(submission);
    board.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
    return board;
  }, [submission]);

  return (
    <>
      <BaseDialog onClose={onClose} title="WEIGHT CONTEST" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
        <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => setActiveTab('produce')} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: activeTab === 'produce' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
                color: activeTab === 'produce' ? '#00ff41' : '#ccc', 
                border: `2px solid ${activeTab === 'produce' ? '#00ff41' : '#5a402a'}`, 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Produce Event
            </button>
            <button 
              onClick={() => setActiveTab('fish')} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: activeTab === 'fish' ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
                color: activeTab === 'fish' ? '#00bfff' : '#ccc', 
                border: `2px solid ${activeTab === 'fish' ? '#00bfff' : '#5a402a'}`, 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Fish Event
            </button>
          </div>

          {isSunday ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly {targetCropName} Weigh-In Results 🏆</h2>
                <p style={{ margin: 0, color: '#ccc' }}>The competition has ended! Here are the winners:</p>
              </div>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>Final Standings</h3>
                {currentLeaderboard.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(90, 64, 42, 0.5)' }}>
                    <span style={{ width: '30px', color: entry.name === 'You' ? '#00ff41' : '#fff' }}>#{index + 1}</span>
                    <span style={{ flex: 1, color: entry.name === 'You' ? '#00ff41' : '#aaa' }}>{entry.name}</span>
                    <span style={{ color: '#ffea00' }}>{entry.weight}kg</span>
                  </div>
                ))}
              </div>
              {submission && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <BaseButton label="Claim Prize" onClick={handleClaimPrize} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly {targetCropName} Weigh-In 🏆</h2>
                {submission ? (
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #5a402a', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                    <p style={{ color: '#00ff41', fontSize: '18px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Ticket Submitted!</p>
                    <p style={{ margin: '0 0 10px 0' }}>Your Entry: <span style={{ color: '#ffea00' }}>{submission.weight}kg {targetCropName}</span></p>
                    <p style={{ color: '#ccc', margin: 0 }}>The competition ends in <strong style={{ color: '#fff' }}>{daysUntilSunday} {daysUntilSunday === 1 ? 'day' : 'days'}</strong> (on Sunday).</p>
                    <p style={{ color: '#aaa', fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>* Leaderboard is hidden until the competition ends.</p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#ccc' }}>This week's weight competition is for {targetCropName}. Please submit your ticket and choose which {targetCropName.toLowerCase()} you want to enter.</p>
                )}
              </div>

              {!submission && (
                <div style={{ overflowY: 'auto', maxHeight: '300px', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {individualCrops.length > 0 ? individualCrops.map((crop) => (
                    <div key={crop.id} style={{ backgroundColor: 'rgba(31, 22, 16, 0.8)', border: '2px solid #5a402a', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {targetCropData?.image && targetCropData.image.includes('crop') ? (
                             <div style={{ 
                                 width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, 
                                 backgroundImage: `url(${targetCropData.image})`, 
                                 backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(targetCropData.pos || 0) * ONE_SEED_HEIGHT}px`,
                                 transform: 'scale(0.6)', backgroundRepeat: 'no-repeat'
                             }} />
                          ) : targetCropData?.image && targetCropData.image.includes('seeds') ? (
                             <div className="item-icon item-icon-seeds" style={{ width: '40px', height: '40px', transform: 'scale(0.8)', backgroundPositionY: targetCropData.pos ? `-${targetCropData.pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div>
                          ) : (
                             <img src={targetCropData?.image} alt={targetCropName} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                          )}
                        </div>
                        <span style={{ color: '#00ff41', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{crop.name} - <span style={{ color: '#fff' }}>{crop.weight}kg</span></span>
                      </div>
                      <BaseButton small label="Submit" onClick={() => handleSelect(crop)} />
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#ff4444', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid #ff4444' }}>You don't have any {targetCropName}s to submit! Go farm some.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </BaseDialog>
    </>
  );
};

export const CalendarDialog = ({ onClose, simulatedDay, simulatedDate, refetch, onClaimed }) => {
  const { show } = useNotification();
  const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[estDate.getMonth()];
  const year = estDate.getFullYear();
  const month = estDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;

  const blanks = Array.from({ length: startOffset }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('sandbox_login_streak') || '0', 10));
  const [lastClaimDate, setLastClaimDate] = useState(() => localStorage.getItem('sandbox_last_claim_date') || '');

  const today = new Date().toDateString();
  const canClaim = lastClaimDate !== today;

  const DAILY_REWARDS = [
    { day: 1, id: 9993, name: "Wood", count: 10, image: "/images/forest/wood.png" },
    { day: 2, id: 9994, name: "Stone", count: 10, image: "/images/forest/rock.png" },
    { day: 3, id: 'honey', name: "Honey", count: 100, image: "/images/items/honey.png" },
    { day: 4, id: 9995, name: "Sticks", count: 10, image: "/images/forest/wood.png" },
    { day: 5, id: 9996, name: "Iron Ore", count: 5, image: "/images/forest/ironrock.png" },
    { day: 6, id: 9997, name: "Gold Ore", count: 2, image: "/images/forest/goldrock.png" },
    { day: 7, id: 'chest', name: "Bronze Chest", count: 1, image: "/images/items/chest.png" }
  ];

  const handleClaim = () => {
    if (!canClaim) return;
    const reward = DAILY_REWARDS[streak % 7];

    if (reward.id === 'honey') {
      const currentHoney = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
      const newHoney = currentHoney + reward.count;
      localStorage.setItem('sandbox_honey', newHoney.toString());
      window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));
    } else {
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      const itemId = reward.id === 'chest' ? (ID_CHEST_ITEMS?.CHEST_BRONZE || 20001) : reward.id;
      sandboxLoot[itemId] = (sandboxLoot[itemId] || 0) + reward.count;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    }

    const nextStreak = (streak + 1) % 7;
    setStreak(nextStreak);
    setLastClaimDate(today);
    localStorage.setItem('sandbox_login_streak', nextStreak.toString());
    localStorage.setItem('sandbox_last_claim_date', today);

    show(`Claimed ${reward.count}x ${reward.name}!`, "success");
    if (refetch) refetch();
    if (onClaimed) onClaimed();
  };

  const VISIBLE_WINDOW = 7;

  return (
    <BaseDialog onClose={onClose} title="CALENDAR" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '15px', width: '700px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#00ff41', margin: 0 }}>{monthName} {year}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{ color: '#ccc', fontSize: '12px' }}>Login Streak: <span style={{ color: '#ffea00', fontWeight: 'bold' }}>{streak % 7 + 1}/7</span></span>
            <BaseButton small label={canClaim ? "Claim Today's Reward" : "Come back tomorrow!"} disabled={!canClaim} onClick={handleClaim} />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          border: '2px solid #5a402a',
          borderRadius: '8px',
          padding: '12px'
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} style={{ textAlign: 'center', color: '#ccc', fontWeight: 'bold', paddingBottom: '8px', borderBottom: '1px solid #5a402a', marginBottom: '4px', fontSize: '12px' }}>
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} style={{ height: '88px' }} />
          ))}
          {days.map(day => {
            const currentDayOfWeek = (startOffset + day - 1) % 7;
            const isSunday = currentDayOfWeek === 6;
            const isToday = day === simulatedDate;
            const isPast = day < simulatedDate;
            const daysFromToday = day - simulatedDate;
            const isBeyondWindow = daysFromToday >= VISIBLE_WINDOW;

            const weatherEmoji = getWeatherForDay(day);
            const weatherTitle = weatherEmoji === '⚡' ? 'Lightning Storm' : weatherEmoji === '🌧️' ? 'Rainy' : weatherEmoji === '☁️' ? 'Cloudy' : 'Sunny';

            // Which reward cycle position does this day map to?
            const rewardIndex = ((streak % 7) + Math.max(0, daysFromToday)) % 7;
            const reward = DAILY_REWARDS[rewardIndex];
            const isClaimed = isPast || (isToday && !canClaim);
            const showReward = !isPast;

            return (
              <div key={day} style={{
                height: '88px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                padding: '4px',
                border: isToday ? '2px solid #00ff41' : '1px solid #5a402a',
                backgroundColor: isToday ? 'rgba(0,255,65,0.12)' : isPast ? 'rgba(20,14,10,0.8)' : 'rgba(31,22,16,0.8)',
                color: isToday ? '#00ff41' : isPast ? '#555' : '#fff',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'hidden',
                filter: isBeyondWindow ? 'blur(4px)' : 'none',
                pointerEvents: isBeyondWindow ? 'none' : 'auto',
                userSelect: isBeyondWindow ? 'none' : 'auto',
              }}>
                {/* Date + weather row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '12px', opacity: isBeyondWindow ? 0 : 1 }} title={weatherTitle}>{weatherEmoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{day}</span>
                </div>

                {/* Reward */}
                {showReward && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                    <img
                      src={reward.image}
                      alt={reward.name}
                      style={{ width: '22px', height: '22px', objectFit: 'contain', opacity: isClaimed ? 0.4 : 1 }}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/forest/rock.png'; }}
                    />
                    <span style={{ fontSize: '9px', color: isClaimed ? '#555' : '#ffea00', textAlign: 'center', lineHeight: 1.2 }}>
                      {reward.count}x {reward.name}
                    </span>
                  </div>
                )}

                {/* Claimed checkmark */}
                {isClaimed && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '22px', color: '#00ff41', textShadow: '0 0 6px #000', pointerEvents: 'none' }}>✓</div>
                )}

                {/* Sunday weigh-in icon */}
                {isSunday && !isBeyondWindow && (
                  <img src="/images/weight/weightcontest.png" alt="Weigh-in" style={{ width: '24px', height: '24px', position: 'absolute', bottom: '2px', right: '2px', opacity: 0.85, filter: 'drop-shadow(0px 1px 2px black)' }} title="Weekly Weigh-In!" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BaseDialog>
  );
};

// Helper to calculate level from XP
const getLevelFromXp = (xp) => Math.floor(Math.sqrt((xp || 0) / 150)) + 1;

export const CraftingDialog = ({ onClose, refetchSeeds, tutorialStep, onAdvanceTutorial, craftingGoal }) => {
  const { all: allItems, refetch } = useItems();
  const { show } = useNotification();
  const [activeTab, setActiveTab] = useState(craftingGoal ? (craftingGoal.tab || 'items') : 'tools'); // 'tools' or 'items'
  const [craftAmounts, setCraftAmounts] = useState(craftingGoal ? { [craftingGoal.recipeId]: craftingGoal.amount || 1 } : {});
  
  const safeItems = allItems || [];
  const woodCount = safeItems.find(i => i.id === 9993)?.count || 0;
  const specialWoodCount = safeItems.find(i => i.id === 9942)?.count || 0;
  const stoneCount = safeItems.find(i => i.id === 9994)?.count || 0;
  const sticksCount = safeItems.find(i => i.id === 9995)?.count || 0;
  const stonePipeCount = safeItems.find(i => i.id === 9990)?.count || 0;
  const ironCount = safeItems.find(i => i.id === 9996)?.count || 0;
  const pumpkinCount = safeItems.find(i => i.id === ID_PRODUCE_ITEMS.PUMPKIN)?.count || 0;
  const cornCount = safeItems.find(i => i.id === ID_PRODUCE_ITEMS.CORN)?.count || 0;
  const plankCount = safeItems.find(i => i.id === 9989)?.count || 0;
  const axeCount = safeItems.find(i => i.id === 9991)?.count || 0;
  const pickaxeCount = safeItems.find(i => i.id === 9992)?.count || 0;
  const ironPickaxeCount = safeItems.find(i => i.id === 9981)?.count || 0;
  const ladybugScarecrowCount = safeItems.find(i => i.id === 9979)?.count || 0;
  const tier2ScarecrowCount = safeItems.find(i => i.id === 9978)?.count || 0;
  const tier3ScarecrowCount = safeItems.find(i => i.id === 9977)?.count || 0;
  const tier4ScarecrowCount = safeItems.find(i => i.id === 9976)?.count || 0;
  const teslaTowerCount = safeItems.find(i => i.id === 9975)?.count || 0;

  const ladybugCount = safeItems.find(i => i.id === ID_POTION_ITEMS.LADYBUG)?.count || 0;
  const scarecrowBaseCount = safeItems.find(i => i.id === ID_POTION_ITEMS.SCARECROW)?.count || 0;
  const leavesCount = safeItems.find(i => i.id === 9956)?.count || 0;
  
  const hempCount = safeItems.find(i => i.id === 9972)?.count || 0;
  const cottonCount = safeItems.find(i => i.id === 9971)?.count || 0;
  const ropeCount = safeItems.find(i => i.id === 9970)?.count || 0;
  const canvasCount = safeItems.find(i => i.id === 9969)?.count || 0;
  const copperCount = safeItems.find(i => i.id === 9974)?.count || 0;
  const coalCount = safeItems.find(i => i.id === 9973)?.count || 0;
  const nailsCount = safeItems.find(i => i.id === 9968)?.count || 0;
  const steelCount = safeItems.find(i => i.id === 9967)?.count || 0;
  const engineCount = safeItems.find(i => i.id === 9962)?.count || 0;

  const farmDataStr = localStorage.getItem('sandbox_animal_farm') || '{}';
  const farmData = JSON.parse(farmDataStr);
  const hasCoop = farmData?.coop?.status && farmData.coop.status !== 'unbuilt';
  const hasSheepcage = farmData?.sheepcage?.status && farmData.sheepcage.status !== 'unbuilt';
  const hasCowbarn = farmData?.cowbarn?.status && farmData.cowbarn.status !== 'unbuilt';

  const [craftingXp, setCraftingXp] = useState(() => parseInt(localStorage.getItem('sandbox_crafting_xp') || '0', 10));
  const craftingLevel = getLevelFromXp(craftingXp);
  const craftingProgress = ((craftingXp - Math.pow(craftingLevel - 1, 2) * 150) / (Math.pow(craftingLevel, 2) * 150 - Math.pow(craftingLevel - 1, 2) * 150)) * 100;

  useEffect(() => {
    const handleLsUpdate = (e) => {
      if (e.detail.key === 'sandbox_crafting_xp') setCraftingXp(parseInt(e.detail.value, 10));
    };
    window.addEventListener('ls-update', handleLsUpdate);
    return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  const addCraftingXp = (amount) => {
    const oldLevel = getLevelFromXp(craftingXp);
    const newXp = craftingXp + amount;
    const newLevel = getLevelFromXp(newXp);
    setCraftingXp(newXp);
    localStorage.setItem('sandbox_crafting_xp', newXp.toString());
    if (newLevel > oldLevel) {
      window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Crafting', level: newLevel } }));
    }
  };

  const handleCraftGeneric = (resultId, reqs, amount, xpReward) => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const [id, count] of reqs) {
      let available = 0;
      if (Array.isArray(sandboxProduce[id])) available = sandboxProduce[id].length;
      else available = (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      if (available < count * amount) return;
    }
    
    for (const [id, count] of reqs) {
      let remaining = count * amount;
      if (sandboxProduce[id] !== undefined) {
        if (Array.isArray(sandboxProduce[id])) {
          while(remaining > 0 && sandboxProduce[id].length > 0) { sandboxProduce[id].pop(); remaining--; }
        } else {
          const deduct = Math.min(Number(sandboxProduce[id]) || 0, remaining);
          sandboxProduce[id] = (Number(sandboxProduce[id]) || 0) - deduct;
          remaining -= deduct;
        }
      }
      if (remaining > 0) sandboxLoot[id] = Math.max(0, (sandboxLoot[id] || 0) - remaining);
    }
    
    sandboxLoot[resultId] = (sandboxLoot[resultId] || 0) + amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(xpReward * amount);
    show(`Crafted successfully!`, "success");
  };

  const handleCraftSticks = (amount = 1) => {
    if (woodCount < 2 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 2 * amount);
    sandboxLoot[9995] = (sandboxLoot[9995] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(5 * amount);
    show(`Crafted ${amount} Stick${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftPlank = (amount = 1) => {
    if (woodCount < 10 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 10 * amount);
    sandboxLoot[9989] = (sandboxLoot[9989] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(15 * amount);
    show(`Crafted ${amount} Wooden Plank${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftStonePipe = (amount = 1) => {
    if (stoneCount < 2 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 2 * amount);
    sandboxLoot[9990] = (sandboxLoot[9990] || 0) + 2 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(10 * amount);
    show(`Crafted ${2 * amount} Stone Pipes!`, "success");
  };

  const handleCraftScarecrow = (amount = 1) => {
    if (sticksCount < 3 * amount || pumpkinCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    
    let remainingPumpkinToDeduct = 1 * amount;
    if (sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN] > 0) {
      const deduct = Math.min(sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN], remainingPumpkinToDeduct);
      sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN] -= deduct;
      remainingPumpkinToDeduct -= deduct;
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    }
    if (remainingPumpkinToDeduct > 0) {
      sandboxLoot[ID_PRODUCE_ITEMS.PUMPKIN] = Math.max(0, (sandboxLoot[ID_PRODUCE_ITEMS.PUMPKIN] || 0) - remainingPumpkinToDeduct);
    }
    
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(25 * amount);
    show(`Crafted ${amount} Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftUmbrella = (amount = 1) => {
    if (sticksCount < 2 * amount || cornCount < 5 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 2 * amount);
    
    let remainingCornToDeduct = 5 * amount;
    if (sandboxProduce[ID_PRODUCE_ITEMS.CORN] > 0) {
      const deduct = Math.min(sandboxProduce[ID_PRODUCE_ITEMS.CORN], remainingCornToDeduct);
      sandboxProduce[ID_PRODUCE_ITEMS.CORN] -= deduct;
      remainingCornToDeduct -= deduct;
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    }
    if (remainingCornToDeduct > 0) {
      sandboxLoot[ID_PRODUCE_ITEMS.CORN] = Math.max(0, (sandboxLoot[ID_PRODUCE_ITEMS.CORN] || 0) - remainingCornToDeduct);
    }
    
    sandboxLoot[9999] = (sandboxLoot[9999] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(20 * amount);
    show(`Crafted ${amount} Umbrella${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftSprinkler = (amount = 1) => {
    if (stonePipeCount < 2 * amount || ironCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');

    sandboxLoot[9990] = Math.max(0, (sandboxLoot[9990] || 0) - 2 * amount);
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 1 * amount);
    
    sandboxLoot[9998] = (sandboxLoot[9998] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(40 * amount);
    show(`Crafted ${amount} Water Sprinkler${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftAxe = (amount = 1) => {
    if (sticksCount < 3 * amount || stoneCount < 3 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 3 * amount);
    sandboxLoot[9991] = (sandboxLoot[9991] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(15 * amount);
    show(`Crafted ${amount} Axe${amount > 1 ? 's' : ''}!`, "success");
    if (tutorialStep === 26 && pickaxeCount > 0 && onAdvanceTutorial) onAdvanceTutorial();
  };

  const handleCraftPickaxe = (amount = 1) => {
    if (sticksCount < 3 * amount || stoneCount < 3 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 3 * amount);
    sandboxLoot[9992] = (sandboxLoot[9992] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(15 * amount);
    show(`Crafted ${amount} Pickaxe${amount > 1 ? 's' : ''}!`, "success");
    if (tutorialStep === 26 && axeCount > 0 && onAdvanceTutorial) onAdvanceTutorial();
  };

  const handleCraftIronPickaxe = (amount = 1) => {
    if (sticksCount < 3 * amount || ironCount < 3 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3 * amount);
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 3 * amount);
    sandboxLoot[9981] = (sandboxLoot[9981] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    addCraftingXp(50 * amount);
    show(`Crafted ${amount} Iron Pickaxe${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftLadybugScarecrow = (amount = 1) => {
    if (scarecrowBaseCount < 1 * amount || ladybugCount < 10 * amount || specialWoodCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) - 1 * amount);
    sandboxLoot[ID_POTION_ITEMS.LADYBUG] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.LADYBUG] || 0) - 10 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 1 * amount);
    sandboxLoot[9979] = (sandboxLoot[9979] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(35 * amount);
    show(`Crafted ${amount} Ladybug Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTier2 = (amount = 1) => {
    if (scarecrowBaseCount < 5 * amount || specialWoodCount < 1 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) - 5 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 1 * amount);
    sandboxLoot[9978] = (sandboxLoot[9978] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(50 * amount);
    show(`Crafted ${amount} Tier 2 Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTier3 = (amount = 1) => {
    if (tier2ScarecrowCount < 4 * amount || woodCount < 10 * amount || specialWoodCount < 2 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9978] = Math.max(0, (sandboxLoot[9978] || 0) - 4 * amount);
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 10 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 2 * amount);
    sandboxLoot[9977] = (sandboxLoot[9977] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(100 * amount);
    show(`Crafted ${amount} Tier 3 Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTier4 = (amount = 1) => {
    if (tier3ScarecrowCount < 3 * amount || (safeItems.find(i => i.id === 9997)?.count || 0) < 5 * amount || specialWoodCount < 5 * amount) return; // 9997 = Gold
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9977] = Math.max(0, (sandboxLoot[9977] || 0) - 3 * amount);
    sandboxLoot[9997] = Math.max(0, (sandboxLoot[9997] || 0) - 5 * amount);
    sandboxLoot[9942] = Math.max(0, (sandboxLoot[9942] || 0) - 5 * amount);
    sandboxLoot[9976] = (sandboxLoot[9976] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(250 * amount);
    show(`Crafted ${amount} Max Tier Scarecrow${amount > 1 ? 's' : ''}!`, "success");
  };

  const handleCraftTesla = (amount = 1) => {
    if (ironCount < 10 * amount || stonePipeCount < 5 * amount) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10 * amount); // Iron
    sandboxLoot[9990] = Math.max(0, (sandboxLoot[9990] || 0) - 5 * amount);  // Pipes
    sandboxLoot[9975] = (sandboxLoot[9975] || 0) + 1 * amount;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    addCraftingXp(150 * amount);
    show(`Crafted ${amount} Tesla Tower${amount > 1 ? 's' : ''}!`, "success");
  };

  const highlightSticks = tutorialStep === 26 && (axeCount === 0 || pickaxeCount === 0) && sticksCount < 3;
  const highlightAxe = tutorialStep === 26 && axeCount === 0 && sticksCount >= 3;
  const highlightPickaxe = tutorialStep === 26 && pickaxeCount === 0 && sticksCount >= 3;

  const recipes = {
    tools: [
      {
        id: 'axe',
        name: 'Axe',
        description: 'Used to chop down trees in the Forest for Wood and Leaves.',
        minLevel: 1,
        image: ALL_ITEMS[9991]?.image || '/images/forest/axe.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${3 * amt} Stone`,
        canCraft: (amt) => sticksCount >= 3 * amt && stoneCount >= 3 * amt,
        onCraft: (amt) => handleCraftAxe(amt),
        highlight: highlightAxe,
        tutorialLocked: tutorialStep === 26 && axeCount > 0
      },
      {
        id: 'pickaxe',
        name: 'Pickaxe',
        description: 'Used to mine rocks in the Cave for Stone, Coal, and Ores.',
        minLevel: 1,
        image: ALL_ITEMS[9992]?.image || '/images/forest/picaxe.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${3 * amt} Stone`,
        canCraft: (amt) => sticksCount >= 3 * amt && stoneCount >= 3 * amt,
        onCraft: (amt) => handleCraftPickaxe(amt),
        highlight: highlightPickaxe,
        tutorialLocked: tutorialStep === 26 && pickaxeCount > 0
      },
      {
        id: 'iron_pickaxe',
        name: 'Iron Pickaxe',
        description: 'A much stronger pickaxe required to mine Gold Rocks.',
        minLevel: 5,
        image: ALL_ITEMS[9981]?.image || '/images/forest/picaxe.png',
        imageFilter: 'drop-shadow(0px 0px 5px #00ff41) brightness(1.2)',
        costFunc: (amt) => `${3 * amt} Sticks, ${3 * amt} Iron`,
        canCraft: (amt) => sticksCount >= 3 * amt && ironCount >= 3 * amt,
        onCraft: (amt) => handleCraftIronPickaxe(amt),
        highlight: craftingGoal?.recipeId === 'iron_pickaxe'
      },
      {
        id: 'bug_net',
        name: 'Bug Net',
        description: 'Used to safely catch bugs hidden in Forest bushes.',
        minLevel: 2,
        image: '/images/forest/net.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${4 * amt} Rope`,
        canCraft: (amt) => sticksCount >= 3 * amt && ropeCount >= 4 * amt,
        onCraft: (amt) => handleCraftGeneric(9988, [[9995, 3], [9970, 4]], amt, 25),
        highlight: craftingGoal?.recipeId === 'bug_net'
      }
    ],
    items: [
      {
        id: 'bucket',
        name: 'Bucket',
        description: 'Allows you to draw items and water from the Well.',
        minLevel: 2,
        image: ALL_ITEMS[9953]?.image || '/images/forest/wood.png',
        costFunc: (amt) => `${5 * amt} Wood, ${1 * amt} Sticks`,
        canCraft: (amt) => woodCount >= 5 * amt && sticksCount >= 1 * amt,
        onCraft: (amt) => {
          if (woodCount < 5 * amt || sticksCount < 1 * amt) return;
          const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
          sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 5 * amt);
          sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 1 * amt);
          sandboxLoot[9953] = (sandboxLoot[9953] || 0) + 1 * amt;
          localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
          if (refetch) refetch();
          addCraftingXp(15 * amt);
          show(`Crafted ${amt} Bucket${amt > 1 ? 's' : ''}!`, "success");
        },
        highlight: craftingGoal?.recipeId === 'bucket'
      },
      {
        id: 'plank',
        name: 'Wooden Plank',
        description: 'A refined wooden board used in advanced crafting.',
        minLevel: 1,
        image: ALL_ITEMS[9989]?.image || '/images/forest/wood.png',
        costFunc: (amt) => `${10 * amt} Wood`,
        canCraft: (amt) => woodCount >= 10 * amt,
        onCraft: (amt) => handleCraftPlank(amt),
        highlight: craftingGoal?.recipeId === 'plank'
      },
      {
        id: 'sticks',
        name: 'Sticks',
        description: 'Basic component for tool handles and structures.',
        minLevel: 1,
        image: ALL_ITEMS[9995]?.image || '/images/forest/wood.png',
        costFunc: (amt) => `${2 * amt} Wood`,
        canCraft: (amt) => woodCount >= 2 * amt,
        onCraft: (amt) => handleCraftSticks(amt),
        highlight: highlightSticks || craftingGoal?.recipeId === 'sticks'
      },
    {
        id: 'stone_pipe',
        name: 'Stone Pipe (x2)',
        description: 'Used to channel water for automated systems.',
        minLevel: 2,
        image: ALL_ITEMS[9990]?.image || '/images/forest/stone.png',
        costFunc: (amt) => `${2 * amt} Stone`,
        canCraft: (amt) => stoneCount >= 2 * amt,
        onCraft: (amt) => handleCraftStonePipe(amt),
        highlight: craftingGoal?.recipeId === 'stone_pipe'
      },
      {
        id: 'scarecrow',
        name: 'Scarecrow',
        description: 'Protects the specific plot it is placed on from crows.',
        minLevel: 1,
        image: ALL_ITEMS[ID_POTION_ITEMS?.SCARECROW]?.image || '/images/scarecrow/scarecrow1.png',
        costFunc: (amt) => `${3 * amt} Sticks, ${1 * amt} Pumpkin`,
        canCraft: (amt) => sticksCount >= 3 * amt && pumpkinCount >= 1 * amt,
        onCraft: (amt) => handleCraftScarecrow(amt),
        highlight: craftingGoal?.recipeId === 'scarecrow'
      },
      {
        id: 'umbrella',
        name: 'Umbrella',
        description: 'Protects crops from overwatering during storms.',
        minLevel: 3,
        image: ALL_ITEMS[9999]?.image || '/images/items/umbrella.png',
        costFunc: (amt) => `${2 * amt} Sticks, ${5 * amt} Corn`,
        canCraft: (amt) => sticksCount >= 2 * amt && cornCount >= 5 * amt,
        onCraft: (amt) => handleCraftUmbrella(amt),
        highlight: craftingGoal?.recipeId === 'umbrella'
      },
      {
        id: 'rope',
        name: 'Rope',
        description: 'Sturdy woven leaves used to tie things together.',
        minLevel: 2,
        image: '/images/crafting/hemp_rope.png',
        costFunc: (amt) => `${10 * amt} Leaves`,
        canCraft: (amt) => leavesCount >= 10 * amt,
        onCraft: (amt) => handleCraftGeneric(9970, [[9956, 10]], amt, 15),
        highlight: craftingGoal?.recipeId === 'rope'
      },
      {
        id: 'canvas',
        name: 'Canvas',
        description: 'Heavy fabric woven from cotton, essential for building sailboats.',
        minLevel: 5,
        image: '/images/crafting/canvas.png',
        costFunc: (amt) => `${10 * amt} Cotton`,
        canCraft: (amt) => cottonCount >= 10 * amt,
        onCraft: (amt) => handleCraftGeneric(9969, [[9971, 10]], amt, 25),
      },
      {
        id: 'copper_nails',
        name: 'Copper Nails',
        description: 'Strong nails used in shipwrighting.',
        minLevel: 4,
        image: '/images/crafting/copper_nails.png',
        costFunc: (amt) => `${2 * amt} Copper Ore`,
        canCraft: (amt) => copperCount >= 2 * amt,
        onCraft: (amt) => handleCraftGeneric(9968, [[9974, 2]], amt, 20),
      },
      {
        id: 'steel_plate',
        name: 'Steel Plate',
        description: 'Heavy armor plating for industrial machines.',
        minLevel: 10,
        image: '/images/crafting/steel_plate.png',
        costFunc: (amt) => `${2 * amt} Iron, ${1 * amt} Coal`,
        canCraft: (amt) => ironCount >= 2 * amt && coalCount >= 1 * amt,
        onCraft: (amt) => handleCraftGeneric(9967, [[9996, 2], [9973, 1]], amt, 40),
      },
      {
        id: 'crab_pot',
        name: 'Crab Pot',
        description: 'Catches crabs passively over time in the water.',
        minLevel: 10,
        image: '/images/items/crab_pot.png',
        costFunc: (amt) => `${10 * amt} Wood, ${2 * amt} Iron, ${3 * amt} Rope`,
        canCraft: (amt) => woodCount >= 10 * amt && ironCount >= 2 * amt && ropeCount >= 3 * amt,
        onCraft: (amt) => handleCraftGeneric(9966, [[9993, 10], [9996, 2], [9970, 3]], amt, 50),
      },
      {
        id: 'rowboat',
        name: 'Rowboat',
        description: 'A small boat to fish in the local lake.',
        minLevel: 5,
        image: '/images/items/rowboat.png',
        costFunc: (amt) => `${30 * amt} Wood, ${20 * amt} Sticks, ${10 * amt} Iron`,
        canCraft: (amt) => woodCount >= 30 * amt && sticksCount >= 20 * amt && ironCount >= 10 * amt && ropeCount >= 5 * amt,
        onCraft: (amt) => handleCraftGeneric(9965, [[9993, 30], [9995, 20], [9996, 10], [9970, 5]], amt, 200),
      },
      {
        id: 'sailboat',
        name: 'Sailboat',
        description: 'A larger vessel to brave the open ocean.',
        minLevel: 15,
        image: '/images/items/sailboat.png',
        costFunc: (amt) => `${100 * amt} Wood, ${50 * amt} Iron, ${20 * amt} Canvas`,
        canCraft: (amt) => woodCount >= 100 * amt && ironCount >= 50 * amt && canvasCount >= 20 * amt && nailsCount >= 20 * amt,
        onCraft: (amt) => handleCraftGeneric(9964, [[9993, 100], [9996, 50], [9969, 20], [9968, 20]], amt, 500),
      },
      {
        id: 'trawler',
        name: 'Trawler',
        description: 'A massive industrial ship for deep sea fishing.',
        minLevel: 30,
        image: '/images/items/trawler.png',
        costFunc: (amt) => `${100 * amt} Wood, ${50 * amt} Steel, ${1 * amt} Engine`,
        canCraft: (amt) => woodCount >= 100 * amt && steelCount >= 50 * amt && engineCount >= 1 * amt,
        onCraft: (amt) => handleCraftGeneric(9963, [[9993, 100], [9967, 50], [9962, 1]], amt, 1500),
      },
      {
        id: 'sprinkler',
        name: 'Sprinkler',
        description: 'Automatically waters crops so you don\'t have to.',
        minLevel: 4,
        image: ALL_ITEMS[9998]?.image || '/images/items/watersprinkler.png',
        costFunc: (amt) => `${2 * amt} Pipes, ${1 * amt} Iron`,
        canCraft: (amt) => stonePipeCount >= 2 * amt && ironCount >= 1 * amt,
        onCraft: (amt) => handleCraftSprinkler(amt),
        highlight: craftingGoal?.recipeId === 'sprinkler'
      },
      {
        id: 'ladybug_scarecrow',
        name: 'Ladybug Scarecrow',
        description: 'Protects crops from pests and attracts friendly bugs.',
        minLevel: 5,
        image: ALL_ITEMS[9979]?.image || '/images/scarecrow/ladybug_scarecrow.png',
        costFunc: (amt) => `${1 * amt} Scarecrow, ${10 * amt} Ladybugs, ${1 * amt} Sp. Wood`,
        canCraft: (amt) => scarecrowBaseCount >= 1 * amt && ladybugCount >= 10 * amt && specialWoodCount >= 1 * amt,
        onCraft: (amt) => handleCraftLadybugScarecrow(amt),
        highlight: craftingGoal?.recipeId === 'ladybug_scarecrow'
      },
      {
        id: 'tier2_scarecrow',
        name: 'Tier 2 Scarecrow',
        description: 'Protects a wider radius of crops (up to 2 plots away).',
        minLevel: 6,
        image: ALL_ITEMS[9978]?.image || '/images/scarecrow/tier2.png',
        costFunc: (amt) => `${5 * amt} Scarecrows, ${1 * amt} Sp. Wood`,
        canCraft: (amt) => scarecrowBaseCount >= 5 * amt && specialWoodCount >= 1 * amt,
        onCraft: (amt) => handleCraftTier2(amt),
        highlight: craftingGoal?.recipeId === 'tier2_scarecrow'
      },
      {
        id: 'tier3_scarecrow',
        name: 'Tier 3 Scarecrow',
        description: 'Protects a massive radius of crops (up to 5 plots away).',
        minLevel: 8,
        image: ALL_ITEMS[9977]?.image || '/images/scarecrow/tier3.png',
        costFunc: (amt) => `${4 * amt} Tier-2 Scarecrows, ${10 * amt} Wood, ${2 * amt} Sp. Wood`,
        canCraft: (amt) => tier2ScarecrowCount >= 4 * amt && woodCount >= 10 * amt && specialWoodCount >= 2 * amt,
        onCraft: (amt) => handleCraftTier3(amt),
        highlight: craftingGoal?.recipeId === 'tier3_scarecrow'
      },
      {
        id: 'tier4_scarecrow',
        name: 'Max Tier Scarecrow',
        description: 'The ultimate scarecrow. Protects the entire farm!',
        minLevel: 10,
        image: ALL_ITEMS[9976]?.image || '/images/scarecrow/tier4.png',
        costFunc: (amt) => `${3 * amt} Tier-3 Scarecrows, ${5 * amt} Gold Ore, ${5 * amt} Sp. Wood`,
        canCraft: (amt) => tier3ScarecrowCount >= 3 * amt && (allItems.find(i => i.id === 9997)?.count || 0) >= 5 * amt && specialWoodCount >= 5 * amt,
        onCraft: (amt) => handleCraftTier4(amt),
        highlight: craftingGoal?.recipeId === 'tier4_scarecrow'
      },
      {
        id: 'tesla_tower',
        name: 'Tesla Tower',
        description: 'Grounds lightning strikes to protect your farm layout.',
        minLevel: 12,
        image: ALL_ITEMS[9975]?.image || '/images/items/tesla.png',
        costFunc: (amt) => `${10 * amt} Iron, ${5 * amt} Stone Pipes`,
        canCraft: (amt) => ironCount >= 10 * amt && stonePipeCount >= 5 * amt,
        onCraft: (amt) => handleCraftTesla(amt),
        highlight: craftingGoal?.recipeId === 'tesla_tower'
      },
      {
        id: 'yarn',
        name: 'Yarn',
        description: 'A throwable toy that drastically increases the cat\'s happiness.',
        minLevel: 2,
        image: ALL_ITEMS[9955]?.image || '/images/pets/yarn.png',
        costFunc: (amt) => `${2 * amt} Cotton, ${1 * amt} Rope`,
        canCraft: (amt) => cottonCount >= 2 * amt && ropeCount >= 1 * amt,
        onCraft: (amt) => handleCraftGeneric(9955, [[9971, 2], [9970, 1]], amt, 25),
        highlight: craftingGoal?.recipeId === 'yarn'
      },
      {
        id: 'egg_basket',
        name: 'Egg Basket',
        description: 'Used to safely collect and store eggs from your chickens.',
        minLevel: 5,
        image: ALL_ITEMS[9940]?.image || '/images/barn/basket.png',
        costFunc: (amt) => `${5 * amt} Sticks, ${5 * amt} Rope`,
        canCraft: (amt) => sticksCount >= 5 * amt && ropeCount >= 5 * amt,
        onCraft: (amt) => handleCraftGeneric(9940, [[9995, 5], [9970, 5]], amt, 25),
        highlight: craftingGoal?.recipeId === 'egg_basket'
      }
    ],
    buildings: [
      {
        id: 'coop',
        name: 'Chicken Coop',
        description: 'Houses up to 10 chickens that lay eggs daily.',
        minLevel: 1,
        image: '/images/barn/coop.png',
        costFunc: (amt) => `50 Wood, 30 Stone\n10 Iron, 500 Honey`,
        canCraft: (amt) => !hasCoop && woodCount >= 50 && stoneCount >= 30 && ironCount >= 10 && parseInt(localStorage.getItem('sandbox_honey')||'0', 10) >= 500,
        onCraft: (amt) => {
           if (hasCoop) return;
           const honey = parseInt(localStorage.getItem('sandbox_honey')||'0', 10);
           if (woodCount < 50 || stoneCount < 30 || ironCount < 10 || honey < 500) return;
           
           localStorage.setItem('sandbox_honey', (honey - 500).toString());
           window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

           const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
           sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 50);
           sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 30);
           sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10);
           localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
           if (refetch) refetch();

           const fd = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{}');
           if (!fd.coop) fd.coop = { status: 'unbuilt', buildStartTime: 0, chickens: [] };
           fd.coop.status = 'building';
           fd.coop.buildStartTime = Date.now();
           localStorage.setItem('sandbox_animal_farm', JSON.stringify(fd));
           
           addCraftingXp(500);
           show("Started building Chicken Coop! Check Animal Farm.", "success");
        },
        highlight: craftingGoal?.recipeId === 'coop',
        used: hasCoop,
        hideAmount: true
      },
      {
        id: 'sheepcage',
        name: 'Sheep Cage',
        description: 'Houses up to 5 sheep that produce wool daily.',
        minLevel: 1,
        image: '/images/barn/sheepcage.png',
        costFunc: (amt) => `50 Wood, 30 Stone\n10 Iron, 500 Honey`,
        canCraft: (amt) => !hasSheepcage && woodCount >= 50 && stoneCount >= 30 && ironCount >= 10 && parseInt(localStorage.getItem('sandbox_honey')||'0', 10) >= 500,
        onCraft: (amt) => {
           if (hasSheepcage) return;
           const honey = parseInt(localStorage.getItem('sandbox_honey')||'0', 10);
           if (woodCount < 50 || stoneCount < 30 || ironCount < 10 || honey < 500) return;
           
           localStorage.setItem('sandbox_honey', (honey - 500).toString());
           window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

           const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
           sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 50);
           sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 30);
           sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10);
           localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
           if (refetch) refetch();

           const fd = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{}');
           if (!fd.sheepcage) fd.sheepcage = { status: 'unbuilt', buildStartTime: 0, sheep: [] };
           fd.sheepcage.status = 'building';
           fd.sheepcage.buildStartTime = Date.now();
           localStorage.setItem('sandbox_animal_farm', JSON.stringify(fd));
           
           addCraftingXp(500);
           show("Started building Sheep Cage! Check Animal Farm.", "success");
        },
        highlight: craftingGoal?.recipeId === 'sheepcage',
        used: hasSheepcage,
        hideAmount: true
      },
      {
        id: 'cowbarn',
        name: 'Cow Barn',
        description: 'Houses up to 3 cows that produce milk daily.',
        minLevel: 1,
        image: '/images/barn/cowbarn.png',
        costFunc: (amt) => `50 Wood, 30 Stone\n10 Iron, 500 Honey`,
        canCraft: (amt) => !hasCowbarn && woodCount >= 50 && stoneCount >= 30 && ironCount >= 10 && parseInt(localStorage.getItem('sandbox_honey')||'0', 10) >= 500,
        onCraft: (amt) => {
           if (hasCowbarn) return;
           const honey = parseInt(localStorage.getItem('sandbox_honey')||'0', 10);
           if (woodCount < 50 || stoneCount < 30 || ironCount < 10 || honey < 500) return;
           
           localStorage.setItem('sandbox_honey', (honey - 500).toString());
           window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

           const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
           sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 50);
           sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 30);
           sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 10);
           localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
           if (refetch) refetch();

           const fd = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{}');
           if (!fd.cowbarn) fd.cowbarn = { status: 'unbuilt', buildStartTime: 0, cows: [] };
           fd.cowbarn.status = 'building';
           fd.cowbarn.buildStartTime = Date.now();
           localStorage.setItem('sandbox_animal_farm', JSON.stringify(fd));
           
           addCraftingXp(500);
           show("Started building Cow Barn! Check Animal Farm.", "success");
        },
        highlight: craftingGoal?.recipeId === 'cowbarn',
        used: hasCowbarn,
        hideAmount: true
      }
    ]
  };

  return (
    <>
    {tutorialStep === 26 && (
      <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 100002 }}>
        <div style={{ position: 'relative', width: '490px' }}>
          <img src="/images/tutorial/tutmessagep1.png" alt="Tutorial" style={{ width: '490px', objectFit: 'contain' }} />
        </div>
      </div>
    )}
    <BaseDialog onClose={onClose} title="CRAFTING" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', width: '490px', maxWidth: '90vw' }}>
        <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', textAlign: 'center' }}>Crafting Workbench</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>
          <h2 style={{ color: '#00ff41', margin: '0' }}>Crafting Workbench</h2>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '8px', border: '1px solid #ffea00', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#ccc', fontSize: '12px' }}>Crafting Level: </span>
              <span style={{ color: '#ffea00', fontWeight: 'bold', fontSize: '16px' }}>{craftingLevel}</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${craftingProgress}%`, height: '100%', backgroundColor: '#ffea00', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
        
        {craftingGoal && craftingGoal.message && (
          <div style={{ backgroundColor: 'rgba(255, 234, 0, 0.2)', border: '1px solid #ffea00', padding: '10px', borderRadius: '8px', color: '#ffea00', textAlign: 'center', marginBottom: '10px', fontSize: '14px' }}>
            {craftingGoal.message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('tools')} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeTab === 'tools' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
              color: activeTab === 'tools' ? '#00ff41' : '#ccc', 
              border: `2px solid ${activeTab === 'tools' ? '#00ff41' : '#5a402a'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              fontSize: '16px',
              position: 'relative'
            }}
          >
            Tools
            {(highlightAxe || highlightPickaxe) && activeTab !== 'tools' && (
              <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 1s infinite' }}>
                <span style={{ fontSize: '24px', color: '#00ff41', filter: 'drop-shadow(0px 2px 2px black)' }}>⬇️</span>
              </div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('items')} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: activeTab === 'items' ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
              color: activeTab === 'items' ? '#00bfff' : '#ccc', 
              border: `2px solid ${activeTab === 'items' ? '#00bfff' : '#5a402a'}`, 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              fontSize: '16px',
              position: 'relative'
            }}
          >
            Items
            {highlightSticks && activeTab !== 'items' && (
              <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 1s infinite' }}>
                <span style={{ fontSize: '24px', color: '#00ff41', filter: 'drop-shadow(0px 2px 2px black)' }}>⬇️</span>
              </div>
            )}
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              onClick={() => setActiveTab('buildings')}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'buildings' ? 'rgba(255, 165, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                color: activeTab === 'buildings' ? '#ffa500' : tutorialStep < 36 ? '#555' : '#ccc',
                border: `2px solid ${activeTab === 'buildings' ? '#ffa500' : '#5a402a'}`,
                borderRadius: '8px',
                cursor: tutorialStep < 36 ? 'not-allowed' : 'pointer',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                fontSize: '16px',
                pointerEvents: tutorialStep < 36 ? 'none' : 'auto',
                opacity: tutorialStep < 36 ? 0.5 : 1
              }}
            >
              Buildings
            </button>
            {tutorialStep < 36 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', pointerEvents: 'all', cursor: 'not-allowed' }}>
                <span style={{ fontSize: '18px', filter: 'drop-shadow(0px 1px 2px black)' }}>🔒</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '15px', 
          overflowY: 'auto', 
          maxHeight: '400px',
          padding: '5px',
          paddingRight: '10px'
        }}>
          {recipes[activeTab].map(recipe => {
            const amt = craftAmounts[recipe.id] || 1;
            const isLocked = craftingLevel < recipe.minLevel;
            
            if (isLocked) return null;
            
            return (
              <div key={recipe.id} style={{
                backgroundColor: recipe.highlight ? 'rgba(0,255,65,0.2)' : 'rgba(0,0,0,0.5)',
                border: `2px solid ${recipe.highlight ? '#00ff41' : '#5a402a'}`,
                borderRadius: '8px',
                padding: '15px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px',
                position: 'relative',
                opacity: recipe.used ? 0.7 : 1
              }}>
                <div title={recipe.description} onClick={() => show(recipe.description, "info")} style={{ position: 'absolute', top: '5px', right: '5px', width: '20px', height: '20px', backgroundColor: 'rgba(0,191,255,0.2)', border: '1px solid #00bfff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00bfff', fontSize: '12px', fontWeight: 'bold', cursor: 'help' }}>i</div>
                {recipe.used && (
                   <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', backgroundColor: 'rgba(255, 68, 68, 0.9)', color: 'white', padding: '5px 15px', borderRadius: '4px', fontWeight: 'bold', fontSize: '24px', letterSpacing: '2px', border: '2px solid white', zIndex: 10, pointerEvents: 'none' }}>USED</div>
                )}
                {recipe.tutorialLocked && (
                   <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'all' }}>
                     <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>CRAFTED</span>
                   </div>
                )}
                {recipe.highlight && (
                   <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', animation: 'bounce 1s infinite' }}>
                     <span style={{ fontSize: '30px', color: '#00ff41', filter: 'drop-shadow(0px 2px 2px black)' }}>⬇️</span>
                   </div>
                )}
                <div style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={recipe.image} alt={recipe.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: recipe.imageFilter || 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
                </div>
                <div style={{ fontSize: '14px', color: '#ffea00', fontWeight: 'bold', minHeight: '34px', display: 'flex', alignItems: 'center' }}>{recipe.name}</div>
                
                <div style={{ fontSize: '11px', color: '#aaa', minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                  {recipe.costFunc(amt)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: 'auto', opacity: recipe.used ? 0.5 : 1, pointerEvents: recipe.used ? 'none' : 'auto' }}>
                  {!recipe.hideAmount && (
                    <input 
                      type="number" 
                      min="1" 
                      max="99" 
                      value={amt} 
                      onChange={(e) => setCraftAmounts({...craftAmounts, [recipe.id]: Math.max(1, parseInt(e.target.value) || 1)})}
                      style={{ width: '40px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #5a402a', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace' }}
                    />
                  )}
                  <BaseButton small label={recipe.used ? "Built" : "Craft"} onClick={() => recipe.onCraft(amt)} disabled={!recipe.canCraft(amt) || recipe.used || recipe.tutorialLocked} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', border: '1px solid #5a402a', fontSize: '12px', color: '#ccc', flexWrap: 'wrap', gap: '10px' }}>
          <span>Wood: {woodCount}</span>
          <span>Sp. Wood: {specialWoodCount}</span>
          <span>Stone: {stoneCount}</span>
          <span>Sticks: {sticksCount}</span>
          <span>Leaves: {leavesCount}</span>
          <span>Rope: {ropeCount}</span>
          <span>Iron: {ironCount}</span>
          <span>Pipes: {stonePipeCount}</span>
          <span>Planks: {plankCount}</span>
        </div>
      </div>
    </BaseDialog>
    </>
  );
};

const ProtectorSpot = ({ spotId, pos, offsetX, offsetY, placingType, placedItem, onPlace, onRemove }) => {
  const [frame, setFrame] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showDebug, setShowDebug] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');

  useEffect(() => {
    const handler = (e) => setShowDebug(e.detail);
    window.addEventListener('toggleDebugLabels', handler);
    return () => window.removeEventListener('toggleDebugLabels', handler);
  }, []);
  
  useEffect(() => {
    if (placedItem?.type !== 'scarecrow') return;
    // Animate base scarecrows
    if (placedItem?.type !== 'tier1' && placedItem?.type !== 'tier2' && placedItem?.type !== 'tier3' && placedItem?.type !== 'tier4' && placedItem?.type !== 'ladybug_scarecrow') return;
    
    const timer = setInterval(() => {
      setFrame(f => (f % 5) + 1);
    }, 200); // 5 frames, 200ms each
    return () => clearInterval(timer);
  }, [placedItem?.type]);

  useEffect(() => {
    if (!placedItem || !placedItem.expiryTime) return;
    

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof placedItem.expiryTime === 'number' ? placedItem.expiryTime : now - 1; 
      const remaining = exp - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        if (placedItem.onExpire) placedItem.onExpire(spotId, placedItem.type);
      } else {
        setTimeLeft(remaining);
      }
    };
    
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [placedItem, spotId]);

  const isPlacing = !!placingType;
  const isPlaced = !!placedItem;

  if (!isPlacing && !isPlaced && !showDebug) return null;

  const leftVal = pos.left !== undefined ? (typeof pos.left === 'number' ? `${pos.left + offsetX}px` : `calc(${pos.left} + ${offsetX}px)`) : '0px';
  const topVal = pos.top !== undefined ? (typeof pos.top === 'number' ? `${pos.top + offsetY}px` : `calc(${pos.top} + ${offsetY}px)`) : '0px';

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    if (m > 0) return `${m}:${pad(s)}`;
    return `${s}s`;
  };

  let borderColor = 'white';
  let bgColor = 'rgba(255,255,255,0.4)';
  let textColor = '#00ff41';
  let imageSrc = null;
  let imageStyle = { width: '120%', height: '120%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.8))' };
  let topOffset = '-40px';

  if (isPlaced) {
    if (placedItem.type.includes('tier') || placedItem.type === 'ladybug_scarecrow') {
      textColor = '#00ff41';
      imageSrc = `/images/scarecrow/scarecrow${frame}.png`;
      imageStyle.width = '200%';
      imageStyle.height = '200%';
      topOffset = '-25px';
      
      if (placedItem.type === 'tier1') {
        imageSrc = `/images/scarecrow/scarecrow${frame}.png`;
      } else if (placedItem.type === 'tier2') {
        imageSrc = `/images/scarecrow/tier2.png`;
      } else if (placedItem.type === 'tier3') {
        imageSrc = `/images/scarecrow/tier3.png`;
      } else if (placedItem.type === 'tier4') {
        imageSrc = `/images/scarecrow/tier4.png`;
      } else if (placedItem.type === 'ladybug_scarecrow') {
        imageSrc = `/images/scarecrow/ladybug_scarecrow.png`;
      }
    } else if (placedItem.type === 'tesla') {
      textColor = '#00ffff';
      imageSrc = '/images/items/tesla.png';
      imageStyle.width = '150%';
      imageStyle.height = '150%';
      topOffset = '-25px';
    } else if (placedItem.type === 'ladybug') {
      textColor = '#ff4444';
      imageSrc = '/images/items/ladybug.png';
      imageStyle.width = '100%';
      imageStyle.height = '100%';
      topOffset = '-25px';
    } else if (placedItem.type === 'sprinkler') {
      textColor = '#00bfff';
      imageSrc = '/images/items/watersprinkler.png';
    } else if (placedItem.type === 'umbrella') {
      textColor = '#ff00ff';
      imageSrc = '/images/items/umbrella.png';
    }
  } else if (isPlacing) {
    if (placingType.includes('tier') || placingType === 'ladybug_scarecrow') {
      borderColor = 'white'; bgColor = 'rgba(255,255,255,0.4)';
    } else if (placingType === 'tesla') {
      borderColor = '#00ffff'; bgColor = 'rgba(0,255,255,0.3)';
    } else if (placingType === 'ladybug') {
      borderColor = '#ff4444'; bgColor = 'rgba(255,68,68,0.3)';
    } else if (placingType === 'sprinkler') {
      borderColor = '#00bfff'; bgColor = 'rgba(0,191,255,0.3)';
    } else if (placingType === 'umbrella') {
      borderColor = '#ff00ff'; bgColor = 'rgba(255,0,255,0.3)';
    }
  }

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isPlacing && !isPlaced) {
          onPlace(spotId, placingType);
        } else if (isPlaced && onRemove) {
          onRemove(spotId, placedItem.type);
        }
      }}
      style={{
        position: 'absolute',
        left: leftVal,
        top: topVal,
        width: '50px',
        height: '50px',
        zIndex: 9999, 
        cursor: 'pointer',
        border: isPlacing && !isPlaced ? `3px dashed ${borderColor}` : 'none',
        backgroundColor: isPlacing && !isPlaced ? bgColor : 'transparent',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: isPlacing || isPlaced ? 'auto' : 'none',
      }}
    >
      {showDebug && (isPlacing || isPlaced) && (
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '0px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: borderColor,
          border: `1px solid ${borderColor}`,
          padding: '2px 6px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10001,
          pointerEvents: 'none'
        }}>
          Spot: {spotId}
        </div>
      )}
      {isPlaced && (
        <>
          <div style={{
            position: 'absolute',
            top: topOffset,
            color: textColor,
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            whiteSpace: 'nowrap',
            zIndex: 10000
          }}>
            {formatTime(timeLeft)}
          </div>
          {imageSrc && (
            <img 
              src={imageSrc} 
              alt={placedItem.type} 
              onError={(e) => { 
                if (placedItem.type === 'scarecrow') e.target.src = `/images/scarecrow/scarecrow${frame}.jpg`; 
                if (placedItem.type === 'tier1') e.target.src = `/images/scarecrow/scarecrow${frame}.jpg`; 
                else e.target.style.display = 'none'; 
              }}
              style={imageStyle}
            />
          )}
        </>
      )}
    </div>
  );
};

export const RegionalQuestBoard = ({ onClose, title, questType, tutorialStep, refetch, completedQuests, setCompletedQuests }) => {
  const { show } = useNotification();
  const [animState, setAnimState] = useState(0); 
  const [activeQuest, setActiveQuest] = useState(null);

  const allQuests = getQuestData();
  const availableQuests = allQuests.filter(q => q.type === questType && q.unlockCondition(tutorialStep, completedQuests));
  const activeQuestsList = availableQuests.filter(q => !completedQuests.includes(q.id));

  const checkRequirements = (reqs) => {
    if (!reqs || reqs.length === 0) return true;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of reqs) {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           if (val < req.count) return false;
         } else {
           if (!val) return false;
         }
         continue;
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        if (gold < req.count) return false;
        continue;
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      if (count < req.count) return false;
    }
    return true;
  };

  const getRequirementCounts = (reqs) => {
    if (!reqs || reqs.length === 0) return [];
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    return reqs.map(req => {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           return { ...req, current: val };
         }
         return { ...req, current: val ? 1 : 0, count: req.count || 1 };
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        return { ...req, current: gold };
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      return { ...req, current: count };
    });
  };

  const handleCompleteQuest = () => {
    const quest = activeQuest;
    if (!quest) return;

    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of quest.reqs) {
      if (req.fn) continue;
      if (req.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = Math.max(0, currentGold - req.count);
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
        continue;
      }
      let remaining = req.count;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      
      for (const id of ids) {
        if (remaining <= 0) break;
        if (sandboxProduce[id] !== undefined) {
          if (Array.isArray(sandboxProduce[id])) {
            while (remaining > 0 && sandboxProduce[id].length > 0) {
              sandboxProduce[id].pop();
              remaining--;
            }
          } else {
            const deduct = Math.min(Number(sandboxProduce[id]) || 0, remaining);
            sandboxProduce[id] = (Number(sandboxProduce[id]) || 0) - deduct;
            remaining -= deduct;
          }
        }
        if (remaining > 0 && sandboxLoot[id]) {
          const deduct = Math.min(Number(sandboxLoot[id]), remaining);
          sandboxLoot[id] -= deduct;
          remaining -= deduct;
        }
      }
    }

    for (const reward of quest.rewards) {
      if (reward.id === 'honey') {
        const currentHoney = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
        const newHoney = currentHoney + reward.count;
        localStorage.setItem('sandbox_honey', newHoney.toString());
        window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));
      } else if (reward.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = currentGold + reward.count;
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
      } else {
        sandboxLoot[reward.id] = (sandboxLoot[reward.id] || 0) + reward.count;
      }
    }
    
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));

    const nextCompleted = [...completedQuests, quest.id];
    setCompletedQuests(nextCompleted);
    localStorage.setItem('sandbox_completed_quests', JSON.stringify(nextCompleted));

    let xpSkill = "";
    let xpKey = "";
    if (quest.type === 'farming' || quest.type === 'main') {
        xpSkill = 'Farming';
        xpKey = 'sandbox_farming_xp';
    } else if (quest.type === 'fishing') {
        xpSkill = 'Fishing';
        xpKey = 'sandbox_fishing_xp';
    }
    
    if (xpSkill) {
        const currentXp = parseInt(localStorage.getItem(xpKey) || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentXp || 0) / 150)) + 1;
        const newXp = currentXp + 500;
        localStorage.setItem(xpKey, newXp.toString());
        window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: xpKey, value: newXp.toString() } }));
        const newLevel = Math.floor(Math.sqrt((newXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
            window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: xpSkill, level: newLevel } }));
        }
        setTimeout(() => { window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+500 ${xpSkill} XP!`, type: "info" } })); }, 1000);
    }

    if (refetch) refetch();
    setAnimState(2); 
  };

  if (animState > 0 && activeQuest) {
    const isReadyToTurnIn = checkRequirements(activeQuest.reqs);
    const reqCounts = getRequirementCounts(activeQuest.reqs);

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {animState === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', animation: 'popIn 0.4s ease-out' }}>
            <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <h2 style={{ color: '#ffea00', margin: 0, fontSize: '28px', fontFamily: 'GROBOLD, Cartoonist, monospace', textShadow: '2px 2px 0 #000' }}>Rewards Claimed!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
              {activeQuest.rewards.map((rew, idx) => (
                <div key={idx} style={{ width: '220px', height: '310px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.7)', flexShrink: 0 }}>
                  {rew.id === 'honey' ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img src="/images/cardfront/goldcard/goldcard.png" alt="Gold" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'GROBOLD, Cartoonist, monospace', fontWeight: 'bold', fontSize: '20px', color: '#3b2000', whiteSpace: 'nowrap', textShadow: '1px 1px 0 rgba(255,255,255,0.4)' }}>{rew.count} HONEY</div>
                    </div>
                  ) : rew.id === 'gems' ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img src="/images/cardfront/gemcard/gemcard.png" alt="Gems" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'GROBOLD, Cartoonist, monospace', fontWeight: 'bold', fontSize: '20px', color: '#3b2000', whiteSpace: 'nowrap', textShadow: '1px 1px 0 rgba(255,255,255,0.4)' }}>{rew.count} GEMS</div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      {ALL_ITEMS[rew.id]?.pos >= 0 ? (
                        <div style={{ width: '80px', height: '80px', backgroundImage: `url(/images/crops/seeds.webp)`, backgroundSize: `${(159 * 80 / 207.7647).toFixed(1)}px auto`, backgroundPositionX: 'center', backgroundPositionY: `-${(ALL_ITEMS[rew.id].pos * 80).toFixed(1)}px`, backgroundRepeat: 'no-repeat' }} />
                      ) : (
                        <img src={ALL_ITEMS[rew.id]?.image || rew.image} alt={rew.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; }} />
                      )}
                      <span style={{ fontFamily: 'Cartoonist', fontSize: '18px', color: '#fff', textShadow: '1px 1px 0 #000', textAlign: 'center' }}>{rew.count} {rew.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <BaseButton label="Done" onClick={() => {
                if (activeQuest?.id === 'q1_pabee_intro') {
                  window.dispatchEvent(new CustomEvent('pabeePackOpen'));
                }
                setAnimState(0);
              }} />
            </div>
          </div>
        )}
        {animState === 1 && (
          <div style={{ backgroundColor: '#fff8dc', padding: '40px', borderRadius: '4px', maxWidth: '500px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', color: '#333', fontFamily: 'serif', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <h2 style={{ margin: '0 0 20px 0', borderBottom: '2px dashed #8c6b4a', paddingBottom: '10px', fontFamily: 'monospace', color: '#5a402a' }}>{activeQuest.subject}</h2>
            <div style={{ overflowY: 'auto', flex: 1, lineHeight: '1.8', fontSize: '18px', paddingRight: '10px', marginBottom: '20px' }}>
              {activeQuest.body.map((para, i) => (
                <p key={i} style={{ color: '#5a402a' }}>{para}</p>
              ))}
            </div>

            {activeQuest.reqs.length > 0 && (
              <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.1)', border: '1px solid #8c6b4a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontFamily: 'monospace' }}>Required:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                  {reqCounts.map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
                      {req.image && <img src={req.image} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt={req.name} onError={(e) => { e.target.onerror = null; e.target.src = '/images/items/seeds.png'; }} />}
                      <span style={{ color: req.current >= req.count ? '#006400' : '#8b0000', fontWeight: 'bold' }}>
                        {req.name}: {req.current}/{req.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeQuest.pfpImage && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '14px', backgroundColor: 'rgba(90,64,42,0.1)', border: '2px solid #c8821a', borderRadius: '10px' }}>
                <img
                  src={activeQuest.pfpImage}
                  alt={activeQuest.pfpLabel}
                  style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '50%', border: '3px solid #c8821a', boxShadow: '0 0 14px rgba(200,130,26,0.5)', animation: 'mapFloat 2.5s ease-in-out infinite' }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#5a402a', fontWeight: 'bold' }}>🏆 New Profile Picture Unlocked: {activeQuest.pfpLabel}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8c6b4a', fontStyle: 'italic' }}>{activeQuest.pfpHow}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <BaseButton label={isReadyToTurnIn ? "Complete" : "Incomplete"} disabled={!isReadyToTurnIn} onClick={handleCompleteQuest} />
              <BaseButton label="Back" onClick={() => setAnimState(0)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <BaseDialog onClose={onClose} title={title} header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', minWidth: '400px', maxHeight: '60vh', overflowY: 'auto' }}>
        <h2 style={{ color: '#ffea00', margin: '0 0 20px 0', textAlign: 'center' }}>{title}</h2>
        {activeQuestsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeQuestsList.map(quest => (
              <div 
                key={quest.id}
                onClick={() => { setActiveQuest(quest); setAnimState(1); }} 
                style={{ 
                  backgroundColor: 'rgba(90, 64, 42, 0.4)', 
                  border: '2px solid #a67c52', 
                  padding: '15px', 
                  borderRadius: '4px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  boxShadow: '2px 2px 5px rgba(0,0,0,0.5)'
                }} 
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.backgroundColor = 'rgba(90, 64, 42, 0.6)'; }} 
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(90, 64, 42, 0.4)'; }}
              >
                <div style={{ fontSize: '30px' }}>📝</div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffea00', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{quest.subject}</span>
                  <span style={{ fontSize: '12px', color: '#ccc', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{quest.sender}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', padding: '20px' }}>
            No missions available right now.
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

const DOCK_BUILD_MS = 2 * 60 * 60 * 1000; // 2 hours
const DOCK_SKIP_GEMS = 150;

export const MailboxDialog = ({ onClose, tutorialStep, refetch, onTutorialAdvance, completedQuests, setCompletedQuests, readQuests, setReadQuests }) => {
  const [animState, setAnimState] = useState(0); // 0: list, 1: opening, 2: reading, 3: claiming
  const [activeQuest, setActiveQuest] = useState(null);
  const [activeQuestWasRead, setActiveQuestWasRead] = useState(false);
  const [discardedQuests, setDiscardedQuests] = useState(() => JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]'));
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [dockTimeLeft, setDockTimeLeft] = useState(null);
  const [pendingLevelUp, setPendingLevelUp] = useState(null);

  // Mark the body whenever a letter is open so other components (e.g. PlayerPullNotification)
  // can suppress popups that would distract the user mid-read. Also fires an event so any
  // currently-visible notification dismisses immediately the moment a letter opens.
  useEffect(() => {
    if (animState > 0) {
      document.body.setAttribute('data-letter-open', 'true');
      window.dispatchEvent(new CustomEvent('letterOpened'));
    } else {
      document.body.removeAttribute('data-letter-open');
    }
    return () => document.body.removeAttribute('data-letter-open');
  }, [animState]);

  // Mailbox-level flag: set the whole time the mailbox dialog is mounted, so
  // PlayerPullNotification suppresses popups even before a specific letter is opened.
  useEffect(() => {
    document.body.setAttribute('data-mailbox-open', 'true');
    window.dispatchEvent(new CustomEvent('letterOpened'));
    return () => document.body.removeAttribute('data-mailbox-open');
  }, []);

  useEffect(() => {
    // Dock-build countdown. Only ticks while the dock is actually mid-build —
    // returns immediately (no interval) when not building or already repaired.
    const tick = () => {
      const start = parseInt(localStorage.getItem('sandbox_dock_build_start') || '0', 10);
      if (!start) { setDockTimeLeft(null); return false; }
      if (localStorage.getItem('sandbox_dock_repaired') === 'true') { setDockTimeLeft(0); return false; }
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, DOCK_BUILD_MS - elapsed);
      setDockTimeLeft(remaining);
      if (remaining === 0) {
        localStorage.setItem('sandbox_dock_repaired', 'true');
        localStorage.setItem('sandbox_dock_unlocked', 'true');
        window.dispatchEvent(new CustomEvent('dockRepaired'));
        return false;
      }
      return true;
    };
    if (!tick()) return; // not building / done — no interval
    const id = setInterval(() => {
      if (!tick()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = () => {
      const discarded = JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]');
      if (!discarded.includes('q1_end_papabee')) {
        const next = [...discarded, 'q1_end_papabee'];
        setDiscardedQuests(next);
        localStorage.setItem('sandbox_discarded_quests', JSON.stringify(next));
      }
    };
    window.addEventListener('plotsUnlocked', handler);
    return () => window.removeEventListener('plotsUnlocked', handler);
  }, []);

  const handleSkipDockBuild = () => {
    const gems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
    if (gems < DOCK_SKIP_GEMS) { window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Need ${DOCK_SKIP_GEMS} gems to skip!`, type: 'error' } })); return; }
    localStorage.setItem('sandbox_gems', String(gems - DOCK_SKIP_GEMS));
    window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
    trackGemSpend(DOCK_SKIP_GEMS);
    localStorage.setItem('sandbox_dock_repaired', 'true');
    localStorage.setItem('sandbox_dock_unlocked', 'true');
    window.dispatchEvent(new CustomEvent('dockRepaired'));
    setDockTimeLeft(0);
  };

  const confirmDiscard = () => {
    const nextDiscarded = [...discardedQuests, activeQuest.id];
    setDiscardedQuests(nextDiscarded);
    localStorage.setItem('sandbox_discarded_quests', JSON.stringify(nextDiscarded));
    setShowDiscardConfirm(false);
    setAnimState(0);
  };

  const allQuests = getQuestData();
  const availableQuests = allQuests.filter(q => (!q.type || q.type === 'main') && q.unlockCondition(tutorialStep, completedQuests));
  const activeQuestsList = availableQuests.filter(q => !discardedQuests.includes(q.id));

  const checkRequirements = (reqs) => {
    if (!reqs || reqs.length === 0) return true;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    for (const req of reqs) {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           if (val < req.count) return false;
         } else {
           if (!val) return false;
         }
         continue;
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        if (gold < req.count) return false;
        continue;
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      if (count < req.count) return false;
    }
    return true;
  };

  const getRequirementCounts = (reqs) => {
    if (!reqs || reqs.length === 0) return [];
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    
    return reqs.map(req => {
      if (req.fn) {
         const val = req.fn(sandboxLoot, sandboxProduce);
         if (typeof val === 'number') {
           return { ...req, current: val };
         }
         return { ...req, current: val ? 1 : 0, count: req.count || 1 };
      }
      if (req.id === 'gold') {
        const gold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        return { ...req, current: gold };
      }
      let count = 0;
      const ids = Array.isArray(req.id) ? req.id : [req.id];
      for (const id of ids) {
        if (Array.isArray(sandboxProduce[id])) count += sandboxProduce[id].length;
        else count += (Number(sandboxProduce[id]) || 0) + (Number(sandboxLoot[id]) || 0);
      }
      return { ...req, current: count };
    });
  };

  const handleCompleteQuest = () => {
    const quest = activeQuest;
    if (!quest) return;

    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    // Only deduct gold requirements — crops/items are kept by the player
    for (const req of quest.reqs) {
      if (req.fn) continue;
      if (req.id === 'gold') {
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = Math.max(0, currentGold - req.count);
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
      }
    }

    // Give rewards
    for (const reward of quest.rewards) {
      if (reward.id === 'honey' || reward.id === 'gold') {
        // Treat legacy "honey" rewards as gold — single source of truth lives
        // in sandbox_gold, which the ProfileBar counter reads.
        const currentGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
        const newGold = currentGold + reward.count;
        localStorage.setItem('sandbox_gold', newGold.toString());
        window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold.toString() }));
      } else if (reward.id === 'gems') {
        const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
        const newGems = currentGems + reward.count;
        localStorage.setItem('sandbox_gems', newGems.toString());
        window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
      } else if (reward.id === 'pico_pack') {
        // Pack animation handles seed delivery via charPackOpen event
      } else {
        sandboxLoot[reward.id] = (sandboxLoot[reward.id] || 0) + reward.count;
      }
    }

    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));

    const nextCompleted = [...completedQuests, quest.id];
    setCompletedQuests(nextCompleted);
    localStorage.setItem('sandbox_completed_quests', JSON.stringify(nextCompleted));

    // Auto-delete letter after completion (except q1_end_papabee — stays until first plot unlock)
    if (quest.id !== 'q1_end_papabee') {
      const nextDiscarded = [...discardedQuests, quest.id];
      setDiscardedQuests(nextDiscarded);
      localStorage.setItem('sandbox_discarded_quests', JSON.stringify(nextDiscarded));
    }

    if (quest.id === "q2_rebuild_tavern") {
      localStorage.setItem('quest_q2_rebuild_tavern_completed', 'true');
      window.dispatchEvent(new CustomEvent('tavernUnlocked'));
    }
    if (quest.id === "q2_unlock_dock") {
      localStorage.setItem('sandbox_dock_build_start', Date.now().toString());
    }

    let xpSkill = "";
    let xpKey = "";
    if (quest.type === 'farming' || quest.type === 'main') {
        xpSkill = 'Farming';
        xpKey = 'sandbox_farming_xp';
    } else if (quest.type === 'fishing') {
        xpSkill = 'Fishing';
        xpKey = 'sandbox_fishing_xp';
    }

    const hasPicoPack = quest.rewards.some(r => r.id === 'pico_pack');
    let didLevelUp = false;
    let levelUpDetail = null;

    if (xpSkill && quest.id !== 'q1_pabee_intro' && quest.reqs.length > 0) {
        const currentXp = parseInt(localStorage.getItem(xpKey) || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentXp || 0) / 150)) + 1;
        const newXp = currentXp + 500;
        localStorage.setItem(xpKey, newXp.toString());
        window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: xpKey, value: newXp.toString() } }));
        const newLevel = Math.floor(Math.sqrt((newXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
            didLevelUp = true;
            levelUpDetail = { skill: xpSkill, level: newLevel };
        }
        setTimeout(() => { window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `+500 ${xpSkill} XP!`, type: "info" } })); }, 1000);
    }

    if (refetch) refetch();

    if (hasPicoPack) {
      const packReward = quest.rewards.find(r => r.id === 'pico_pack');
      window.dispatchEvent(new CustomEvent('closeMailbox'));
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('charPackOpen', { detail: { seeds: packReward.seeds, onClosed: didLevelUp ? levelUpDetail : null } }));
      }, 100);
    } else {
      if (didLevelUp) setPendingLevelUp(levelUpDetail);
      setAnimState(3); // Show rewards
    }
  };

  const handleOpenLetter = (quest) => {
    const alreadyRead = readQuests.includes(quest.id);
    setActiveQuestWasRead(alreadyRead);
    setActiveQuest(quest);
    if (!alreadyRead) {
      const nextRead = [...readQuests, quest.id];
      setReadQuests(nextRead);
      localStorage.setItem('sandbox_read_quests', JSON.stringify(nextRead));
      // Fires for any UI that needs to react to read-state changes (e.g. GameMenu showing
      // the market icon once q_mayor_market_intro has been read).
      window.dispatchEvent(new CustomEvent('questStateChanged'));
    }
    setAnimState(1);
    setTimeout(() => setAnimState(2), 2000);
  };

  if (animState > 0 && activeQuest) {
    const isReadyToTurnIn = checkRequirements(activeQuest.reqs);
    const reqCounts = getRequirementCounts(activeQuest.reqs);

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {animState === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', animation: 'popIn 0.4s ease-out' }}>
            <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <h2 style={{ color: '#ffea00', margin: 0, fontSize: '28px', fontFamily: 'GROBOLD, Cartoonist, monospace', textShadow: '2px 2px 0 #000' }}>Rewards Claimed!</h2>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '16px' }}>
              {activeQuest.rewards.map((rew, idx) => (
                <div key={idx} style={{ width: '220px', height: '310px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.7)', flexShrink: 0 }}>
                  {rew.id === 'honey' ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img src="/images/cardfront/goldcard/goldcard.png" alt="Gold" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'GROBOLD, Cartoonist, monospace', fontWeight: 'bold', fontSize: '20px', color: '#3b2000', whiteSpace: 'nowrap', textShadow: '1px 1px 0 rgba(255,255,255,0.4)' }}>{rew.count} HONEY</div>
                    </div>
                  ) : rew.id === 'gems' ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img src="/images/cardfront/gemcard/gemcard.png" alt="Gems" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'GROBOLD, Cartoonist, monospace', fontWeight: 'bold', fontSize: '20px', color: '#3b2000', whiteSpace: 'nowrap', textShadow: '1px 1px 0 rgba(255,255,255,0.4)' }}>{rew.count} GEMS</div>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      {ALL_ITEMS[rew.id]?.pos >= 0 ? (
                        <div style={{ width: '80px', height: '80px', backgroundImage: `url(/images/crops/seeds.webp)`, backgroundSize: `${(159 * 80 / 207.7647).toFixed(1)}px auto`, backgroundPositionX: 'center', backgroundPositionY: `-${(ALL_ITEMS[rew.id].pos * 80).toFixed(1)}px`, backgroundRepeat: 'no-repeat' }} />
                      ) : (
                        <img src={ALL_ITEMS[rew.id]?.image || rew.image} alt={rew.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; }} />
                      )}
                      <span style={{ fontFamily: 'Cartoonist', fontSize: '18px', color: '#fff', textShadow: '1px 1px 0 #000', textAlign: 'center' }}>{rew.count} {rew.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <BaseButton label="Done" onClick={() => {
                const packReward = activeQuest.rewards.find(r => r.id === 'pico_pack');
                if (activeQuest.id === 'q1_pabee_intro') {
                  window.dispatchEvent(new CustomEvent('closeMailbox'));
                  onClose();
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('pabeePackOpen'));
                  }, 100);
                } else if (packReward) {
                  window.dispatchEvent(new CustomEvent('closeMailbox'));
                  onClose();
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('charPackOpen', { detail: { seeds: packReward.seeds } }));
                  }, 100);
                } else {
                  if (pendingLevelUp) {
                    window.dispatchEvent(new CustomEvent('levelUp', { detail: pendingLevelUp }));
                    setPendingLevelUp(null);
                  }
                  setAnimState(0);
                }
              }} />
            </div>
          </div>
        )}
        {animState === 1 && (
          <div style={{ fontSize: '150px', animation: 'envelopeOpen 2s forwards' }}>
            <style>{`
              @keyframes envelopeOpen {
                0% { transform: scale(0.1) translateY(500px); opacity: 0; }
                40% { transform: scale(1.2) translateY(0); opacity: 1; }
                60% { transform: scale(1.2) translateY(0) rotate(5deg); opacity: 1; }
                80% { transform: scale(1.5) translateY(-20px) rotate(-5deg); opacity: 1; }
                100% { transform: scale(2.5) translateY(-50px); opacity: 0; filter: blur(10px); }
              }
            `}</style>
            ✉️
          </div>
        )}
        {animState === 2 && (() => {
          // Sender → custom letter background image. Each entry uses the
          // same parchment-style rendering the Queen letter pioneered. New
          // letters can be added by dropping a PNG and adding a row here.
          const SENDER_LETTER_IMAGES = {
            'Queen Beeatrice': '/images/mail/letter.png',
            'Beejamin':        '/images/tutorial/beejaminletter.png',
            'Mayor Prezibee':  '/images/tutorial/mayorbeeletter.png',
            'Sam':             '/images/tutorial/samletter.png',
          };
          const customLetterImage = SENDER_LETTER_IMAGES[activeQuest.sender];
          const isCustomLetter = !!customLetterImage;
          return (
          <div style={{
            position: 'relative',
            backgroundColor: isCustomLetter ? 'transparent' : '#f4e4bc',
            backgroundImage: isCustomLetter
              ? `url(${customLetterImage})`
              : 'repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.05) 31px, rgba(0,0,0,0.05) 32px)',
            backgroundSize: isCustomLetter ? '100% 100%' : undefined,
            backgroundRepeat: isCustomLetter ? 'no-repeat' : undefined,
            backgroundPositionY: isCustomLetter ? undefined : '8px',
            padding: isCustomLetter ? '110px 100px 130px 160px' : '40px',
            borderRadius: '8px',
            width: isCustomLetter ? '1100px' : '90%',
            height: isCustomLetter ? '733px' : undefined,
            maxWidth: isCustomLetter ? '95vw' : '600px',
            maxHeight: isCustomLetter ? '90vh' : '85vh',
            boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column',
            color: '#2c1e16',
            fontFamily: 'serif',
            boxShadow: isCustomLetter ? 'none' : '0 20px 50px rgba(0,0,0,0.8), inset 0 0 50px rgba(200,150,100,0.3)',
            animation: 'letterFadeIn 0.8s ease-out forwards',
          }}>
            <style>{`@keyframes letterFadeIn { 0% { transform: scale(0.8) translateY(100px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }`}</style>
            {isCustomLetter ? (
              <h1 style={{
                margin: '0 0 18px 0',
                fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                fontSize: '42px',
                lineHeight: 1.0,
                fontWeight: 'bold',
                color: '#3b1f0a',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                maxWidth: '60%',
                textShadow: '2px 2px 0 rgba(0,0,0,0.06)',
              }}>{activeQuest.sender}</h1>
            ) : (
              <h2 style={{ margin: '0 0 20px 0', borderBottom: '2px solid #8c6b4a', paddingBottom: '10px', fontFamily: 'monospace', color: '#5a402a' }}>From: {activeQuest.sender}</h2>
            )}
            <div style={{ overflowY: 'auto', flex: 1, lineHeight: '1.7', fontSize: isCustomLetter ? '17px' : '20px', paddingRight: '15px', marginBottom: '20px', maxWidth: isCustomLetter ? '560px' : undefined, fontFamily: isCustomLetter ? '"Georgia", "Cambria", serif' : undefined, fontWeight: isCustomLetter ? 700 : undefined, color: isCustomLetter ? '#2a1a08' : '#5a402a', textShadow: 'none' }}>
              {isCustomLetter
                ? <QueenLetterTypewriter body={activeQuest.body} key={activeQuest.id} instant={activeQuestWasRead} />
                : activeQuest.body.map((para, i) => (
                  <p key={i} style={{ color: '#5a402a' }}>{para}</p>
                ))}
            </div>

            {activeQuest.reqs.length > 0 && !completedQuests.includes(activeQuest.id) && activeQuest.id !== 'q2_rebuild_tavern' && activeQuest.id !== 'q_mayor_market_intro' && (
              isCustomLetter ? (
                /* Inline "Task:" section with slot icons + Turn In button. */
                <div style={{ marginBottom: '8px', maxWidth: '560px' }}>
                  {reqCounts.map((req, i) => {
                    const slotItems = Array.from({ length: req.count });
                    const item = ALL_ITEMS[req.id];
                    const renderIcon = (greyed) => (
                      item?.pos >= 0 ? (
                        <div style={{
                          width: '70%', height: '70%',
                          backgroundImage: 'url(/images/crops/seeds.webp)',
                          backgroundSize: `${(159 * 30 / 207.7647).toFixed(1)}px auto`,
                          backgroundPositionX: 'center',
                          backgroundPositionY: `-${(item.pos * 30).toFixed(1)}px`,
                          backgroundRepeat: 'no-repeat',
                          opacity: greyed ? 0.35 : 1,
                          filter: greyed ? 'grayscale(80%)' : 'none',
                        }} />
                      ) : req.image ? (
                        <img src={req.image} alt={req.name} style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: greyed ? 0.35 : 1, filter: greyed ? 'grayscale(80%)' : 'none' }} onError={(e) => { e.target.onerror = null; }} />
                      ) : null
                    );
                    return (
                      <div key={i}>
                        <h3 style={{ margin: '0 0 4px 0', fontFamily: 'GROBOLD, Cartoonist, sans-serif', color: '#3b1f0a', fontSize: '20px' }}>Task:</h3>
                        <p style={{ margin: '0 0 10px 0', fontFamily: '"Georgia", "Cambria", serif', fontWeight: 700, color: '#2a1a08', fontSize: '16px' }}>
                          Collect &amp; turn in {req.count}x {req.name} crops
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {slotItems.map((_, slotIdx) => {
                            const filled = slotIdx < req.current;
                            return (
                              <div key={slotIdx} style={{
                                width: 56, height: 56,
                                border: '2px solid #8c6b4a',
                                borderRadius: 8,
                                background: filled ? 'rgba(255,235,180,0.4)' : 'rgba(140,107,74,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: filled ? 'inset 0 0 6px rgba(255,200,100,0.3)' : 'none',
                              }}>
                                {renderIcon(!filled)}
                              </div>
                            );
                          })}
                          <div style={{ marginLeft: '6px' }}>
                            <BaseButton
                              label="TURN IN"
                              small
                              disabled={req.current < req.count}
                              onClick={handleCompleteQuest}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.1)', border: '1px solid #8c6b4a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontFamily: 'monospace' }}>Required Items:</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {reqCounts.map((req, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
                        {ALL_ITEMS[req.id]?.pos >= 0 ? (
                          <div style={{ width: '24px', height: '24px', backgroundImage: 'url(/images/crops/seeds.webp)', backgroundSize: `${(159 * 24 / 207.7647).toFixed(1)}px auto`, backgroundPositionX: 'center', backgroundPositionY: `-${(ALL_ITEMS[req.id].pos * 24).toFixed(1)}px`, backgroundRepeat: 'no-repeat', flexShrink: 0 }} />
                        ) : req.image ? (
                          <img src={req.image} style={{ width: '24px', height: '24px', objectFit: 'contain' }} alt={req.name} onError={(e) => { e.target.onerror = null; }} />
                        ) : null}
                        <span style={{ color: req.current >= req.count ? '#006400' : '#8b0000', fontWeight: 'bold' }}>
                          {req.name}: {req.current}/{req.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {activeQuest.id === 'q2_rebuild_tavern' && !completedQuests.includes(activeQuest.id) && (
              <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.15)', border: '1px solid #8c6b4a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontFamily: 'monospace', color: '#8c6b4a', fontSize: '14px' }}>
                  Head to the <strong>Tavern</strong> to submit your materials and rebuild it.
                </p>
              </div>
            )}

            {activeQuest.id === 'q_mayor_market_intro' && !completedQuests.includes(activeQuest.id) && (
              <div style={{ backgroundColor: 'rgba(90, 64, 42, 0.15)', border: '1px solid #8c6b4a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontFamily: 'monospace', color: '#8c6b4a', fontSize: '14px' }}>
                  Head to the <strong>Market</strong> — the Mayor will meet you there.
                </p>
              </div>
            )}

            {activeQuest.id === 'q2_unlock_dock' && completedQuests.includes('q2_unlock_dock') && dockTimeLeft > 0 && (
              <div style={{ backgroundColor: 'rgba(30, 60, 100, 0.2)', border: '2px solid #4a7ab5', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontFamily: 'monospace' }}>
                <p style={{ margin: '0 0 8px 0', color: '#3a5a8a', fontWeight: 'bold', fontSize: '15px' }}>
                  🔨 Dock under construction...
                </p>
                <p style={{ margin: '0 0 12px 0', color: '#3a5a8a', fontSize: '20px', fontWeight: 'bold' }}>
                  {Math.floor(dockTimeLeft / 3600000)}h {Math.floor((dockTimeLeft % 3600000) / 60000)}m {Math.floor((dockTimeLeft % 60000) / 1000)}s remaining
                </p>
                <button
                  onClick={handleSkipDockBuild}
                  style={{ background: '#4a7ab5', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 20px', fontFamily: 'monospace', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Skip for {DOCK_SKIP_GEMS} 💎
                </button>
              </div>
            )}

            {activeQuest.id === 'q2_unlock_dock' && completedQuests.includes('q2_unlock_dock') && dockTimeLeft === 0 && (
              <div style={{ backgroundColor: 'rgba(0, 100, 0, 0.15)', border: '2px solid #3a8a3a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontFamily: 'monospace' }}>
                <p style={{ margin: 0, color: '#2a6a2a', fontWeight: 'bold', fontSize: '15px' }}>
                  ✅ Dock construction complete! Head to the dock to meet Fisherman Finn.
                </p>
              </div>
            )}

            {!completedQuests.includes(activeQuest.id) && activeQuest.reqs.length === 0 && activeQuest.rewards.some(r => r.id === 'pabee_pack' || r.id === 'pico_pack') && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <img
                  src="/images/cardfront/card1idle/idle_1/idle_1_00000.png"
                  alt="Gift"
                  style={{ width: '120px', imageRendering: 'pixelated', animation: 'mapFloat 2s ease-in-out infinite' }}
                />
              </div>
            )}

            {activeQuest.pfpImage && !completedQuests.includes(activeQuest.id) && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '16px', backgroundColor: 'rgba(90,64,42,0.12)', border: '2px solid #c8821a', borderRadius: '10px' }}>
                <img
                  src={activeQuest.pfpImage}
                  alt={activeQuest.pfpLabel}
                  style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '50%', border: '3px solid #c8821a', boxShadow: '0 0 16px rgba(200,130,26,0.5)', animation: 'mapFloat 2.5s ease-in-out infinite' }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#5a402a', fontWeight: 'bold' }}>🏆 New Profile Picture Unlocked: {activeQuest.pfpLabel}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#8c6b4a', fontStyle: 'italic' }}>{activeQuest.pfpHow}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', transform: isCustomLetter ? 'scale(0.75)' : 'none', transformOrigin: 'center bottom' }}>
              {completedQuests.includes(activeQuest.id) ? (
                <>
                  <BaseButton label="Discard" onClick={() => setShowDiscardConfirm(true)} />
                  <BaseButton label="Fold Letter" onClick={() => setAnimState(0)} />
                </>
              ) : (
                <>
                  {activeQuest.id === 'q2_rebuild_tavern' ? (
                    <>
                      <BaseButton label="Discard" onClick={() => setShowDiscardConfirm(true)} />
                      <BaseButton label="Fold Letter" onClick={() => setAnimState(0)} />
                    </>
                  ) : activeQuest.reqs.length > 0 ? (
                    <>
                      {activeQuest.starterPack && localStorage.getItem(`sandbox_starter_pack_claimed_${activeQuest.id}`) !== 'true' && (
                        <BaseButton
                          label="Take Seeds"
                          onClick={() => {
                            localStorage.setItem(`sandbox_starter_pack_claimed_${activeQuest.id}`, 'true');
                            window.dispatchEvent(new CustomEvent('closeMailbox'));
                            onClose();
                            setTimeout(() => {
                              window.dispatchEvent(new CustomEvent('charPackOpen', { detail: { seeds: activeQuest.starterPack.seeds } }));
                            }, 100);
                          }}
                        />
                      )}
                      {/* Custom-letter senders show the Turn In button inline
                          with the task slots above, so we skip it here. */}
                      {!isCustomLetter && (
                        <BaseButton label={activeQuest.id === 'q2_unlock_dock' ? (isReadyToTurnIn ? "Invest & Start Construction" : "Need 1,500 Gold") : (isReadyToTurnIn ? "Turn In & Claim" : "Not Enough Items")} disabled={!isReadyToTurnIn} onClick={handleCompleteQuest} />
                      )}
                      <BaseButton label="Fold Letter" onClick={() => setAnimState(0)} />
                    </>
                  ) : (
                    <BaseButton label={activeQuest.rewards.length === 0 ? "Mark as Read" : "Claim Gifts"} onClick={handleCompleteQuest} />
                  )}
                  {activeQuest.id !== 'q2_rebuild_tavern' && activeQuest.rewards.length === 0 && activeQuest.reqs.length === 0 && (
                    <BaseButton label="Fold Letter" onClick={() => {
                      if (activeQuest.reqs.length === 0) {
                        if (activeQuest.id !== 'q1_end_papabee') {
                          const nextDiscarded = [...discardedQuests, activeQuest.id];
                          setDiscardedQuests(nextDiscarded);
                          localStorage.setItem('sandbox_discarded_quests', JSON.stringify(nextDiscarded));
                        }
                        const nextCompleted = [...completedQuests, activeQuest.id];
                        setCompletedQuests(nextCompleted);
                        localStorage.setItem('sandbox_completed_quests', JSON.stringify(nextCompleted));
                        // Bank letter — folding triggers the market icon to pulse so the user
                        // is nudged to head to the Banker. The pulse clears on next market visit.
                        if (activeQuest.id === 'q_mayor_bank_intro') {
                          localStorage.setItem('sandbox_market_pulse_bank', 'true');
                          window.dispatchEvent(new CustomEvent('questStateChanged'));
                        }
                        // Beejamin dock letter — folding reveals the dock nav icon and pulses it
                        // until the user actually clicks through to /house for the first time.
                        if (activeQuest.id === 'q_beejamin_dock_intro') {
                          localStorage.setItem('sandbox_dock_letter_read', 'true');
                          window.dispatchEvent(new CustomEvent('questStateChanged'));
                        }
                      }
                      setAnimState(0);
                    }} />
                  )}
                </>
              )}
            </div>
          </div>
          );
        })()}

        {/* Discard confirmation popup */}
        {showDiscardConfirm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100001, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#2a1a0e', border: '2px solid #8c6b4a', borderRadius: '12px', padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '340px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontFamily: 'monospace', color: '#e8d5b0', fontSize: '16px', lineHeight: 1.5 }}>
                Are you sure you want to discard this letter? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <BaseButton label="Yes, Discard" onClick={confirmDiscard} />
                <BaseButton label="Cancel" onClick={() => setShowDiscardConfirm(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '500px' }}>
        <img src="/images/mail/Mailboxx.png" alt="Mailbox" style={{ width: '100%', display: 'block', userSelect: 'none' }} draggable={false} />
        {/* Close button - mailboxclose image at top right */}
        <img src="/images/mail/mailboxclose.png" alt="Close" onClick={onClose} style={{ position: 'absolute', top: '11.2%', right: '-4.9%', width: '15%', cursor: 'pointer', zIndex: 2, userSelect: 'none', transition: 'transform 0.08s, filter 0.08s' }} draggable={false}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.filter = 'brightness(0.85)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
        />
        {/* Mail list content area */}
        <div style={{ position: 'absolute', top: '24%', left: '49%', transform: 'translateX(-50%)', width: '78%', bottom: '12%', overflowY: activeQuestsList.length > 5 ? 'auto' : 'visible', overflowX: 'visible', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {activeQuestsList.length > 0 ? activeQuestsList.map(quest => {
            const isRead = readQuests.includes(quest.id);
            const isReady = quest.reqs.length > 0 && !completedQuests.includes(quest.id) && checkRequirements(quest.reqs);
            return (
              <div
                key={quest.id}
                onClick={() => handleOpenLetter(quest)}
                style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.15s', marginTop: '10px', width: '100%', overflow: 'visible' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <img src={quest.mailImage || "/images/mail/mailpapabee.png"} alt="" style={{ width: '88%', display: 'block', borderRadius: '10px', margin: '0 auto' }} draggable={false} />
                {isReady
                  ? <img src="/images/farming/checkmark.png" alt="✓" className="badge-pulse" style={{ position: 'absolute', top: '-11px', right: '14px', width: '28px', height: '28px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))', animation: 'badge-pulse 0.9s infinite ease-in-out' }} draggable={false} />
                  : !isRead && <img src="/images/mail/!.png" alt="!" className="badge-pulse" style={{ position: 'absolute', top: '-11px', right: '14px', width: '28px', height: '28px' }} draggable={false} />
                }
                <div style={{ position: 'absolute', top: 0, left: 0, right: '23px', bottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 'calc(30% - 10px)' }}>
                  <span style={{ fontFamily: 'Cartoonist', fontSize: '14px', color: '#FFFFFF', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>{quest.subject}</span>
                </div>
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', color: '#8c6b4a', fontStyle: 'italic', padding: '20px', fontFamily: 'monospace' }}>No new mail.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const EasterBasketDialog = ({ onClose }) => {
  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
  const eggs = [
    { id: 9986, name: 'Green Egg', color: '#00ff41' },
    { id: 9985, name: 'Purple Egg', color: '#ff00ff' },
    { id: 9984, name: 'Blue Egg', color: '#00bfff' },
    { id: 9983, name: 'Yellow Egg', color: '#ffea00' },
    { id: 9982, name: 'Red Egg', color: '#ff4444' }
  ];

  return (
    <BaseDialog onClose={onClose} title="EASTER BASKET" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', minWidth: '350px' }}>
        <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Your Easter Egg Collection</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
          {eggs.map(egg => {
            const hasEgg = sandboxLoot[egg.id] > 0;
            return (
              <div key={egg.id} style={{ width: '80px', height: '100px', backgroundColor: 'rgba(0,0,0,0.5)', border: `2px solid ${hasEgg ? egg.color : '#333'}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: hasEgg ? 1 : 0.3 }}>
                <div style={{ fontSize: '40px', filter: hasEgg ? `drop-shadow(0 0 10px ${egg.color})` : 'grayscale(100%)' }}>
                  {hasEgg ? '🥚' : '❓'}
                </div>
                <span style={{ fontSize: '10px', marginTop: '5px', color: hasEgg ? egg.color : '#777' }}>{egg.name}</span>
              </div>
            );
          })}
        </div>
        {eggs.every(e => sandboxLoot[e.id] > 0) ? (
          <p style={{ color: '#00ff41', fontWeight: 'bold' }}>🎉 You found all the Easter Eggs! Happy Easter! 🎉</p>
        ) : (
          <p style={{ color: '#ccc', fontSize: '14px' }}>Keep searching the farm, forest, and pond for more eggs!</p>
        )}
        <div style={{ marginTop: '20px' }}><BaseButton label="Close" onClick={onClose} /></div>
      </div>
    </BaseDialog>
  );
};

const Farm = ({ isFarmMenu, setIsFarmMenu }) => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const { seeds: currentSeeds, refetch: refetchSeeds, all: allItems, refetch } = useItems();
  const navigate = useNavigate();

  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [tutorialCrowSpawned, setTutorialCrowSpawned] = useState(false);
  const [tutorialCrowDone, setTutorialCrowDone] = useState(false);
  const [tutorialGrowSkipped, setTutorialGrowSkipped] = useState(false);
  const [tutPage, setTutPage] = useState(1);
  const tutPageRef = useRef(1);
  const setTutPageSync = (val) => { tutPageRef.current = val; setTutPage(val); localStorage.setItem('sandbox_tut_page', String(val)); window.dispatchEvent(new CustomEvent('tutPageChanged')); };
const [tutGemPopupOpen, setTutGemPopupOpen] = useState(false);
  const [tutGemPlotIndex, setTutGemPlotIndex] = useState(null);
  const [showMissionBoard, setShowMissionBoard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showPabeePack, setShowPabeePack] = useState(false);
  const [charPackInfo, setCharPackInfo] = useState(null);
  const [showFarmCustomize, setShowFarmCustomize] = useState(false);
  const [showFestivals, setShowFestivals] = useState(false);

  useEffect(() => {
    const handler = () => setShowFestivals(true);
    window.addEventListener('openFestivals', handler);
    return () => window.removeEventListener('openFestivals', handler);
  }, []);

  const [farmingXp, setFarmingXp] = useState(() => parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10));
  const farmingLevel = getLevelFromXp(farmingXp);
  const farmingProgress = ((farmingXp - Math.pow(farmingLevel - 1, 2) * 150) / (Math.pow(farmingLevel, 2) * 150 - Math.pow(farmingLevel - 1, 2) * 150)) * 100;

  const [isMailboxOpenForLevelUp, setIsMailboxOpenForLevelUp] = useState(false);
  const pendingLevelUpQueueRef = useRef([]);
  const levelUpDelayTimerRef = useRef(null);
  const levelUpBlockingRef = useRef(false); // synced to derived blocking state

  useEffect(() => {
      const handleLsUpdate = (e) => {
          if (e.detail.key === 'sandbox_farming_xp') setFarmingXp(parseInt(e.detail.value, 10));
      };
      window.addEventListener('ls-update', handleLsUpdate);
      return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  useEffect(() => {
    const handler = () => {
      // Add the pack seeds to loot
      const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      const packSeeds = [
        getRaritySeedId(ID_SEEDS.CARROT, 1),
        getRaritySeedId(ID_SEEDS.CARROT, 1),
      ];
      for (const seedId of packSeeds) {
        loot[seedId] = (loot[seedId] || 0) + 1;
      }
      localStorage.setItem('sandbox_loot', JSON.stringify(loot));

      // Add 1000 honey (the in-game currency shown in the balance bar)
      const currentHoney = parseFloat(localStorage.getItem('sandbox_honey') || '0');
      const newHoney = currentHoney + 1000;
      localStorage.setItem('sandbox_honey', newHoney.toString());
      window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newHoney.toString() }));

      // Add 750 gems (enough to skip all 12 welcome crops at 50 gems each and still have 250 left)
      const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      const newGems = currentGems + 750;
      localStorage.setItem('sandbox_gems', newGems.toString());
      window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));

      window.dispatchEvent(new CustomEvent('closeMailbox'));
      setShowPabeePack(true);
    };
    window.addEventListener('pabeePackOpen', handler);
    return () => window.removeEventListener('pabeePackOpen', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { seeds, onClosed, tier } = e.detail;
      const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      for (const seedId of seeds) {
        loot[seedId] = (loot[seedId] || 0) + 1;
      }
      localStorage.setItem('sandbox_loot', JSON.stringify(loot));
      setCharPackInfo({ seeds, tier: tier || 'pico_pack', pendingLevelUp: onClosed || null });
    };
    window.addEventListener('charPackOpen', handler);
    return () => window.removeEventListener('charPackOpen', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setUnlockedPlots(e.detail);
    window.addEventListener('plotsUnlocked', handler);
    return () => window.removeEventListener('plotsUnlocked', handler);
  }, []);

  const safeItems = allItems || [];
  const axeCount = safeItems.find(i => i.id === 9991)?.count || 0;
  const pickaxeCount = safeItems.find(i => i.id === 9992)?.count || 0;
  const sticksCount = safeItems.find(i => i.id === 9995)?.count || 0;
  const {
    plantBatch,
    harvestMany,
    getMaxPlots,
    getUserCrops,
    applyGrowthElixir,
    applyPesticide,
    applyFertilizer,
    destroyCrop,
    loading: farmingLoading,
  } = useFarming();
  const { show } = useNotification();

  // Fire a one-time notification when the player first climbs into top 3 on the leaderboard
  useEffect(() => {
    const MOCK_THRESHOLDS = [
      { rank: 1, pts: 284500, msg: '🥇 You\'re #1 on the Best Farmer leaderboard!' },
      { rank: 2, pts: 196000, msg: '🥈 You reached #2 on the Best Farmer leaderboard!' },
      { rank: 3, pts: 118200, msg: '🥉 You cracked the top 3 on the Best Farmer leaderboard!' },
    ];
    const checkRanks = () => {
      const pts = parseInt(localStorage.getItem('sandbox_season_farming_points') || '0', 10);
      const notified = new Set(JSON.parse(localStorage.getItem('sandbox_lb_notified_ranks') || '[]'));
      for (const { rank, pts: threshold, msg } of MOCK_THRESHOLDS) {
        if (pts >= threshold && !notified.has(rank)) {
          notified.add(rank);
          localStorage.setItem('sandbox_lb_notified_ranks', JSON.stringify([...notified]));
          show(msg, 'success');
          break;
        }
      }
    };
    window.addEventListener('seasonPointsChanged', checkRanks);
    return () => window.removeEventListener('seasonPointsChanged', checkRanks);
  }, [show]);

  const [isPlanting, setIsPlanting] = useState(true);
  const [isSelectCropDialog, setIsSelectCropDialog] = useState(false);
  const [cropArray, setCropArray] = useState(() => new CropItemArrayClass(30));
  const [previewCropArray, setPreviewCropArray] = useState(
    () => new CropItemArrayClass(30)
  );
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [, setGrowthTimer] = useState(null);
  const [maxPlots, setMaxPlots] = useState(0);
  const [unlockedPlots, setUnlockedPlots] = useState(() => JSON.parse(localStorage.getItem('sandbox_unlocked_plots') || '[6,7,8]'));
  const [previewUpdateKey, setPreviewUpdateKey] = useState(0);
  const [userCropsLoaded, setUserCropsLoaded] = useState(false);
  const [usedSeedsInPreview, setUsedSeedsInPreview] = useState({});
  const plantConfirmAudioRef = useRef(null);
  const harvestConfirmAudioRef = useRef(null);
  const tutPostWaterRef = useRef(false); // tracks when tut bug/crow sequence is active
  const tutBugKilledRef = useRef(false); // tracks when tut bug has been killed (waiting for crow)
  const tutWaterPlotRef = useRef(null);  // plot index used in tutorial sequence
  const bugsRef = useRef({}); // Tracks bugs currently on the farm
  const crowsRef = useRef({}); // Tracks crows currently on the farm
  const lastPestRollAtRef = useRef({}); // Per-plot timestamp of the last pest spawn roll
  const scarecrowsRef = useRef(JSON.parse(localStorage.getItem('sandbox_scarecrows') || '{}'));
  const ladybugsRef = useRef(JSON.parse(localStorage.getItem('sandbox_ladybugs') || '{}'));
  const sprinklersRef = useRef(JSON.parse(localStorage.getItem('sandbox_sprinklers') || '{}'));
  const umbrellasRef = useRef(JSON.parse(localStorage.getItem('sandbox_umbrellas') || '{}'));
  const teslaTowersRef = useRef(JSON.parse(localStorage.getItem('sandbox_tesla') || '{}'));
  
  const [isUsingPotion, setIsUsingPotion] = useState(false);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [isPlacingScarecrow, setIsPlacingScarecrow] = useState(false);
  const [placingScarecrowType, setPlacingScarecrowType] = useState('tier1'); // 'tier1', 'tier2', 'tier3', 'tier4', 'ladybug_scarecrow'
  
  const [isPlacingTesla, setIsPlacingTesla] = useState(false);
  const [teslaTowers, setTeslaTowers] = useState(teslaTowersRef.current);

  const [isPlacingLadybug, setIsPlacingLadybug] = useState(false);
  const [isPlacingSprinkler, setIsPlacingSprinkler] = useState(false);
  const [isPlacingUmbrella, setIsPlacingUmbrella] = useState(false);
  const [showFarmingBoard, setShowFarmingBoard] = useState(false);
  
  // Quest State
  const [completedQuests, setCompletedQuests] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
    // Backwards compat
    if (localStorage.getItem('sandbox_pabee_mail_claimed') === 'true' && !saved.includes('q1_pabee_intro')) {
      saved.push('q1_pabee_intro');
      localStorage.setItem('sandbox_completed_quests', JSON.stringify(saved));
    }
    return saved;
  });

  // Mirror sandbox_read_quests + sandbox_completed_quests into farm-local state so
  // the mission-board hotspot filter (and anything else here) re-renders when
  // letters are read/folded in the global mailbox dialog. The mailbox lives in
  // router/index.jsx so its setReadQuests doesn't reach this component otherwise —
  // the global `questStateChanged` event keeps both copies in sync.
  const [readQuests, setReadQuests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]'); }
    catch { return []; }
  });
  useEffect(() => {
    const update = () => {
      try { setReadQuests(JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]')); } catch (_) {}
      try { setCompletedQuests(JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')); } catch (_) {}
    };
    window.addEventListener('questStateChanged', update);
    return () => window.removeEventListener('questStateChanged', update);
  }, []);
  
  const hasBarnMissionUnlocked = useMemo(() => {
    return completedQuests.includes('q16_build_barn');
  }, [completedQuests]);

  const availableFarmingQuests = getQuestData().filter(q => q.type === 'farming' && q.unlockCondition(tutorialStep, completedQuests) && !completedQuests.includes(q.id));
  const activeFarmingIds = availableFarmingQuests.map(q => q.id);
  const seenFarmingIds = (localStorage.getItem('seen_farming_missions_ids') || '').split(',').filter(Boolean);
  const hasNewFarmingMissions = activeFarmingIds.some(id => !seenFarmingIds.includes(id));

  const [scarecrows, setScarecrows] = useState(scarecrowsRef.current);
  const [ladybugs, setLadybugs] = useState(ladybugsRef.current);
  const [sprinklers, setSprinklers] = useState(sprinklersRef.current);
  const [umbrellas, setUmbrellas] = useState(umbrellasRef.current);
  const [showEasterBasket, setShowEasterBasket] = useState(false);

  const [skipGrowTarget, setSkipGrowTarget] = useState(null);
  const [tookHoney, setTookHoney] = useState(false);

  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  
  useEffect(() => {
    const handleGlobalDialog = (e) => setIsGlobalDialogOpen(e.detail);
    window.addEventListener('globalDialogOpen', handleGlobalDialog);
    return () => window.removeEventListener('globalDialogOpen', handleGlobalDialog);
  }, []);

  useEffect(() => {
    if (isGlobalDialogOpen) {
      setSelectedTool(null);
      setIsWatering(false);
      setIsDigging(false);
      setIsHoeing(false);
      setIsDirting(false);
      setIsSeeding(false);
    }
  }, [isGlobalDialogOpen]);

  // --- Level up queue: all blocking-dialog states are in scope here ---
  useEffect(() => {
    const handleOpen = () => setIsMailboxOpenForLevelUp(true);
    const handleClose = () => setIsMailboxOpenForLevelUp(false);
    window.addEventListener('openMailbox', handleOpen);
    window.addEventListener('closeMailbox', handleClose);
    return () => {
      window.removeEventListener('openMailbox', handleOpen);
      window.removeEventListener('closeMailbox', handleClose);
    };
  }, []);

  useEffect(() => {
    const blocking = isGlobalDialogOpen || isMailboxOpenForLevelUp || showMissionBoard || showShop
      || !!charPackInfo || showFarmCustomize || showFestivals
      || isSelectCropDialog
      || showPabeePack;
    const wasBlocking = levelUpBlockingRef.current;
    levelUpBlockingRef.current = blocking;
    if (wasBlocking && !blocking && pendingLevelUpQueueRef.current.length > 0) {
      clearTimeout(levelUpDelayTimerRef.current);
      levelUpDelayTimerRef.current = setTimeout(() => {
        if (!levelUpBlockingRef.current) {
          const next = pendingLevelUpQueueRef.current.shift();
          if (next) fireNextLevelUpPack(next);
        }
      }, 2500);
    }
  }, [isGlobalDialogOpen, isMailboxOpenForLevelUp, showMissionBoard, showShop,
      charPackInfo, showFarmCustomize, showFestivals,
      isSelectCropDialog,
      showPabeePack]);

  const fireNextLevelUpPack = useCallback(() => {
    const LEVEL_UP_SEED_POOL = [
      ID_SEEDS.CARROT, ID_SEEDS.TOMATO, ID_SEEDS.CORN,
      ID_SEEDS.CELERY, ID_SEEDS.POTATO, ID_SEEDS.ONION,
      ID_SEEDS.RADISH, ID_SEEDS.LETTUCE,
    ];
    const shuffled = [...LEVEL_UP_SEED_POOL].sort(() => Math.random() - 0.5);
    const seeds = shuffled.slice(0, 3).map(id => getRaritySeedId(id, 1));
    window.dispatchEvent(new CustomEvent('charPackOpen', { detail: { seeds } }));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!levelUpBlockingRef.current) {
        clearTimeout(levelUpDelayTimerRef.current);
        levelUpDelayTimerRef.current = setTimeout(() => {
          if (!levelUpBlockingRef.current) {
            fireNextLevelUpPack();
          } else {
            pendingLevelUpQueueRef.current.push(e.detail);
          }
        }, 2500);
      } else {
        pendingLevelUpQueueRef.current.push(e.detail);
      }
    };
    window.addEventListener('levelUp', handler);
    return () => window.removeEventListener('levelUp', handler);
  }, [fireNextLevelUpPack]);

  const hideIcons = isGlobalDialogOpen || isSelectCropDialog;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('seedDialogOpen', { detail: isSelectCropDialog }));
  }, [isSelectCropDialog]);


  const autoSpawnRef = useRef(localStorage.getItem('auto_spawn_enabled') !== 'false');
  const [simulatedDay, setSimulatedDay] = useState(() => getSimulatedDateInfo().day);
  const [simulatedDate, setSimulatedDate] = useState(() => getSimulatedDateInfo().date);
  const [weatherOverride, setWeatherOverride] = useState(() => localStorage.getItem('sandbox_weather_override') || null);
  useEffect(() => {
    const handler = () => setWeatherOverride(localStorage.getItem('sandbox_weather_override') || null);
    window.addEventListener('weatherOverrideChanged', handler);
    return () => window.removeEventListener('weatherOverrideChanged', handler);
  }, []);
  const simulatedDateRef = useRef(simulatedDate);
  useEffect(() => {
    simulatedDateRef.current = simulatedDate;
  }, [simulatedDate]);
  
  // Load Worker Bee Level
  const [workerBeeLevel, setWorkerBeeLevel] = useState(() => {
    const saved = parseInt(localStorage.getItem('sandbox_worker_bee_level'), 10);
    return isNaN(saved) ? 1 : saved;
  });

  // Sync Worker Bee Level Changes
  useEffect(() => {
    const handleBeeLevelChange = (e) => setWorkerBeeLevel(e.detail);
    window.addEventListener('workerBeeLevelChanged', handleBeeLevelChange);
    return () => window.removeEventListener('workerBeeLevelChanged', handleBeeLevelChange);
  }, []);

  const handleSkipGrowth = async () => {
    const currentGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
    if (currentGems < 50) {
      show("You don't have enough Gems!", "error");
      setSkipGrowTarget(null);
      return;
    }

    const target = skipGrowTarget;
    const newGems = currentGems - 50;
    localStorage.setItem('sandbox_gems', newGems.toString());
    window.dispatchEvent(new CustomEvent('sandboxGemsChanged', { detail: newGems.toString() }));
    trackGemSpend(50);

    setSkipGrowTarget(null);
    if (tutorialStep === 3 && tutPage === 10) setTutorialGrowSkipped(true);

    await handleInstantHarvest(target, true);
  };

  // Plot Preparation State (0: Red X, 1: Hole, 2: Hole+Fish, 3: Dirt Pile)
  const [plotPrep, setPlotPrep] = useState(() => JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}'));
  const [prepDialogTarget, setPrepDialogTarget] = useState(null);

  // Tutorial step 14 → 15 auto-advance when user digs their first hole
  useEffect(() => {
    if (tutorialStep !== 14) return;
    const STARTER = [6, 7, 8];
    const anyDug = STARTER.some(idx => (plotPrep[idx]?.status || 0) >= 1);
    if (anyDug) {
      const t = setTimeout(() => {
        setTutorialStep(15);
        localStorage.setItem('sandbox_tutorial_step', '15');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 500); // small delay so the dig animation can play
      return () => clearTimeout(t);
    }
  }, [tutorialStep, plotPrep]);

  // Tutorial step 15 → 16 auto-advance when user fills a hole with dirt (status 3)
  useEffect(() => {
    if (tutorialStep !== 15) return;
    const STARTER = [6, 7, 8];
    const anyDirt = STARTER.some(idx => (plotPrep[idx]?.status || 0) === 3);
    if (anyDirt) {
      const t = setTimeout(() => {
        setTutorialStep(16);
        localStorage.setItem('sandbox_tutorial_step', '16');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [tutorialStep, plotPrep]);

  // When entering step 16, grant the user an uncommon potato seed (once)
  useEffect(() => {
    if (tutorialStep !== 16) return;
    if (localStorage.getItem('sandbox_tutorial_gave_potato') === 'true') return;
    const seedId = getRaritySeedId(ID_SEEDS.POTATO, 2); // rarity 2 = uncommon
    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[seedId] = (loot[seedId] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    localStorage.setItem('sandbox_tutorial_gave_potato', 'true');
    if (typeof refetchSeeds === 'function') refetchSeeds();
  }, [tutorialStep]);

  // Tutorial step 19 — spawn a crow while the WOAH text is typing, auto-advance to 20 once it lands
  useEffect(() => {
    if (tutorialStep !== 19) return;
    const STARTER = [6, 7, 8];
    const plantedIdx = STARTER.find(idx => {
      const it = cropArray.getItem(idx);
      return it && it.seedId && it.seedId !== 0n;
    });
    if (plantedIdx == null) return;
    // Spawn crow ~1.8s in (while text is typing) so the 3s fly-in finishes around step advance
    const spawnT = setTimeout(() => {
      crowsRef.current[plantedIdx] = 60;
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plantedIdx);
        if (item) item.crowCountdown = 60;
        return newArr;
      });
    }, 1800);
    // After the crow's 3s fly-in completes, advance to step 20
    const advanceT = setTimeout(() => {
      setTutorialStep(20);
      localStorage.setItem('sandbox_tutorial_step', '20');
      window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
    }, 4900);
    return () => { clearTimeout(spawnT); clearTimeout(advanceT); };
  }, [tutorialStep]);

  // Tutorial step 20 → 21 auto-advance when the crow is scared away
  useEffect(() => {
    if (tutorialStep !== 20) return;
    const onScareCrow = (e) => {
      const STARTER = [6, 7, 8];
      if (!STARTER.includes(e.detail?.plotIndex)) return;
      setTimeout(() => {
        setTutorialStep(21);
        localStorage.setItem('sandbox_tutorial_step', '21');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 800);
    };
    window.addEventListener('scareCrow', onScareCrow);
    return () => window.removeEventListener('scareCrow', onScareCrow);
  }, [tutorialStep]);

  // Tutorial step 22 — spawn bugs on the planted plot as the bubble opens
  useEffect(() => {
    if (tutorialStep !== 22) return;
    const STARTER = [6, 7, 8];
    const plantedIdx = STARTER.find(idx => {
      const it = cropArray.getItem(idx);
      return it && it.seedId && it.seedId !== 0n;
    });
    if (plantedIdx == null) return;
    const t = setTimeout(() => {
      bugsRef.current[plantedIdx] = 60;
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plantedIdx);
        if (item) item.bugCountdown = 60;
        return newArr;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [tutorialStep]);

  // Tutorial step 22 → 23 auto-advance when a bug is squashed on a starter plot
  useEffect(() => {
    if (tutorialStep !== 22) return;
    const onSquashBug = (e) => {
      const STARTER = [6, 7, 8];
      if (!STARTER.includes(e.detail?.plotIndex)) return;
      setTimeout(() => {
        setTutorialStep(23);
        localStorage.setItem('sandbox_tutorial_step', '23');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 800);
    };
    window.addEventListener('squashBug', onSquashBug);
    return () => window.removeEventListener('squashBug', onSquashBug);
  }, [tutorialStep]);

  // During tutorial steps 16-23, keep resetting plantedAt on the planted potato so it never grows
  // (kicks in ~1s after the seed is planted, freezing growth for the whole lesson)
  useEffect(() => {
    if (tutorialStep < 16 || tutorialStep > 23) return;
    const STARTER = [6, 7, 8];
    const freeze = () => {
      setCropArray(prev => {
        let changed = false;
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        STARTER.forEach(idx => {
          const item = newArr.getItem(idx);
          if (item && item.seedId && item.seedId !== 0n) {
            item.growthTime = 9e12;
            item.plantedAt = Date.now();
            changed = true;
          }
        });
        return changed ? newArr : prev;
      });
    };
    freeze(); // run immediately on step change
    const id = setInterval(freeze, 500);
    return () => clearInterval(id);
  }, [tutorialStep]);

  // Tutorial step 24 → 25 auto-advance when the planted potato is harvested (its seedId clears)
  useEffect(() => {
    if (tutorialStep !== 24) return;
    const STARTER = [6, 7, 8];
    const stillPlanted = STARTER.some(idx => {
      const it = cropArray.getItem(idx);
      return it && it.seedId && it.seedId !== 0n;
    });
    // We started this step with a planted plot; once it's gone, the user harvested → advance
    const sawPlant = localStorage.getItem('sandbox_tutorial_step24_seen_plant') === 'true';
    if (stillPlanted && !sawPlant) {
      localStorage.setItem('sandbox_tutorial_step24_seen_plant', 'true');
      return;
    }
    if (!stillPlanted && sawPlant) {
      localStorage.removeItem('sandbox_tutorial_step24_seen_plant');
      const t = setTimeout(() => {
        setTutorialStep(25);
        localStorage.setItem('sandbox_tutorial_step', '25');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 600);
      return () => clearTimeout(t);
    }
  }, [tutorialStep, cropArray]);

  // Tutorial step 32 — fire the pack (once) + grant gold + gems (once); always poll for advance
  useEffect(() => {
    if (tutorialStep !== 32) return;
    if (localStorage.getItem('sandbox_tutorial_gave_farewell_pack') !== 'true') {
      localStorage.setItem('sandbox_tutorial_gave_farewell_pack', 'true');
      // One of each Wave-1 welcome-quest crop so every farewell-pack seed gets consumed by a
      // welcome quest. This way the user is exactly out of seeds when the mayor's
      // "go buy seeds at the market" mission triggers.
      const seeds = [
        getRaritySeedId(ID_SEEDS.POTATO, 1),
        getRaritySeedId(ID_SEEDS.LETTUCE, 1),
        getRaritySeedId(ID_SEEDS.RADISH, 1),
      ];
      const curGold = parseInt(localStorage.getItem('sandbox_gold') || '0', 10);
      const newGold = (curGold + 2000).toString();
      localStorage.setItem('sandbox_gold', newGold);
      window.dispatchEvent(new CustomEvent('sandboxGoldChanged', { detail: newGold }));
      const curGems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      localStorage.setItem('sandbox_gems', String(curGems + 250));
      window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
      window.dispatchEvent(new CustomEvent('charPackOpen', { detail: { seeds, tier: 'tutorial_farewell_pack' } }));
    }
    // Polling always runs while on step 32: advance once a pack has opened and then closed.
    // The "ever opened" flag is persisted to localStorage so a refresh after the pack opens
    // (but before the user clicks claim) auto-resumes — next tick sees no .card-inner +
    // packEverOpened === true and advances to step 33.
    let packEverOpened = localStorage.getItem('sandbox_tutorial_pack_opened') === 'true';
    const pollId = setInterval(() => {
      const packOpen = !!document.querySelector('.card-inner');
      if (packOpen) {
        if (!packEverOpened) {
          packEverOpened = true;
          localStorage.setItem('sandbox_tutorial_pack_opened', 'true');
        }
      } else if (packEverOpened) {
        clearInterval(pollId);
        setTutorialStep(33);
        localStorage.setItem('sandbox_tutorial_step', '33');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }
    }, 400);
    return () => clearInterval(pollId);
  }, [tutorialStep]);

  // Tutorial step 23 — animate gems from 0 to 50 with a stock-ticker style
  // count-up. Use a ref instead of a localStorage flag so the gift fires every
  // time the player enters step 23, including tutorial restarts. The ref
  // resets whenever step ≠ 23, so each fresh entry re-arms the grant.
  const gaveTutorialGemsRef = useRef(false);
  // Drop the legacy persistent flag so older saves aren't permanently blocked.
  useEffect(() => {
    try { localStorage.removeItem('sandbox_tutorial_gave_gems'); } catch (_) {}
  }, []);
  useEffect(() => {
    if (tutorialStep !== 23) {
      gaveTutorialGemsRef.current = false;
      return;
    }
    if (gaveTutorialGemsRef.current) return;
    gaveTutorialGemsRef.current = true;
    // Delay until text is mostly done
    const startDelay = setTimeout(() => {
      const start = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      const target = start + 50;
      const duration = 1400;
      const startTime = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.round(start + (target - start) * eased);
        localStorage.setItem('sandbox_gems', String(current));
        window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 3000);
    return () => clearTimeout(startDelay);
  }, [tutorialStep]);

  // Tutorial step 16 → 17 auto-advance when a starter plot gets a seed planted (instant, seamless dim transition)
  useEffect(() => {
    if (tutorialStep !== 16) return;
    const STARTER = [6, 7, 8];
    const anyPlanted = STARTER.some(idx => {
      const item = cropArray.getItem(idx);
      return item && item.seedId && item.seedId !== 0n;
    });
    if (anyPlanted) {
      setTutorialStep(17);
      localStorage.setItem('sandbox_tutorial_step', '17');
      window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
    }
  }, [tutorialStep, cropArray]);

  // Watering State
  const waterStateRef = useRef(JSON.parse(localStorage.getItem('sandbox_water_state') || '{}'));
  const [isWatering, setIsWatering] = useState(false);
  const [isDigging, setIsDigging] = useState(false);
  const [isHoeing, setIsHoeing] = useState(false);
  const [isDirting, setIsDirting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [waterEffects, setWaterEffects] = useState([]);

  // Tutorial step 17 → 18 auto-advance when the user waters a starter plot
  // Also freezes growth on the planted potato so it doesn't grow during the lesson
  useEffect(() => {
    if (tutorialStep !== 17) return;
    const STARTER = [6, 7, 8];
    const watered = waterEffects.some(e => STARTER.includes(e.index));
    if (watered) {
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        STARTER.forEach(idx => {
          const item = newArr.getItem(idx);
          if (item && item.seedId && item.seedId !== 0n) {
            item.growthTime = 9e12; // effectively pause growth during tutorial
            item.plantedAt = Date.now();
          }
        });
        return newArr;
      });
      const t = setTimeout(() => {
        setTutorialStep(18);
        localStorage.setItem('sandbox_tutorial_step', '18');
        window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [tutorialStep, waterEffects]);

  const [selectedTool, setSelectedTool] = useState(null);
  const [flashTool, setFlashTool] = useState(null);
  const flashToolTimerRef = useRef(null);
  const toggleTool = (name) => setSelectedTool(prev => prev === name ? null : name);
  const flashToolBriefly = (name) => {
    setFlashTool(name);
    if (flashToolTimerRef.current) clearTimeout(flashToolTimerRef.current);
    flashToolTimerRef.current = setTimeout(() => setFlashTool(prev => prev === name ? null : prev), 600);
  };

  useEffect(() => {
    window.cml = (cmd) => {
      if (cmd === 'skip') {
          setTutorialStep(9);
          localStorage.setItem('sandbox_tutorial_step', '9');
          localStorage.setItem('sandbox_tutorial_skipped', 'true');
          window.dispatchEvent(new CustomEvent('tutorialSkipChanged'));
        setIsDigging(false);
        setIsDirting(false);
        setIsSeeding(false);
      }
      if (cmd === 'animal farm') {
        const comp = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
        if (!comp.includes('q16_build_barn')) {
          comp.push('q16_build_barn');
          localStorage.setItem('sandbox_completed_quests', JSON.stringify(comp));
          setCompletedQuests(comp);
        }
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "Animal Farm unlocked!", type: "success" } }));
      }
      if (cmd === 'skip time') {
        window.dispatchEvent(new CustomEvent('skipTime'));
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "Time skipped by 24 hours!", type: "success" } }));
      }
      if (cmd && cmd.startsWith('yarn')) {
        const parts = cmd.split(' ');
        const amt = parts[1] ? parseInt(parts[1], 10) : 1;
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        sandboxLoot[9955] = Math.max(0, (sandboxLoot[9955] || 0) + amt);
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Added ${amt}x Yarn!`, type: "success" } }));
      }
      if (cmd && ['farming', 'fishing', 'foraging', 'mining', 'crafting'].some(s => cmd.startsWith(s))) {
        const parts = cmd.split(' ');
        const skillName = parts[0].toLowerCase();
        const level = parseInt(parts[1], 10);
        if (!isNaN(level)) {
          const xpNeeded = Math.pow(level - 1, 2) * 150;
          localStorage.setItem(`sandbox_${skillName}_xp`, xpNeeded.toString());
          window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: `sandbox_${skillName}_xp`, value: xpNeeded.toString() } }));
          window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} level set to ${level}!`, type: "success" } }));
        }
      }
      if (cmd && cmd.startsWith('crop ')) {
        const amount = parseInt(cmd.split(' ')[1], 10);
        if (!isNaN(amount)) {
          localStorage.setItem('sandbox_total_crops', amount.toString());
          window.dispatchEvent(new CustomEvent('soilProgressChanged'));
          window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Crop count set to ${amount.toLocaleString()}!`, type: "success" } }));
        }
      }
      if (cmd && cmd.startsWith('weather ')) {
        const weather = cmd.split(' ')[1];
        if (['sunny', 'rain', 'storm', 'clear'].includes(weather)) {
          if (weather === 'clear') {
            localStorage.removeItem('sandbox_weather_override');
            window.dispatchEvent(new CustomEvent('weatherOverrideChanged'));
            window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Weather override cleared!`, type: "success" } }));
          } else {
            localStorage.setItem('sandbox_weather_override', weather);
            window.dispatchEvent(new CustomEvent('weatherOverrideChanged'));
            window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: `Weather forced to ${weather}!`, type: "success" } }));
          }
        }
      }
    };

    return () => {
      delete window.cml;
    };
  }, []);

  // The Well Dropping Logic
  const handleWellDrop = () => {
    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    if (!loot[9953] || loot[9953] <= 0) {
      show("You need to craft a Bucket first to use the Well!", "error");
      return;
    }
    const today = new Date().toDateString();
    const wellDate = localStorage.getItem('sandbox_well_date');
    let uses = parseInt(localStorage.getItem('sandbox_well_uses') || '0', 10);
    
    if (wellDate !== today) {
      uses = 0;
      localStorage.setItem('sandbox_well_date', today);
    }
    
    if (uses >= 5) {
      show("The well is drying up. Try again tomorrow!", "warning");
      return;
    }
    
    uses += 1;
    localStorage.setItem('sandbox_well_uses', uses.toString());
    
    if (Math.random() < 0.01) { // 1% chance
      loot[9954] = (loot[9954] || 0) + 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(loot));
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('sandbox_ring_expiry', expiry.toString());
      show("SPLASH! You pulled up a Magic Ring! Harvests are doubled for 24 hours!", "success");
      if (refetch) refetch();
    } else {
      show(`SPLASH! You pulled up some muddy water... (${5 - uses} attempts left today)`, "info");
    }
  };

  const updatePlotPrep = useCallback((index, prepData) => {
    setPlotPrep(prev => {
      const next = { ...prev, [index]: prepData };
      localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
      return next;
    });
  }, [setPlotPrep]);

  const handleRemoveScarecrow = useCallback((spotId) => {
    setScarecrows((prev) => {
      const newScarecrows = { ...prev };
      delete newScarecrows[spotId];
      scarecrowsRef.current = newScarecrows;
      localStorage.setItem('sandbox_scarecrows', JSON.stringify(newScarecrows));
      return newScarecrows;
    });
  }, []);

  const handleRemoveLadybug = useCallback((spotId) => {
    setLadybugs((prev) => {
      const newLadybugs = { ...prev };
      delete newLadybugs[spotId];
      ladybugsRef.current = newLadybugs;
      localStorage.setItem('sandbox_ladybugs', JSON.stringify(newLadybugs));
      return newLadybugs;
    });
  }, []);

  const handleRemoveSprinkler = useCallback((spotId) => {
    setSprinklers((prev) => {
      const next = { ...prev };
      delete next[spotId];
      sprinklersRef.current = next;
      localStorage.setItem('sandbox_sprinklers', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleRemoveUmbrella = useCallback((spotId) => {
    setUmbrellas((prev) => {
      const next = { ...prev };
      delete next[spotId];
      umbrellasRef.current = next;
      localStorage.setItem('sandbox_umbrellas', JSON.stringify(next));
      return next;
    });
  }, []);

  const loadCropsFromContract = useCallback(
    async () => {
      try {
        setUserCropsLoaded(false);
        // Get all user crops in a single call
        const crops = await getUserCrops();

        // Collect unique seedIds to fetch growth times once per seed type
        const uniqueSeedIds = Array.from(
          new Set(
            crops
              .map((crop) => crop.seedId)
              .filter((sid) => sid && sid !== 0n)
          )
        );

        const growthTimeCache = new Map();
        const skippedCrops = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
        
        // WEATHER BUFFS/NERFS
        let weatherEmoji = getWeatherForDay(simulatedDate);
        const wOverride = localStorage.getItem('sandbox_weather_override');
        if (wOverride === 'sunny') weatherEmoji = '☀️';
        else if (wOverride === 'rain') weatherEmoji = '🌧️';
        else if (wOverride === 'storm') weatherEmoji = '⚡';

        let weatherMultiplier = 1;
        const currentTutorialStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        if (currentTutorialStep >= 32) {
          if (weatherEmoji === '☀️') weatherMultiplier = 1.10; // 10% faster
          else if (weatherEmoji === '🌧️' || weatherEmoji === '⚡') weatherMultiplier = 0.95; // 5% slower
        }

        let baseSpeedMultiplier = Number(localStorage.getItem('sandbox_crop_speed') || 100) / 100;
        if (isNaN(baseSpeedMultiplier) || baseSpeedMultiplier <= 0) baseSpeedMultiplier = 1;
        const currentSpeedMultiplier = baseSpeedMultiplier * weatherMultiplier;

        await Promise.all(
          uniqueSeedIds.map(async (sid) => {
            // Strip rarity bits (12+) so rarity-encoded IDs map to the correct base growth time
            const numSid = Number(sid);
            const baseSeedNum = numSid > 0xFFF ? numSid & 0xFFF : numSid;
            const baseGt = getGrowthTime(baseSeedNum);
            const gt = Math.max(1, Math.floor(baseGt / currentSpeedMultiplier));
            const normalGt = Math.max(1, Math.floor(baseGt / baseSpeedMultiplier));
            growthTimeCache.set(sid.toString(), { gt, normalGt });
          })
        );

        const nowSec = Math.floor(Date.now() / 1000);
        const newCropArray = new CropItemArrayClass(30);
        for (const crop of crops) {
          if (crop.seedId && crop.seedId !== 0n) {
            const item = newCropArray.getItem(crop.plotNumber);
            if (item) {
              const seedIdBig = crop.seedId;
              item.seedId = seedIdBig;
              const endTime = Number(crop.endTime?.toString?.() || crop.endTime || 0);
              const growthTimeObj = growthTimeCache.get(seedIdBig.toString());
              const growthTime = growthTimeObj ? growthTimeObj.gt : 60;
              
              if (skippedCrops[crop.plotNumber]) {
                item.plantedAt = 1;
                item.contractPlantedAt = 1;
                item.growStatus = 2;
                item.growthTime = growthTime;
              } else {
                // Calculate plantedAt based on original growth time and current endTime
                // The endTime might be modified by Growth Elixir, so we need to account for that
                const originalEndTime = Math.floor((item.plantedAt || 0) / 1000) + growthTime;
                const timeDifference = originalEndTime - endTime;
                
                // Adjust plantedAt and record Growth Elixir application if any
                const originalPlantedAt = (endTime - growthTime) * 1000;
                item.contractPlantedAt = (isNaN(originalPlantedAt) || originalPlantedAt <= 0) ? Date.now() : originalPlantedAt;
                let wState = waterStateRef.current[crop.plotNumber];
                let pausedMs = (wState && !isNaN(wState.pausedMs)) ? wState.pausedMs : 0;
                item.plantedAt = item.contractPlantedAt + pausedMs;
                item.growthElixirApplied = timeDifference > 0;

                // Preserve needsWater from water state to prevent flicker on reload
                if (wState) {
                  const hasPest = bugsRef.current[crop.plotNumber] !== undefined || crowsRef.current[crop.plotNumber] !== undefined;
                  if (wState.needsInitial) {
                    item.needsWater = true;
                  } else if (wState.needsMid) {
                    const halfTime = (growthTime * 1000) / 2;
                    item.needsWater = (Date.now() - (item.contractPlantedAt + pausedMs)) >= halfTime || hasPest;
                  } else {
                    item.needsWater = hasPest;
                  }
                }

                // Tutorial: keep starter potato locked to growing; never reach harvestable state.
                const tsNow = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
                const isStarterPlot = [6, 7, 8].includes(crop.plotNumber);
                const tutorialFreeze = tsNow >= 17 && tsNow <= 25 && isStarterPlot;
                if (tutorialFreeze) {
                  item.growthTime = 9e12;
                  item.growStatus = 1;
                } else {
                  item.growthTime = growthTime;
                  const adjustedEndTime = Math.floor(item.plantedAt / 1000) + growthTime;
                  const isReady = adjustedEndTime <= nowSec;
                  item.growStatus = isReady ? 2 : 1;
                }
              }
              
              // Store potion effect multipliers and growth elixir status for display
              item.produceMultiplierX1000 = crop.produceMultiplierX1000 || 1000;
              item.tokenMultiplierX1000 = crop.tokenMultiplierX1000 || 1000;
              item.growthElixirApplied = !!crop.growthElixirApplied;
              
              // Fetch Fish Fertilizer scaling
              const savedPlotPrep = JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}');
              const pData = savedPlotPrep[crop.plotNumber];
              if (pData && pData.fishId) {
                  const fishItem = ALL_ITEMS[pData.fishId];
                  let boost = 1.05; // 5% base
                  if (fishItem && fishItem.type) {
                      if (fishItem.type.includes('UNCOMMON')) boost = 1.08;
                      if (fishItem.type.includes('RARE')) boost = 1.10;
                      if (fishItem.type.includes('EPIC')) boost = 1.15;
                      if (fishItem.type.includes('LEGENDARY')) boost = 1.25;
                  }
                  item.fishScaleBonus = boost; // Scale to be applied in FarmInterface visual
              }

              // Re-inject bugs/crows so they don't blink or reset animations on reload
              item.bugCountdown = bugsRef.current[crop.plotNumber];
              item.crowCountdown = crowsRef.current[crop.plotNumber];
            }
          } else {
            newCropArray.removeCropAt(crop.plotNumber);
          }
        }

        // Force state updates to trigger re-renders
        setCropArray(newCropArray);
        setPreviewCropArray(newCropArray);
        setUserCropsLoaded(true);
        
        // Force a re-render by updating the preview key
        setPreviewUpdateKey(prev => prev + 1);
        
        // Clear any stale selection state when loading crops
        setSelectedIndexes([]);
        
      } catch (error) {
        const { message } = handleContractError(error, 'loading crops');
        console.error("Failed to load crops from contract:", message);
        const emptyArray = new CropItemArrayClass(30);
        setCropArray(emptyArray);
        setPreviewCropArray(emptyArray);
        setUserCropsLoaded(true);
      }
    },
    [getUserCrops, simulatedDate]
  );

  const handleForceSpawnBug = () => {
    const validPlots = [];
    const nowSec = Math.floor(Date.now() / 1000);

    for (let i = 0; i < 30; i++) {
      const item = cropArray.getItem(i);
      if (item && item.seedId && item.seedId !== 0n && bugsRef.current[i] === undefined) {
        let isProtected = false;
        for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
          const sc = scarecrowsRef.current[spotId];
          if (sc) {
             const exp = typeof sc === 'number' ? sc : sc.expiry;
             const type = typeof sc === 'number' ? 'tier1' : sc.type;
             if (exp > nowSec && type === 'ladybug_scarecrow' && protectedPlots.includes(i)) {
                 isProtected = true;
                 break;
             }
          }
          if (ladybugsRef.current[spotId] > nowSec && protectedPlots.includes(i)) {
            isProtected = true;
            break;
          }
        }
        if (!isProtected) validPlots.push(i);
      }
    }
    if (validPlots.length > 0) {
      const target = validPlots[Math.floor(Math.random() * validPlots.length)];
      bugsRef.current[target] = 60; // 60s timer
      show(`Bug spawned on plot ${target}!`, "warning");
    } else {
      show("No available crops for a bug!", "info");
    }
  };

  const handleForceSpawnCrow = () => {
    const validPlots = [];
    const nowSec = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < 30; i++) {
      const item = cropArray.getItem(i);
      if (item && item.seedId && item.seedId !== 0n && crowsRef.current[i] === undefined) {
        let isProtected = false;
        for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
          const sc = scarecrowsRef.current[spotId];
          if (sc) {
            const exp = typeof sc === 'number' ? sc : sc.expiry;
            const type = typeof sc === 'number' ? 'tier1' : sc.type;
            
            if (exp > nowSec) {
              let protectsThisPlot = false;
              if (type === 'tier4') protectsThisPlot = true;
              else if (type === 'tier3') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 5;
              else if (type === 'tier2') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 2;
              else protectsThisPlot = protectedPlots.includes(i);
              
              if (protectsThisPlot) {
                isProtected = true;
                break;
              }
            }
          }
        }
        if (!isProtected) validPlots.push(i);
      }
    }

    if (validPlots.length > 0) {
      const target = validPlots[Math.floor(Math.random() * validPlots.length)];
      crowsRef.current[target] = 30; // 30s timer
      show(`Crow spawned on plot ${target}!`, "warning");
    } else {
      show("No unprotected crops available for a crow!", "info");
    }
  };



  useEffect(() => {
    const onAdminDeleteSpot = (e) => {
      if (e.detail.id !== null) handleRemoveScarecrow(e.detail.id);
      else { setScarecrows({}); scarecrowsRef.current = {}; localStorage.setItem('sandbox_scarecrows', JSON.stringify({})); }
    };
    const onAdminDeleteLadybug = (e) => {
      if (e.detail.id !== null) handleRemoveLadybug(e.detail.id);
      else { setLadybugs({}); ladybugsRef.current = {}; localStorage.setItem('sandbox_ladybugs', JSON.stringify({})); }
    };
    const onAdminDeleteSprinkler = (e) => {
      if (e.detail.id !== null) handleRemoveSprinkler(e.detail.id);
      else { setSprinklers({}); sprinklersRef.current = {}; localStorage.setItem('sandbox_sprinklers', JSON.stringify({})); }
    };
    const onAdminDeleteUmbrella = (e) => {
      if (e.detail.id !== null) handleRemoveUmbrella(e.detail.id);
      else { setUmbrellas({}); umbrellasRef.current = {}; localStorage.setItem('sandbox_umbrellas', JSON.stringify({})); }
    };
    const onAdminDeleteTesla = (e) => {
      if (e.detail.id !== null) {
        setTeslaTowers(prev => { const next = { ...prev }; delete next[e.detail.id]; teslaTowersRef.current = next; localStorage.setItem('sandbox_tesla', JSON.stringify(next)); return next; });
      } else {
        setTeslaTowers({}); teslaTowersRef.current = {}; localStorage.setItem('sandbox_tesla', JSON.stringify({}));
      }
    };

    const onAdminClearCrops = () => {
      const emptyCrops = new Array(30).fill(null).map(() => ({ id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 }));
      localStorage.setItem('sandbox_crops', JSON.stringify(emptyCrops));
      const emptyArray = new CropItemArrayClass(30);
      setCropArray(emptyArray);
      setPreviewCropArray(emptyArray);
      
      setPlotPrep({});
      localStorage.removeItem('sandbox_plot_prep');
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: {} }));
      
      waterStateRef.current = {};
      localStorage.setItem('sandbox_water_state', JSON.stringify({}));
      localStorage.removeItem('sandbox_skipped_crops');

      setPreviewUpdateKey(prev => prev + 1);
    };
    const onAdminClearPests = () => {
      bugsRef.current = {};
      crowsRef.current = {};
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        for(let i = 0; i < 30; i++) {
           const item = newArr.getItem(i);
           if(item) {
             item.bugCountdown = undefined;
             item.crowCountdown = undefined;
           }
        }
        return newArr;
      });
    };
    const onToggleAutoSpawn = (e) => autoSpawnRef.current = e.detail;
    const onResetPlotPrep = (e) => updatePlotPrep(e.detail.plotIndex, { status: 0 });
    const onSetAllPlotsX = () => {
      const next = {};
      for (let i = 0; i < maxPlots; i++) next[i] = { status: 0 };
      setPlotPrep(next);
      localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
    };
    const onSkipTutorial = () => {
      setTutorialStep(36);
      localStorage.setItem('sandbox_tutorial_step', '36');
      setIsDigging(false);
      setIsDirting(false);
      setIsSeeding(false);
    };

    const onSkipTime = () => {
      const skipAmount = 24 * 60 * 60 * 1000;
      const currentWaterState = { ...waterStateRef.current };
      let changed = false;
      for (const idx in currentWaterState) {
        if (currentWaterState[idx].contractPlantedAt) {
          currentWaterState[idx].contractPlantedAt -= skipAmount;
          changed = true;
        }
      }
      if (changed) {
        waterStateRef.current = currentWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
        setPreviewUpdateKey(prev => prev + 1);
      }
    };

    const handleOpenCrafting = (e) => {
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
    };

    const onChangeSimulatedDate = (e) => {
      setSimulatedDay(e.detail.day);
      setSimulatedDate(e.detail.date);
    };

    window.addEventListener('forceSpawnBug', handleForceSpawnBug);
    window.addEventListener('forceSpawnCrow', handleForceSpawnCrow);
    window.addEventListener('adminDeleteSpot', onAdminDeleteSpot);
    window.addEventListener('adminDeleteLadybug', onAdminDeleteLadybug);
    window.addEventListener('adminDeleteSprinkler', onAdminDeleteSprinkler);
    window.addEventListener('adminDeleteUmbrella', onAdminDeleteUmbrella);
    window.addEventListener('adminDeleteTesla', onAdminDeleteTesla);
    window.addEventListener('adminClearCrops', onAdminClearCrops);
    window.addEventListener('adminClearPests', onAdminClearPests);
    window.addEventListener('changeSimulatedDate', onChangeSimulatedDate);
    window.addEventListener('toggleAutoSpawn', onToggleAutoSpawn);
    window.addEventListener('resetPlotPrep', onResetPlotPrep);
    window.addEventListener('setAllPlotsX', onSetAllPlotsX);
    window.addEventListener('skipTutorial', onSkipTutorial);
    window.addEventListener('skipTime', onSkipTime);
    window.addEventListener('openCraftingFor', handleOpenCrafting);

    return () => {
      window.removeEventListener('forceSpawnBug', handleForceSpawnBug);
      window.removeEventListener('forceSpawnCrow', handleForceSpawnCrow);
      window.removeEventListener('adminDeleteSpot', onAdminDeleteSpot);
      window.removeEventListener('adminDeleteLadybug', onAdminDeleteLadybug);
      window.removeEventListener('adminDeleteSprinkler', onAdminDeleteSprinkler);
      window.removeEventListener('adminDeleteUmbrella', onAdminDeleteUmbrella);
      window.removeEventListener('adminDeleteTesla', onAdminDeleteTesla);
      window.removeEventListener('adminClearCrops', onAdminClearCrops);
      window.removeEventListener('adminClearPests', onAdminClearPests);
      window.removeEventListener('changeSimulatedDate', onChangeSimulatedDate);
      window.removeEventListener('toggleAutoSpawn', onToggleAutoSpawn);
      window.removeEventListener('resetPlotPrep', onResetPlotPrep);
      window.removeEventListener('setAllPlotsX', onSetAllPlotsX);
      window.removeEventListener('skipTutorial', onSkipTutorial);
      window.removeEventListener('skipTime', onSkipTime);
      window.removeEventListener('openCraftingFor', handleOpenCrafting);
    };
  }, [handleRemoveScarecrow, handleRemoveLadybug, handleRemoveSprinkler, handleRemoveUmbrella, loadCropsFromContract, cropArray, updatePlotPrep]);

  useEffect(() => {
    if (localStorage.getItem("pendingScarecrowPlacement") === "true") {
      localStorage.removeItem("pendingScarecrowPlacement");
      setPlacingScarecrowType('tier1');
      setIsPlacingScarecrow(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsPlacingTesla(false);
      setIsFarmMenu(false); // Keep farm active so animations don't restart
      setTimeout(() => show("Select a white border to place your scarecrow!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingLadybugPlacement") === "true") {
      localStorage.removeItem("pendingLadybugPlacement");
      setIsPlacingLadybug(true);
      setIsPlacingScarecrow(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active
      setTimeout(() => show("Select a red border to place your ladybug!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingSprinklerPlacement") === "true") {
      localStorage.removeItem("pendingSprinklerPlacement");
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      setTimeout(() => show("Select a blue border to place your sprinkler!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingUmbrellaPlacement") === "true") {
      localStorage.removeItem("pendingUmbrellaPlacement");
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      setTimeout(() => show("Select a purple border to place your umbrella!", "info"), 500);
    }

  }, [show]);

  useEffect(() => {
    setPreviewUpdateKey(prev => prev + 1);
  }, [cropArray]);

  // Listen for potion usage events from inventory
  useEffect(() => {
    const handleStartPotionUsage = (event) => {
      const { id, name } = event.detail;
      
      const isScarecrowVariant = [ID_POTION_ITEMS.SCARECROW, 9979, 9978, 9977, 9976].includes(id);
      if (isScarecrowVariant) {
        if (id === ID_POTION_ITEMS.SCARECROW) setPlacingScarecrowType('tier1');
        else if (id === 9979) setPlacingScarecrowType('ladybug_scarecrow');
        else if (id === 9978) setPlacingScarecrowType('tier2');
        else if (id === 9977) setPlacingScarecrowType('tier3');
        else if (id === 9976) setPlacingScarecrowType('tier4');

        setIsPlacingScarecrow(true);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsPlacingTesla(false);
        setIsFarmMenu(false); // Keep farm active so animations don't restart
        return;
      }
      
      if (id === 9975) { // Tesla Tower
        setIsPlacingTesla(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      if (id === ID_POTION_ITEMS.LADYBUG) {
        setIsPlacingLadybug(true);
        setIsPlacingScarecrow(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsPlacingTesla(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false); // Keep farm active
        return;
      }
      if (id === 9998) {
        setIsPlacingSprinkler(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingUmbrella(false);
        setIsPlacingTesla(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      if (id === 9999) {
        setIsPlacingUmbrella(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsPlacingTesla(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      if (id === 9987) {
        setShowEasterBasket(true);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      setSelectedPotion({ id, name });
      setIsUsingPotion(true);
      setIsPlanting(false);
      setIsFarmMenu(true);
    };

    window.addEventListener('startPotionUsage', handleStartPotionUsage);
    
    return () => {
      window.removeEventListener('startPotionUsage', handleStartPotionUsage);
    };
  }, []);

  const getAvailableSeeds = useCallback(() => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    let seedsList = [...(currentSeeds || [])];

    if (allItems) {
      allItems.forEach(item => {
        const itemData = ALL_ITEMS[item.id];
        if (itemData?.category === ID_ITEM_CATEGORIES.SEED) {
          const localCount = sandboxLoot[item.id] || 0;
          if (localCount > 0) {
            const existing = seedsList.find(s => s.id === item.id);
            if (!existing) {
              seedsList.push({ ...item, count: localCount });
            } else {
              existing.count = Math.max(existing.count, localCount);
            }
          }
        }
      });
    }

    return seedsList
      .map((seed) => ({
        ...seed,
        count: Math.max(0, seed.count - (usedSeedsInPreview[seed.id] || 0)),
      }))
      .filter((seed) => seed.count > 0);
  }, [currentSeeds, allItems, usedSeedsInPreview]);

  const playPlantConfirmSound = useCallback(() => {
    if (!plantConfirmAudioRef.current) {
      plantConfirmAudioRef.current = new Audio("/sounds/FinalPlantConfirmButton.wav");
      plantConfirmAudioRef.current.preload = "auto";
    }
    const audio = plantConfirmAudioRef.current;
      const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
      const volume = clampVolume(volumeSetting);
      if (volume <= 0) return;
      audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  useEffect(() => {
    if (waterEffects.length > 0) {
      const timer = setTimeout(() => {
        setWaterEffects(prev => prev.filter(e => Date.now() - e.time < 1000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [waterEffects]);

  const playHarvestConfirmSound = useCallback(() => {
    if (!harvestConfirmAudioRef.current) {
      harvestConfirmAudioRef.current = new Audio("/sounds/FinalHarvestConfirmButton.wav");
      harvestConfirmAudioRef.current.preload = "auto";
    }
    const audio = harvestConfirmAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
    const volume = clampVolume(volumeSetting);
    if (volume <= 0) return;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  const playWaterSound = useCallback(() => {
    const audio = new Audio("/sounds/water.mp3");
    const volumeSetting = parseFloat(settings?.soundVolume ?? defaultSettings.soundVolume) / 100;
    const volume = clampVolume(volumeSetting);
    if (volume <= 0) return;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);
  
  // Keep Farm updated with tutorial steps that progress outside of Farm
  useEffect(() => {
    const stepHandler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', stepHandler);
    return () => window.removeEventListener('tutorialStepChanged', stepHandler);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setMaxPlots(await getMaxPlots());
        await loadCropsFromContract();
      } catch (error) {
        const { message } = handleContractError(error, 'loading user data');
        console.error("Failed to load user data:", message);
      }
    };

    loadUserData();
  }, [loadCropsFromContract, getMaxPlots]);

  // Listen for crop refresh events (after planting)
  useEffect(() => {
    const handleCropsRefresh = async (event) => {
      await loadCropsFromContract();
    };

    window.addEventListener('cropsRefreshed', handleCropsRefresh);
    
    return () => {
      window.removeEventListener('cropsRefreshed', handleCropsRefresh);
    };
  }, [loadCropsFromContract]);

  // Listen for bug interactions and destructions
  useEffect(() => {
    const handleTriggerDestroy = async (event) => {
      const { plotIndex } = event.detail;
      if (destroyCrop) {
        await destroyCrop(plotIndex);
        show(`Oh no! A bug ate your crop at plot ${plotIndex + 1}!`, "error");
        await loadCropsFromContract();
        setPreviewUpdateKey(prev => prev + 1);
      }
    };

    const handleSquashBug = (event) => {
      const { plotIndex } = event.detail;
      delete bugsRef.current[plotIndex];

      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) {
          item.bugCountdown = undefined;
          const wState = waterStateRef.current[plotIndex];
          if (wState) {
             const hasOtherPest = crowsRef.current[plotIndex] !== undefined;
             const isHalfway = wState.needsMid && (Date.now() - (wState.contractPlantedAt + (wState.pausedMs || 0))) >= (item.growthTime * 1000) / 2;
             item.needsWater = hasOtherPest || wState.needsInitial || isHalfway;
          }
        }
        return newArr;
      });
      // (Top-right "Bug squashed!" notification removed — silent kill.)

      if (tutPostWaterRef.current) {
        tutBugKilledRef.current = true;
        setTimeout(() => {
          crowsRef.current[plotIndex] = 9999; // long countdown so it never harms crops
          setCropArray(prev => {
            const newArr = new CropItemArrayClass(30);
            newArr.copyFrom(prev);
            const item = newArr.getItem(plotIndex);
            if (item) item.crowCountdown = 9999;
            return newArr;
          });
        }, 1500);
      }
    };

    const handleScareCrow = (event) => {
      const { plotIndex } = event.detail;
      delete crowsRef.current[plotIndex];

      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) {
           item.crowCountdown = undefined;
           const wState = waterStateRef.current[plotIndex];
           if (wState) {
              const hasOtherPest = bugsRef.current[plotIndex] !== undefined;
              const isHalfway = wState.needsMid && (Date.now() - (wState.contractPlantedAt + (wState.pausedMs || 0))) >= (item.growthTime * 1000) / 2;
              item.needsWater = hasOtherPest || wState.needsInitial || isHalfway;
           }
        }
        return newArr;
      });
      // (Top-right "Crow scared away!" notification removed — silent kill.)

      if (tutPostWaterRef.current && tutBugKilledRef.current) {
        tutPostWaterRef.current = false;
        tutBugKilledRef.current = false;
        setTutPageSync(10);
      }
    };

    window.addEventListener('triggerDestroyCrop', handleTriggerDestroy);
    window.addEventListener('squashBug', handleSquashBug);
    window.addEventListener('scareCrow', handleScareCrow);

    return () => {
      window.removeEventListener('triggerDestroyCrop', handleTriggerDestroy);
      window.removeEventListener('squashBug', handleSquashBug);
      window.removeEventListener('scareCrow', handleScareCrow);
    };
  }, [destroyCrop, loadCropsFromContract, show]);

  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update growth when not in farm menu to prevent flickering during harvest selection
      if (!isFarmMenu) {
        // Lightning mechanic
        let currentWeather = getWeatherForDay(simulatedDateRef.current);
        const wOverride = localStorage.getItem('sandbox_weather_override');
        if (wOverride === 'sunny') currentWeather = '☀️';
        else if (wOverride === 'rain') currentWeather = '🌧️';
        else if (wOverride === 'storm') currentWeather = '⚡';

        const currentTutorialStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        if (currentTutorialStep < 32) currentWeather = null;
        const isRainingNow = currentWeather === '⚡' || currentWeather === '🌧️';
        if (currentWeather === '⚡') {
          // ~5% chance every 1.5 hours (5400 seconds)
          if (Math.random() < 0.00001) {
            const nowSeconds = Math.floor(Date.now() / 1000);
            
            let isTeslaProtected = false;
            for (const tExp of Object.values(teslaTowersRef.current)) {
               if (tExp > nowSeconds) {
                  isTeslaProtected = true;
                  break;
               }
            }
            
            if (isTeslaProtected) {
              window.dispatchEvent(new CustomEvent('showNotification', { detail: { msg: "⚡ Lightning struck, but your Tesla Tower safely grounded it!", type: "info" } }));
              return;
            }

            const activeScarecrows = Object.entries(scarecrowsRef.current).filter(([k,v]) => (typeof v === 'number' ? v : v.expiry) > nowSeconds);
            const activeLadybugs = Object.entries(ladybugsRef.current).filter(([k,v]) => v > nowSeconds);
            
            const total = activeScarecrows.length + activeLadybugs.length;
            if (total > 0) {
              const idx = Math.floor(Math.random() * total);
              if (idx < activeScarecrows.length) {
                handleRemoveScarecrow(activeScarecrows[idx][0]);
                show(`⚡ Lightning struck and destroyed a scarecrow!`, "error");
              } else {
                handleRemoveLadybug(activeLadybugs[idx - activeScarecrows.length][0]);
                show(`⚡ Lightning struck and destroyed a ladybug!`, "error");
              }
            }
          }
        }

        // Process bugs safely
        const currentBugs = { ...bugsRef.current };
        const currentCrows = { ...crowsRef.current };
        let cropsToDestroy = [];
        let pestsChanged = false;
        
        for (const idx in currentBugs) {
          if (currentBugs[idx] > 1) { // Cap bugs at 1 so they just pause and never destroy
            currentBugs[idx] -= 1;
            pestsChanged = true;
          }
        }
        for (const idx in currentCrows) {
          if (currentTutorialStep > 0 && currentTutorialStep < 32) {
            // During tutorial: freeze crow countdown so it never destroys the crop
            pestsChanged = true;
          } else {
            currentCrows[idx] -= 1;
            pestsChanged = true;
            if (currentCrows[idx] <= 0) {
              if (!cropsToDestroy.includes(Number(idx))) {
                cropsToDestroy.push(Number(idx));
              }
              delete currentCrows[idx];
            }
          }
        }
        bugsRef.current = currentBugs;
        crowsRef.current = currentCrows;

        const currentWaterState = waterStateRef.current;
        const now = Date.now();

        setCropArray((prevCropArray) => {
          let hasChanges = cropsToDestroy.length > 0 || pestsChanged;
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          
          const oldStatuses = [];
          for (let i = 0; i < 30; i++) {
             const item = prevCropArray.getItem(i);
             oldStatuses.push(item ? item.growStatus : null);
          }
          newCropArray.updateGrowth();
          for (let i = 0; i < 30; i++) {
             const newItem = newCropArray.getItem(i);
             if (newItem && newItem.growStatus !== oldStatuses[i]) {
                hasChanges = true;
             }
          }

          if (cropsToDestroy.length > 0) {
            cropsToDestroy.forEach(idx => {
              window.dispatchEvent(new CustomEvent('triggerDestroyCrop', { detail: { plotIndex: idx } }));
              // Instantly clear the crop on UI before the backend syncs
              const item = newCropArray.getItem(idx);
              if (item) {
                  item.seedId = 0n;
                  item.bugCountdown = undefined;
                  item.crowCountdown = undefined;
              }
              delete currentWaterState[idx];
              // Revert plot to hole state so the empty dirt shows correctly
              window.dispatchEvent(new CustomEvent('crowAteAtPlot', { detail: { plotIndex: idx } }));
            });
            localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
          }
          
          // Randomly spawn pests
          for (let i = 0; i < 30; i++) {
            const item = newCropArray.getItem(i);
            if (item && item.seedId && item.seedId !== 0n && !cropsToDestroy.includes(i)) {
              let wState = currentWaterState[i];
              if (!wState) {
                wState = { needsInitial: true, needsMid: false, pausedMs: 0, contractPlantedAt: item.contractPlantedAt || item.plantedAt };
                currentWaterState[i] = wState;
                localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
                hasChanges = true;
              }
              
              if (item.contractPlantedAt !== undefined && !isNaN(item.contractPlantedAt)) {
                wState.contractPlantedAt = item.contractPlantedAt;
                delete item.contractPlantedAt;
                hasChanges = true;
              } else if (wState.contractPlantedAt === undefined || isNaN(wState.contractPlantedAt)) {
                wState.contractPlantedAt = item.plantedAt || now;
                hasChanges = true;
              }
              if (isNaN(wState.pausedMs)) {
                 wState.pausedMs = 0;
                 hasChanges = true;
              }

              let basePlantedAt = wState.contractPlantedAt;
              let isPaused = false;
              const hasPest = bugsRef.current[i] !== undefined || crowsRef.current[i] !== undefined;

              if (wState.needsInitial) {
                isPaused = true;
                wState.pausedMs = now - basePlantedAt;
                hasChanges = true;
              } else if (wState.needsMid) {
                const elapsed = now - (basePlantedAt + wState.pausedMs);
                const halfTime = (item.growthTime * 1000) / 2;
                if (elapsed >= halfTime) {
                  isPaused = true;
                  wState.pausedMs = now - halfTime - basePlantedAt;
                  hasChanges = true;
                } else if (hasPest) {
                  isPaused = true;
                  wState.pausedMs += 1000; // Pause timer accumulation
                  hasChanges = true;
                }
              } else if (hasPest) {
                 isPaused = true;
                 wState.pausedMs += 1000; // Pause timer accumulation
                 hasChanges = true;
              }

              if (item.needsWater !== isPaused) {
                 item.needsWater = isPaused;
                 hasChanges = true;
              }
              const newPlantedAt = basePlantedAt + wState.pausedMs;
              if (item.plantedAt !== newPlantedAt) {
                 item.plantedAt = newPlantedAt;
                 hasChanges = true;
              }

              // Pest spawning logic
              const nowSec = Math.floor(Date.now() / 1000);
              
              let isProtectedFromCrows = false;
              let isProtectedFromBugs = false;
              let hasSprinkler = false;
              let hasUmbrella = false;
              for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
                // Check Advanced Scarecrow Protection Logic
                const sc = scarecrowsRef.current[spotId];
                if (sc) {
                  const exp = typeof sc === 'number' ? sc : sc.expiry;
                  const type = typeof sc === 'number' ? 'tier1' : sc.type;
                  
                  if (exp > nowSec) {
                    let protectsThisPlot = false;
                    if (type === 'tier4') protectsThisPlot = true;
                    else if (type === 'tier3') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 5; // Protects ~11 plots around it
                    else if (type === 'tier2') protectsThisPlot = Math.abs(i - protectedPlots[0]) <= 2; // Protects ~5 plots around it
                    else protectsThisPlot = protectedPlots.includes(i); // Tier 1 and Ladybug Scarecrow

                    if (protectsThisPlot) {
                      isProtectedFromCrows = true;
                      if (type === 'ladybug_scarecrow') isProtectedFromBugs = true;
                    }
                  }
                }
                
                // Check other protections
                if (protectedPlots.includes(i)) {
                  if (scarecrowsRef.current[spotId] > nowSec) isProtectedFromCrows = true;
                  if (ladybugsRef.current[spotId] > nowSec) isProtectedFromBugs = true;
                  if (sprinklersRef.current[spotId] > nowSec) hasSprinkler = true;
                  if (umbrellasRef.current[spotId] > nowSec) hasUmbrella = true;
                }
              }

              if (hasSprinkler || isRainingNow) {
                if (wState.needsInitial || wState.needsMid) {
                   wState.needsInitial = false;
                   wState.needsMid = false;
                   hasChanges = true;
                   localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
                }
              }

              // Instantly clear existing crows if a scarecrow was just placed to protect this plot
              if (isProtectedFromCrows && crowsRef.current[i] !== undefined) {
                delete crowsRef.current[i];
                item.crowCountdown = undefined;
                hasChanges = true;
              }

              // Instantly clear existing bugs if a ladybug was just placed
              if (isProtectedFromBugs && bugsRef.current[i] !== undefined) {
                delete bugsRef.current[i];
                item.bugCountdown = undefined;
                hasChanges = true;
              }

              const tutPestsDone = localStorage.getItem('sandbox_tutorial_pests_done') === 'true';
              const tutStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
              const inTutorial = tutStep > 0 && tutStep < 36;
              // Skip pest spawns while the plot is still on the sign frame (initial water not yet given).
              const wStateForSpawn = waterStateRef.current[i];
              const onSignFrame = wStateForSpawn?.needsInitial === true;
              if (!onSignFrame && autoSpawnRef.current && bugsRef.current[i] === undefined && crowsRef.current[i] === undefined && !(inTutorial && tutPestsDone)) {
                // Throttle the spawn check to once every 10 seconds per plot (was every 1s).
                // Probabilities below are now "per 10s" instead of "per second", so we keep
                // the same numerical chance per check but just check 10x less often.
                const nowMs = Date.now();
                const lastRoll = lastPestRollAtRef.current[i] || 0;
                if (nowMs - lastRoll >= 10000) {
                  lastPestRollAtRef.current[i] = nowMs;
                  // Halve pest spawn rates at night (18:00 - 06:00 ET) — crops are quieter while
                  // the player is "sleeping". Day: crow 0.5% / bug 1.0% per check. Night halved.
                  let isNight = false;
                  try {
                    const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }).formatToParts(new Date()).find(p => p.type === 'hour').value, 10);
                    isNight = h >= 18 || h < 6;
                  } catch (_) {}
                  const nightFactor = isNight ? 0.5 : 1.0;
                  const roll = Math.random();
                  if (roll < 0.005 * nightFactor) {
                    if (!isProtectedFromCrows && !inTutorial) {
                      crowsRef.current[i] = 30;
                      item.crowCountdown = 30;
                      hasChanges = true;
                    }
                  } else if (roll < 0.015 * nightFactor) {
                    if (!inTutorial) {
                      bugsRef.current[i] = 60;
                      item.bugCountdown = 60;
                      hasChanges = true;
                      const prevSpawns = parseInt(localStorage.getItem('sandbox_total_bug_spawns') || '0', 10) + 1;
                      localStorage.setItem('sandbox_total_bug_spawns', String(prevSpawns));
                    }
                  }
                }
              }
              if (item.bugCountdown !== bugsRef.current[i] || item.crowCountdown !== crowsRef.current[i]) {
                 item.bugCountdown = bugsRef.current[i];
                 item.crowCountdown = crowsRef.current[i];
                 hasChanges = true;
              }
            } else {
              // Clean up if a crop was harvested legitimately
              if (bugsRef.current[i] !== undefined) {
                delete bugsRef.current[i];
                hasChanges = true;
              }
              if (crowsRef.current[i] !== undefined) {
                delete crowsRef.current[i];
                hasChanges = true;
              }
            }
          }
          return hasChanges ? newCropArray : prevCropArray;
        });
      }

      // Always update preview array growth, but only if we're in farm menu
      if (isFarmMenu) {
        setPreviewCropArray((prevPreviewCropArray) => {
          let hasChanges = false;
          const newPreviewCropArray = new CropItemArrayClass(30);
          newPreviewCropArray.copyFrom(prevPreviewCropArray);

          const oldStatuses = [];
          for (let i = 0; i < 30; i++) {
             const item = prevPreviewCropArray.getItem(i);
             oldStatuses.push(item ? item.growStatus : null);
          }
          newPreviewCropArray.updateGrowth();
          for (let i = 0; i < 30; i++) {
             const newItem = newPreviewCropArray.getItem(i);
             if (newItem && newItem.growStatus !== oldStatuses[i]) {
                hasChanges = true;
             }
          }

          // Sync preview array plantedAt with water state to pause preview correctly
          const currentWaterState = waterStateRef.current;
          for (let i = 0; i < 30; i++) {
            const item = newPreviewCropArray.getItem(i);
            if (item && item.seedId && item.seedId !== 0n) {
              const wState = currentWaterState[i];
              if (wState && wState.contractPlantedAt !== undefined && !isNaN(wState.contractPlantedAt)) {
                let pausedMs = isNaN(wState.pausedMs) ? 0 : wState.pausedMs;
                const newPlantedAt = wState.contractPlantedAt + pausedMs;
                if (item.plantedAt !== newPlantedAt) {
                   item.plantedAt = newPlantedAt;
                   hasChanges = true;
                }
                const isPaused = wState.needsInitial || (wState.needsMid && (Date.now() - item.plantedAt) >= (item.growthTime * 1000) / 2);
                if (item.needsWater !== isPaused) {
                   item.needsWater = isPaused;
                   hasChanges = true;
                }
              }
              
              if (item.bugCountdown !== bugsRef.current[i]) { item.bugCountdown = bugsRef.current[i]; hasChanges = true; }
              if (item.crowCountdown !== crowsRef.current[i]) { item.crowCountdown = crowsRef.current[i]; hasChanges = true; }
            }
          }

          return hasChanges ? newPreviewCropArray : prevPreviewCropArray;
        });
      }
    }, 1000); // Update every second

    setGrowthTimer(interval);
    return () => clearInterval(interval);
  }, [isFarmMenu]); // Add isFarmMenu as dependency

  const startPlanting = () => {
    // Check if userCrops are loaded before allowing planting mode
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (!isFarmMenu) {
      setPreviewCropArray(cropArray);
      // Reset used seeds tracking when starting planting
      setUsedSeedsInPreview({});
    }
    setIsFarmMenu(true);
    setIsPlanting(true);
  };

  // Batch plant function - plant best seeds in all empty slots automatically
  const plantAll = useCallback(async () => {

    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    // Ensure farm menu is open to show preview
    if (!isFarmMenu) {
      setIsFarmMenu(true);
      setIsPlanting(true);
      // Reset used seeds tracking when opening farm menu
      setUsedSeedsInPreview({});
    }

    // Check if there are any empty plots available
    const occupiedPlots = [];
    const emptyPlotNumbers = [];
    for (let i = 0; i < maxPlots; i++) {
      const item = cropArray.getItem(i);
      if (item && (item.seedId === null || item.seedId === undefined || item.seedId === 0n)) {
        if (plotPrep[i]?.status === 3) {
          emptyPlotNumbers.push(i);
        }
      } else if (item && item.seedId) {
        occupiedPlots.push({
          plot: i,
          seedId: item.seedId,
          status: item.growStatus,
        });
      }
    }

    if (emptyPlotNumbers.length === 0) {
      show("No prepared dirt plots available! Click the red X to dig and place dirt.", "info");
      return;
    }

    const newWaterState = { ...waterStateRef.current };

    // Sort seeds by quality (best first): LEGENDARY > EPIC > RARE > UNCOMMON > COMMON
    const qualityOrder = {
      ID_RARE_TYPE_LEGENDARY: 5,
      ID_RARE_TYPE_EPIC: 4,
      ID_RARE_TYPE_RARE: 3,
      ID_RARE_TYPE_UNCOMMON: 2,
      ID_RARE_TYPE_COMMON: 1,
    };

    const sortedSeeds = (currentSeeds || [])
      .filter((seed) => seed.count > 0)
      .sort((a, b) => {
        const aQuality = qualityOrder[a.category] || 0;
        const bQuality = qualityOrder[b.category] || 0;
        if (aQuality !== bQuality) {
          return bQuality - aQuality; // Higher quality first
        }
        return (b.yield || 0) - (a.yield || 0); // Higher yield first for same quality
      });


    if (sortedSeeds.length === 0) {
      show("You don't have any seeds to plant!", "info");
      return;
    }

    // Plant seeds starting with the best quality
    const encodedIdsToPlant = [];
    const plantedSeedIds = [];
    for (const seed of sortedSeeds) {
      if (emptyPlotNumbers.length === 0) break;
      let countToPlant = Math.min(seed.count, emptyPlotNumbers.length);
      for (let i = 0; i < countToPlant; i++) {
          const plotIdx = emptyPlotNumbers.shift();
          const category = seed.id >> 8;
          const localId = seed.id & 0xFF;
          const subtype = getSubtype(seed.id);
          encodedIdsToPlant.push((plotIdx << 24) | (category << 16) | (subtype << 8) | localId);
          plantedSeedIds.push(seed.id);
          newWaterState[plotIdx] = { needsInitial: true, needsMid: false, pausedMs: 0, contractPlantedAt: Date.now() };
      }
    }

    if (encodedIdsToPlant.length === 0) {
      show("No seeds were planted. All plots may already be occupied.", "info");
      return;
    }

    waterStateRef.current = newWaterState;
    localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

    playPlantConfirmSound();
    show(`Planting ${encodedIdsToPlant.length} seeds...`, "info");
    const result = await plantBatch(encodedIdsToPlant);
    if (result) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        for (const sid of plantedSeedIds) {
            if (sandboxLoot[sid] > 0) sandboxLoot[sid] -= 1;
        }
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        
        show(`✅ Successfully planted ${encodedIdsToPlant.length} seeds!`, "success");
        await loadCropsFromContract();
        if (typeof refetchSeeds === "function") refetchSeeds();
        setPreviewUpdateKey(prev => prev + 1);
        setIsFarmMenu(false);
    } else {
        show("❌ Failed to plant seeds.", "error");
    }
  }, [userCropsLoaded, maxPlots, isFarmMenu, cropArray, currentSeeds, show, plantBatch, loadCropsFromContract, refetchSeeds, playPlantConfirmSound]);

  const startHarvesting = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const startPotionUsage = (potionId, potionName) => {
    if (potionId === ID_POTION_ITEMS.SCARECROW) {
      setIsPlacingScarecrow(true);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active so animations don't restart
      show("Select a spot to place your scarecrow!", "info");
      return;
    }
    
    const isScarecrowVariant = [9979, 9978, 9977, 9976].includes(potionId);
    if (isScarecrowVariant) {
      if (potionId === 9979) setPlacingScarecrowType('ladybug_scarecrow');
      else if (potionId === 9978) setPlacingScarecrowType('tier2');
      else if (potionId === 9977) setPlacingScarecrowType('tier3');
      else if (potionId === 9976) setPlacingScarecrowType('tier4');

      setIsPlacingScarecrow(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsFarmMenu(false);
      show("Select a spot to place your advanced scarecrow!", "info");
      return;
    }
    
    if (potionId === 9975) {
      setIsPlacingTesla(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your Tesla Tower!", "info");
      return;
    }
    if (potionId === ID_POTION_ITEMS.LADYBUG) {
      setIsPlacingLadybug(true);
      setIsPlacingScarecrow(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a red border to place your ladybug!", "info");
      return;
    }
    if (potionId === 9998) {
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a blue border to place your sprinkler!", "info");
      return;
    }
    if (potionId === 9999) {
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a purple border to place your umbrella!", "info");
      return;
    }
    if (potionId === 9987) {
      setShowEasterBasket(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      return;
    }
    setSelectedPotion({ id: potionId, name: potionName });
    setIsUsingPotion(true);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const handlePlaceScarecrow = (spotId, type) => {
    let duration = 3; // default tier 1 and ladybug
    if (type === 'tier2') duration = 12;
    if (type === 'tier3') duration = 48; // 2 days
    if (type === 'tier4') duration = 120; // 5 days
    if (type === 'ladybug_scarecrow') duration = 4;

    const expiryTime = Math.floor(Date.now() / 1000) + duration * 60 * 60;
    const newScarecrows = { ...scarecrows, [spotId]: { expiry: expiryTime, type: type } };
    setScarecrows(newScarecrows);
    scarecrowsRef.current = newScarecrows;
    localStorage.setItem('sandbox_scarecrows', JSON.stringify(newScarecrows));
    show("Scarecrow placed to protect your crops!", "success");
    
    let friendlyName = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (type === 'tier1') friendlyName = 'Scarecrow';
    
    show(`${friendlyName} placed to protect your crops!`, "success");
    setIsPlacingScarecrow(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    let itemId = ID_POTION_ITEMS.SCARECROW;
    if (type === 'tier2') itemId = 9978;
    if (type === 'tier3') itemId = 9977;
    if (type === 'tier4') itemId = 9976;
    if (type === 'ladybug_scarecrow') itemId = 9979;

    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[itemId] = Math.max(0, (sandboxLoot[itemId] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceTesla = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 120 * 60 * 60; // 5 days
    const newTowers = { ...teslaTowers, [spotId]: expiryTime };
    setTeslaTowers(newTowers);
    teslaTowersRef.current = newTowers;
    localStorage.setItem('sandbox_tesla', JSON.stringify(newTowers));
    show("Tesla Tower placed to ground lightning!", "success");
    setIsPlacingTesla(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9975] = Math.max(0, (sandboxLoot[9975] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceLadybug = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 3 * 60 * 60; // 3 hours
    const newLadybugs = { ...ladybugs, [spotId]: expiryTime };
    setLadybugs(newLadybugs);
    ladybugsRef.current = newLadybugs;
    localStorage.setItem('sandbox_ladybugs', JSON.stringify(newLadybugs));
    show("Ladybug placed to protect your crops!", "success");
    setIsPlacingLadybug(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.LADYBUG] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.LADYBUG] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceSprinkler = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const newSprinklers = { ...sprinklers, [spotId]: expiryTime };
    setSprinklers(newSprinklers);
    sprinklersRef.current = newSprinklers;
    localStorage.setItem('sandbox_sprinklers', JSON.stringify(newSprinklers));
    show("Water Sprinkler placed to auto-water crops!", "success");
    setIsPlacingSprinkler(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9998] = Math.max(0, (sandboxLoot[9998] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceUmbrella = async (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const newUmbrellas = { ...umbrellas, [spotId]: expiryTime };
    setUmbrellas(newUmbrellas);
    umbrellasRef.current = newUmbrellas;
    localStorage.setItem('sandbox_umbrellas', JSON.stringify(newUmbrellas));
    show("Umbrella placed to protect crops from rain!", "success");
    setIsPlacingUmbrella(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9999] = Math.max(0, (sandboxLoot[9999] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();

    await loadCropsFromContract();
  };

  const handleHarvestAll = async () => {
    try {
      const readySlots = [];
      const readySeedIds = [];
      let harvestedCarrot = false;
      const carrotSeed = (currentSeeds || []).find(s => s.label && s.label.toLowerCase().includes('carrot'));
      const currentTimeSeconds = Math.floor(Date.now() / 1000);

      let totalXpToAward = 0;

      for (let i = 0; i < cropArray.getLength(); i++) {
        const item = cropArray.getItem(i);
        if (item && item.seedId) {
          const endTime = Math.floor((item.plantedAt || 0) / 1000) + (item.growthTime || 0);
          const isReady = (item.growStatus === 2) || (currentTimeSeconds >= endTime);
          if (isReady) {
            readySlots.push(i);
            readySeedIds.push(item.seedId);
            totalXpToAward += 10; // 10 Farming XP per crop
            if (carrotSeed && item.seedId.toString() === carrotSeed.id.toString()) harvestedCarrot = true;
          }
        }
      }

      if (readySlots.length === 0) {
        show("No crops are ready to harvest!", "info");
        return;
      }
      playHarvestConfirmSound();

      // (Top-right harvest notification removed.)

      let ok = false;
      try {
        if (readySlots.length > 1 && typeof harvestMany === "function") {
          const res = await harvestMany(readySlots);
          ok = !!res;
        } else if (readySlots.length === 1) {
          const res = await harvestMany(readySlots[0]);
          ok = !!res;
        } else {
          // Fallback if batch method is unavailable
          const res = await harvestMany(readySlots);
          ok = !!res;
        }
      } catch (error) {
        const { message } = handleContractError(error, 'harvesting crops');
        console.error("Failed to harvest crops:", message);
        show(`❌ ${message}`, "error");
      }

      if (!ok) {
        // show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }

      // Roll + log a per-instance weight for every harvested crop. Keyed by produce id
      // so the inventory/bank popup card preview can render "Weight: <g>" + date.
      try {
        const log = JSON.parse(localStorage.getItem('sandbox_produce_weights') || '{}');
        readySeedIds.forEach((seedId) => {
          if (!seedId) return;
          const baseSeed = seedId & 0xFFF;
          const produceIdForLog = (baseSeed & 0xFF) | (((baseSeed >> 8) + 3) << 8);
          const list = Array.isArray(log[produceIdForLog]) ? log[produceIdForLog] : [];
          // Roll N weights to match the N produce yielded by harvestMany.
          const produceCount = ALL_ITEMS[Number(seedId)]?.produceCount ?? 1;
          for (let i = 0; i < produceCount; i++) {
            const { weight } = rollCropWeight(seedId);
            list.push({ w: weight, d: Date.now() });
          }
          if (list.length > 64) list.splice(0, list.length - 64);
          log[produceIdForLog] = list;
        });
        localStorage.setItem('sandbox_produce_weights', JSON.stringify(log));
      } catch (_) {}

      // Reload crops from contract to sync state
      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();

      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      // Award XP (skipped during tutorial)
      if (totalXpToAward > 0 && tutorialStep >= 36) {
        const currentFarmingXp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
        const oldLevel = getLevelFromXp(currentFarmingXp);
        const newFarmingXp = currentFarmingXp + totalXpToAward;
        localStorage.setItem('sandbox_farming_xp', newFarmingXp.toString());
        // (Top-right "+X Farming XP!" notification removed.)
        setFarmingXp(newFarmingXp);
        const newLevel = getLevelFromXp(newFarmingXp);
        if (newLevel > oldLevel) {
          window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Farming', level: newLevel } }));
        }
      }

      // Track total crops and specific crop harvests for soil unlocks
      {
        const DRAGON_FRUIT_SEED_ID = (4 << 8) | 11;
        const POTATO_SEED_ID = ID_PRODUCE_ITEMS.POTATO;
        let dragonfruitCount = 0;
        let potatoCount = 0;
        for (let i = 0; i < cropArray.getLength(); i++) {
          const item = cropArray.getItem(i);
          if (item && item.seedId && readySlots.includes(i)) {
            const baseId = item.seedId & 0xFFF;
            if (baseId === DRAGON_FRUIT_SEED_ID) dragonfruitCount++;
            if ((item.seedId & 0xFFF) === (POTATO_SEED_ID & 0xFFF) || Number(item.seedId) === POTATO_SEED_ID) potatoCount++;
          }
        }
        const prevTotal = parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10);
        localStorage.setItem('sandbox_total_crops', (prevTotal + readySlots.length).toString());
        if (dragonfruitCount > 0) {
          const prevDragon = parseInt(localStorage.getItem('sandbox_dragonfruit_harvested') || '0', 10);
          localStorage.setItem('sandbox_dragonfruit_harvested', (prevDragon + dragonfruitCount).toString());
        }
        if (potatoCount > 0) {
          const prevPotato = parseInt(localStorage.getItem('sandbox_potato_harvested') || '0', 10);
          const newPotato = prevPotato + potatoCount;
          localStorage.setItem('sandbox_potato_harvested', String(newPotato));
        }
        window.dispatchEvent(new CustomEvent('soilProgressChanged'));
      }

      // (Top-right "Successfully harvested" notification removed.)
      // Clear any selection state after harvest all
      setSelectedIndexes([]);
      setIsFarmMenu(false);
      setIsPlanting(true);
      
      const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
      readySlots.forEach(idx => delete skipped[idx]);
      localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));

      // Reset water state for harvested crops
      const newWaterState = { ...waterStateRef.current };
      readySlots.forEach(idx => { delete newWaterState[idx]; });
      waterStateRef.current = newWaterState;
      localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

      // Reset plot prep to 0 (Red X) for harvested plots
      setPlotPrep(prev => {
        const next = { ...prev };
        readySlots.forEach(idx => { next[idx] = { status: 0 }; });
        localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
        return next;
      });
      
      // Sync main crop array with latest growth data
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        newCropArray.updateGrowth();
        return newCropArray;
      });
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting all crops');
      console.error("Failed during Harvest All:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handlePlant = async () => {
    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }
    let loadingNotification = null;
    try {
      // Find all newly planted crops in preview (growStatus === -1)
      const cropsToPlant = [];
      for (let i = 0; i < previewCropArray.getLength(); i++) {
        const item = previewCropArray.getItem(i);
        if (item && item.growStatus === -1 && item.seedId) {
          cropsToPlant.push({
            seedId: item.seedId,
            plotNumber: i,
          });
        }
      }

      if (cropsToPlant.length === 0) {
        if (!selectedSeed) {
          show("Please select a seed first!", "info");
        } else {
          show(
            'No crops selected to plant. Please click on plots to plant seeds or use "Plant All".',
            "info"
          );
        }
        setIsFarmMenu(false);
        return;
      }
      // Show loading message that persists until transaction completes
      const loadingMessage =
        cropsToPlant.length === 1
          ? "Planting seed..."
          : `Planting ${cropsToPlant.length} seeds...`;
      playPlantConfirmSound();
      loadingNotification = show(loadingMessage, "info", 300000); // 5 minutes timeout

      // Batch plant
      const seedIds = cropsToPlant.map((crop) => {
        const numericSeedId = Number(crop.seedId);
        const category = numericSeedId >> 8;
        const id = numericSeedId & 0xFF;
        const subtype = getSubtype(numericSeedId);
        const plotId = crop.plotNumber;
        return (plotId << 24) | (category << 16) | (subtype << 8) | id
      });
      const result = await plantBatch(seedIds);
      if (result) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        for (const crop of cropsToPlant) {
            const numericSeedId = Number(crop.seedId);
            if (sandboxLoot[numericSeedId] > 0) sandboxLoot[numericSeedId] -= 1;
        }
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        
        const newWaterState = { ...waterStateRef.current };
        for (let i = 0; i < cropsToPlant.length; i++) {
          newWaterState[cropsToPlant[i].plotNumber] = { needsInitial: true, needsMid: false, pausedMs: 0, contractPlantedAt: Date.now() };
        }
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        loadingNotification.dismiss();
        show(
          `✅ Successfully planted ${cropsToPlant.length} seeds!`,
          "success",
          3000 // 3 seconds timeout
        );
      } else {
        loadingNotification.dismiss();
        show("❌ Failed to plant seeds. Please try again.", "error", 3000);
        return;
      }

      // Update the main crop array immediately with planted crops before closing menu
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        
        // Copy newly planted crops from preview to main array
        for (let i = 0; i < cropsToPlant.length; i++) {
          const cropToPlant = cropsToPlant[i];
          const previewItem = previewCropArray.getItem(cropToPlant.plotNumber);
          if (previewItem && previewItem.seedId) {
            const mainItem = newCropArray.getItem(cropToPlant.plotNumber);
            if (mainItem) {
              mainItem.seedId = previewItem.seedId;
              mainItem.plantedAt = previewItem.plantedAt;
              mainItem.growthTime = previewItem.growthTime;
              mainItem.growStatus = 1; // Mark as growing
            }
          }
        }
        
        return newCropArray;
      });

      // Reset any selection state after successful planting
      setSelectedIndexes([]);

      // Reload crops and seeds concurrently to reduce total wait time
      await Promise.all([
        loadCropsFromContract(),
          (async () => {
            try {
              if (typeof refetchSeeds === "function") {
                await refetchSeeds();
              }
            } catch (e) {
              // Failed to refetch seeds after planting
            }
          })(),
        ]);
        
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      // Confirm planting in preview array (transition -1 to 1)
      setPreviewCropArray((prevPreviewCropArray) => {
        const newPreviewCropArray = new CropItemArrayClass(30);
        newPreviewCropArray.copyFrom(prevPreviewCropArray);
        newPreviewCropArray.confirmPlanting();
        return newPreviewCropArray;
      });

      // Reset used seeds tracking after successful planting
      setUsedSeedsInPreview({});

      // Reset planting state and close farm menu
      setIsPlanting(true); // Keep in planting mode for next time
      setIsFarmMenu(false); // Close the farm menu to show planted items
      
    } catch (error) {
      const { message } = handleContractError(error, 'planting crops');
      loadingNotification.dismiss();
      console.error("Failed to plant crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleHarvest = async () => {
    if (!selectedIndexes || selectedIndexes.length === 0) {
      show("Please select crops to harvest first!", "info");
      return;
    }
    try {
      // Check which crops are actually ready to harvest
      const readyCrops = [];
      let harvestedCarrot = false;
      let totalXpToAward = 0;
      const carrotSeed = currentSeeds.find(s => s.label && s.label.toLowerCase().includes('carrot'));
      const currentTimeSec = Math.floor(Date.now() / 1000);

      for (const idx of selectedIndexes) {
        if (idx >= 0 && idx < cropArray.getLength()) {
          const item = cropArray.getItem(idx);
          const endTimeSec = Math.floor((item?.plantedAt || 0) / 1000) + (item?.growthTime || 0);
          const isActuallyReady = currentTimeSec >= endTimeSec;
          

          if (item && item.seedId && item.growStatus === 2 && isActuallyReady) {
            readyCrops.push(idx);
            totalXpToAward += 10;
            if (carrotSeed && item.seedId.toString() === carrotSeed.id.toString()) harvestedCarrot = true;
          }
        }
      }

      if (readyCrops.length === 0) {
        show(
          "No selected crops are ready to harvest! Make sure crops are fully grown.",
          "info"
        );
        return;
      }
      playHarvestConfirmSound();
      // (Top-right harvest notification removed.)

      let successCount = 0;
      // Capture seed ids while cropArray still holds them — we'll log a per-instance
      // weight for each one after the harvest succeeds.
      const readySeedIds = readyCrops.map((idx) => cropArray.getItem(idx)?.seedId).filter(Boolean);

      // Prefer batch harvest when multiple crops are ready
      const result = await harvestMany(readyCrops);
      if (result) {
        successCount = readyCrops.length;
        // Roll + log a weight for each harvested crop, keyed by produce id.
        try {
          const log = JSON.parse(localStorage.getItem('sandbox_produce_weights') || '{}');
          readySeedIds.forEach((seedId) => {
            const baseSeed = seedId & 0xFFF;
            const produceIdForLog = (baseSeed & 0xFF) | (((baseSeed >> 8) + 3) << 8);
            const list = Array.isArray(log[produceIdForLog]) ? log[produceIdForLog] : [];
            // Roll N weights to match the N produce yielded by harvestMany.
            const produceCount = ALL_ITEMS[Number(seedId)]?.produceCount ?? 1;
            for (let i = 0; i < produceCount; i++) {
              const { weight } = rollCropWeight(seedId);
              list.push({ w: weight, d: Date.now() });
            }
            if (list.length > 64) list.splice(0, list.length - 64);
            log[produceIdForLog] = list;
          });
          localStorage.setItem('sandbox_produce_weights', JSON.stringify(log));
        } catch (_) {}
      }

      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();
      
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      if (successCount > 0) {
        // Award XP (skipped during tutorial)
        if (totalXpToAward > 0 && tutorialStep >= 36) {
          const currentFarmingXp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
          const oldLevel = getLevelFromXp(currentFarmingXp);
          const newFarmingXp = currentFarmingXp + totalXpToAward;
          localStorage.setItem('sandbox_farming_xp', newFarmingXp.toString());
          setFarmingXp(newFarmingXp);
          const newLevel = getLevelFromXp(newFarmingXp);
          if (newLevel > oldLevel) {
            window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Farming', level: newLevel } }));
          }
        }

        const ringExpiry = parseInt(localStorage.getItem('sandbox_ring_expiry') || '0', 10);
        if (ringExpiry > Date.now()) {
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            const bonusItems = [ID_PRODUCE_ITEMS?.ONION || 131587, ID_PRODUCE_ITEMS?.POTATO || 131586, ID_PRODUCE_ITEMS?.CARROT || 131588, ID_PRODUCE_ITEMS?.TOMATO || 131589, ID_PRODUCE_ITEMS?.CORN || 131590];
            for (let i = 0; i < successCount; i++) {
                const r = bonusItems[Math.floor(Math.random() * bonusItems.length)];
                sandboxLoot[r] = (sandboxLoot[r] || 0) + 1;
            }
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("✨ Magic Ring doubled your harvest yield!", "success");
        }

        if (harvestedCarrot && !localStorage.getItem('easter_purple_egg')) {
            localStorage.setItem('easter_purple_egg', 'true');
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            sandboxLoot[9985] = (sandboxLoot[9985] || 0) + 1;
            sandboxLoot[9987] = 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("🐣 You unearthed the Purple Easter Egg!", "success");
        }

        // Track total crops and dragonfruit for soil unlocks
        {
          const DRAGON_FRUIT_SEED_ID = (4 << 8) | 11;
          let dragonfruitCount = 0;
          for (const idx of readyCrops) {
            const item = cropArray.getItem(idx);
            if (item && item.seedId && (item.seedId & 0xFFF) === DRAGON_FRUIT_SEED_ID) dragonfruitCount++;
          }
          const prevTotal = parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10);
          localStorage.setItem('sandbox_total_crops', (prevTotal + successCount).toString());
          if (dragonfruitCount > 0) {
            const prevDragon = parseInt(localStorage.getItem('sandbox_dragonfruit_harvested') || '0', 10);
            localStorage.setItem('sandbox_dragonfruit_harvested', (prevDragon + dragonfruitCount).toString());
          }
          window.dispatchEvent(new CustomEvent('soilProgressChanged'));
        }

        // (Top-right "Successfully harvested N crops!" notification removed.)
        // Clear selection state after successful harvest
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
        // Reset water state for harvested crops
        const newWaterState = { ...waterStateRef.current };
        readyCrops.forEach(idx => { delete newWaterState[idx]; });
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        // Reset plot prep to 0 (Red X) for harvested crops
        setPlotPrep(prev => {
          const next = { ...prev };
          readyCrops.forEach(idx => { next[idx] = { status: 0 }; });
          localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
          window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
          return next;
        });
        
        // Sync main crop array with latest growth data
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      } else {
        show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting crops');
      console.error("Failed to harvest crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleInstantHarvest = async (index, skipPoints = false) => {
    try {
      playHarvestConfirmSound();
      // (Top-right "Harvesting crop..." notification removed.)

      const itemToHarvest = cropArray.getItem(index);
      // Roll a weight ONCE up here (regardless of skipPoints) and persist the per-
      // instance entry into sandbox_produce_weights. The same weight is reused below
      // by the !skipPoints leaderboard / heaviest tracking so the value displayed in
      // notifications matches what the inventory/bank popup shows.
      let rolledHarvest = null;
      try {
        if (itemToHarvest?.seedId) {
          rolledHarvest = rollCropWeight(itemToHarvest.seedId);
          const baseSeed = itemToHarvest.seedId & 0xFFF;
          const produceIdForLog = (baseSeed & 0xFF) | (((baseSeed >> 8) + 3) << 8);
          const log = JSON.parse(localStorage.getItem('sandbox_produce_weights') || '{}');
          const list = Array.isArray(log[produceIdForLog]) ? log[produceIdForLog] : [];
          // Higher-rarity seeds yield multiple produce per harvest (uncommon = 2,
          // rare = 3, etc.) — log a separate weight entry for each unit so every
          // resulting card gets its own weight instead of one showing "Unknown".
          const produceCount = ALL_ITEMS[Number(itemToHarvest.seedId)]?.produceCount ?? 1;
          list.push({ w: rolledHarvest.weight, d: Date.now() });
          for (let i = 1; i < produceCount; i++) {
            const extra = rollCropWeight(itemToHarvest.seedId);
            list.push({ w: extra.weight, d: Date.now() });
          }
          if (list.length > 64) list.splice(0, list.length - 64);
          log[produceIdForLog] = list;
          localStorage.setItem('sandbox_produce_weights', JSON.stringify(log));
        }
      } catch (_) {}
      const carrotSeed = (currentSeeds || []).find(s => s.label && s.label.toLowerCase().includes('carrot'));
      let wasCarrot = false;
      if (carrotSeed && itemToHarvest && itemToHarvest.seedId && itemToHarvest.seedId.toString() === carrotSeed.id.toString()) {
          wasCarrot = true;
      }

      // Block harvest if inventory is full
      if (itemToHarvest?.seedId) {
        const { canHarvest, reason } = canHarvestProduce(itemToHarvest.seedId);
        if (!canHarvest) {
          show(`🎒 ${reason}`, 'error');
          return;
        }
      }

      const result = await harvestMany([index]);

      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();

      if (tutorialStep === 3 && tutPageRef.current === 11) {
        localStorage.setItem('sandbox_tut_market', 'true');
        localStorage.setItem('sandbox_tut_market_page', '11');
        setTutPageSync(12);
      }

      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      if (result) {
        // Award XP
        const totalHarvested = parseInt(localStorage.getItem('sandbox_total_harvested') || '0', 10);
        localStorage.setItem('sandbox_total_harvested', String(totalHarvested + 1));

        // Fire the harvest-card-reveal event regardless of skipPoints so gem-skip
        // harvests also get the center-screen card animation. Multiple harvests in
        // quick succession queue up inside HarvestCardReveal — no harvest blocking
        // here so subsequent clicks can land their cards behind the front one.
        if (itemToHarvest?.seedId && rolledHarvest) {
          window.dispatchEvent(new CustomEvent('cropHarvested', {
            detail: {
              cropName: rolledHarvest.name,
              weight: rolledHarvest.weight,
              seedId: itemToHarvest.seedId,
              bracket: rolledHarvest.bracket,
              rarityLabel: rolledHarvest.rarityLabel,
              rarityColor: rolledHarvest.rarityColor,
            },
          }));
        }

        // Leaderboard tracking (skipped crops don't count)
        if (!skipPoints && itemToHarvest?.seedId) {
          const baseSeedId = itemToHarvest.seedId & 0xFFF;
          const seedCat = baseSeedId >> 8; // 1=feeble,2=pico,3=basic,4=premium
          const subtype = getSubtype(itemToHarvest.seedId); // 1-5 grow tier within category
          // pico: 500/600/700/800/900, basic: 2000-4000, premium: 10000-18000
          const TIER_BASE  = { 1: 500,   2: 500,   3: 2000,  4: 10000 };
          const TIER_STEP  = { 1: 100,   2: 100,   3: 500,   4: 2000  };
          const base = TIER_BASE[seedCat] ?? 500;
          const step = TIER_STEP[seedCat] ?? 100;
          const pts = base + Math.max(0, subtype - 1) * step;
          if (tutorialStep >= 36) {
            const tc = parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10);
            localStorage.setItem('sandbox_total_crops', (tc + 1).toString());
            const fp = parseInt(localStorage.getItem('sandbox_farming_points') || '0', 10);
            localStorage.setItem('sandbox_farming_points', (fp + pts).toString());
            const sfp = parseInt(localStorage.getItem('sandbox_season_farming_points') || '0', 10);
            localStorage.setItem('sandbox_season_farming_points', (sfp + pts).toString());
            window.dispatchEvent(new CustomEvent('seasonPointsChanged'));
          }

          // Weight tracking — reuse the harvest-time roll captured at the top of
          // handleInstantHarvest so the heaviest tracker, notifications, and the
          // sandbox_produce_weights log all see the same value.
          const { weight, name: cropName, bracket, rarityLabel, rarityColor } = rolledHarvest || rollCropWeight(itemToHarvest.seedId);
          // Notify if this crop lands in the top 10% of the legendary weight bracket (fraction >= 0.9)
          if (bracket === 5) {
            const baseId = itemToHarvest.seedId & 0xFFF;
            const cropInfo = CROP_WEIGHTS[baseId];
            if (cropInfo) {
              const fraction = (weight - cropInfo.min) / (cropInfo.max - cropInfo.min);
              if (fraction >= 0.9) {
                const displayWeight = weight >= 1000 ? `${(weight / 1000).toFixed(2)} kg` : `${weight} g`;
                show(`🏆 Elite ${cropName}! Your ${displayWeight} ${cropName} is in the top 10% of all legendary harvests!`, 'success');
              }
            }
          }
          const harvestedAt = Date.now();
          // (Per-instance weight log moved to the top of handleInstantHarvest so it
          // runs regardless of skipPoints / tutorial state. The cropHarvested event
          // is now also dispatched outside this block so gem-skip harvests trigger
          // the harvest card reveal too.)
          // Player pull notification for rare/epic/legendary crops harvested
          {
            const rarityName = bracket === 5 ? 'legendary' : bracket === 4 ? 'epic' : bracket === 3 ? 'rare' : null;
            if (rarityName) {
              // Map seedId to its produce item for the box image (the harvested crop, not the seed).
              const baseSeed = itemToHarvest.seedId & 0xFFF;
              const produceId = (baseSeed & 0xFF) | (((baseSeed >> 8) + 2) << 8); // seed cat → produce cat (1→3, 2→4, 3→5, 4→6)
              const produceItem = ALL_ITEMS[produceId] || ALL_ITEMS[itemToHarvest.seedId];
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('playerPullNoti', {
                  detail: {
                    rarity: rarityName,
                    itemImage: produceItem?.image,
                    itemName: cropName,
                    username: localStorage.getItem('sandbox_username') || 'Player',
                    action: 'grew',
                  },
                }));
              }, 400);
            }
          }
          const storedHeaviest = JSON.parse(localStorage.getItem('sandbox_heaviest_crop') || 'null');
          if (!storedHeaviest || weight > storedHeaviest.weight) {
            localStorage.setItem('sandbox_heaviest_crop', JSON.stringify({ weight, name: cropName, harvestedAt }));
          }
          if (cropName === 'Potato') {
            const storedPotato = JSON.parse(localStorage.getItem('sandbox_heaviest_potato') || 'null');
            if (!storedPotato || weight > storedPotato.weight) {
              localStorage.setItem('sandbox_heaviest_potato', JSON.stringify({ weight, harvestedAt }));
            }
          }

          // === Heaviest-record notifications (legendary banner) ===
          const username = localStorage.getItem('sandbox_username') || 'Player';
          const baseSeedKey = (itemToHarvest.seedId & 0xFFF).toString();

          // 1) Heaviest of the DAY (across all crops, resets at midnight local time).
          const todayKey = new Date().toDateString();
          const dailyKey = 'sandbox_heaviest_day';
          const storedDaily = JSON.parse(localStorage.getItem(dailyKey) || 'null');
          const isNewDailyRecord = !storedDaily || storedDaily.day !== todayKey || weight > storedDaily.weight;
          if (isNewDailyRecord) {
            localStorage.setItem(dailyKey, JSON.stringify({ day: todayKey, weight, name: cropName, harvestedAt }));
            // Only fire the broadcast if the player actually beat a previous record (not just first crop of the day).
            if (storedDaily && storedDaily.day === todayKey && weight > storedDaily.weight) {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('playerPullNoti', {
                  detail: { rarity: 'legendary', tag: 'heaviest_day', username, itemName: cropName, weight, action: 'grew' },
                }));
              }, 800);
            }
          }

          // 2) Heaviest of THIS specific crop type (personal best per crop).
          const perCropKey = `sandbox_heaviest_seed_${baseSeedKey}`;
          const storedPerCrop = JSON.parse(localStorage.getItem(perCropKey) || 'null');
          if (!storedPerCrop || weight > storedPerCrop.weight) {
            localStorage.setItem(perCropKey, JSON.stringify({ weight, name: cropName, harvestedAt }));
            // Skip the broadcast on the very first harvest of a crop (no previous record to break).
            if (storedPerCrop) {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('playerPullNoti', {
                  detail: { rarity: 'legendary', tag: 'heaviest_crop', username, itemName: cropName, weight, action: 'grew' },
                }));
              }, 1300);
            }
          }
          const featured = getWeeklyFeaturedCrop();
          if ((itemToHarvest.seedId & 0xFFF) === featured.baseId) {
            const stored = JSON.parse(localStorage.getItem('sandbox_weekly_heaviest_crop') || 'null');
            if (!stored || stored.weekNum !== featured.weekNum || weight > stored.weight) {
              localStorage.setItem('sandbox_weekly_heaviest_crop', JSON.stringify({ weight, name: cropName, weekNum: featured.weekNum, harvestedAt }));
            }
          }
        }

        if (tutorialStep >= 36) {
          const currentFarmingXp = parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10);
          const oldLevel = getLevelFromXp(currentFarmingXp);
          const newFarmingXp = currentFarmingXp + 10;
          localStorage.setItem('sandbox_farming_xp', newFarmingXp.toString());
          // (Top-right "+10 Farming XP!" notification removed.)
          setFarmingXp(newFarmingXp);
          const newLevel = getLevelFromXp(newFarmingXp);
          if (newLevel > oldLevel) {
            window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Farming', level: newLevel } }));
          }
        }

        const ringExpiry = parseInt(localStorage.getItem('sandbox_ring_expiry') || '0', 10);
        if (ringExpiry > Date.now()) {
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            const bonusItems = [ID_PRODUCE_ITEMS?.ONION || 131587, ID_PRODUCE_ITEMS?.POTATO || 131586, ID_PRODUCE_ITEMS?.CARROT || 131588, ID_PRODUCE_ITEMS?.TOMATO || 131589, ID_PRODUCE_ITEMS?.CORN || 131590];
            const r = bonusItems[Math.floor(Math.random() * bonusItems.length)];
            sandboxLoot[r] = (sandboxLoot[r] || 0) + 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("✨ Magic Ring doubled your harvest yield!", "success");
        }

        if (wasCarrot && !localStorage.getItem('easter_purple_egg')) {
            localStorage.setItem('easter_purple_egg', 'true');
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            sandboxLoot[9985] = (sandboxLoot[9985] || 0) + 1;
            sandboxLoot[9987] = 1;
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            show("🐣 You unearthed the Purple Easter Egg!", "success");
        }
        // (Top-right "Successfully harvested crop!" notification removed.)
        updatePlotPrep(index, { status: 0 });
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
        const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
        delete skipped[index];
        localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));
        
        // Reset water state
        const newWaterState = { ...waterStateRef.current };
        delete newWaterState[index];
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        // Sync main crop array with latest growth data
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      } else {
        show("❌ Failed to harvest crop. Please try again.", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting crop');
      console.error("Failed to harvest crop:", message);
      show(`❌ ${message}`, "error");
    }
  };

  // Worker Bee Auto-Harvest Logic
  useEffect(() => {
    if (workerBeeLevel <= 1 || farmingLoading) return;
    
    const beeTimer = setInterval(() => {
      const readySlots = [];
      const currentTimeSec = Math.floor(Date.now() / 1000);
      for (let i = 0; i < cropArray.getLength(); i++) {
        const item = cropArray.getItem(i);
        if (item && item.seedId) {
          const endTimeSec = Math.floor((item.plantedAt || 0) / 1000) + (item.growthTime || 0);
          if (item.growStatus === 2 || currentTimeSec >= endTimeSec) readySlots.push(i);
        }
      }

      if (readySlots.length > 0) {
        const chance = (workerBeeLevel - 1) * 0.15; // Lvl 2: 15%, Lvl 3: 30%, Lvl 4: 45%
        if (Math.random() < chance) {
          const targetPlot = readySlots[Math.floor(Math.random() * readySlots.length)];
          show(`🐝 Worker Bee auto-harvested plot ${targetPlot + 1}!`, "success");
          handleInstantHarvest(targetPlot);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(beeTimer);
  }, [workerBeeLevel, cropArray, farmingLoading]);

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
    setIsUsingPotion(false);
    setSelectedPotion(null);
    setIsPlacingScarecrow(false);
    setIsPlacingLadybug(false);
    setIsPlacingSprinkler(false);
    setIsPlacingUmbrella(false);
    setIsPlacingTesla(false);
    setIsWatering(false);
    setIsDigging(false);
    setIsHoeing(false);
    setIsDirting(false);
    setIsSeeding(false);
    // Reset used seeds tracking when canceling
    setUsedSeedsInPreview({});
    
    // Sync main crop array with latest growth data from preview
    setCropArray((prevCropArray) => {
      const newCropArray = new CropItemArrayClass(30);
      newCropArray.copyFrom(prevCropArray);
      newCropArray.updateGrowth();
      return newCropArray;
    });
  };

  const handlePotionUse = async () => {
    if (!selectedPotion) {
      show("No potion selected!", "error");
      return;
    }

    if (!selectedIndexes || selectedIndexes.length !== 1) {
      show("Please select exactly one crop to apply the potion!", "info");
      return;
    }

    try {
      let potionFunction = null;

      // Determine which potion function to use based on the BigInt ID
      const potionId = selectedPotion.id;
      if (potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR || 
          potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_II || 
          potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III) {
        potionFunction = applyGrowthElixir;
      } else if (potionId === ID_POTION_ITEMS.POTION_PESTICIDE || 
                 potionId === ID_POTION_ITEMS.POTION_PESTICIDE_II || 
                 potionId === ID_POTION_ITEMS.POTION_PESTICIDE_III) {
        potionFunction = applyPesticide;
      } else if (potionId === ID_POTION_ITEMS.POTION_FERTILIZER || 
                 potionId === ID_POTION_ITEMS.POTION_FERTILIZER_II || 
                 potionId === ID_POTION_ITEMS.POTION_FERTILIZER_III) {
        potionFunction = applyFertilizer;
      }
      if (!potionFunction) {
        show("Invalid potion type!", "error");
        return;
      }

      const targetIndex = selectedIndexes[0];
      show(`Applying ${selectedPotion.name} to crop #${targetIndex + 1}...`, "info");

      const result = await potionFunction(targetIndex);

      if (result) {
        show(`✅ Successfully applied ${selectedPotion.name} to 1 crop!`, "success");
        
        // Reload crops from contract to show updated potion effects
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadCropsFromContract();
        
        // Force a re-render by updating the preview update key
        setPreviewUpdateKey(prev => prev + 1);
        
        // Clear any selection state after successful potion application
        setSelectedIndexes([]);
        setIsUsingPotion(false);
        setSelectedPotion(null);
        setIsFarmMenu(false);
        setIsPlanting(true);
      } else {
        show("❌ Failed to apply potion. Please try again.", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'applying potion');
      show(`❌ ${message}`, "error");
    }
  };

  const onClickCrop = (isShift, index) => {

    // During tutorial, X plots are only clickable on step 14 (when explicitly prompted to dig).
    // On every other tutorial step, clicking an X shakes the plot instead of digging.
    if (tutorialStep < 36 && tutorialStep !== 14) {
      const pStatus = plotPrep[index]?.status || 0;
      if (pStatus === 0) {
        window.dispatchEvent(new CustomEvent('tutorialPlotShake', { detail: index }));
        return;
      }
    }

    // Check if userCrops are loaded before allowing any plot interaction
    if (!userCropsLoaded) {
      show(
        "Please wait for your farm data to load before interacting with plots.",
        "info"
      );
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (isPlacingScarecrow || isPlacingLadybug || isPlacingSprinkler || isPlacingUmbrella || isPlacingTesla) {
      return; // Clicks handled by scarecrow spots overlay
    }

    if (isDigging) {
      const pStatus = plotPrep[index]?.status || 0;
      const fishId = plotPrep[index]?.fishId;
      const item = cropArray.getItem(index);

      const returnFishAndSeed = (seedIdToReturn) => {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        let returnedSomething = false;
        if (fishId) {
          sandboxLoot[fishId] = (sandboxLoot[fishId] || 0) + 1;
          returnedSomething = true;
        }
        if (seedIdToReturn) {
          sandboxLoot[seedIdToReturn.toString()] = (sandboxLoot[seedIdToReturn.toString()] || 0) + 1;
          returnedSomething = true;
        }
        if (returnedSomething) {
          localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
          if (typeof refetchSeeds === "function") refetchSeeds();
        }
      };

      if (item && item.seedId && item.seedId !== 0n) {
        returnFishAndSeed(item.seedId);
        show("Crop removed. Seed and fish returned!", "success");
        updatePlotPrep(index, { status: 1 });
        
        const skipped = JSON.parse(localStorage.getItem('sandbox_skipped_crops') || '{}');
        delete skipped[index];
        localStorage.setItem('sandbox_skipped_crops', JSON.stringify(skipped));

        if (destroyCrop) {
          destroyCrop(index).then(() => {
            loadCropsFromContract();
          });
        }
        setCropArray(prev => {
          const newArr = new CropItemArrayClass(30);
          newArr.copyFrom(prev);
          const target = newArr.getItem(index);
          if (target) {
            target.seedId = 0n;
            target.bugCountdown = undefined;
            target.crowCountdown = undefined;
          }
          return newArr;
        });
        playPlantConfirmSound();
      } else if (pStatus === 3) {
        returnFishAndSeed(null);
        updatePlotPrep(index, { status: 1 });
        if (fishId) show("Dirt removed. Fish returned!", "success");
        playPlantConfirmSound();
      } else if (pStatus === 0) {
        if (tutorialStep === 3) {
          const existingHoles = Object.values(plotPrep).filter(p => p.status === 1 || p.status === 3).length;
          if (existingHoles >= 1) {
            show("Dig just one hole for now!", "info");
            return;
          }
        }
        playPlantConfirmSound();
        updatePlotPrep(index, { status: 1 });
        if (tutorialStep === 3 && tutPage < 6) {
          setTutPageSync(6);
        }
      } else {
        show("It's already a hole!", "info");
      }
      return;
    }

    if (isHoeing) {
      show("Click directly on a placed item to remove it!", "info");
      return;
    }



    if (isWatering) {
      const item = cropArray.getItem(index);
      // If crop is ready to harvest, collect it and deselect the watering can
      if (item && item.seedId) {
        const nowSec = Math.floor(Date.now() / 1000);
        const endTime = Math.floor((item.plantedAt || 0) / 1000) + (item.growthTime || 0);
        if (item.growStatus === 2 || nowSec >= endTime) {
          setSelectedTool(null);
          setIsWatering(false);
          handleInstantHarvest(index);
          return;
        }
      }
      if (item && item.needsWater) {
        const wState = waterStateRef.current[index];
        if (wState) {
          if (wState.needsInitial) wState.needsInitial = false;
          else if (wState.needsMid) wState.needsMid = false;
          waterStateRef.current = { ...waterStateRef.current };
          localStorage.setItem('sandbox_water_state', JSON.stringify(waterStateRef.current));
          setWaterEffects(prev => [...prev, { id: Date.now() + Math.random(), index, time: Date.now() }]);
        }
        playWaterSound();
        if (tutorialStep === 3 && tutPage === 8) {
          const plotIdx = tutWaterPlotRef.current !== null ? tutWaterPlotRef.current : index;
          setSelectedTool(null);
          setIsWatering(false);
          setTutPageSync(9);
          tutPostWaterRef.current = true;
          tutBugKilledRef.current = false;
          setTimeout(() => {
            bugsRef.current[plotIdx] = 60;
            setCropArray(prev => {
              const newArr = new CropItemArrayClass(30);
              newArr.copyFrom(prev);
              const item = newArr.getItem(plotIdx);
              if (item) item.bugCountdown = 60;
              return newArr;
            });
          }, 1000);
        }

      } else {
        show("This plot doesn't need water right now.", "info");
      }
      return;
    }

    if (isUsingPotion) {
      // Potion usage mode - allow selection of exactly one growing crop
      const plotData = cropArray.getItem(index);
      if (!plotData || !plotData.seedId) {
        show("This plot is empty. Potions can only be used on growing crops.", "info");
        return;
      }

      // Check if the crop is still growing (growStatus === 1) or ready to harvest (growStatus === 2)
      if (plotData.growStatus === 2) {
        show("This crop is ready to harvest. Potions can only be used on growing crops.", "info");
        return;
      }

      if (plotData.growStatus !== 1) {
        show("This crop is not growing. Potions can only be used on actively growing crops.", "info");
        return;
      }

      // Single-select behavior: selecting a new crop replaces previous selection
      setSelectedIndexes((prev) => (prev.length === 1 && prev[0] === index ? [] : [index]));
      return;
    }

    // --- INSTANT HARVEST CHECK ---
    const plotData = cropArray.getItem(index);
    if (plotData && plotData.seedId && plotData.seedId !== 0n) {
      const nowSec = Math.floor(Date.now() / 1000);
      const endTime = Math.floor((plotData.plantedAt || 0) / 1000) + (plotData.growthTime || 0);
      const isReady = (plotData.growStatus === 2) || (nowSec >= endTime);

      // Auto-water: if the crop needs water and isn't ready yet, just water it on click
      if (!isReady && plotData.needsWater) {
        const wState = waterStateRef.current[index];
        if (wState) {
          if (wState.needsInitial) wState.needsInitial = false;
          else if (wState.needsMid) wState.needsMid = false;
          waterStateRef.current = { ...waterStateRef.current };
          localStorage.setItem('sandbox_water_state', JSON.stringify(waterStateRef.current));
          setWaterEffects(prev => [...prev, { id: Date.now() + Math.random(), index, time: Date.now() }]);
        }
        playWaterSound();
        if (tutorialStep === 3 && tutPage === 8) {
          const plotIdx = tutWaterPlotRef.current !== null ? tutWaterPlotRef.current : index;
          setTutPageSync(9);
          tutPostWaterRef.current = true;
          tutBugKilledRef.current = false;
          setTimeout(() => {
            bugsRef.current[plotIdx] = 60;
            setCropArray(prev => {
              const newArr = new CropItemArrayClass(30);
              newArr.copyFrom(prev);
              const it = newArr.getItem(plotIdx);
              if (it) it.bugCountdown = 60;
              return newArr;
            });
          }, 1000);
        }
        return;
      }

      if (tutorialStep === 3 && tutPage === 11) {
        if (isReady) {
          if (farmingLoading) return;
          handleInstantHarvest(index);
        } else {
          setTutGemPlotIndex(index);
          setTutGemPopupOpen(true);
        }
        return;
      }

      if (isReady) {
        if (farmingLoading) return; // Prevent spam clicking
        handleInstantHarvest(index);
        return;
      } else {
        if (tutorialStep >= 36 || tutorialStep === 24) setSkipGrowTarget(index);
        return;
      }
    }

    // EMPTY PLOT PREP LOGIC
    const pStatus = plotPrep[index]?.status || 0;

    if (isDirting) {
      if (pStatus === 1 || pStatus === 2) {
        updatePlotPrep(index, { ...plotPrep[index], status: 3 });
        playPlantConfirmSound();
        if (tutorialStep === 3 && tutPage < 7) {
          setTutPageSync(7);
        }
      } else {
        show("You can only place dirt in a hole!", "info");
      }
      return;
    }

    if (isSeeding) {
      if (pStatus === 3) {
        // Ready to plant! Require Shift for quick-plant; otherwise open the seed dialog
        if (selectedSeed && isShift) {
          const availableSeeds = getAvailableSeeds();
          const selectedAvailable = availableSeeds.find((s) => s.id === selectedSeed);
          if (!selectedAvailable || selectedAvailable.count <= 0) {
            setSelectedSeed(null);
            setCurrentFieldIndex(index);
            setIsSelectCropDialog(true);
            return;
          }
          handleClickSeedFromDialog(selectedSeed, index);
          return;
        }
        if (selectedSeed === 9998) {
          setIsPlacingSprinkler(true);
          setIsPlacingScarecrow(false);
          setIsPlacingLadybug(false);
          setIsPlacingTesla(false);
          setIsPlacingUmbrella(false);
          setIsUsingPotion(false);
          setIsPlanting(false);
          setIsFarmMenu(false);
          return;
        }
        if (selectedSeed === 9999) {
          setIsPlacingUmbrella(true);
          setIsPlacingScarecrow(false);
          setIsPlacingLadybug(false);
          setIsPlacingTesla(false);
          setIsPlacingSprinkler(false);
          setIsUsingPotion(false);
          setIsPlanting(false);
          setIsFarmMenu(false);
          return;
        }
    
        // Open selection dialog when Shift not held or no seed selected
        setCurrentFieldIndex(index);
        setIsSelectCropDialog(true);
      } else {
        show("You can only plant seeds in prepared dirt!", "info");
      }
      return;
    }

    if (pStatus === 0) {
      if (tutorialStep === 3) {
        const existingHoles = Object.values(plotPrep).filter(p => p.status === 1 || p.status === 3).length;
        if (existingHoles >= 1) {
          show("Dig just one hole for now!", "info");
          return;
        }
      }
      playPlantConfirmSound();
      updatePlotPrep(index, { status: 1 });
      if (tutorialStep === 3 && tutPage < 6) {
        setTutPageSync(6);
      }
      return;
    } else if (pStatus === 1 || pStatus === 2) {
      updatePlotPrep(index, { ...plotPrep[index], status: 3 });
      playPlantConfirmSound();
      if (tutorialStep === 3 && tutPage < 7) {
        setTutPageSync(7);
      }
      return;
    } else if (pStatus === 3) {
      // Open the seed picker. We don't set is*ing tool flags anymore — the toolbelt is
      // decorative (clicks happen on the plot, action is determined by plot state).
      // Setting setIsSeeding(true) here is what was making subsequent X-plot clicks
      // fall into the "You can only plant seeds in prepared dirt" early branch.
      setCurrentFieldIndex(index);
      setIsSelectCropDialog(true);
      return;
    }
  };

  const handleClickSeedFromDialog = async (id, fieldIndex) => {
    // Remember the selected seed so Shift+click can reuse it across plots
    setSelectedSeed(id);
    setIsSelectCropDialog(false);
    const idx = typeof fieldIndex === "number" ? fieldIndex : currentFieldIndex;
    if (idx < 0) {
      return;
    }

    // Ensure plot is empty before proceeding (UI guard)
    const existing = cropArray.getItem(idx);
    if (existing && existing.seedId && existing.seedId !== 0n) {
      show(`Plot ${idx} is already occupied.`, "error");
      return;
    }

    // Check if seed is available considering used seeds in preview
    const availableSeeds = getAvailableSeeds();
    let seed = availableSeeds.find((s) => s.id === id);
    if (!seed && (id === 9998 || id === 9999)) {
      seed = allItems.find((s) => s.id === id);
    }
    if (!seed || seed.count <= 0) {
      show("You don't have any more items of this type available!", "info");
      return;
    }
    if (id === 9998) {
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your sprinkler!", "info");
      return;
    }
    if (id === 9975) {
      setIsPlacingTesla(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsPlacingSprinkler(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your Tesla Tower!", "info");
      return;
    }
    if (id === 9999) {
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsPlacingTesla(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your umbrella!", "info");
      return;
    }

    // --- INSTANT PLANT HACK ---
    const category = id >> 8;
    const localId = id & 0xFF;
    const subtype = getSubtype(id);
    const encodedId = (idx << 24) | (category << 16) | (subtype << 8) | localId;
    
    playPlantConfirmSound();
    const result = await plantBatch([encodedId]);
    if (result) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        if (sandboxLoot[id] > 0) sandboxLoot[id] -= 1;
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        
        const newWaterState = { ...waterStateRef.current };
        newWaterState[idx] = { needsInitial: true, needsMid: false, pausedMs: 0, contractPlantedAt: Date.now() };
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        show("✅ Seed planted!", "success");
        if (tutorialStep === 3 && tutPage === 7) {
          setTutPageSync(8);
          tutWaterPlotRef.current = idx;
        }
        await loadCropsFromContract();
        if (typeof refetchSeeds === "function") refetchSeeds();
        setPreviewUpdateKey(prev => prev + 1);
        setIsFarmMenu(false);
    } else {
        show("❌ Failed to plant seed.", "error");
    }
  };

  const SHARED_SPOTS_CONFIG = [
    { index: 1, offsetX: 0, offsetY: 196 },     // New Spot 1
    { index: 2, offsetX: -30, offsetY: 40 },  // Spot 2
    { index: 3, offsetX: 16, offsetY: 143 },  // Spot 3
    { index: 10, offsetX: 60, offsetY: 40 },  // Spot 10
    { index: 11, offsetX: 80, offsetY: -10 }, // Between plot 12 and 13
    { index: 4, offsetX: 83, offsetY: 94 },     // New Spot 4
    { index: 5, offsetX: -40, offsetY: 92 },    // New Spot 5
    { index: 6, offsetX: 25, offsetY: 145 },       // New Spot 6
    { index: 7, offsetX: 10, offsetY: 145 },       // New Spot 7
    { index: 8, offsetX: 105, offsetY: 197 }        // New Spot 8
  ];

  const dialogs = [
    {
      id: ID_FARM_HOTSPOTS.DEX,
      component: FarmerDialog,
      label: "FARMER",
      header: "/images/dialog/modal-header-gardner.png",
      actions: {
        plant: startPlanting,
        plantAll: plantAll,
        harvest: startHarvesting,
        harvestAll: handleHarvestAll,
        usePotion: startPotionUsage,
      },
    },
  ];

  const bees = tutorialStep < 36 ? [] : FARM_BEES;
  return (
    <div>
      {tutorialStep >= 11 && <WeatherOverlay />}

      {/* Cloud shadows + wind streaks were here — now rendered globally by <SkyOverlay /> in App.jsx
          so they animate continuously across all routes. The remaining <></> block below still
          contains the per-scene sun gleam, light rays, etc. — kept here since those are farm-specific. */}
      {(tutorialStep < 36 || (weatherOverride !== 'rain' && weatherOverride !== 'storm' && !['🌧️', '⚡'].includes(getWeatherForDay(simulatedDate)))) && (
      <>
        {/* (cloud keyframes moved to global SkyOverlay) */}

        {/* Cloud + wind blocks moved to global <SkyOverlay /> in App.jsx for cross-route continuity. */}
        {false && [
          // Top layer (high in the sky — small, fast, light)
          { src: '/images/land/cloudone.png',   anim: 'cloudDriftEa', dur: 320, delay: '-20s',  pos: { top: '-5vh', left: '-50vw' }, size: { width: '230vw', height: '140vh' }, blur: 13, rot:  -8, flip: false },
          { src: '/images/land/cloudthree.png', anim: 'cloudDriftEd', dur: 280, delay: '-130s', pos: { top: '2vh',  left: '-50vw' }, size: { width: '170vw', height: '110vh' }, blur: 12, rot:  10, flip: true  },
          // Mid-upper layer (medium)
          { src: '/images/land/cloudtwo.png',   anim: 'cloudDriftEb', dur: 380, delay: '-70s',  pos: { top: '12vh', left: '-50vw' }, size: { width: '310vw', height: '190vh' }, blur: 14, rot:  18, flip: false },
          { src: '/images/land/cloudone.png',   anim: 'cloudDriftEc', dur: 340, delay: '-200s', pos: { top: '8vh',  left: '-50vw' }, size: { width: '200vw', height: '130vh' }, blur: 13, rot: -15, flip: true  },
          // Mid layer (largest, dominant)
          { src: '/images/land/cloudthree.png', anim: 'cloudDriftEa', dur: 460, delay: '-150s', pos: { top: '20vh', left: '-50vw' }, size: { width: '410vw', height: '260vh' }, blur: 15, rot:   0, flip: false },
          { src: '/images/land/cloudtwo.png',   anim: 'cloudDriftEd', dur: 400, delay: '-280s', pos: { top: '24vh', left: '-50vw' }, size: { width: '270vw', height: '170vh' }, blur: 14, rot:  22, flip: true  },
          // Lower layer (slower, larger feels closer)
          { src: '/images/land/cloudone.png',   anim: 'cloudDriftEb', dur: 520, delay: '-100s', pos: { top: '36vh', left: '-50vw' }, size: { width: '350vw', height: '210vh' }, blur: 16, rot: -12, flip: false },
          { src: '/images/land/cloudthree.png', anim: 'cloudDriftEc', dur: 360, delay: '-240s', pos: { top: '40vh', left: '-50vw' }, size: { width: '190vw', height: '120vh' }, blur: 13, rot:  30, flip: true  },
          // Drifter — odd horizontal slice for variety
          { src: '/images/land/cloudtwo.png',   anim: 'cloudDriftEa', dur: 600, delay: '-340s', pos: { top: '50vh', left: '-50vw' }, size: { width: '380vw', height: '230vh' }, blur: 16, rot:   8, flip: false },
        ].map((c, i) => (
          // Outer wrapper carries the drift animation; inner img gets the rotate/flip for diversity
          // (separating them avoids the keyframe transform overriding the rotation).
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'fixed',
              ...c.pos,
              ...c.size,
              pointerEvents: 'none',
              zIndex: 400,
              animation: `${c.anim} ${c.dur}s linear infinite`,
              animationDelay: c.delay,
            }}
          >
            <img
              src={c.src}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: 0.25,
                filter: `brightness(0) blur(${c.blur}px)`,
                transform: `rotate(${c.rot}deg)${c.flip ? ' scaleX(-1)' : ''}`,
              }}
            />
          </div>
        ))}

        {/* Sun gleam moved to global <SkyOverlay /> — now on a real-time 12-hour right→left cycle. */}

        {/* God-rays — warm angled beams streaming down from upper-left, with subtle shimmer.
            Each ray is a rotated rectangle filled with a top-bright → transparent gradient.
            Anchored at the top so the rotation pivot looks like the rays emanate from the sun. */}
        <style>{`
          @keyframes rayShimmerA { 0%, 100% { opacity: 0.32; transform: rotate(18deg) scaleY(1); } 50% { opacity: 0.44; transform: rotate(18deg) scaleY(1.04); } }
          @keyframes rayShimmerB { 0%, 100% { opacity: 0.28; transform: rotate(24deg) scaleY(1); } 50% { opacity: 0.40; transform: rotate(24deg) scaleY(1.06); } }
          @keyframes rayShimmerC { 0%, 100% { opacity: 0.24; transform: rotate(30deg) scaleY(1); } 50% { opacity: 0.36; transform: rotate(30deg) scaleY(1.05); } }
          @keyframes rayShimmerD { 0%, 100% { opacity: 0.20; transform: rotate(13deg) scaleY(1); } 50% { opacity: 0.34; transform: rotate(13deg) scaleY(1.07); } }
          @keyframes rayShimmerE { 0%, 100% { opacity: 0.18; transform: rotate(36deg) scaleY(1); } 50% { opacity: 0.30; transform: rotate(36deg) scaleY(1.05); } }
        `}</style>
        {[
          { left: '8vw',  width: '10vw', anim: 'rayShimmerA', dur: 7,  delay: '-1s' },
          { left: '20vw', width: '7vw',  anim: 'rayShimmerB', dur: 9,  delay: '-3s' },
          { left: '32vw', width: '12vw', anim: 'rayShimmerC', dur: 8,  delay: '-5s' },
          { left: '0vw',  width: '8vw',  anim: 'rayShimmerD', dur: 10, delay: '-2s' },
          { left: '46vw', width: '9vw',  anim: 'rayShimmerE', dur: 11, delay: '-6s' },
        ].map((r, i) => (
          <div
            key={`ray-${i}`}
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: '-30vh',
              left: r.left,
              width: r.width,
              height: '160vh',
              background: 'linear-gradient(180deg, rgba(255,243,190,0.55) 0%, rgba(255,235,160,0.32) 25%, rgba(255,225,130,0.16) 55%, transparent 90%)',
              mixBlendMode: 'screen',
              filter: 'blur(6px)',
              pointerEvents: 'none',
              zIndex: 402,
              transformOrigin: 'top center',
              animation: `${r.anim} ${r.dur}s ease-in-out infinite`,
              animationDelay: r.delay,
            }}
          />
        ))}

        {/* Wind streaks moved to global <SkyOverlay /> in App.jsx. */}
      </>
      )}

      {/* Farming Level Banner - Top Right (hidden during tutorial) */}
      {tutorialStep >= 36 && (
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, pointerEvents: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', display: 'flex' }}>
          <img src="/images/label/farmerlevellabel.png" style={{ height: '92px', objectFit: 'contain', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '113px', paddingBottom: '18px' }}>
            <span style={{ fontFamily: 'Cartoonist', fontSize: '32px', color: '#fff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', whiteSpace: 'nowrap' }}>LEVEL {farmingLevel}</span>
          </div>
        </div>
        {/* XP Progress Bar */}
        <div style={{ position: 'relative', height: '20px', marginTop: '2px' }}>
          <img src="/images/level/progress bar.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${Math.min(farmingProgress, 100)}%`, transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            <img src="/images/level/yellowbar.png" alt="" style={{ width: '100%', height: '60%', objectFit: 'fill', display: 'block' }} />
          </div>
        </div>
      </div>
      )}

      {/* Festivals Button — temporarily hidden */}

      {/* Farming Board Overlay */}


      <PanZoomViewport
        backgroundSrc="/images/backgrounds/realfarm.png"
        hotspots={tutorialStep >= 36 ? hotspots.filter((h) => {
          if (h.id !== ID_FARM_HOTSPOTS.FARMER) return true;
          // Mission board (FARMER hotspot) shows ONLY after the player has
          // read or completed the dedicated mission-board letter.
          return completedQuests.includes('q2_missionboard_intro')
              || readQuests.includes('q2_missionboard_intro');
        }) : []}
        width={width}
        height={height}
        dialogs={dialogs}
        hideMenu={isFarmMenu}
        bees={bees}
        initialScale={1.5}
        initialOffsetX={-22}
        backgroundOffsetX={7.5}
        backgroundOffsetY={-64.5}
        disablePanZoom
        hotspotScale={0.75}
        onHotspotClick={(hotspotId) => {
          setSelectedTool(null);
          setIsWatering(false);
          setIsDigging(false);
          setIsHoeing(false);
          setIsDirting(false);
          setIsSeeding(false);
          if (hotspotId === ID_FARM_HOTSPOTS.FARMER) {
            // Mark mission board as seen on first click so the attention pulse + "!" badge clear.
            if (localStorage.getItem('sandbox_missionboard_seen') !== 'true') {
              localStorage.setItem('sandbox_missionboard_seen', 'true');
              window.dispatchEvent(new CustomEvent('questStateChanged'));
            }
            // Iris-wipe in/out so the mission board entrance feels like the
            // vendor + banker entrances.
            withIris(() => setShowMissionBoard(true));
            return true;
          }
          return false;
        }}
      >
        )}
        {/* Soil only on tutp6 (decorative — clicking plots handles dirt placement). */}
        {tutorialStep === 3 && tutPage === 6 && (
        <img
          src="/images/farming/realsoil.png"
          alt="Soil"
          draggable={false}
          style={{
            position: 'absolute',
            top: '638px',
            left: '618px',
            width: '52px',
            zIndex: 6,
            pointerEvents: 'none',
          }}
        />
        )}
        {/* Well */}
        <img src="/images/land/well.png" alt="Well" style={{ position: 'absolute', top: '385px', left: '230px', width: '190px', pointerEvents: 'none', zIndex: 10 }} draggable={false} />

        <FarmInterface
          key={isFarmMenu ? `preview-${previewUpdateKey}` : "main"}
          cropArray={isFarmMenu ? previewCropArray : cropArray}
          onClickCrop={onClickCrop}
          isFarmMenu={isFarmMenu}
          isPlanting={isPlanting}
          isUsingPotion={isUsingPotion}
          maxPlots={maxPlots}
          totalPlots={30}
          selectedIndexes={selectedIndexes}
          crops={cropArray}
          unlockedPlots={unlockedPlots}
        />

        {/* Protector Spots Overlay */}
        {FARM_POSITIONS && SHARED_SPOTS_CONFIG.map((spot) => {
          const nowSec = Math.floor(Date.now() / 1000);
          
          let placedItem = null;
          let sc = scarecrows[spot.index];
          if (sc && (typeof sc === 'number' ? sc : sc.expiry) > nowSec) {
            placedItem = { type: typeof sc === 'number' ? 'tier1' : sc.type, expiryTime: typeof sc === 'number' ? sc : sc.expiry, onExpire: handleRemoveScarecrow };
          } else if (ladybugs[spot.index] && ladybugs[spot.index] > nowSec) {
            placedItem = { type: 'ladybug', expiryTime: ladybugs[spot.index], onExpire: handleRemoveLadybug };
          } else if (teslaTowers[spot.index] && teslaTowers[spot.index] > nowSec) {
            placedItem = { 
              type: 'tesla', 
              expiryTime: teslaTowers[spot.index], 
              onExpire: (expiredSpotId) => { 
                setTeslaTowers(prev => { const n = {...prev}; delete n[expiredSpotId]; teslaTowersRef.current = n; localStorage.setItem('sandbox_tesla', JSON.stringify(n)); return n; }); 
              } 
            };
          } else if (sprinklers[spot.index] && sprinklers[spot.index] > nowSec) {
            placedItem = { type: 'sprinkler', expiryTime: sprinklers[spot.index], onExpire: handleRemoveSprinkler };
          } else if (umbrellas[spot.index] && umbrellas[spot.index] > nowSec) {
            placedItem = { type: 'umbrella', expiryTime: umbrellas[spot.index], onExpire: handleRemoveUmbrella };
          }

          let placingType = null;
          if (isPlacingScarecrow) placingType = placingScarecrowType;
          else if (isPlacingTesla) placingType = 'tesla';
          else if (isPlacingLadybug) placingType = 'ladybug';
          else if (isPlacingSprinkler) placingType = 'sprinkler';
          else if (isPlacingUmbrella) placingType = 'umbrella';

          return (
            <ProtectorSpot
              key={`protector-spot-${spot.index}`}
              spotId={spot.index}
              pos={FARM_POSITIONS[spot.index]}
              offsetX={spot.offsetX}
              offsetY={spot.offsetY}
              placingType={placedItem ? null : placingType}
              placedItem={placedItem}
              onPlace={(spotId, type) => {
                if (type.includes('tier') || type === 'ladybug_scarecrow') handlePlaceScarecrow(spotId, type);
                if (type === 'tesla') handlePlaceTesla(spotId);
                if (type === 'ladybug') handlePlaceLadybug(spotId);
                if (type === 'sprinkler') handlePlaceSprinkler(spotId);
                if (type === 'umbrella') handlePlaceUmbrella(spotId);
              }}
              onRemove={async (spotId, type) => {
                if (isHoeing) {
                  if (type.includes('tier') || type === 'ladybug_scarecrow') handleRemoveScarecrow(spotId);
                  if (type === 'ladybug') handleRemoveLadybug(spotId);
                  if (type === 'tesla') {
                      setTeslaTowers(prev => { const n = {...prev}; delete n[spotId]; teslaTowersRef.current = n; localStorage.setItem('sandbox_tesla', JSON.stringify(n)); return n; });
                      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}'); sandboxLoot[9975] = (sandboxLoot[9975]||0)+1; localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
                  }
                  if (type === 'sprinkler') handleRemoveSprinkler(spotId);
                  if (type === 'umbrella') {
                    handleRemoveUmbrella(spotId);
                    await loadCropsFromContract();
                  }
                  show(`${type.charAt(0).toUpperCase() + type.slice(1)} removed!`, "success");
                } else {
                  show("Equip the Hoe to remove placed items!", "warning");
                }
              }}
            />
          );
        })}

        {tutorialStep >= 36 && (
          <>

        {/* The Well Label Overlay */}
        <div 
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(0, 191, 255, 0.8))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleWellDrop();
          }}
          style={{ display: 'none', position: 'absolute', top: '355px', left: '235px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
        >
          <div style={{ backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '15px 30px', borderRadius: '12px', border: '3px solid #5a402a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ color: '#00bfff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>
              🪣 THE WELL
            </span>
          </div>
        </div>

        {/* The Mine Label Overlay - temporarily hidden */}
          </>
        )}

        {/* Animal Farm Label Overlay */}
        {hasBarnMissionUnlocked && (
          <div 
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              navigateWithClouds(navigate, '/animal');
            }}
            style={{ position: 'absolute', top: '518px', left: '200px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
          >
            <div style={{ backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '15px 30px', borderRadius: '12px', border: '3px solid #5a402a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textShadow: '2px 2px 0 #000' }}>
                🐄 ANIMAL FARM
              </span>
            </div>
          </div>
        )}


      </PanZoomViewport>
      {isFarmMenu && (
        <FarmMenu
          isPlant={isPlanting}
          isUsingPotion={isUsingPotion}
          onCancel={handleCancel}
          onPlant={handlePlant}
          onHarvest={handleHarvest}
          onPlantAll={plantAll}
          onPotionUse={handlePotionUse}
          selectedSeed={selectedSeed}
          selectedPotion={selectedPotion}
          loading={farmingLoading}
        />
      )}
      {isSelectCropDialog && (
        <SelectSeedDialog
          onClose={() => setIsSelectCropDialog(false)}
          onClickSeed={handleClickSeedFromDialog}
          availableSeeds={getAvailableSeeds()}
        />
      )}

      {prepDialogTarget !== null && (
        <PlotPrepDialog
          onClose={() => setPrepDialogTarget(null)}
          onPlaceDirt={() => {
            updatePlotPrep(prepDialogTarget, { ...plotPrep[prepDialogTarget], status: 3 });
            setPrepDialogTarget(null);
            playPlantConfirmSound();
          }}
          onAddFish={(fishId) => {
            const existingPrep = plotPrep[prepDialogTarget];
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            
            if (existingPrep?.status === 2 && existingPrep?.fishId) {
              sandboxLoot[existingPrep.fishId] = (sandboxLoot[existingPrep.fishId] || 0) + 1;
            }

            sandboxLoot[fishId] = Math.max(0, (sandboxLoot[fishId] || 0) - 1);
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            
            updatePlotPrep(prepDialogTarget, { status: 2, fishId });
            setPrepDialogTarget(null);
            show("Fish placed in the hole!", "success");
            if (refetchSeeds) refetchSeeds();
          }}
          availableFish={allItems.filter(item => Object.values(ID_FISH_ITEMS || {}).includes(item.id) && item.count > 0)}
          farmingLevel={farmingLevel}
        />
      )}

      {skipGrowTarget !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
          <SkipGrowthDialog
            onClose={() => setSkipGrowTarget(null)}
            onConfirm={handleSkipGrowth}
          />
        </div>
      )}

      {/* Cancel Placement Button */}
      {(isPlacingScarecrow || isPlacingLadybug || isPlacingSprinkler || isPlacingUmbrella || isPlacingTesla) && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}>
          <button
            onClick={() => {
              setIsPlacingScarecrow(false);
              setIsPlacingLadybug(false);
              setIsPlacingTesla(false);
              setIsPlacingSprinkler(false);
              setIsPlacingUmbrella(false);
              setIsPlanting(true);
            }}
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff4444', border: '2px solid #ff4444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,68,68,0.5)' }}
          >
            [CANCEL PLACEMENT]
          </button>
        </div>
      )}
  
  {/* Farming Board Dialog */}
  {showFarmingBoard && (
    <RegionalQuestBoard 
      onClose={() => setShowFarmingBoard(false)} 
      title="FARMING MISSIONS"
      questType="farming"
      tutorialStep={tutorialStep}
      completedQuests={completedQuests}
      setCompletedQuests={setCompletedQuests}
      refetch={refetch} 
    />
  )}

  <style>{`
    .tutorial-img { transition: transform 0.08s, filter 0.08s; cursor: pointer; }
    .tutorial-img:active { transform: scale(0.96); filter: brightness(0.8); }
  `}</style>

  {/* Tutorial step indicator — top-right debug readout */}
  {tutorialStep < 36 && (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 100003,
      background: 'rgba(0,0,0,0.75)',
      color: '#f5d87a',
      fontFamily: 'GROBOLD, Cartoonist, monospace',
      fontSize: 14,
      padding: '6px 12px',
      borderRadius: 8,
      border: '1px solid rgba(200,130,26,0.6)',
      pointerEvents: 'none',
      letterSpacing: 1,
    }}>STEP {tutorialStep}</div>
  )}

  {/* Persistent Papabee — one mount, keeps floating across step transitions */}
  <TutorialPapabee step={tutorialStep} dimmedBehind={isSelectCropDialog} />

  {/* Tutorial Part 1 — Papabee intro */}
  {tutorialStep === 0 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="HEY!" advanceTo={2} showPapabee={true} papabeeSilhouette={true} />}
  {/* Tutorial Part 2 */}
  {tutorialStep === 2 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="COME OVER HERE!" advanceTo={3} showPapabee={true} papabeeSilhouette={true} />}
  {/* Tutorial Part 3 — Papabee appears */}
  {tutorialStep === 3 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Hey! Its me your great once removed uncle papabee... remeber?" advanceTo={4} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} papabeeReveal={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 4 — Papabee addresses the player */}
  {tutorialStep === 4 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="And its you... the one with the name..." advanceTo={5} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 5 — Papabee apologizes */}
  {tutorialStep === 5 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Sorry I have a terrible memory and its been years." advanceTo={6} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 6 — Papabee asks for name */}
  {tutorialStep === 6 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Remind me, what is your name?" advanceTo={7} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 7 — Name prompt popup */}
  {tutorialStep === 7 && <TutorialNamePrompt setTutorialStep={setTutorialStep} advanceTo={8} />}
  {/* Tutorial Part 8 — Papabee remembers the name */}
  {tutorialStep === 8 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText={`AH ${localStorage.getItem('sandbox_username') || 'friend'}! how could I forget, its great to see you again!`} advanceTo={9} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 9 — Welcome to the farm */}
  {tutorialStep === 9 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Well welcome to my farm... well actually its now yours!" advanceTo={10} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 10 — Papabee offers a lesson */}
  {tutorialStep === 10 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Let me give you a quick lesson on how to be the best farmer in the valley, second to me of course HAHA!" advanceTo={11} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 11 — Toolbelt intro (bubble + papabee moved up & left) */}
  {tutorialStep === 11 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="This is your toolbelt, it holds everything you need to get to growing crops, dont lose it thats the only one I have..." advanceTo={12} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" shiftX={600} shiftY={50} />}
  {/* Tutorial Part 12 — Show the 3 starter plots (Xs appear, no dim) */}
  {tutorialStep === 12 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Here are your plots. I know its not alot but you will be able to get more later." advanceTo={13} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {tutorialStep === 12 && <TutorialStarterPlotsBright staggered={true} />}
  {/* Tutorial Part 13 — Shovel intro */}
  {tutorialStep === 13 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="This is your Shovel you can use it to dig holes, thats step 1 to growing a crop... You're lucky you have such a great teacher!" advanceTo={14} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="18px" textMaxWidth="620px" />}
  {/* Tutorial Part 14 — Prompt to click a plot (dim on, bright X/hole overlay, auto-advances to 15) */}
  {tutorialStep === 14 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Click on any plot to dig your first hole!" advanceTo={15} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" noAdvance={true} />}
  {tutorialStep === 14 && <TutorialStarterPlotsBright staggered={false} allowHover={true} />}
  {/* Tutorial Part 15 — Dirt bag intro (dim on, holes bright, shovel hidden, soil highlighted) */}
  {tutorialStep === 15 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Wow great job! You see the bag of dirt, thats what you use to fill up the hole. Click on the hole to fill it with dirt." advanceTo={16} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" noAdvance={true} />}
  {tutorialStep === 15 && <TutorialStarterPlotsBright staggered={false} onlyHoles={true} allowHover={true} />}
  {/* Tutorial Part 16 — Seed bag intro (dim on, dirt bright, soil hidden, seeds highlighted) */}
  {tutorialStep === 16 && !isSelectCropDialog && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Ok have you done this before? Must be genetics! Here is a potato seed, click on the dirt to plant the potato!" advanceTo={17} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" noAdvance={true} />}
  {tutorialStep === 16 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 17 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 18 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 19 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 20 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 21 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 22 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 23 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 24 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {tutorialStep === 25 && <TutorialStarterPlotsBright staggered={false} onlyDirt={true} allowHover={true} />}
  {/* Tutorial Part 17 — Water bucket intro */}
  {tutorialStep === 17 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Perfect! Now you see the water bucket, thats what you use to water your plants! Click on your pile now to give that soil and seed some well deserved H20" advanceTo={18} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="18px" textMaxWidth="620px" textShiftY={-3} noAdvance={true} />}
  {/* Tutorial Part 18 — Heat mention (click to advance) */}
  {tutorialStep === 18 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Ouf I might need some water soon, its hot!" advanceTo={19} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" />}
  {/* Tutorial Part 19 — WOAH, crow flies in, auto-advances when it lands */}
  {tutorialStep === 19 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="WOAH whats that coming down from the sky! WATCH YOUR HEAD." advanceTo={20} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" noAdvance={true} />}
  {/* Tutorial Part 20 — Tap the crow */}
  {tutorialStep === 20 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="HURRY Tap the bird to SHooo it away!" advanceTo={21} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" noAdvance={true} />}
  {/* Tutorial Part 21 — Crows are dangerous */}
  {tutorialStep === 21 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Man, crows are very dangeruos to your crops, if they stay on the crop too long they will eat it! Now as I was saying... wait... whats that sound" advanceTo={22} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="18px" textMaxWidth="620px" />}
  {/* Tutorial Part 22 — Tap the bugs */}
  {tutorialStep === 22 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Ugh I hate bugs... wait Im a bug... Well these ones are still super annoying if you let them buzz around your crop will stop growing, tap them, hurry!" advanceTo={23} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="18px" textMaxWidth="620px" textShiftY={-5} noAdvance={true} />}
  {/* Tutorial Part 23 — Gems gift */}
  {tutorialStep === 23 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Finally peace and quiet. I guess all there is to do is wait... but you know busy bees, we cant wait forever... Here are some gems to speed up the process." advanceTo={24} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="18px" textMaxWidth="620px" textShiftY={-10} />}
  {/* Tutorial Part 24 — Click pile to skip wait time */}
  {tutorialStep === 24 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Click on the pile to skip the wait time." advanceTo={25} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" noAdvance={true} />}
  {/* Tutorial Part 25 — Congrats on first harvest */}
  {tutorialStep === 25 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="CONGRATS on your first harvest, I see you going far and this is just the beggining" advanceTo={26} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" shiftX={660} shiftY={-160} dismissHarvestRevealOnAdvance={true} />}
  {/* Tutorial Part 26 — Your farm, your story */}
  {tutorialStep === 26 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="This is your farm, your valley, and your story" advanceTo={27} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 27 — Where am I going? */}
  {tutorialStep === 27 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Where am I going? Well its about time your once removed great uncle hand over the keys to a young folk and go live the slow life" advanceTo={28} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="18px" textMaxWidth="620px" />}
  {/* Tutorial Part 28 — Letters */}
  {tutorialStep === 28 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Dont worry, Ill send you some letters and you can send me some too... Only if you want too." advanceTo={29} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" />}
  {/* Tutorial Part 29 — One last gift */}
  {tutorialStep === 29 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="I do have one last gift for you" advanceTo={30} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 30 — Pico Seed pack intro */}
  {tutorialStep === 30 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Here is a Pico Seed pack, open it and lets see what you get" advanceTo={32} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" />}
  {/* Tutorial Part 33 — Reaction to pack contents */}
  {tutorialStep === 33 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Wow you got some good seeds, and look at all that gold and gems..." advanceTo={34} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="20px" textMaxWidth="620px" />}
  {/* Tutorial Part 34 — Heading off */}
  {tutorialStep === 34 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText="Well I think ill be heading off now" advanceTo={35} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" />}
  {/* Tutorial Part 35 — Farewell (uses username) */}
  {tutorialStep === 35 && <TutorialBubbleOverlay setTutorialStep={setTutorialStep} fullText={`So long ${localStorage.getItem('sandbox_username') || 'friend'}, make me proud!`} advanceTo={36} bubbleSrc="/images/tutorial/papabeebubble.png" showPapabee={true} fontSize="22px" textMaxWidth="620px" exitOnAdvance={true} />}


  {/* Easter Basket Dialog */}
      {tutorialStep >= 9 && showEasterBasket && <EasterBasketDialog onClose={() => setShowEasterBasket(false)} />}

      <AdminPanel />

      {showMissionBoard && <MissionBoard onClose={() => withIris(() => setShowMissionBoard(false))} />}
      {showShop && <Shop onClose={() => setShowShop(false)} />}
      {showFarmCustomize && <FarmCustomizePanel onClose={() => setShowFarmCustomize(false)} />}
      {showPabeePack && (
        <PokemonPackRipDialog
          rollingInfo={{
            id: 'pabee_pack',
            count: 2,
            isReveal: true,
            isComplete: true,
            isFallback: false,
            revealedSeeds: [
              getRaritySeedId(ID_SEEDS.CARROT, 1),
              getRaritySeedId(ID_SEEDS.CARROT, 1),
            ],
          }}
          onClose={() => {
            setShowPabeePack(false);
            if (tutorialStep === 0) {
              setTutorialStep(1);
              localStorage.setItem('sandbox_tutorial_step', '1');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
            }
          }}
          onBack={() => {
            setShowPabeePack(false);
            if (tutorialStep === 0) {
              setTutorialStep(1);
              localStorage.setItem('sandbox_tutorial_step', '1');
              window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
            }
          }}
        />
      )}
      {charPackInfo && (
        <PokemonPackRipDialog
          rollingInfo={{
            id: charPackInfo.tier,
            count: charPackInfo.seeds.length,
            isReveal: true,
            isComplete: true,
            isFallback: false,
            revealedSeeds: charPackInfo.seeds,
          }}
          onClose={() => {
            const pending = charPackInfo?.pendingLevelUp;
            setCharPackInfo(null);
            if (pending) setTimeout(() => window.dispatchEvent(new CustomEvent('levelUp', { detail: pending })), 300);
          }}
          onBack={() => {
            const pending = charPackInfo?.pendingLevelUp;
            setCharPackInfo(null);
            if (pending) setTimeout(() => window.dispatchEvent(new CustomEvent('levelUp', { detail: pending })), 300);
          }}
        />
      )}

      {/* FestivalsDialog — temporarily hidden */}

      {/* Fixed Tool Belt — stays on screen regardless of zoom/pan */}
      {(tutorialStep >= 36 || (tutorialStep >= 11 && tutorialStep <= 35) || (tutorialStep === 3 && tutPage >= 4)) && (
        <div style={{ position: 'fixed', bottom: '-7px', left: '50%', transform: 'translateX(-50%) scale(0.85)', transformOrigin: 'bottom center', width: '896px', height: '144px', zIndex: (isSelectCropDialog || (tutorialStep >= 25 && tutorialStep <= 35)) ? 500 : ((tutorialStep >= 11 && tutorialStep <= 35) ? 100001 : 500), pointerEvents: 'none', filter: ((isSelectCropDialog && tutorialStep === 16) || tutorialStep === 32) ? 'blur(4px) brightness(0.6)' : ((tutorialStep >= 25 && tutorialStep <= 35) ? 'brightness(0.6)' : 'none'), transition: 'filter 0.2s ease' }}>
          {tutorialStep === 11 && (
            <style>{`@keyframes beltGlow { 0%,100% { filter: drop-shadow(0 0 8px gold) drop-shadow(0 0 18px rgba(255,210,0,0.7)); } 50% { filter: drop-shadow(0 0 18px gold) drop-shadow(0 0 36px rgba(255,210,0,0.9)); } }`}</style>
          )}
          <img src="/images/farming/realbeltbottom.png" alt="" draggable={false} style={{ position: 'absolute', bottom: 0, left: 0, width: '896px', pointerEvents: 'none', zIndex: 1, animation: (tutorialStep === 11) ? 'beltGlow 1.4s ease-in-out infinite' : 'none' }} />
          {(() => {
            const shovelVisible = (tutorialStep >= 36 || tutorialStep === 13 || tutorialStep === 14 || (tutorialStep >= 25 && tutorialStep <= 35) || (tutorialStep === 3 && tutPage >= 5));
            return (
              <div style={{ position: 'absolute', bottom: '43px', left: '167px', width: '48px', zIndex: 2, transform: shovelVisible ? 'scale(1)' : 'scale(0)', transformOrigin: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', pointerEvents: 'none' }}>
                <img src="/images/farming/realshovel.png" alt="Shovel" draggable={false}
                  style={{ width: '100%', pointerEvents: 'none' }} />
              </div>
            );
          })()}
          {(() => {
            const soilVisible = (tutorialStep >= 36 || tutorialStep === 15 || (tutorialStep >= 25 && tutorialStep <= 35) || (tutorialStep === 3 && tutPage >= 6)) && tutorialStep !== 16;
            return (
              <div style={{ position: 'absolute', bottom: '59px', left: '268px', width: '83px', zIndex: 2, transform: soilVisible ? 'scale(1)' : 'scale(0)', transformOrigin: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', pointerEvents: 'none' }}>
                <img src="/images/farming/realsoil.png" alt="Soil" draggable={false}
                  style={{ width: '100%', pointerEvents: 'none' }} />
              </div>
            );
          })()}
          {(() => {
            const seedsVisible = (tutorialStep >= 36 || tutorialStep === 16 || (tutorialStep >= 25 && tutorialStep <= 35) || (tutorialStep === 3 && tutPage >= 7));
            return (
              <div style={{ position: 'absolute', bottom: '61px', left: '413px', width: '69px', zIndex: 2, transform: seedsVisible ? 'scale(1)' : 'scale(0)', transformOrigin: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', pointerEvents: 'none' }}>
                <img src="/images/farming/realseeds.png" alt="Seeds" draggable={false}
                  style={{ width: '100%', pointerEvents: 'none' }} />
              </div>
            );
          })()}
          {(() => {
            const bucketVisible = (tutorialStep >= 36 || tutorialStep === 17 || (tutorialStep >= 25 && tutorialStep <= 35) || (tutorialStep === 3 && tutPage >= 8));
            return (
              <div style={{ position: 'absolute', bottom: '59px', left: '535px', width: '101px', zIndex: 2, transform: bucketVisible ? 'scale(1)' : 'scale(0)', transformOrigin: 'center', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', pointerEvents: 'none' }}>
                <img src="/images/farming/realbucket.png" alt="Bucket" draggable={false}
                  style={{ width: '100%', pointerEvents: 'none' }} />
              </div>
            );
          })()}
          {false && (
            <img src="/images/farming/realfork.png" alt="Fork" draggable={false} />
          )}
          <img src="/images/farming/realbelttop.png" alt="" draggable={false} style={{ position: 'absolute', bottom: '27px', left: '146px', width: '602px', pointerEvents: 'none', zIndex: 3 }} />
        </div>
      )}
    </div>
  );
};

export default Farm;
