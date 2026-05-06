import React, { useEffect, useState } from 'react';

// Three-phase cloud "swarm" used when the player moves between routes.
// Phase 1 (covering): a flock of cloud sprites flies in from every edge of
//   the viewport and settles into a tiled formation that fully blankets the
//   screen. The route swap happens once the wash + clouds are fully opaque.
// Phase 2 (covered):  clouds + wash hold for a beat so the new scene mounts
//   cleanly behind them.
// Phase 3 (uncovering): every cloud + the wash fade out together, revealing
//   the new scene without sliding off — feels like the clouds dissipate.
//
// Triggered by the `cloudCover` and `cloudUncover` window events. Use the
// `navigateWithClouds(navigate, path)` helper below to do the full round trip.

const COVER_MS = 850;
// HOLD_MS is the time the clouds + logo sit fully on screen before the
// uncover starts. Bumped so the logo has a real beat at full opacity instead
// of fading in and immediately fading out.
const HOLD_MS  = 1000;
// Uncover is noticeably slower than cover — the clouds drift out at a
// calmer pace than they swarmed in, so the reveal doesn't feel snapped.
const UNCOVER_MS = 3200;
// Largest per-cloud stagger delay. Used in the unmount timer so the
// component sticks around long enough for the slowest cloud to finish.
const UNCOVER_STAGGER_MAX = 200;
// Logo fades out quickly at the start of the uncover, well before the
// clouds finish drifting away.
const LOGO_FADE_OUT_MS = 600;
const COVER_EASE = 'cubic-bezier(0.32, 0.94, 0.5, 1)'; // soft overshoot for a "puff" feel

const cloudPath = (n) => `/images/land/cloud${['one', 'two', 'three'][n - 1]}.png`;

// Each cloud has an "off" position (well off-screen, where it spawns) and an
// "on" position (where it lives once the swarm has assembled). Targets are
// distributed across the viewport so the assembled swarm has full coverage
// at every band of the screen.
const CLOUDS = [
  // Top band — drop down from above
  { src: 1, offX: '-30vw', offY: '-130vh', onX: '-32vw', onY: '-32vh', w: '60vw', rot:  -8, flip: false, br: 1.05 },
  { src: 2, offX:   '0vw', offY: '-130vh', onX:   '2vw', onY: '-34vh', w: '64vw', rot:   3, flip: false, br: 1.06 },
  { src: 3, offX:  '30vw', offY: '-130vh', onX:  '32vw', onY: '-30vh', w: '58vw', rot:  10, flip: true,  br: 1.05 },
  // Mid-upper band — sweep in from the sides
  { src: 1, offX: '-150vw', offY: '-15vh', onX: '-34vw', onY: '-12vh', w: '52vw', rot:  -4, flip: true,  br: 1.04 },
  { src: 2, offX:  '150vw', offY: '-12vh', onX:  '34vw', onY:  '-8vh', w: '52vw', rot:   6, flip: false, br: 1.06 },
  // Center crossover — provides full middle coverage
  { src: 3, offX: '-160vw', offY:   '0vh', onX:   '0vw', onY:   '2vh', w: '70vw', rot:   0, flip: false, br: 1.08 },
  // Mid-lower band — sweep in from the sides (opposite direction for variety)
  { src: 2, offX:  '150vw', offY:  '12vh', onX:  '34vw', onY:  '12vh', w: '52vw', rot:   3, flip: true,  br: 1.05 },
  { src: 1, offX: '-150vw', offY:  '15vh', onX: '-34vw', onY:   '8vh', w: '52vw', rot:  -6, flip: false, br: 1.04 },
  // Bottom band — rise from below
  { src: 3, offX: '-30vw', offY:  '130vh', onX: '-32vw', onY:  '32vh', w: '60vw', rot:   8, flip: false, br: 1.05 },
  { src: 2, offX:   '0vw', offY:  '130vh', onX:   '0vw', onY:  '34vh', w: '64vw', rot:  -4, flip: true,  br: 1.06 },
  { src: 1, offX:  '30vw', offY:  '130vh', onX:  '32vw', onY:  '30vh', w: '58vw', rot: -10, flip: false, br: 1.05 },
  // Diagonal corner fill
  { src: 1, offX: '-150vw', offY: '-130vh', onX: '-48vw', onY: '-22vh', w: '42vw', rot: -16, flip: false, br: 1.03 },
  { src: 3, offX:  '150vw', offY: '-130vh', onX:  '48vw', onY: '-22vh', w: '42vw', rot:  16, flip: true,  br: 1.07 },
  { src: 2, offX: '-150vw', offY:  '130vh', onX: '-48vw', onY:  '22vh', w: '42vw', rot: -14, flip: true,  br: 1.04 },
  { src: 1, offX:  '150vw', offY:  '130vh', onX:  '48vw', onY:  '22vh', w: '42vw', rot:  14, flip: false, br: 1.05 },
  // Extra puffs scattered between the bands for density
  { src: 3, offX: '-150vw', offY: '-50vh', onX: '-15vw', onY: '-22vh', w: '34vw', rot:  -6, flip: false, br: 1.06 },
  { src: 2, offX:  '150vw', offY: '-50vh', onX:  '15vw', onY: '-22vh', w: '34vw', rot:   8, flip: true,  br: 1.05 },
  { src: 1, offX: '-150vw', offY:  '50vh', onX: '-15vw', onY:  '22vh', w: '34vw', rot:  10, flip: true,  br: 1.04 },
  { src: 3, offX:  '150vw', offY:  '50vh', onX:  '15vw', onY:  '22vh', w: '34vw', rot:  -8, flip: false, br: 1.07 },
];

// How early (in ms) before the transition fully ends to release pointer
// events back to the underlying scene, so the player can interact with
// hotspots/labels while the last sliver of clouds is still drifting away.
const EARLY_RELEASE_MS = 1500;

const RouteCloudTransition = () => {
  // 'idle' | 'covering' | 'covered' | 'uncovering'
  const [phase, setPhase] = useState('idle');
  // Flips to true ~one frame after `covering` starts so the CSS transition
  // animates from the off-screen pose to the assembled pose.
  const [staged, setStaged] = useState(false);
  // Once true, the wrapper stops swallowing pointer events so the underlying
  // scene becomes clickable while the tail of the uncover animation finishes.
  const [clicksReleased, setClicksReleased] = useState(false);

  useEffect(() => {
    const onCover = () => {
      setPhase('covering');
      setStaged(false);
      setClicksReleased(false);
      // Two RAFs to be sure the initial off-screen render commits before we
      // toggle to the on-screen pose — otherwise the browser collapses the
      // change and the clouds jump straight to assembled with no animation.
      requestAnimationFrame(() => requestAnimationFrame(() => setStaged(true)));
    };
    const onUncover = () => {
      setPhase('uncovering');
      // Release clicks ~EARLY_RELEASE_MS before the unmount so the player
      // can start interacting with the new scene before the last clouds
      // finish drifting off.
      const totalMs = UNCOVER_MS + UNCOVER_STAGGER_MAX + 50;
      setTimeout(() => setClicksReleased(true), Math.max(0, totalMs - EARLY_RELEASE_MS));
      // Wait for the slowest cloud + the logo's matched fade to finish before
      // unmounting, otherwise the tail end of the animation gets cut off.
      setTimeout(() => {
        setPhase('idle');
        setStaged(false);
        setClicksReleased(false);
      }, totalMs);
    };
    window.addEventListener('cloudCover', onCover);
    window.addEventListener('cloudUncover', onUncover);
    return () => {
      window.removeEventListener('cloudCover', onCover);
      window.removeEventListener('cloudUncover', onUncover);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'covering') return;
    const t = setTimeout(() => setPhase('covered'), COVER_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'idle') return null;

  const isFading = phase === 'uncovering';
  // Clouds use the assembled "on" pose during covering (after stage) and the
  // entire covered phase, then return to their off-screen spawn pose during
  // uncovering — that way the uncover plays as a reverse of the cover (each
  // cloud retraces its path back to where it came from) instead of fading.
  const useOnPose = (phase === 'covering' && staged) || phase === 'covered';
  const washOpacity = phase === 'covering' && !staged ? 0 : (isFading ? 0 : 1);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999998,
        // Release pointer events early so the player can click labels /
        // hotspots while the tail of the uncover animation finishes.
        pointerEvents: clicksReleased ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Solid sky wash — fills any gaps between the cloud sprites once the
          swarm is assembled. Fades in with the clouds and fades out with them. */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #d9ecff 0%, #f5f0d8 50%, #ffe9bd 100%)',
          opacity: washOpacity,
          transition: isFading
            ? `opacity ${UNCOVER_MS}ms ease-out`
            : `opacity ${COVER_MS}ms ${COVER_EASE}`,
        }}
      />

      {/* Cloud swarm */}
      {CLOUDS.map((c, i) => {
        const tx = useOnPose ? c.onX : c.offX;
        const ty = useOnPose ? c.onY : c.offY;
        const transform =
          `translate(-50%, -50%) translate(${tx}, ${ty}) rotate(${c.rot}deg)${c.flip ? ' scaleX(-1)' : ''}`;
        return (
          <img
            key={i}
            src={cloudPath(c.src)}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: c.w, height: 'auto',
              transform,
              opacity: 1,
              // The transform transition handles BOTH directions — coming in
              // (off → on) and going out (on → off) — so the uncover is the
              // exact reverse of the cover instead of a fade.
              transition: isFading
                // Going out — slight stagger so the swarm peels off rather
                // than moving as one rigid block.
                ? `transform ${UNCOVER_MS}ms ${COVER_EASE} ${(i * 25) % 200}ms`
                // Coming in — same staggered timing for symmetry.
                : `transform ${COVER_MS}ms ${COVER_EASE} ${(i * 25) % 200}ms`,
              pointerEvents: 'none',
              filter: `brightness(${c.br ?? 1})`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}

      {/* HoneyValleys logo — fades in once the clouds have fully gathered,
          holds during 'covered', and fades back out as the clouds disperse. */}
      <img
        src="/images/transition/hvlogo.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 'auto', height: '40vmin',
          // Slight scale-up while present for a subtle "settle" feel.
          transform: phase === 'covered'
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.85)',
          opacity: phase === 'covered' ? 1 : 0,
          // Logo fades out quickly at the start of the uncover so it's gone
          // well before the clouds finish drifting away.
          transition: isFading
            ? `opacity ${LOGO_FADE_OUT_MS}ms ease-out, transform ${LOGO_FADE_OUT_MS}ms ease-out`
            : `opacity 350ms ease-out, transform 500ms ${COVER_EASE}`,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.35))',
          willChange: 'opacity, transform',
        }}
      />
    </div>
  );
};

// Helper: clouds cover, then navigate, then clouds uncover. Pass in the
// `navigate` function from useNavigate() and the target path. Skips the
// cloud sweep entirely if the player is already on the target route, so
// clicking the active nav button doesn't trigger a useless transition.
// Module-level lock so overlapping clicks during a cloud sweep can't
// restart the animation mid-flight (which used to make the clouds jump
// back to their off-screen spawn poses and "cut" the transition).
let cloudTransitionInProgress = false;

export const navigateWithClouds = (navigate, path) => {
  if (typeof window === 'undefined') {
    navigate?.(path);
    return;
  }
  // Already mid-transition — drop the extra click. The user has to wait for
  // the current sweep to finish before they can fire a new one.
  if (cloudTransitionInProgress) return;

  const currentPath = (window.location.pathname || '').replace(/\/$/, '');
  const targetPath = (path || '').replace(/\/$/, '').split('?')[0].split('#')[0];
  if (currentPath === targetPath) return;

  cloudTransitionInProgress = true;
  window.dispatchEvent(new CustomEvent('cloudCover'));
  setTimeout(() => {
    try { navigate?.(path); } catch (_) {}
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cloudUncover'));
      // Release the lock once the entire uncover (including the slowest
      // staggered cloud + logo fade) has finished, matching the unmount
      // timer inside the component.
      setTimeout(() => {
        cloudTransitionInProgress = false;
      }, UNCOVER_MS + UNCOVER_STAGGER_MAX + 60);
    }, HOLD_MS);
  }, COVER_MS);
};

export default RouteCloudTransition;
