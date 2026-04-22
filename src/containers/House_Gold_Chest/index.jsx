import React, { useState, useEffect, useRef } from "react";
import { ID_CHEST_ITEMS } from "../../constants/app_ids";

const CLAIM_KEY = 'sandbox_daily_chest_claimed_at';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const IDLE_COUNT = 21;
const OPEN_START = 21;
const OPEN_COUNT = 27;
const FPS = 12;

const getTimeLeft = () => {
  const claimedAt = parseInt(localStorage.getItem(CLAIM_KEY) || '0', 10);
  if (!claimedAt) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - claimedAt));
};

const formatCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const GoldChestDialog = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());
  const [phase, setPhase] = useState('idle'); // 'idle' | 'opening' | 'done'
  const [frame, setFrame] = useState(0);
  const phaseRef = useRef('idle');
  const frameRef = useRef(0);
  const intervalRef = useRef(null);
  const tickRef = useRef(null);

  // countdown tick
  useEffect(() => {
    tickRef.current = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // chest animation
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (phaseRef.current === 'idle') {
        frameRef.current = (frameRef.current + 1) % IDLE_COUNT;
        setFrame(frameRef.current);
      } else if (phaseRef.current === 'opening') {
        const next = frameRef.current + 1;
        if (next >= OPEN_COUNT) {
          clearInterval(intervalRef.current);
          // deliver loot
          const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
          loot[ID_CHEST_ITEMS.CHEST_BRONZE] = (loot[ID_CHEST_ITEMS.CHEST_BRONZE] || 0) + 1;
          localStorage.setItem('sandbox_loot', JSON.stringify(loot));
          window.dispatchEvent(new CustomEvent('lootUpdated'));
          // record claim
          localStorage.setItem(CLAIM_KEY, String(Date.now()));
          localStorage.setItem('sandbox_last_claim_date', new Date().toDateString());
          window.dispatchEvent(new CustomEvent('dailyChestClaimed'));
          phaseRef.current = 'done';
          setPhase('done');
          setTimeLeft(getTimeLeft());
        } else {
          frameRef.current = next;
          setFrame(next);
        }
      }
    }, Math.floor(1000 / FPS));
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleClaim = () => {
    if (phaseRef.current !== 'idle') return;
    phaseRef.current = 'opening';
    frameRef.current = 0;
    setPhase('opening');
    setFrame(0);
  };

  const canClaim = timeLeft === 0;

  const src = phase === 'opening'
    ? `/images/cardfront/card1open/open_chest_wood/NEW_open_chest_wood_${String(OPEN_START + frame).padStart(5, '0')}.png`
    : `/images/cardfront/card1idle/chest_wood/New_idle_chest_wood_${String(frame).padStart(5, '0')}.png`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes dailyChestPulse { 0%,100%{opacity:1;transform:translateY(0)} 50%{opacity:0.55;transform:translateY(-3px)} }
        @keyframes dailyFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{ textAlign: 'center', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px' }}
      >
        {/* Title */}
        <div style={{
          fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '26px',
          color: '#f5d87a', marginBottom: '10px',
          textShadow: '2px 2px 0 #000, -1px 1px 0 #000',
        }}>
          Daily Chest
        </div>

        {/* Chest animation */}
        <img
          src={src}
          alt="Daily Chest"
          draggable={false}
          onClick={canClaim && phase === 'idle' ? handleClaim : undefined}
          style={{
            width: '260px',
            imageRendering: 'pixelated',
            cursor: canClaim && phase === 'idle' ? 'pointer' : 'default',
          }}
        />

        {/* State-specific UI */}
        {phase === 'idle' && canClaim && (
          <div style={{ animation: 'dailyFadeIn 0.4s ease-out forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
              fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '14px', color: '#c8a46a',
              marginBottom: '2px',
            }}>
              Your daily chest is ready!
            </div>
            <div
              onClick={handleClaim}
              style={{
                fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '18px',
                color: '#fff', background: 'linear-gradient(135deg, #c8821a, #f5a623)',
                padding: '10px 36px', borderRadius: '10px', cursor: 'pointer',
                boxShadow: '0 4px 0 #7a4a08, 0 6px 12px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.2)',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1.06)'}
            >
              Claim
            </div>
          </div>
        )}

        {phase === 'idle' && !canClaim && (
          <div style={{ animation: 'dailyFadeIn 0.4s ease-out forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '13px', color: '#888', marginTop: '4px' }}>
              Next chest in
            </div>
            <div style={{
              fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '28px', color: '#f5d87a',
              textShadow: '1px 1px 0 #000',
              animation: 'dailyChestPulse 2s ease-in-out infinite',
            }}>
              {formatCountdown(timeLeft)}
            </div>
            <div
              onClick={onClose}
              style={{
                marginTop: '4px', fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '14px',
                color: '#ccc', background: 'rgba(255,255,255,0.1)', padding: '8px 24px',
                borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Close
            </div>
          </div>
        )}

        {phase === 'opening' && (
          <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '14px', color: '#c8a46a', marginTop: '8px' }}>
            Opening...
          </div>
        )}

        {phase === 'done' && (
          <div style={{ animation: 'dailyFadeIn 0.5s ease-out forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '16px', color: '#7dff7d', textShadow: '1px 1px 0 #000', marginTop: '4px' }}>
              Bronze Chest added to inventory!
            </div>
            <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '13px', color: '#888' }}>
              Next chest in
            </div>
            <div style={{
              fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '28px', color: '#f5d87a',
              textShadow: '1px 1px 0 #000',
              animation: 'dailyChestPulse 2s ease-in-out infinite',
            }}>
              {formatCountdown(timeLeft)}
            </div>
            <div
              onClick={onClose}
              style={{
                marginTop: '4px', fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: '14px',
                color: '#ccc', background: 'rgba(255,255,255,0.1)', padding: '8px 24px',
                borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Close
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldChestDialog;
