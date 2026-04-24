import React, { useState, useEffect } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import { getWeeklyFeaturedCrop } from "../../constants/crop_weights";

const RANK_MEDAL = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const MOCK_FARMING = {
  points:   [{ name: 'Barnabee', value: '284,500 pts' }, { name: 'Sunflora Bee', value: '196,000 pts' }, { name: 'Grubsworth', value: '118,200 pts' }],
  heaviest: [{ name: 'Barnabee', value: '4.82 kg', sub: 'Cabbage' }, { name: 'Sunflora Bee', value: '3.91 kg', sub: 'Pumpkin' }, { name: 'Grubsworth', value: '3.14 kg', sub: 'Carrot' }],
};

const MOCK_FISHING = {
  points:   [{ name: 'CapnHook Bee', value: '940 pts' }, { name: 'Dewey Jr.', value: '720 pts' }, { name: 'Wormtail', value: '580 pts' }],
  heaviest: [{ name: 'CapnHook Bee', value: '2.31 kg', sub: 'Trout' }, { name: 'Dewey Jr.', value: '1.94 kg', sub: 'Herring' }, { name: 'Wormtail', value: '1.62 kg', sub: 'Salmon' }],
};

const Row = ({ rank, name, value, sub, isPlayer }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: isPlayer ? 'rgba(100,220,100,0.13)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${isPlayer ? 'rgba(100,220,100,0.35)' : rank < 3 ? RANK_COLORS[rank] + '33' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 6, padding: '5px 8px', marginBottom: 3,
  }}>
    <span style={{ fontSize: 13, minWidth: 20 }}>{isPlayer ? '👤' : (RANK_MEDAL[rank] || `${rank + 1}.`)}</span>
    <span style={{ flex: 1, color: isPlayer ? '#7fff7f' : '#ddd', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ color: isPlayer ? '#7fff7f' : '#f5d87a', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}>{value}</div>
      {sub && <div style={{ color: '#999', fontSize: 9 }}>{sub}</div>}
    </div>
  </div>
);

const MiniLeaderboard = ({ title, rows, playerValue, playerSub }) => (
  <div style={{ flex: 1 }}>
    <div style={{
      fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 11,
      color: '#f5d87a', textShadow: '1px 1px 0 #000', letterSpacing: 1,
      marginBottom: 6, textAlign: 'center',
    }}>
      {title}
    </div>
    {rows.map((r, i) => (
      <Row key={i} rank={i} name={r.name} value={r.value} sub={r.sub} />
    ))}
    <Row rank={-1} name="You" value={playerValue} sub={playerSub} isPlayer />
  </div>
);

const SectionHeader = ({ label }) => (
  <div style={{
    fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 15,
    color: '#fff', textShadow: '2px 2px 0 #000', letterSpacing: 2,
    textAlign: 'center', marginBottom: 10,
    borderBottom: '1px solid rgba(245,216,122,0.3)', paddingBottom: 6,
  }}>
    {label}
  </div>
);

const WeeklyBadge = ({ cropName }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: 'rgba(245,216,122,0.1)', border: '1px solid rgba(245,216,122,0.3)',
    borderRadius: 8, padding: '4px 10px', marginBottom: 10,
  }}>
    <span style={{ fontSize: 10, color: '#aaa', fontFamily: 'GROBOLD, Cartoonist, sans-serif', letterSpacing: 1 }}>
      THIS WEEK
    </span>
    <span style={{ fontSize: 12, color: '#f5d87a', fontFamily: 'GROBOLD, Cartoonist, sans-serif', letterSpacing: 1 }}>
      {cropName}
    </span>
  </div>
);

const LeaderboardDialog = ({ onClose, label = "LEADERBOARD", header = "", headerOffset = 0 }) => {
  const [stats, setStats] = useState({
    farmingPoints: 0, heaviestCrop: null, weeklyHeaviest: null,
    fishingPoints: 0, heaviestFish: null,
  });
  const [featured] = useState(() => getWeeklyFeaturedCrop());

  useEffect(() => {
    const weekly = JSON.parse(localStorage.getItem('sandbox_weekly_heaviest_crop') || 'null');
    setStats({
      farmingPoints: parseInt(localStorage.getItem('sandbox_farming_points') || '0', 10),
      heaviestCrop:  JSON.parse(localStorage.getItem('sandbox_heaviest_crop') || 'null'),
      weeklyHeaviest: weekly?.weekNum === featured.weekNum ? weekly : null,
      fishingPoints: parseInt(localStorage.getItem('sandbox_fishing_points') || '0', 10),
      heaviestFish:  JSON.parse(localStorage.getItem('sandbox_heaviest_fish') || 'null'),
    });
  }, [featured.weekNum]);

  const weeklyHeaviestMock = MOCK_FARMING.heaviest.map(r => ({ ...r, sub: featured.name }));

  return (
    <BaseDialog onClose={onClose} title={label} header={header} headerOffset={headerOffset}>
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Farming */}
        <div>
          <SectionHeader label="🌾  Farming" />
          <div style={{ display: 'flex', gap: 12 }}>
            <MiniLeaderboard
              title="BEST FARMER"
              rows={MOCK_FARMING.points}
              playerValue={stats.farmingPoints.toLocaleString() + ' pts'}
            />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ flex: 1 }}>
              <WeeklyBadge cropName={featured.name} />
              <MiniLeaderboard
                title="HEAVIEST CROP"
                rows={weeklyHeaviestMock}
                playerValue={stats.weeklyHeaviest ? `${stats.weeklyHeaviest.weight} kg` : '—'}
                playerSub={stats.weeklyHeaviest ? featured.name : undefined}
              />
            </div>
          </div>
          <div style={{ color: '#555', fontSize: 9, textAlign: 'center', marginTop: 6 }}>
            Points: Pico 500–900 · Basic 2,000–4,000 · Premium 10,000–18,000 · Gem skips don't count
          </div>
          <div style={{ color: '#555', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
            Heaviest: weekly featured crop only · weight range varies per crop · resets Monday
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />

        {/* Fishing */}
        <div>
          <SectionHeader label="🎣  Fishing" />
          <div style={{ display: 'flex', gap: 12 }}>
            <MiniLeaderboard
              title="BEST ANGLER"
              rows={MOCK_FISHING.points}
              playerValue={stats.fishingPoints.toLocaleString() + ' pts'}
            />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <MiniLeaderboard
              title="HEAVIEST FISH"
              rows={MOCK_FISHING.heaviest}
              playerValue={stats.heaviestFish ? `${stats.heaviestFish.weight} kg` : '—'}
              playerSub={stats.heaviestFish?.name}
            />
          </div>
          <div style={{ color: '#555', fontSize: 9, textAlign: 'center', marginTop: 6 }}>
            Points: Common = 10 · Uncommon = 20 · Rare = 40 · Epic = 80
          </div>
        </div>

      </div>
    </BaseDialog>
  );
};

export default LeaderboardDialog;
