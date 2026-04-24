import React, { useState, useEffect } from "react";

// Update this date to start a new leaderboard season — records harvested before this are excluded
const SEASON_START_MS = new Date('2026-04-23').getTime();

const MOCK_BEST_FARMER = [
  { rank: 1, name: 'FarmKing99',    pts: '284,500' },
  { rank: 2, name: 'HarvestMoon',   pts: '196,000' },
  { rank: 3, name: 'GoldenRow',     pts: '118,200' },
];

const MOCK_HEAVIEST_POTATO = [
  { rank: 1, name: 'CornQueen',   kg: '69', emoji: <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} /> },
  { rank: 2, name: 'PlowMaster',  kg: '67', emoji: <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} /> },
  { rank: 3, name: 'BumperCrop',  kg: '62', emoji: <img src="/images/leaderboard/potato.png" alt="potato" style={{ width: '1.8vmin', height: '1.8vmin', objectFit: 'contain', verticalAlign: 'middle', position: 'relative', top: '-1.6px' }} /> },
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

const LeaderboardDialog = ({ onClose }) => {
  const [farmPts, setFarmPts] = useState(0);
  const [heaviestPotato, setHeaviestPotato] = useState(null);

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
          src="/images/leaderboard/leaderboardpotato.png"
          alt="Leaderboard"
          style={{ display: 'block', maxHeight: '90vh', maxWidth: '90vw' }}
        />

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
            top: 58,
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
        {[34.2, 40.8, 46.9].map((top, i) => (
          <div key={i} style={{ ...ROW_STYLE, top: `${top}%` }}>
            <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
              {MOCK_BEST_FARMER[i].rank}&nbsp;&nbsp;{MOCK_BEST_FARMER[i].name}
            </span>
            <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
              {MOCK_BEST_FARMER[i].pts} PTS
            </span>
          </div>
        ))}

        {/* You — Best Farmer */}
        <div style={{ ...ROW_STYLE, top: '52.5%' }}>
          <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold' }}>
            5&nbsp;&nbsp;You
          </span>
          <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold' }}>
            {farmPts.toLocaleString()} PTS
          </span>
        </div>

        {/* HEAVIEST POTATO rows */}
        {[66.5, 72.6, 78.5].map((top, i) => (
          <div key={i} style={{ ...ROW_STYLE, top: `${top}%` }}>
            <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
              {MOCK_HEAVIEST_POTATO[i].rank}&nbsp;&nbsp;{MOCK_HEAVIEST_POTATO[i].name}
            </span>
            <span style={{ fontSize: '1.8vmin', color: '#3b1f0a', fontWeight: 'bold' }}>
              {MOCK_HEAVIEST_POTATO[i].kg} KG {MOCK_HEAVIEST_POTATO[i].emoji}
            </span>
          </div>
        ))}

        {/* You — Heaviest Potato */}
        <div style={{ ...ROW_STYLE, top: '84.4%' }}>
          <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold' }}>
            {heaviestPotato ? '4' : '—'}&nbsp;&nbsp;You
          </span>
          <span style={{ fontSize: '1.8vmin', color: '#f5d87a', fontWeight: 'bold' }}>
            {heaviestPotato ? `${heaviestPotato.weight} g` : '— g'} <PotatoImg />
          </span>
        </div>

      </div>
    </div>
  );
};

export default LeaderboardDialog;
