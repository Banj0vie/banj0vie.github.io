import React, { useState, useEffect } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import { useNotification } from "../../contexts/NotificationContext";

const PLOT_COSTS =         [500, 1500, 4000, 10000, 25000, 65000, 175000, 450000, 1000000];
const PLOT_LEVEL_REQS =    [2,   4,    7,    10,    14,    18,    23,     28,     35];
const STARTING_PLOTS = [6, 7, 8];
const TOTAL_PLOTS = 30;

function formatGold(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

const getFarmLevel = () => Math.floor(Math.sqrt((parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10)) / 150)) + 1;

const GardnerDialog = ({ onClose, label = "GARDENER", header = "/images/dialog/modal-header-gardner.png" }) => {
  const { show } = useNotification();
  const [unlockedPlots, setUnlockedPlots] = useState(() =>
    JSON.parse(localStorage.getItem('sandbox_unlocked_plots') || JSON.stringify(STARTING_PLOTS))
  );
  const [gold, setGold] = useState(() =>
    parseInt(localStorage.getItem('sandbox_gold') || '0', 10)
  );
  const [farmLevel, setFarmLevel] = useState(getFarmLevel);

  useEffect(() => {
    const sync = () => setGold(parseInt(localStorage.getItem('sandbox_gold') || '0', 10));
    window.addEventListener('goldChanged', sync);
    window.addEventListener('sandboxGoldChanged', sync);
    return () => { window.removeEventListener('goldChanged', sync); window.removeEventListener('sandboxGoldChanged', sync); };
  }, []);

  useEffect(() => {
    const sync = () => setFarmLevel(getFarmLevel());
    window.addEventListener('levelUp', sync);
    return () => window.removeEventListener('levelUp', sync);
  }, []);

  const unlockedCount = unlockedPlots.length;
  const upgradeIndex = Math.floor((unlockedCount - STARTING_PLOTS.length) / 3);
  const isMaxed = unlockedCount >= TOTAL_PLOTS;
  const cost = isMaxed ? 0 : PLOT_COSTS[Math.min(upgradeIndex, PLOT_COSTS.length - 1)];
  const requiredLevel = isMaxed ? 0 : PLOT_LEVEL_REQS[Math.min(upgradeIndex, PLOT_LEVEL_REQS.length - 1)];
  const meetsLevel = farmLevel >= requiredLevel;
  const canAfford = gold >= cost;
  const canUnlock = meetsLevel && canAfford;

  const handleUnlock = () => {
    if (isMaxed || !canUnlock) return;

    const current = JSON.parse(localStorage.getItem('sandbox_unlocked_plots') || JSON.stringify(STARTING_PLOTS));
    const currentSet = new Set(current);
    const newPlots = [...current];
    let added = 0;
    for (let i = 0; i < TOTAL_PLOTS && added < 3; i++) {
      if (!currentSet.has(i)) { newPlots.push(i); added++; }
    }
    newPlots.sort((a, b) => a - b);

    localStorage.setItem('sandbox_unlocked_plots', JSON.stringify(newPlots));
    setUnlockedPlots(newPlots);

    const newGold = gold - cost;
    localStorage.setItem('sandbox_gold', String(newGold));
    window.dispatchEvent(new CustomEvent('goldChanged', { detail: String(newGold) }));
    window.dispatchEvent(new CustomEvent('plotsUnlocked', { detail: newPlots }));

    show(`3 new plots unlocked! You now have ${newPlots.length} plots.`, 'success');
  };

  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* NPC intro */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          "Well hello there, friend. I've been tending this land for thirty years. I can clear and prepare more plots for you — but good soil takes work."
        </div>

        {/* Current plots */}
        <div style={{
          background: 'rgba(255,255,255,0.07)', borderRadius: 12,
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>PLOTS UNLOCKED</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#a5d6a7' }}>{unlockedCount} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>/ {TOTAL_PLOTS}</span></div>
          </div>
          <div style={{ fontSize: 36 }}>🌱</div>
        </div>

        {isMaxed ? (
          <div style={{
            background: 'rgba(255,255,255,0.07)', borderRadius: 12,
            padding: '20px', textAlign: 'center',
            fontSize: 15, color: '#a5d6a7', fontWeight: 700,
          }}>
            🏆 All plots unlocked! Maximum farm reached.
          </div>
        ) : (
          <>
            {/* Next unlock preview */}
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 12,
              padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: `1px solid ${meetsLevel ? 'rgba(255,255,255,0.1)' : 'rgba(239,154,154,0.3)'}`,
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>NEXT UNLOCK</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>+3 Plots</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{unlockedCount} → {unlockedCount + 3} plots</div>
                <div style={{ fontSize: 11, color: meetsLevel ? '#a5d6a7' : '#ef9a9a', marginTop: 4 }}>
                  {meetsLevel ? `✓ Farm Level ${requiredLevel} met` : `🔒 Requires Farm Level ${requiredLevel} (you: ${farmLevel})`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>COST</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ffd54f' }}>🪙 {formatGold(cost)}</div>
                <div style={{ fontSize: 11, color: canAfford ? '#a5d6a7' : '#ef9a9a', marginTop: 2 }}>
                  {canAfford ? `You have 🪙 ${formatGold(gold)}` : `Need ${formatGold(cost - gold)} more`}
                </div>
              </div>
            </div>

            {/* Unlock button */}
            <button
              onClick={handleUnlock}
              disabled={!canUnlock}
              style={{
                background: canUnlock
                  ? 'linear-gradient(180deg, #66bb6a, #2e7d32)'
                  : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: 30,
                padding: '14px 0', width: '100%',
                color: canUnlock ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: 16, fontWeight: 700,
                cursor: canUnlock ? 'pointer' : 'default',
                boxShadow: canUnlock ? '0 4px 12px rgba(0,0,0,0.4)' : 'none',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => canUnlock && (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {!meetsLevel ? `🔒 Farm Level ${requiredLevel} required` : canAfford ? `Unlock 3 Plots — 🪙 ${formatGold(cost)}` : `Not enough gold`}
            </button>

            {/* Remaining upgrades */}
            {upgradeIndex < PLOT_COSTS.length - 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PLOT_COSTS.slice(upgradeIndex + 1, upgradeIndex + 4).map((c, i) => (
                  <div key={i} style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                    padding: '8px', textAlign: 'center', minWidth: 70,
                  }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Lv {PLOT_LEVEL_REQS[Math.min(upgradeIndex + 1 + i, PLOT_LEVEL_REQS.length - 1)]} · +{i + 2} upgrades</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,215,68,0.6)' }}>🪙 {formatGold(c)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </BaseDialog>
  );
};

export default GardnerDialog;
