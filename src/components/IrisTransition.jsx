import React, { useEffect, useRef, useState } from 'react';

// Logo-shaped iris wipe used when entering/exiting buildings + dialogs.
//
// Implementation: an SVG that fills exactly the viewport with a black <rect>
// masked by the bee silhouette. The bee scales via CSS transform on a
// nested <g>, so the only thing changing per frame is one transform value.
//
// Why this is smooth:
//  - The SVG is sized to 100vw × 100vh (NOT 220vmax × 220vmax) so the
//    browser only has to rasterize one screen's worth of pixels per frame.
//  - The mask is static (the bee image is a fixed source); only the
//    bee's transform interpolates, so the GPU can keep the mask cached.
//  - `will-change: transform` and `transform: translateZ(0)` promote the
//    SVG and the bee to their own GPU compositor layers.
//  - Returning null when idle ensures the heavy SVG is fully gone from the
//    DOM during normal play, never quietly burning paint cycles.

const TRANSITION_MS = 1300;
// Big enough that the bee silhouette's body fully covers all four viewport
// corners at "fully open" with the smaller 100vw × 100vh SVG canvas. With
// the square viewBox slicing into the screen, scale 5 leaves no black corners.
const FULLY_OPEN_SCALE = 5;
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const LOGO_SRC = '/images/transition/logo.png';

const IrisTransition = () => {
  // Track whether the iris is currently in motion. When false the SVG isn't
  // rendered at all — keeps the DOM clean during normal play.
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(FULLY_OPEN_SCALE);
  const deactivateTimerRef = useRef(null);

  useEffect(() => {
    const onIris = (e) => {
      const phase = e?.detail?.phase;
      if (deactivateTimerRef.current) {
        clearTimeout(deactivateTimerRef.current);
        deactivateTimerRef.current = null;
      }
      if (phase === 'close') {
        setActive(true);
        setScale(FULLY_OPEN_SCALE);
        // Two RAFs ensure the initial render at FULLY_OPEN_SCALE commits
        // before we set scale to 0 — without that the CSS transition is
        // collapsed and the bee snaps shut without animating.
        requestAnimationFrame(() => requestAnimationFrame(() => setScale(0)));
      } else if (phase === 'open') {
        setActive(true);
        setScale(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setScale(FULLY_OPEN_SCALE)));
        deactivateTimerRef.current = setTimeout(() => {
          setActive(false);
          deactivateTimerRef.current = null;
        }, TRANSITION_MS + 60);
      }
    };
    window.addEventListener('irisTransition', onIris);
    return () => {
      window.removeEventListener('irisTransition', onIris);
      if (deactivateTimerRef.current) clearTimeout(deactivateTimerRef.current);
    };
  }, []);

  if (!active) return null;

  // Block clicks any time we're not effectively wide open.
  const isCovering = scale < FULLY_OPEN_SCALE - 0.001;

  return (
    <svg
      aria-hidden="true"
      viewBox="-1 -1 2 2"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: isCovering ? 'auto' : 'none',
        zIndex: 9999999,
        // Force the SVG onto its own compositor layer so the mask animation
        // doesn't trigger repaints on ancestor layers.
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <defs>
        <mask id="logoIrisMask">
          {/* White rect = "show overlay everywhere" baseline. */}
          <rect x="-1" y="-1" width="2" height="2" fill="white" />
          {/* Bee silhouette overrides the rect with black where the bee's
              opaque pixels are, carving a transparent hole out of the
              masked black overlay. */}
          <g
            style={{
              transform: `scale(${scale})`,
              // Origin at viewBox (0, 0) — that's the center of our viewBox.
              transformOrigin: '0 0',
              transition: `transform ${TRANSITION_MS}ms ${EASE}`,
              willChange: 'transform',
            }}
          >
            <image
              href={LOGO_SRC}
              x="-0.5"
              y="-0.7"
              width="1"
              height="1.4"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </mask>
      </defs>
      <rect
        x="-1"
        y="-1"
        width="2"
        height="2"
        fill="rgba(0,0,0,1)"
        mask="url(#logoIrisMask)"
      />
    </svg>
  );
};

// Helper: closes the iris fully, holds the screen black while the callback
// runs (so any new dialog can mount, fetch, image-decode, finish its own
// open animation, etc.), THEN opens the iris back up to reveal the result.
const HOLD_BLACK_MS = 400;
export const withIris = (callback) => {
  if (typeof window === 'undefined') {
    callback?.();
    return;
  }
  window.dispatchEvent(new CustomEvent('irisTransition', { detail: { phase: 'close' } }));
  setTimeout(() => {
    try { callback?.(); } catch (_) {}
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('irisTransition', { detail: { phase: 'open' } }));
    }, HOLD_BLACK_MS);
  }, TRANSITION_MS + 80);
};

export default IrisTransition;
