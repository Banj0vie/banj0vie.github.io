import React, { useState, useEffect } from 'react';

// Pulse + "!" badge effect for the VENDOR and Mission Board labels until the user has
// clicked them for the first time. Uses localStorage flags + a questStateChanged listener
// so it reactively turns off on click without polling.
//
// The mission board pulse waits until the dedicated `q2_missionboard_intro` letter has
// been read or completed — the earlier mayor market-intro letter wakes the hotspot
// (so it's visible) but doesn't yet ask the player to act on it.
const isMissionBoardLetterRead = () => {
  let read = [];
  let completed = [];
  try { read = JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]'); } catch (_) {}
  try { completed = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]'); } catch (_) {}
  return read.includes('q2_missionboard_intro') || completed.includes('q2_missionboard_intro');
};

const HotspotAttentionEffects = () => {
  const [pulse, setPulse] = useState(() => ({
    vendor: localStorage.getItem('sandbox_vendor_label_seen') !== 'true',
    missionBoard: localStorage.getItem('sandbox_missionboard_seen') !== 'true' && isMissionBoardLetterRead(),
  }));
  useEffect(() => {
    const update = () => setPulse({
      vendor: localStorage.getItem('sandbox_vendor_label_seen') !== 'true',
      missionBoard: localStorage.getItem('sandbox_missionboard_seen') !== 'true' && isMissionBoardLetterRead(),
    });
    window.addEventListener('questStateChanged', update);
    return () => window.removeEventListener('questStateChanged', update);
  }, []);
  return (
    <style>{`
      @keyframes hotspotAttentionPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.15); }
      }
      ${pulse.vendor ? `.map-btn[title="VENDOR"] {
        animation: hotspotAttentionPulse 1.1s ease-in-out infinite !important;
      }` : ''}
      ${pulse.missionBoard ? `.map-btn[title="Mission Board"] {
        animation: hotspotAttentionPulse 1.1s ease-in-out infinite !important;
        position: relative !important;
      }
      .map-btn[title="Mission Board"]::after {
        content: '';
        position: absolute;
        top: -8px; right: -2px;
        width: 28px; height: 28px;
        background-image: url(/images/mail/!.png);
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        pointer-events: none;
        animation: hotspotAttentionPulse 0.9s ease-in-out infinite;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.7));
      }` : ''}
    `}</style>
  );
};

// Drifting cloud shadows + wind streaks + soft corner lights.
// Mounted once at the App level so animations persist across route changes — switching from
// market to farm doesn't reset cloud positions, giving the feel of one continuous sky.
//
// Cloud cycles are mostly off-screen (visible window ≈ 22% of duration), so most of the time
// any given cloud is invisible. Across the 9-cloud set staggered with negative delays, 2-4
// clouds overlap in view at any moment.

const CLOUDS = [
  // Top layer (high in the sky — small, fast, light)
  { src: '/images/land/cloudone.png',   anim: 'cloudDriftEa', dur: 320, delay: '-20s',  pos: { top: '-5vh', left: '-50vw' }, size: { width: '115vw', height: '70vh' },  blur: 13, rot:  -8, flip: false },
  { src: '/images/land/cloudthree.png', anim: 'cloudDriftEd', dur: 280, delay: '-130s', pos: { top: '2vh',  left: '-50vw' }, size: { width: '85vw',  height: '55vh' },  blur: 12, rot:  10, flip: true  },
  // Mid-upper layer (medium)
  { src: '/images/land/cloudtwo.png',   anim: 'cloudDriftEb', dur: 380, delay: '-70s',  pos: { top: '12vh', left: '-50vw' }, size: { width: '155vw', height: '95vh' },  blur: 14, rot:  18, flip: false },
  { src: '/images/land/cloudone.png',   anim: 'cloudDriftEc', dur: 340, delay: '-200s', pos: { top: '8vh',  left: '-50vw' }, size: { width: '100vw', height: '65vh' },  blur: 13, rot: -15, flip: true  },
  // Mid layer (largest, dominant)
  { src: '/images/land/cloudthree.png', anim: 'cloudDriftEa', dur: 460, delay: '-150s', pos: { top: '20vh', left: '-50vw' }, size: { width: '205vw', height: '130vh' }, blur: 15, rot:   0, flip: false },
  { src: '/images/land/cloudtwo.png',   anim: 'cloudDriftEd', dur: 400, delay: '-280s', pos: { top: '24vh', left: '-50vw' }, size: { width: '135vw', height: '85vh' },  blur: 14, rot:  22, flip: true  },
  // Lower layer (slower, larger feels closer)
  { src: '/images/land/cloudone.png',   anim: 'cloudDriftEb', dur: 520, delay: '-100s', pos: { top: '36vh', left: '-50vw' }, size: { width: '175vw', height: '105vh' }, blur: 16, rot: -12, flip: false },
  { src: '/images/land/cloudthree.png', anim: 'cloudDriftEc', dur: 360, delay: '-240s', pos: { top: '40vh', left: '-50vw' }, size: { width: '95vw',  height: '60vh' },  blur: 13, rot:  30, flip: true  },
  // Drifter — odd horizontal slice for variety
  { src: '/images/land/cloudtwo.png',   anim: 'cloudDriftEa', dur: 600, delay: '-340s', pos: { top: '50vh', left: '-50vw' }, size: { width: '190vw', height: '115vh' }, blur: 16, rot:   8, flip: false },
];

const WIND_STREAKS = [
  { top: '14vh', width: '30vw', duration: 55, delay: -5 },
  { top: '42vh', width: '26vw', duration: 70, delay: -30 },
  { top: '78vh', width: '34vw', duration: 60, delay: -48 },
];

const SkyOverlay = () => {
  // Real-time time-of-day, anchored to Eastern Time (America/New_York — auto-adjusts EST/EDT).
  // Same sky for every player regardless of their local timezone.
  // Day:   06:00 - 18:00 ET → warm sun gleam, R → L across the screen
  // Night: 18:00 - 06:00 ET → cool moon gleam, R → L; subtle navy tint over the scene
  const { easternHours, isNight } = (() => {
    if (typeof window === 'undefined') return { easternHours: 12, isNight: false };
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
      const h = get('hour') + get('minute') / 60 + get('second') / 3600;
      return { easternHours: h, isNight: h >= 18 || h < 6 };
    } catch (_) {
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const h = (utcHours - 5 + 24) % 24;
      return { easternHours: h, isNight: h >= 18 || h < 6 };
    }
  })();

  // Sun cycle anchors to 6:00 ET (right edge), reaches the left at 18:00.
  const sunAnimationDelay = `-${((easternHours - 6 + 12) % 12) * 3600}s`;
  // Moon cycle anchors to 18:00 ET (right edge), reaches the left at 06:00 the next day.
  const moonAnimationDelay = `-${((easternHours - 18 + 12) % 12) * 3600}s`;

  return (
    <>
      <style>{`
        @keyframes cloudDriftE   { 0% { transform: translate(-60vw,   0);    opacity: 0; } 2% { opacity: 1; } 20% { opacity: 1; } 22% { transform: translate(160vw,   0);    opacity: 0; } 100% { transform: translate(-60vw,   0);    opacity: 0; } }
        @keyframes cloudDriftEa  { 0% { transform: translate(-60vw, -10vh); opacity: 0; } 2% { opacity: 1; } 20% { opacity: 1; } 22% { transform: translate(160vw,  18vh); opacity: 0; } 100% { transform: translate(-60vw, -10vh); opacity: 0; } }
        @keyframes cloudDriftEb  { 0% { transform: translate(-60vw,  12vh); opacity: 0; } 2% { opacity: 1; } 20% { opacity: 1; } 22% { transform: translate(160vw, -10vh); opacity: 0; } 100% { transform: translate(-60vw,  12vh); opacity: 0; } }
        @keyframes cloudDriftEc  { 0% { transform: translate(-60vw,  -5vh); opacity: 0; } 2% { opacity: 1; } 20% { opacity: 1; } 22% { transform: translate(160vw,   8vh); opacity: 0; } 100% { transform: translate(-60vw,  -5vh); opacity: 0; } }
        @keyframes cloudDriftEd  { 0% { transform: translate(-60vw,   6vh); opacity: 0; } 2% { opacity: 1; } 20% { opacity: 1; } 22% { transform: translate(160vw,  -3vh); opacity: 0; } 100% { transform: translate(-60vw,   6vh); opacity: 0; } }
        @keyframes sunGleamArc {
          0%   { transform: translate(40vw, 0vh); opacity: 0; }
          8%   { opacity: 0.55; }
          92%  { opacity: 0.55; }
          100% { transform: translate(-50vw, 0vh); opacity: 0; }
        }
        /* Moon gleam — right → left across the 12-hour night (18:00 - 06:00 ET).
           Starts well off-screen right at 6 PM, sits clearly on the right portion through
           early-mid night, drifts past center around midnight, then off the left by 6 AM.
           Slight Y wobble through the cycle for natural drift. */
        @keyframes moonGleamArc {
          0%   { transform: translate(70vw,  2vh); opacity: 0; }
          10%  { transform: translate(55vw,  0vh); opacity: 0.45; }
          50%  { transform: translate(15vw,  2vh); opacity: 0.45; }
          90%  { transform: translate(-30vw, 0vh); opacity: 0.45; }
          100% { transform: translate(-50vw, 1vh); opacity: 0; }
        }
        /* Breathing on the navy tint — subtle so the night feel stays consistent.
           0.88↔1.0 keeps the tint mostly full-strength with just enough variation to feel alive. */
        @keyframes nightTintBreath {
          0%, 100% { opacity: 0.88; }
          50%      { opacity: 1.0;  }
        }
        /* Firefly drift patterns — three slightly different gentle wandering loops for variety. */
        @keyframes fireflyDriftA {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(22px, -16px); }
          50%      { transform: translate(38px,  6px); }
          75%      { transform: translate(14px, 22px); }
        }
        @keyframes fireflyDriftB {
          0%, 100% { transform: translate(0, 0); }
          25%      { transform: translate(-18px, -22px); }
          50%      { transform: translate(-32px,  2px); }
          75%      { transform: translate(-12px, 18px); }
        }
        @keyframes fireflyDriftC {
          0%, 100% { transform: translate(0, 0); }
          33%      { transform: translate(-20px, 12px); }
          66%      { transform: translate( 24px, 18px); }
        }
        @keyframes fireflyBlink {
          /* Single box-shadow per state (was a 2-layer stack ×10 fireflies =
             20 shadows being recomputed each frame). One shadow with a larger
             spread reads identically and is much cheaper to rasterize. */
          0%, 100% { opacity: 0.35; box-shadow: 0 0 6px rgba(216,255,122,0.45); }
          50%      { opacity: 1;    box-shadow: 0 0 14px rgba(216,255,122,0.85); }
        }
        @keyframes windStreak {
          0%   { opacity: 0;   transform: translateX(-20vw) scaleX(0.3); }
          2%   { opacity: 0.5; transform: translateX(10vw)  scaleX(1); }
          6%   { opacity: 0.5; transform: translateX(85vw)  scaleX(1); }
          9%   { opacity: 0;   transform: translateX(120vw) scaleX(0.3); }
          100% { opacity: 0;   transform: translateX(120vw) scaleX(0.3); }
        }
        .sky-overlay-wind {
          position: fixed; left: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%);
          pointer-events: none;
          z-index: 401;
          opacity: 0;
          filter: blur(0.5px);
        }
      `}</style>

      {/* Pulse + "!" badge attention effect for vendor / mission-board labels until first click. */}
      <HotspotAttentionEffects />

      {/* Cloud SHADOWS — brightness(0) makes them dark silhouettes.
          Hidden entirely at night so the sky reads as clear and starry. */}
      {!isNight && CLOUDS.map((c, i) => (
        <div
          key={`cloud-${i}`}
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

      {/* Day vs night gleam — sun during 06:00-18:00 ET, moon during 18:00-06:00 ET.
          Both gradient animations traverse right → left over their respective 12 hours. */}
      {!isNight && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: '-15vh', left: 0,
            width: '70vw', height: '90vh',
            background: 'radial-gradient(ellipse at center, rgba(255,240,180,0.55) 0%, rgba(255,220,140,0.30) 35%, rgba(255,210,120,0.10) 60%, transparent 80%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 401,
            // Reduced from blur(40px) — large blur on a 70vw element was an
            // expensive constant cost. 22px reads almost identical at typical
            // resolutions.
            filter: 'blur(22px)',
            animation: 'sunGleamArc 43200s linear infinite',
            animationDelay: sunAnimationDelay,
          }}
        />
      )}
      {isNight && (
        <>
          {/* Navy night tint — full-screen rgba multiply overlay at z-index 399.
              Gentle 90s opacity breath so the sky doesn't feel completely static. */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,20,55,0.7)',
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              zIndex: 399,
              animation: 'nightTintBreath 50s ease-in-out infinite',
            }}
          />
          {/* Moon gleam — cool silvery-blue glow tracking right → left across the 12-hour
              night cycle, anchored to Eastern Time so every player sees the same arc. */}
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: '-10vh', left: 0,
              width: '60vw', height: '80vh',
              background: 'radial-gradient(ellipse at center, rgba(190,215,255,0.55) 0%, rgba(140,180,255,0.32) 30%, rgba(110,160,250,0.14) 55%, transparent 80%)',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              zIndex: 401,
              // Reduced from blur(36px) — see sun gleam comment above.
              filter: 'blur(20px)',
              animation: 'moonGleamArc 43200s linear infinite',
              animationDelay: moonAnimationDelay,
            }}
          />
          {/* Lift the level UI above the night tint so it stays bright (direct fixed child
              at root level → raising z-index works). The GameMenu nav now portals into
              document.body, so its own z-index 600 is at root level too — no extra fix needed. */}
          <style>{`
            div:has(> div > img[src*="farmerlevellabel"]) { z-index: 1000 !important; }
          `}</style>
          {/* (Vendor + mission board cloning removed — now using HotspotAttentionEffects
              outside the night block to scale-pulse them whenever they're not yet seen.) */}
          {/* (Brightening filter moved out of isNight — applied always at the bottom of the file.) */}
          {/* Fireflies — small warm yellow-green glowing dots that drift in gentle loops and
              flicker in/out. Scattered across the lower 2/3 of the screen since fireflies
              hover near the ground. */}
          {[
            { top: '40vh', left: '10vw', size: 4, drift: 'fireflyDriftA', driftDur: 9,  driftDelay: 0,   blinkDur: 2.6, blinkDelay: 0   },
            { top: '55vh', left: '24vw', size: 3, drift: 'fireflyDriftB', driftDur: 11, driftDelay: -2,  blinkDur: 3.1, blinkDelay: 0.7 },
            { top: '68vh', left: '40vw', size: 5, drift: 'fireflyDriftC', driftDur: 8,  driftDelay: -4,  blinkDur: 2.4, blinkDelay: 1.4 },
            { top: '48vh', left: '58vw', size: 3, drift: 'fireflyDriftA', driftDur: 10, driftDelay: -1,  blinkDur: 2.8, blinkDelay: 2.0 },
            { top: '72vh', left: '74vw', size: 4, drift: 'fireflyDriftB', driftDur: 12, driftDelay: -6,  blinkDur: 3.3, blinkDelay: 0.4 },
            { top: '60vh', left: '88vw', size: 3, drift: 'fireflyDriftC', driftDur: 9,  driftDelay: -3,  blinkDur: 2.5, blinkDelay: 1.7 },
            { top: '80vh', left: '20vw', size: 4, drift: 'fireflyDriftA', driftDur: 11, driftDelay: -7,  blinkDur: 2.9, blinkDelay: 0.9 },
            { top: '36vh', left: '82vw', size: 3, drift: 'fireflyDriftB', driftDur: 13, driftDelay: -2,  blinkDur: 3.0, blinkDelay: 2.2 },
            { top: '85vh', left: '52vw', size: 3, drift: 'fireflyDriftC', driftDur: 10, driftDelay: -5,  blinkDur: 2.7, blinkDelay: 1.0 },
            { top: '44vh', left: '34vw', size: 4, drift: 'fireflyDriftA', driftDur: 12, driftDelay: -8,  blinkDur: 3.2, blinkDelay: 0.5 },
          ].map((f, i) => (
            <div
              key={`firefly-${i}`}
              aria-hidden="true"
              style={{
                position: 'fixed',
                top: f.top,
                left: f.left,
                width: `${f.size}px`,
                height: `${f.size}px`,
                borderRadius: '50%',
                background: '#d8ff7a',
                pointerEvents: 'none',
                zIndex: 402,
                animation: `${f.drift} ${f.driftDur}s ease-in-out infinite, fireflyBlink ${f.blinkDur}s ease-in-out infinite`,
                animationDelay: `${f.driftDelay}s, ${f.blinkDelay}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Wind streaks — daytime only. Night sky reads quieter without sweeping wind. */}
      {!isNight && WIND_STREAKS.map((w, i) => (
        <div
          key={`wind-${i}`}
          aria-hidden="true"
          className="sky-overlay-wind"
          style={{
            top: w.top,
            width: w.width,
            animation: `windStreak ${w.duration}s ease-in-out infinite`,
            animationDelay: `${w.delay}s`,
          }}
        />
      ))}

      {/* Corner lights removed — the radial-gradients in 45vh divs were creating a visible
          horizontal seam at the bottom of the top corners (where the gradient still had
          opacity but the div boundary cut off abruptly). */}

      {/* (All custom brightness filters removed.) */}
    </>
  );
};

export default SkyOverlay;
