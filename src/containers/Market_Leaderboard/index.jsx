import React, { useState, useEffect } from "react";

// Update this date to start a new leaderboard season — records harvested before this are excluded
const SEASON_START_MS = new Date('2026-04-23').getTime();

const MOCK_BEST_FARMER = [
  { rank: 1, name: 'FarmKing99',    pts: '284,500', pfp: '/images/pfp/crowattackpfp.png' },
  { rank: 2, name: 'HarvestMoon',   pts: '196,000', pfp: '/images/pfp/famerpfp.png' },
  { rank: 3, name: 'GoldenRow',     pts: '118,200', pfp: '/images/pfp/potatopfp.png' },
];

const MOCK_HEAVIEST_POTATO = [
  { rank: 1, name: 'CornQueen',   kg: '69', pfp: '/images/pfp/redpfp.png',     emoji: <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} /> },
  { rank: 2, name: 'PlowMaster',  kg: '67', pfp: '/images/pfp/rodpfp.png',     emoji: <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} /> },
  { rank: 3, name: 'BumperCrop',  kg: '62', pfp: '/images/pfp/betapfp.png',    emoji: <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} /> },
];

const ROW_STYLE = {
  position: 'absolute',
  left: '14%',
  right: '14%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'GROBOLD, Cartoonist, monospace',
  pointerEvents: 'none',
};

const PotatoImg = () => (
  <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} />
);

const DEFAULT_PFP = '/images/pfp/defultpfp.png';

// Prize button — clickable tile that scales up when it's the selected leaderboard view.
const PrizeButton = ({ src, alt, active, onClick }) => {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const scale = pressed ? (active ? 1.12 : 0.94) : (active ? 1.2 : (hover ? 1.08 : 1));
  const filter = pressed
    ? 'brightness(0.85)'
    : (active || hover)
      ? 'brightness(1.15) drop-shadow(0 0 8px rgba(255,220,100,0.85))'
      : 'brightness(1)';
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        cursor: 'pointer',
        pointerEvents: 'auto',
        userSelect: 'none',
        transform: `scale(${scale})`,
        filter,
        transition: 'transform 0.15s, filter 0.1s',
      }}
    />
  );
};

const LeaderboardDialog = ({ onClose }) => {
  const [farmPts, setFarmPts] = useState(0);
  const [heaviestPotato, setHeaviestPotato] = useState(null);
  const [pfpSrc, setPfpSrc] = useState(() => localStorage.getItem('sandbox_pfp') || DEFAULT_PFP);
  // Which leaderboard the prize buttons are showing — 'bestfarmer' (points) or 'weightcontest' (potato kg).
  const [view, setView] = useState('bestfarmer');

  useEffect(() => {
    const handler = () => setPfpSrc(localStorage.getItem('sandbox_pfp') || DEFAULT_PFP);
    window.addEventListener('pfpUpdated', handler);
    return () => window.removeEventListener('pfpUpdated', handler);
  }, []);

  useEffect(() => {
    // Season farming points (earned after SEASON_START_MS)
    const pts = parseInt(localStorage.getItem('sandbox_season_farming_points') || '0', 10);
    setFarmPts(pts);

    // Heaviest potato — only count if harvested during current season
    // Weights are in grams; valid potato range is 50–500g. Discard stale pre-scale data.
    let stored = JSON.parse(localStorage.getItem('sandbox_heaviest_potato') || 'null');
    if (stored && (stored.weight > 500 || stored.weight < 1)) {
      localStorage.removeItem('sandbox_heaviest_potato');
      stored = null;
    }

    // Migrate legacy sandbox_heaviest_crop if it was a Potato and no dedicated record exists yet
    if (!stored) {
      const legacy = JSON.parse(localStorage.getItem('sandbox_heaviest_crop') || 'null');
      if (legacy && legacy.name === 'Potato' && legacy.weight <= 500 && legacy.weight >= 1) {
        stored = { weight: legacy.weight, harvestedAt: legacy.harvestedAt ?? SEASON_START_MS };
        localStorage.setItem('sandbox_heaviest_potato', JSON.stringify(stored));
      }
    }

    if (stored && stored.harvestedAt >= SEASON_START_MS) {
      setHeaviestPotato(stored);
    } else {
      setHeaviestPotato(null);
    }
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ position: 'relative', display: 'inline-block' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={view === 'weightcontest' ? "/images/leaderboard/theweightcontest.png" : "/images/leaderboard/topfarmerleaderboard.png"}
          alt="Leaderboard"
          style={{ display: 'block', maxHeight: '90vh', maxWidth: '90vw' }}
        />

        {/* Placement banners (1st/2nd/3rd) — same overlay on both screens, sits
            behind the text rows so the rank/pfp/name still read on top. */}
        {[
          { src: '/images/leaderboard/1st.png', top: 'calc(34.2% + 290px)', left: 'calc(50% + 35px)', width: '38%' },
          { src: '/images/leaderboard/2nd.png', top: 'calc(34.2% + 360px)', left: 'calc(50% - 65px)', width: '30%' },
          { src: '/images/leaderboard/3rd.png', top: 'calc(34.2% + 360px)', left: 'calc(50% + 125px)', width: '30%' },
        ].map((b, i) => (
          <img
            key={i}
            src={b.src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              transform: 'translate(-50%, -50%)',
              width: b.width,
              // Force every banner to match 1st's rendered dimensions (751x224 native).
              aspectRatio: '751 / 224',
              objectFit: 'fill',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ))}

        {/* X button */}
        <img
          src="/images/leaderboard/x.png"
          alt="Close"
          onClick={onClose}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)'; e.currentTarget.style.filter = 'brightness(0.8)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.25)'; }}
          style={{
            position: 'absolute',
            top: 73,
            right: -19,
            width: 60,
            height: 60,
            cursor: 'pointer',
            objectFit: 'contain',
            pointerEvents: 'auto',
            transition: 'transform 0.1s, filter 0.1s',
          }}
        />

        {/* BEST FARMER rows */}
        {view === 'bestfarmer' && [34.2, 40.8, 46.9].map((top, i) => (
          <div key={i} style={{ ...ROW_STYLE, top: `${top}%` }}>
            <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 70 }}>
              <span style={{ display: 'inline-block', width: '1.4em', textAlign: 'center' }}>{MOCK_BEST_FARMER[i].rank}</span>
              <img src={MOCK_BEST_FARMER[i].pfp} alt="" style={{ width: '2.4vmin', height: '2.4vmin', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(59,31,10,0.4)' }} />
              {MOCK_BEST_FARMER[i].name}
            </span>
            <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
              {MOCK_BEST_FARMER[i].pts} PTS
            </span>
          </div>
        ))}

        {/* WEIGHT CONTEST rows — top 3 ranks (You slots in if qualified), and
            the bottom gold banner is always a replica of the user's actual row. */}
        {view === 'weightcontest' && (() => {
          const top3 = heaviestPotato
            ? [{ kind: 'you' }, MOCK_HEAVIEST_POTATO[0], MOCK_HEAVIEST_POTATO[1]]
            : [MOCK_HEAVIEST_POTATO[0], MOCK_HEAVIEST_POTATO[1], MOCK_HEAVIEST_POTATO[2]];
          const slotTops = ['34.2%', '40.8%', '46.9%'];
          // Compute the user's actual rank — slotted at 1 if they qualify, else "—".
          const youRank = heaviestPotato ? 1 : '—';
          return (
            <>
              {top3.map((entry, i) => {
                const rank = i + 1;
                if (entry.kind === 'you') {
                  return (
                    <div key={`wc-you-${i}`} style={{ ...ROW_STYLE, top: slotTops[i] }}>
                      <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 70 }}>
                        <span style={{ display: 'inline-block', width: '1.4em', textAlign: 'center' }}>{rank}</span>
                        <img src={pfpSrc} alt="you" style={{ width: '2.4vmin', height: '2.4vmin', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(59,31,10,0.4)' }} />
                        You
                      </span>
                      <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
                        {heaviestPotato.weight} KG <PotatoImg />
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={`wc-${i}`} style={{ ...ROW_STYLE, top: slotTops[i] }}>
                    <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 70 }}>
                      <span style={{ display: 'inline-block', width: '1.4em', textAlign: 'center' }}>{rank}</span>
                      <img src={entry.pfp} alt="" style={{ width: '2.4vmin', height: '2.4vmin', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(59,31,10,0.4)' }} />
                      {entry.name}
                    </span>
                    <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
                      {entry.kg} KG {entry.emoji}
                    </span>
                  </div>
                );
              })}
              {/* Bottom banner — always a replica of the user's actual placement. */}
              <div style={{ ...ROW_STYLE, top: 'calc(52.5% + 7px)' }}>
                <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 70 }}>
                  <span style={{ display: 'inline-block', width: '1.4em', textAlign: 'center' }}>{youRank}</span>
                  <img src={pfpSrc} alt="you" style={{ width: '2.4vmin', height: '2.4vmin', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #f5d87a' }} />
                  You
                </span>
                <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold' }}>
                  {heaviestPotato ? `${heaviestPotato.weight} KG` : '— KG'} <PotatoImg />
                </span>
              </div>
            </>
          );
        })()}

        {/* Prize buttons stack — bestfarmer on top, weightcontest 80px below. */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(74% - 440px)',
            left: 'calc(50% - 290px)',
            transform: 'translateX(-50%)',
            width: '28%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px',
            pointerEvents: 'none',
          }}
        >
          <PrizeButton
            src="/images/leaderboard/bestfarmer.png"
            alt="Best Farmer"
            active={view === 'bestfarmer'}
            onClick={() => setView('bestfarmer')}
          />
          <PrizeButton
            src="/images/leaderboard/weightcontest.png"
            alt="Weight Contest"
            active={view === 'weightcontest'}
            onClick={() => setView('weightcontest')}
          />
        </div>

        {/* You — current view */}
        {view === 'bestfarmer' && (
          <div style={{ ...ROW_STYLE, top: 'calc(52.5% + 7px)' }}>
            <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 70 }}>
              <span style={{ display: 'inline-block', width: '1.4em', textAlign: 'center' }}>5</span>
              <img src={pfpSrc} alt="you" style={{ width: '2.4vmin', height: '2.4vmin', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #f5d87a' }} />
              You
            </span>
            <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold' }}>
              {farmPts.toLocaleString()} PTS
            </span>
          </div>
        )}

      </div>
    </div>
  );
};

export default LeaderboardDialog;
