import React, { useState, useEffect, useRef, useCallback } from "react";

const RARITY_COLORS = {
  COMMON: '#aaa', UNCOMMON: '#00cc44', RARE: '#4488ff',
  EPIC: '#aa44ff', LEGENDARY: '#ffaa00',
};

const FISH_DESCRIPTIONS = {
  Anchovy:        "A small silvery fish found in shallow coastal waters.",
  Sardin:         "A tiny but tasty fish loved by fishermen everywhere.",
  Herring:        "A mid-sized schooling fish with a distinctive silver sheen.",
  "Small Trout":  "A freshwater favourite with speckled markings.",
  "Yellow Perch": "A vibrant fish with bold yellow and green stripes.",
  Salmon:         "A powerful migratory fish prized for its rich flavour.",
  "Orange Roughy":"A deep-sea dweller with striking orange scales.",
  Catfish:        "A bottom-feeding giant lurking in murky depths.",
  "Small Shark":  "A juvenile shark — rare and thrilling to catch!",
  "Normal fish":  "An ordinary ocean fish, perfectly ordinary.",
  FISH_SMALL:     "A small mysterious fish from the deep.",
  FISH_LARGE:     "A large mysterious fish from the deep.",
};

const STAGE = {
  UNDERWATER:   'UNDERWATER',
  RARITY_FLASH: 'RARITY_FLASH',
  TRACE:        'TRACE',
  REEL:         'REEL',
  REVEAL:       'REVEAL',
  ESCAPED:      'ESCAPED',
};

// [corridorPx, patternIdx]
const TRACE_CFG = [
  [42, 0], // COMMON     — triangle, wide
  [34, 1], // UNCOMMON   — diamond
  [26, 2], // RARE       — 5-star
  [20, 3], // EPIC       — zigzag
  [14, 4], // LEGENDARY  — 6-star, tight
];

const RARITY_WEIGHTS = [
  ['COMMON', 0.50], ['UNCOMMON', 0.25], ['RARE', 0.15],
  ['EPIC', 0.08],   ['LEGENDARY', 0.02],
];

const rollRarity = () => {
  const r = Math.random(); let c = 0;
  for (const [rar, w] of RARITY_WEIGHTS) { c += w; if (r < c) return rar; }
  return 'COMMON';
};

const CANVAS_SIZE = 520;
const CC = CANVAS_SIZE / 2;

const makeTriangle = () =>
  [0,1,2,0].map(i => ({
    x: CC + 195 * Math.cos(i * 2*Math.PI/3 - Math.PI/2),
    y: CC + 195 * Math.sin(i * 2*Math.PI/3 - Math.PI/2),
  }));

const makeDiamond = () =>
  [0,1,2,3,0].map(i => ({
    x: CC + 200 * Math.cos(i * Math.PI/2),
    y: CC + 200 * Math.sin(i * Math.PI/2),
  }));

const makeStar5 = () => {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = i * Math.PI/5 - Math.PI/2;
    const r = i % 2 === 0 ? 205 : 88;
    pts.push({ x: CC + r*Math.cos(a), y: CC + r*Math.sin(a) });
  }
  return pts;
};

const makeZigzag = () => {
  const pts = [];
  for (let i = 0; i <= 7; i++)
    pts.push({ x: 55 + i * 58, y: i % 2 === 0 ? 145 : 375 });
  return pts;
};

const makeStar6 = () => {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const a = i * Math.PI/6 - Math.PI/2;
    const r = i % 2 === 0 ? 205 : 100;
    pts.push({ x: CC + r*Math.cos(a), y: CC + r*Math.sin(a) });
  }
  return pts;
};

const PATTERNS = [makeTriangle, makeDiamond, makeStar5, makeZigzag, makeStar6];
const PATTERN_NAMES = ['Triangle', 'Diamond', 'Star', 'Zigzag', 'Hex Star'];

function samplePath(pts, n = 900) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
    segs.push({ i, l, cum: total });
    total += l;
  }
  const out = [];
  for (let j = 0; j <= n; j++) {
    const target = (j / n) * total;
    let seg = segs[segs.length - 1];
    for (let k = 0; k < segs.length; k++) {
      if (segs[k].cum + segs[k].l >= target) { seg = segs[k]; break; }
    }
    const t = seg.l > 0 ? Math.min(1, (target - seg.cum) / seg.l) : 0;
    const s = seg.i;
    out.push({
      x: pts[s].x + t * (pts[s+1].x - pts[s].x),
      y: pts[s].y + t * (pts[s+1].y - pts[s].y),
    });
  }
  return out;
}

function getMouseInfo(mx, my, samples) {
  let bestDist = Infinity, bestIdx = 0;
  for (let i = 0; i < samples.length; i++) {
    const d = Math.hypot(mx - samples[i].x, my - samples[i].y);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return { progress: bestIdx / (samples.length - 1), dist: bestDist };
}

const UW_FISH_COUNT = 6;
const SPINNER_SIZE  = 650;

const FishingMiniGame = ({ fishItem, fishRarity: _fishRarity, fishWeight, onComplete, onEscape }) => {
  const diffRef = useRef(0);

  const [stage, setStage]                   = useState(STAGE.UNDERWATER);
  const [uwFish, setUwFish]                 = useState([]);
  const [selectedRarity, setSelectedRarity] = useState(null);

  // Trace
  const canvasRef        = useRef(null);
  const samplesRef       = useRef([]);
  const rawPtsRef        = useRef([]);
  const userProgRef      = useRef(0);
  const traceStartedRef  = useRef(false);
  const isDraggingRef    = useRef(false);
  const traceLostRef     = useRef(false);
  const traceWonRef      = useRef(false);
  const corridorRef      = useRef(42);
  const lastTimeRef      = useRef(null);
  const rafRef           = useRef(null);
  const [traceResult, setTraceResult] = useState(null);
  const [traceMsg, setTraceMsg]       = useState('');

  // Reel
  const [reelFill, setReelFill]     = useState(0);
  const [spinning, setSpinning]     = useState(false);
  const [spinnerDeg, setSpinnerDeg] = useState(0);
  const lastAngleRef   = useRef(null);
  const reelRef        = useRef(null);
  const totalRotRef    = useRef(0);
  const spinnerDegRef  = useRef(0);
  const completedRef   = useRef(false);

  // Reveal
  const [revealPhase,    setRevealPhase]    = useState(0);
  const [collectClicked, setCollectClicked] = useState(false);

  useEffect(() => { setStage(STAGE.UNDERWATER); }, []);

  useEffect(() => {
    if (stage !== STAGE.UNDERWATER) return;
    setUwFish(Array.from({ length: UW_FISH_COUNT }, (_, i) => ({
      id: i,
      y: 18 + i * 12 + (Math.random() * 6 - 3),
      w: 110 + Math.random() * 120,
      h: 42 + Math.random() * 44,
      duration: 3.5 + Math.random() * 5,
      delay: Math.random() * 2.5,
      dir: i % 2 === 0 ? 'right' : 'left',
      blur: 8 + Math.random() * 10,
    })));
  }, [stage]);

  const handleFishClick = useCallback((e) => {
    e.stopPropagation();
    const rarity = rollRarity();
    diffRef.current = Math.max(0, ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'].indexOf(rarity));
    setSelectedRarity(rarity);
    setStage(STAGE.RARITY_FLASH);
  }, []);

  useEffect(() => {
    if (stage !== STAGE.RARITY_FLASH) return;
    const t = setTimeout(() => setStage(STAGE.TRACE), 1400);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== STAGE.REVEAL) return;
    setRevealPhase(0);
    const t1 = setTimeout(() => setRevealPhase(1), 60);
    const t2 = setTimeout(() => setRevealPhase(2), 900);
    const t3 = setTimeout(() => setRevealPhase(3), 1250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [stage]);

  useEffect(() => {
    if (!traceResult) return;
    let timer;
    if (traceResult === 'won') {
      timer = setTimeout(() => {
        totalRotRef.current = 0; spinnerDegRef.current = 0;
        setReelFill(0); setSpinnerDeg(0); completedRef.current = false;
        setStage(STAGE.REEL);
      }, 700);
    } else {
      timer = setTimeout(() => setStage(STAGE.ESCAPED), 900);
    }
    return () => clearTimeout(timer);
  }, [traceResult]);

  // Canvas draw loop
  useEffect(() => {
    if (stage !== STAGE.TRACE) return;

    const [corr, patIdx] = TRACE_CFG[diffRef.current];
    corridorRef.current = corr;

    const rawPts = PATTERNS[patIdx]();
    rawPtsRef.current     = rawPts;
    samplesRef.current    = samplePath(rawPts);
    userProgRef.current   = 0;
    traceStartedRef.current = false;
    isDraggingRef.current   = false;
    traceLostRef.current    = false;
    traceWonRef.current     = false;
    lastTimeRef.current     = null;
    setTraceResult(null);
    setTraceMsg('');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width  = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const draw = (ts) => {
      if (traceLostRef.current || traceWonRef.current) return;

      lastTimeRef.current = ts;

      const S   = samplesRef.current;
      const cor = corridorRef.current;
      const uIdx = Math.round(userProgRef.current * (S.length - 1));

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Corridor outer border
      ctx.save();
      ctx.lineWidth   = cor * 2 + 6;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.strokeStyle = 'rgba(180,200,255,0.18)';
      ctx.beginPath();
      S.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Corridor fill (dark)
      ctx.lineWidth   = cor * 2;
      ctx.strokeStyle = 'rgba(10,20,55,0.82)';
      ctx.beginPath();
      S.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.restore();

      // Center guide dashes
      ctx.save();
      ctx.lineWidth   = 1.5;
      ctx.lineCap     = 'round';
      ctx.setLineDash([6, 10]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      S.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // User traced portion (green glow)
      if (uIdx > 0) {
        ctx.save();
        ctx.lineWidth   = cor * 1.5;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.strokeStyle = 'rgba(60,220,90,0.5)';
        ctx.beginPath();
        for (let i = 0; i <= uIdx && i < S.length; i++)
          i === 0 ? ctx.moveTo(S[i].x, S[i].y) : ctx.lineTo(S[i].x, S[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // Start point (pulsing green)
      const start = S[0];
      if (!traceStartedRef.current) {
        const pulse = 0.5 + 0.5 * Math.sin(ts / 220);
        ctx.save();
        ctx.beginPath();
        ctx.arc(start.x, start.y, 20 + pulse * 8, 0, Math.PI*2);
        ctx.fillStyle = `rgba(80,255,100,${0.25 + pulse*0.25})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(start.x, start.y, 13, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(60,240,80,0.95)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // End point (gold star)
      const ep = S[S.length - 1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(ep.x, ep.y, 14, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,210,0,0.95)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [stage]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_SIZE / rect.width),
      y: (e.clientY - rect.top)  * (CANVAS_SIZE / rect.height),
    };
  };

  const handleCanvasMouseDown = (e) => {
    if (stage !== STAGE.TRACE || traceLostRef.current || traceWonRef.current) return;
    traceStartedRef.current = true;
    isDraggingRef.current   = true;
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingRef.current || !traceStartedRef.current) return;
    if (traceLostRef.current || traceWonRef.current) return;
    const pos = getCanvasPos(e);
    if (!pos) return;

    const { progress, dist } = getMouseInfo(pos.x, pos.y, samplesRef.current);

    if (dist > corridorRef.current) {
      traceLostRef.current  = true;
      isDraggingRef.current = false;
      setTraceMsg('You went outside the path!');
      setTraceResult('lost_barrier');
      return;
    }

    if (progress > userProgRef.current) userProgRef.current = progress;

    if (userProgRef.current >= 0.97) {
      traceWonRef.current   = true;
      isDraggingRef.current = false;
      setTraceResult('won');
    }
  };

  const handleCanvasMouseUp = () => { isDraggingRef.current = false; };

  // Reel
  const getAngle = (e, rect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX ?? e.touches?.[0]?.clientX ?? cx) - cx;
    const dy = (e.clientY ?? e.touches?.[0]?.clientY ?? cy) - cy;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleReelMove = useCallback((e) => {
    if (!spinning || !reelRef.current) return;
    const [,,, targetDeg] = [0,0,0, TRACE_CFG[diffRef.current] ? 2160 + diffRef.current * 360 : 2160];
    const rect  = reelRef.current.getBoundingClientRect();
    const angle = getAngle(e, rect);
    if (lastAngleRef.current !== null) {
      let delta = angle - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      totalRotRef.current   += Math.abs(delta);
      spinnerDegRef.current += delta;
      setSpinnerDeg(spinnerDegRef.current);
      const fill = Math.min(100, (totalRotRef.current / (2160 + diffRef.current * 360)) * 100);
      setReelFill(fill);
      if (fill >= 100 && !completedRef.current) {
        completedRef.current = true;
        setSpinning(false);
        setTimeout(() => setStage(STAGE.REVEAL), 500);
      }
    }
    lastAngleRef.current = angle;
  }, [spinning]);

  const rarityColor = RARITY_COLORS[selectedRarity] || '#aaa';
  const rarityLabel = selectedRarity || 'COMMON';
  const fishName    = fishItem?.label || 'Unknown Fish';
  const fishDesc    = FISH_DESCRIPTIONS[fishName] || 'A mysterious creature from the deep.';
  const fishImage   = fishItem?.image || '/images/fish/Normal Ocean Fish (2).png';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      background: stage === STAGE.REVEAL  ? 'transparent'
                : stage === STAGE.ESCAPED ? 'linear-gradient(180deg,#1a0a00,#3a1800)'
                : 'linear-gradient(180deg,#0a1a3a 0%,#0d3060 40%,#0a4a6e 100%)',
      fontFamily: 'monospace', userSelect: 'none',
    }}>
      <style>{`
        @keyframes bubbleRise {
          0%   { transform:translateY(0) scale(1); opacity:.8; }
          100% { transform:translateY(-110vh) scale(.3); opacity:0; }
        }
        @keyframes fishSwimRight { 0%{transform:translateX(-250px);} 100%{transform:translateX(115vw);} }
        @keyframes fishSwimLeft  { 0%{transform:translateX(115vw);} 100%{transform:translateX(-250px);} }
        @keyframes rarityPop {
          0%  {transform:translate(-50%,-50%) scale(0.6);opacity:0;}
          30% {transform:translate(-50%,-50%) scale(1.1);opacity:1;}
          80% {transform:translate(-50%,-50%) scale(1);opacity:1;}
          100%{transform:translate(-50%,-50%) scale(0.9);opacity:0;}
        }
        @keyframes traceWin {
          0%   { transform:scale(1);   filter:brightness(1); }
          50%  { transform:scale(1.08); filter:brightness(1.6) hue-rotate(20deg); }
          100% { transform:scale(1);   filter:brightness(1); }
        }
        @keyframes traceLose {
          0%,100%{transform:translate(0,0);}
          15%{transform:translate(-8px,3px);}
          30%{transform:translate(8px,-4px);}
          50%{transform:translate(-5px,5px);}
          70%{transform:translate(5px,-2px);}
          85%{transform:translate(-3px,2px);}
        }
        @keyframes spinnerGlow {
          0%,100%{box-shadow:0 0 20px rgba(100,200,255,.35);}
          50%{box-shadow:0 0 70px rgba(100,200,255,.9),0 0 110px rgba(100,200,255,.25);}
        }
        @keyframes escapedPulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes waterRipple {
          0%  {transform:translateX(-50%) scaleX(.15);opacity:.7;}
          100%{transform:translateX(-50%) scaleX(1.5);opacity:0;}
        }
      `}</style>

      {/* UNDERWATER */}
      {stage === STAGE.UNDERWATER && (
        <div style={{ position:'absolute', inset:0 }}>
          <p style={{
            position:'absolute', top:'8%', left:'50%', transform:'translateX(-50%)',
            color:'rgba(150,220,255,0.9)', fontSize:'18px',
            textAlign:'center', lineHeight:'1.6', margin:0,
            textShadow:'0 0 12px rgba(0,100,200,.6)',
          }}>
            Fish are passing by...<br/>
            <span style={{fontSize:'13px', opacity:.7}}>Click one to go after it!</span>
          </p>
          {uwFish.map(f => (
            <div key={f.id} onClick={handleFishClick} style={{
              position:'absolute', top:`${f.y}%`, left:0,
              marginTop:`-${f.h/2}px`, width:`${f.w}px`, height:`${f.h}px`,
              animation:`${f.dir === 'right' ? 'fishSwimRight' : 'fishSwimLeft'} ${f.duration}s linear ${f.delay}s infinite`,
              cursor:'pointer', zIndex:5,
            }}>
              <div style={{
                width:'100%', height:'100%',
                background:'radial-gradient(ellipse, rgba(5,18,50,.95) 25%, rgba(10,45,100,.12) 100%)',
                filter:`blur(${f.blur}px)`, borderRadius:'50%',
                transform: f.dir === 'left' ? 'scaleX(-1)' : 'none',
              }} />
            </div>
          ))}
        </div>
      )}

      {/* RARITY FLASH */}
      {stage === STAGE.RARITY_FLASH && (
        <div style={{ position:'absolute', inset:0 }}>
          <div style={{
            position:'absolute', inset:0,
            background:`radial-gradient(ellipse at center, ${rarityColor}22 0%, transparent 70%)`,
          }} />
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            animation:'rarityPop 1.4s ease-out forwards', textAlign:'center',
          }}>
            <div style={{
              fontSize:'48px', fontWeight:'bold', color:rarityColor,
              textShadow:`0 0 30px ${rarityColor}, 0 0 60px ${rarityColor}88`,
              letterSpacing:'4px', marginBottom:'10px',
            }}>{rarityLabel}</div>
            <div style={{ color:'rgba(255,255,255,.7)', fontSize:'16px' }}>fish is on the line!</div>
          </div>
        </div>
      )}

      {/* TRACE */}
      {stage === STAGE.TRACE && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
          <div style={{ textAlign:'center', color:'#aef', lineHeight:'1.7' }}>
            <div style={{ fontSize:'20px', fontWeight:'bold', letterSpacing:'3px',
              color: rarityColor, textShadow:`0 0 16px ${rarityColor}` }}>
              {rarityLabel} — {PATTERN_NAMES[TRACE_CFG[diffRef.current][1]]}
            </div>
            <div style={{ fontSize:'12px', opacity:.65 }}>
              {!traceResult
                ? 'Click & drag along the path — stay inside the borders!'
                : traceResult === 'won'
                  ? '✓ Pattern complete! Reeling in...'
                  : `✕ ${traceMsg}`}
            </div>
          </div>

          <div style={{
            position:'relative',
            borderRadius:'16px',
            border:`2px solid ${traceResult === 'won' ? '#60ee80' : traceResult ? '#ff4422' : 'rgba(100,160,255,0.3)'}`,
            boxShadow: traceResult === 'won'
              ? '0 0 40px rgba(60,220,80,0.6)'
              : traceResult
                ? '0 0 40px rgba(255,50,20,0.6)'
                : '0 0 30px rgba(0,60,140,0.5)',
            animation: traceResult === 'won' ? 'traceWin 0.5s ease-out'
                     : traceResult ? 'traceLose 0.4s ease-out' : 'none',
            overflow:'hidden',
          }}>
            <canvas
              ref={canvasRef}
              style={{ display:'block', cursor:'crosshair' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {traceResult && (
              <div style={{
                position:'absolute', inset:0,
                background: traceResult === 'won'
                  ? 'rgba(40,180,60,0.18)'
                  : 'rgba(180,40,20,0.28)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'64px',
              }}>
                {traceResult === 'won' ? '✓' : '✕'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REEL */}
      {stage === STAGE.REEL && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'24px' }}>
          <p style={{
            color:'#aef', fontSize:'26px', fontWeight:'bold',
            letterSpacing:'6px', textShadow:'0 0 24px rgba(100,200,255,.95)', margin:0,
          }}>SPIN!</p>
          <div
            ref={reelRef}
            onMouseDown={e => { setSpinning(true); lastAngleRef.current = getAngle(e, reelRef.current.getBoundingClientRect()); }}
            onMouseMove={handleReelMove}
            onMouseUp={() => { setSpinning(false); lastAngleRef.current = null; }}
            onMouseLeave={() => { setSpinning(false); lastAngleRef.current = null; }}
            onTouchStart={e => { setSpinning(true); lastAngleRef.current = getAngle(e, reelRef.current.getBoundingClientRect()); }}
            onTouchMove={handleReelMove}
            onTouchEnd={() => { setSpinning(false); lastAngleRef.current = null; }}
            style={{ position:'relative', width:`${SPINNER_SIZE}px`, height:`${SPINNER_SIZE}px`, cursor:'crosshair' }}
          >
            <div style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background:`conic-gradient(rgba(100,200,255,.95) ${reelFill*3.6}deg, rgba(12,30,68,.88) ${reelFill*3.6}deg)`,
              animation: spinning ? 'spinnerGlow .5s ease-in-out infinite' : 'none',
            }} />
            <div style={{ position:'absolute', inset:'38px', borderRadius:'50%', background:'linear-gradient(135deg,#0a1a3a,#0d3060)' }} />
            <div style={{
              position:'absolute', inset:'75px', borderRadius:'50%',
              border:'2px solid rgba(100,200,255,.28)',
              transform:`rotate(${spinnerDeg}deg)`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {[0,45,90,135].map(a => (
                <div key={a} style={{
                  position:'absolute', width:'100%', height:'2px',
                  background:`linear-gradient(90deg,transparent,rgba(100,200,255,${a%90===0?.6:.28}),transparent)`,
                  transform:`rotate(${a}deg)`,
                }} />
              ))}
            </div>
            <div style={{
              position:'absolute', inset:'185px', borderRadius:'50%',
              background: spinning ? 'rgba(100,200,255,.15)' : 'rgba(10,26,58,.9)',
              border:'2px solid rgba(100,200,255,.5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#aef', fontSize:'20px', fontWeight:'bold', transition:'background .1s',
            }}>{Math.round(reelFill)}%</div>
          </div>
          <div style={{
            width:`${Math.min(SPINNER_SIZE,500)}px`, height:'10px',
            background:'rgba(255,255,255,.07)', borderRadius:'5px',
            overflow:'hidden', border:'1px solid rgba(100,200,255,.28)',
          }}>
            <div style={{ width:`${reelFill}%`, height:'100%', background:'linear-gradient(90deg,#4488ff,#00ffcc)', transition:'width .04s' }} />
          </div>
          <span style={{ color:'rgba(150,200,255,.5)', fontSize:'13px' }}>Hold &amp; spin around the reel</span>
        </div>
      )}

      {/* REVEAL */}
      {stage === STAGE.REVEAL && (
        <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,#5ab8f5,#99d4ef 65%,#c0e8f8)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'linear-gradient(180deg,#1a6d9e,#0d4a72 40%,#07283f)' }} />
          <div style={{ position:'absolute', top:'50%', left:0, right:0, height:'5px', marginTop:'-2px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,.7) 30%,rgba(200,240,255,.9) 50%,rgba(255,255,255,.7) 70%,transparent)' }} />
          {[0,.45,.9].map((d,i) => (
            <div key={i} style={{
              position:'absolute', top:'50%', left:'50%',
              width:`${150+i*55}px`, height:'12px', marginTop:'-6px',
              borderRadius:'50%', border:'2px solid rgba(255,255,255,.4)',
              animation:`waterRipple 1.8s ease-out ${d}s infinite`,
            }} />
          ))}
          <div style={{
            position:'absolute', left:'50%', top:'34%',
            transform: revealPhase >= 1 ? 'translate(-50%,-50%)' : 'translate(-50%, calc(-50% + 320px))',
            transition: revealPhase >= 1 ? 'transform .82s cubic-bezier(.08,.7,.2,1)' : 'none',
            zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
          }}>
            <div style={{
              color:'#fff', fontSize:'22px', fontWeight:'bold',
              textShadow:'0 2px 12px rgba(0,0,0,.6)',
              opacity: revealPhase >= 2 ? 1 : 0, transition:'opacity .4s ease-out', textAlign:'center',
            }}>{fishName}</div>
            {fishWeight != null && (
              <div style={{
                color:'#a0d8ef', fontSize:'14px',
                opacity: revealPhase >= 2 ? 1 : 0, transition:'opacity .4s ease-out .1s', textAlign:'center',
                marginTop:'-6px',
              }}>{fishWeight} kg</div>
            )}
            <div style={{ display:'flex', alignItems:'flex-start', gap:'18px' }}>
              <img src={fishImage} alt={fishName} style={{
                width:'180px', height:'180px', objectFit:'contain',
                filter: revealPhase >= 2 ? 'none' : 'blur(22px) grayscale(1) brightness(0.3)',
                transition:'filter .55s ease-out', flexShrink:0, borderRadius:'10px',
              }} onError={e => { e.target.src = '/images/fish/Normal Ocean Fish (2).png'; }} />
              <div style={{
                width:'210px',
                background:'rgba(0,0,0,.75)',
                border:`2px solid ${rarityColor}`,
                borderRadius:'12px', padding:'14px 16px',
                display:'flex', flexDirection:'column', gap:'10px',
                opacity: revealPhase >= 3 ? 1 : 0, transition:'opacity .35s ease-out',
              }}>
                <div style={{
                  display:'inline-block', padding:'3px 12px', borderRadius:'16px',
                  background:rarityColor, color:'#000', fontWeight:'bold', fontSize:'12px', alignSelf:'flex-start',
                }}>{rarityLabel}</div>
                <div style={{ color:'#ccc', fontSize:'13px', lineHeight:'1.55' }}>{fishDesc}</div>
                <button
                  onClick={() => { if (collectClicked) return; setCollectClicked(true); onComplete(); }}
                  style={{
                    marginTop:'4px', padding:'9px 0',
                    background: collectClicked ? 'rgba(255,255,255,.1)' : rarityColor,
                    border:'none', borderRadius:'8px',
                    color: collectClicked ? '#888' : '#000',
                    fontWeight:'bold', fontSize:'15px',
                    cursor: collectClicked ? 'default' : 'pointer',
                    fontFamily:'monospace',
                    boxShadow: collectClicked ? 'none' : `0 3px 10px ${rarityColor}77`,
                    transition:'all .2s',
                  }}
                >{collectClicked ? 'Reeling in...' : 'Collect!'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESCAPED */}
      {stage === STAGE.ESCAPED && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'20px', textAlign:'center' }}>
          <div style={{ fontSize:'72px', animation:'escapedPulse 1s ease-in-out 3' }}>🐟</div>
          <div style={{ color:'#ff6644', fontSize:'32px', fontWeight:'bold', textShadow:'0 0 20px rgba(255,100,60,.6)' }}>
            The fish got away!
          </div>
          <div style={{ color:'#aa8866', fontSize:'14px', maxWidth:'260px' }}>
            You went outside the path.
          </div>
          <button onClick={onEscape} style={{
            marginTop:'12px', padding:'12px 32px',
            background:'rgba(255,255,255,.08)', border:'2px solid rgba(255,150,100,.5)',
            borderRadius:'10px', color:'#ffaa88', fontWeight:'bold', fontSize:'16px',
            cursor:'pointer', fontFamily:'monospace',
          }}>Back to Menu</button>
        </div>
      )}
    </div>
  );
};

export default FishingMiniGame;
