import React, { useState, useEffect } from "react";
import BaseDialog from "../_BaseDialog";
import {
  getInventoryBags,
  getInventoryMaxSlots,
  getProduceUsedSlots,
  BAG_UPGRADE_COSTS,
  MAX_BAGS,
  SLOTS_PER_BAG,
} from "../../utils/inventorySlots";

const getGold = () => parseInt(localStorage.getItem('sandbox_gold') || '0', 10);

const BankerDialog = ({ onClose, label = "BANKER", header = "" }) => {
  const [bags, setBags] = useState(getInventoryBags);
  const [gold, setGold] = useState(getGold);
  const [usedSlots, setUsedSlots] = useState(getProduceUsedSlots);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const onGold = () => setGold(getGold());
    window.addEventListener('sandboxGoldChanged', onGold);
    return () => window.removeEventListener('sandboxGoldChanged', onGold);
  }, []);

  const refresh = () => {
    setBags(getInventoryBags());
    setUsedSlots(getProduceUsedSlots());
    setGold(getGold());
  };

  const buyBag = () => {
    const nextCostIdx = bags - 1; // bags starts at 1, cost[0] = bag 2
    if (bags >= MAX_BAGS) { setFeedback('Max bags reached!'); return; }
    const cost = BAG_UPGRADE_COSTS[nextCostIdx];
    if (gold < cost) { setFeedback('Not enough gold!'); return; }
    const newGold = gold - cost;
    localStorage.setItem('sandbox_gold', String(newGold));
    localStorage.setItem('sandbox_inventory_bags', String(bags + 1));
    window.dispatchEvent(new CustomEvent('sandboxGoldChanged'));
    setFeedback(`Bag unlocked! You now have ${bags + 1} bags.`);
    refresh();
    setTimeout(() => setFeedback(''), 3000);
  };

  const maxSlots = bags * SLOTS_PER_BAG;
  const nextCostIdx = bags - 1;
  const nextCost = bags < MAX_BAGS ? BAG_UPGRADE_COSTS[nextCostIdx] : null;
  const canAfford = nextCost !== null && gold >= nextCost;

  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 18, padding: '8px 0' }}>

        {/* Current bag status */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '14px 18px',
        }}>
          <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', color: '#f5d87a', fontSize: 13, marginBottom: 10, letterSpacing: 1 }}>
            INVENTORY BAGS
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#ccc', fontSize: 12 }}>Bags owned</span>
            <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13 }}>{bags} / {MAX_BAGS}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#ccc', fontSize: 12 }}>Slots available</span>
            <span style={{ color: usedSlots >= maxSlots ? '#ff7777' : '#7fff7f', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13 }}>
              {usedSlots} / {maxSlots}
            </span>
          </div>

          {/* Slot bar */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.min(100, (usedSlots / maxSlots) * 100)}%`,
              background: usedSlots >= maxSlots ? '#ff5555' : usedSlots / maxSlots > 0.75 ? '#f5a623' : '#5dbb63',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Bag tiers */}
        <div>
          <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', color: '#f5d87a', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>
            BAG UPGRADES
          </div>
          {BAG_UPGRADE_COSTS.map((cost, i) => {
            const bagNum = i + 2;
            const isOwned = bags >= bagNum;
            const isNext = bags === bagNum - 1;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: isOwned ? 'rgba(93,187,99,0.1)' : isNext ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isOwned ? 'rgba(93,187,99,0.35)' : isNext ? 'rgba(245,216,122,0.3)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 7, padding: '8px 12px', marginBottom: 5,
                opacity: !isOwned && !isNext ? 0.45 : 1,
              }}>
                <div>
                  <span style={{ color: isOwned ? '#7fff7f' : '#ddd', fontSize: 12, fontFamily: 'GROBOLD, Cartoonist, sans-serif' }}>
                    🎒 Bag {bagNum}
                  </span>
                  <span style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>+{SLOTS_PER_BAG} slots</span>
                </div>
                {isOwned
                  ? <span style={{ color: '#7fff7f', fontSize: 11 }}>✓ Owned</span>
                  : <span style={{ color: '#f5d87a', fontSize: 11, fontFamily: 'monospace' }}>{cost.toLocaleString()} 🍯</span>
                }
              </div>
            );
          })}
        </div>

        {/* Buy button */}
        {bags < MAX_BAGS ? (
          <button
            onClick={buyBag}
            disabled={!canAfford}
            style={{
              padding: '12px', borderRadius: 8, border: 'none', cursor: canAfford ? 'pointer' : 'not-allowed',
              background: canAfford ? 'linear-gradient(135deg, #c8821a, #f5a623)' : 'rgba(255,255,255,0.08)',
              color: canAfford ? '#fff' : '#666',
              fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 13, letterSpacing: 1,
              transition: 'opacity 0.2s',
            }}
          >
            Buy Bag {bags + 1} — {nextCost?.toLocaleString()} 🍯
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: '#f5d87a', fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 13 }}>
            MAX BAGS REACHED
          </div>
        )}

        {feedback && (
          <div style={{ textAlign: 'center', color: feedback.includes('enough') || feedback.includes('Max') ? '#ff7777' : '#7fff7f', fontSize: 12 }}>
            {feedback}
          </div>
        )}

        <div style={{ color: '#555', fontSize: 9, textAlign: 'center' }}>
          Each bag adds {SLOTS_PER_BAG} slots · Each slot holds up to 12 produce
        </div>
      </div>
    </BaseDialog>
  );
};

export default BankerDialog;
