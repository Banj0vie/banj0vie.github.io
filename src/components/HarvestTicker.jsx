import React, { useState, useEffect, useRef } from 'react';
import { ALL_ITEMS } from '../constants/item_data';

const ONE_SEED_HEIGHT = 207.7647;
const SCALE = 0.308;
const SPRITE_W = Math.round(159 * SCALE);

const DURATION = 7000;

export default function HarvestTicker() {
  const [event, setEvent] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      clearTimeout(timerRef.current);
      window.__harvestTickerActive = true;
      setEvent(e.detail);
      setAnimKey(k => k + 1);
      timerRef.current = setTimeout(() => {
        window.__harvestTickerActive = false;
      }, DURATION);
    };
    window.addEventListener('cropHarvested', handler);
    return () => {
      window.removeEventListener('cropHarvested', handler);
      clearTimeout(timerRef.current);
      window.__harvestTickerActive = false;
    };
  }, []);

  if (!event) return null;

  const itemData = event.seedId ? ALL_ITEMS[event.seedId] : null;
  const useDirectImage = itemData && itemData.pos === -1 && itemData.image;

  return (
    <>
      <style>{`
        @keyframes harvestSlideDown {
          0%   { transform: translateX(-50%) translateY(-110%); opacity: 0; }
          10%  { transform: translateX(-50%) translateY(0);     opacity: 1; }
          85%  { transform: translateX(-50%) translateY(0);     opacity: 1; }
          100% { transform: translateX(-50%) translateY(-110%); opacity: 0; }
        }
        @keyframes harvestGlow {
          0%,100% { text-shadow: 0 0 12px #aaff66, 0 0 28px #aaff6688; }
          50%     { text-shadow: 0 0 24px #ccff88, 0 0 56px #aaff6666; }
        }
        @keyframes harvestBorder {
          0%,100% { box-shadow: 0 6px 36px #44cc2299, inset 0 0 18px #44cc2222; border-color: #44cc22; }
          50%     { box-shadow: 0 6px 54px #88ff44bb, inset 0 0 32px #44cc2233; border-color: #88ff44; }
        }
      `}</style>
      <div
        key={animKey}
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          animation: `harvestSlideDown ${DURATION}ms ease-in-out forwards`,
          pointerEvents: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 24px 12px 12px',
          borderRadius: '60px',
          border: '3px solid #44cc22',
          background: 'linear-gradient(135deg, rgba(8,25,5,0.97), rgba(18,50,10,0.97))',
          animation: 'harvestBorder 1.5s ease-in-out infinite',
          backdropFilter: 'blur(12px)',
          whiteSpace: 'nowrap',
          minWidth: '360px',
        }}>
          {/* Crop icon badge */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'rgba(68,204,34,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden', position: 'relative',
          }}>
            {useDirectImage ? (
              <img
                src={itemData.image}
                alt={event.cropName}
                style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              />
            ) : itemData ? (
              <div style={{
                backgroundImage: 'url(/images/crops/seeds.webp)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${SPRITE_W}px auto`,
                backgroundPositionY: itemData.pos ? `-${itemData.pos * ONE_SEED_HEIGHT * SCALE}px` : 0,
                backgroundPositionX: 0,
                width: '64px',
                height: '64px',
                transform: 'scale(0.75)',
                flexShrink: 0,
              }} />
            ) : (
              <span style={{ fontSize: '28px' }}>🌾</span>
            )}
          </div>

          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'GROBOLD, Cartoonist, monospace' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>You harvested</span>
              <span style={{
                fontSize: '18px', fontWeight: 'bold',
                animation: 'harvestGlow 1.5s ease-in-out infinite',
                color: '#aaff66',
              }}>
                x1 {event.cropName} Seed
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                Weight: <span style={{ color: '#f5d87a', fontWeight: 'bold' }}>{event.weight} g</span>
              </span>
              {event.rarityLabel && (
                <span style={{
                  fontSize: '10px', fontWeight: 'bold', padding: '2px 7px', borderRadius: '10px',
                  background: event.rarityColor ?? '#f7efec',
                  color: '#000', letterSpacing: '0.5px',
                }}>
                  {event.rarityLabel}
                </span>
              )}
            </div>
          </div>

          {/* HARVESTED badge */}
          <div style={{
            fontSize: '11px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '14px',
            background: 'linear-gradient(90deg, #44cc22, #88ff44)',
            color: '#000', marginLeft: '4px', flexShrink: 0,
          }}>
            HARVESTED
          </div>
        </div>
      </div>
    </>
  );
}
