import React, { useState, useEffect, useRef } from 'react';

const USERNAMES = [
  'FarmKing99', 'SunflowerSue', 'TaterTot42', 'ReelDeal', 'CropTop',
  'HarvestMoon', 'BigBassB', 'PlowMaster', 'GoldenRow', 'SeedWhisperer',
  'TroutHunter', 'VeggieVibes', 'MojoPete', 'AnglerAce', 'DirtNapper',
  'CornQueen', 'FishFrenzy', 'GreenThumb', 'LureKing', 'BumperCrop',
];

const LEGENDARY_SEEDS = [
  { name: 'Dragon Fruit', image: '/images/cardfront/dragonfruit/dragleg.png' },
  { name: 'Pumpkin', image: '/images/cardfront/pumpkin/pumpleg.png' },
  { name: 'Mango', image: '/images/cardfront/mango/mangoleg.png' },
  { name: 'Pomegranate', image: '/images/cardfront/pomegranate/pomleg.png' },
  { name: 'Lychee', image: '/images/cardfront/lychee/lycleg.png' },
  { name: 'Blueberry', image: '/images/cardfront/blueberry/bbleg.png' },
  { name: 'Pineapple', image: '/images/cardfront/pineapplecard/pineappleleg.png' },
  { name: 'Papaya', image: '/images/cardfront/papaya/papleg.png' },
  { name: 'Lavender', image: '/images/cardfront/lavender/lavleg.png' },
  { name: 'Avocado', image: '/images/cardfront/avocado/avoleg.png' },
  { name: 'Banana', image: '/images/cardfront/banana/banleg.png' },
  { name: 'Apple', image: '/images/cardfront/apple/appleleg.png' },
];

const EPIC_SEEDS = [
  { name: 'Tomato', image: '/images/cardfront/tomato/tomatoepic.png' },
  { name: 'Corn', image: '/images/cardfront/corn/cornepic.png' },
  { name: 'Pepper', image: '/images/cardfront/pepper/pepperepic.png' },
  { name: 'Grapes', image: '/images/cardfront/grape/grapeepic.png' },
  { name: 'Broccoli', image: '/images/cardfront/broccoli/brocepic.png' },
  { name: 'Eggplant', image: '/images/cardfront/eggplant/eggepic.png' },
  { name: 'Cauliflower', image: '/images/cardfront/califlower/caliepic.png' },
  { name: 'Radish', image: '/images/cardfront/radish/radepic.png' },
  { name: 'Wheat', image: '/images/cardfront/wheat/wheatepic.png' },
  { name: 'Turnip', image: '/images/cardfront/turnip/turnipepic.png' },
  { name: 'Bokchoy', image: '/images/cardfront/bokchoy/bchoyepic.png' },
  { name: 'Celery', image: '/images/cardfront/celery/celepic.png' },
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateEvent = () => {
  const user = rand(USERNAMES);
  if (Math.random() < 0.4) {
    const seed = rand(LEGENDARY_SEEDS);
    return { type: 'legendary', user, item: seed.name, image: seed.image };
  } else {
    const seed = rand(EPIC_SEEDS);
    return { type: 'epic', user, item: seed.name, image: seed.image };
  }
};

export default function GlobalEventTicker() {
  const [event, setEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const isTutorialActive = () => {
    const step = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
    return step < 32;
  };

  const showNext = () => {
    if (isTutorialActive()) {
      timeoutRef.current = setTimeout(showNext, 5000);
      return;
    }
    const next = generateEvent();
    setEvent(next);
    setVisible(true);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = setTimeout(showNext, 1500);
    }, 4500);
  };

  useEffect(() => {
    // Random delay before first event so it doesn't fire instantly on load
    timeoutRef.current = setTimeout(showNext, 3000 + Math.random() * 4000);
    return () => clearTimeout(timeoutRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!event) return null;

  const isLegendary = event.type === 'legendary';
  const isEpic      = event.type === 'epic';

  return (
    <>
      <style>{`
        @keyframes tickerSlideDown {
          0%   { transform: translateX(calc(-50% + 20px)) translateY(-100%); opacity: 0; }
          15%  { transform: translateX(calc(-50% + 20px)) translateY(0);    opacity: 1; }
          85%  { transform: translateX(calc(-50% + 20px)) translateY(0);    opacity: 1; }
          100% { transform: translateX(calc(-50% + 20px)) translateY(-100%); opacity: 0; }
        }
        @keyframes rainbowShift {
          0%   { color: #ff4444; }
          16%  { color: #ffaa00; }
          33%  { color: #ffff00; }
          50%  { color: #44ff44; }
          66%  { color: #44aaff; }
          83%  { color: #aa44ff; }
          100% { color: #ff4444; }
        }
        @keyframes legendaryGlow {
          0%,100% { text-shadow: 0 0 8px #ffaa00, 0 0 20px #ffaa0088; }
          50%     { text-shadow: 0 0 16px #ffdd44, 0 0 40px #ffaa0066; }
        }
        @keyframes rainbowBorder {
          0%   { border-color: #ff4444; box-shadow: 0 4px 24px #ff444466; }
          16%  { border-color: #ffaa00; box-shadow: 0 4px 24px #ffaa0066; }
          33%  { border-color: #ffff00; box-shadow: 0 4px 24px #ffff0066; }
          50%  { border-color: #44ff44; box-shadow: 0 4px 24px #44ff4466; }
          66%  { border-color: #44aaff; box-shadow: 0 4px 24px #44aaff66; }
          83%  { border-color: #aa44ff; box-shadow: 0 4px 24px #aa44ff66; }
          100% { border-color: #ff4444; box-shadow: 0 4px 24px #ff444466; }
        }
        @keyframes goldBorder {
          0%,100% { box-shadow: 0 4px 24px #ffaa0088, inset 0 0 12px #ffaa0022; }
          50%     { box-shadow: 0 4px 40px #ffdd4499, inset 0 0 20px #ffaa0033; }
        }
        @keyframes epicGlow {
          0%,100% { text-shadow: 0 0 8px #6644ff, 0 0 20px #6644ff88; }
          50%     { text-shadow: 0 0 16px #aa88ff, 0 0 40px #6644ff66; }
        }
        @keyframes epicBorder {
          0%,100% { box-shadow: 0 4px 24px #6644ff88, inset 0 0 12px #6644ff22; border-color: #6644ff; }
          50%     { box-shadow: 0 4px 40px #aa88ff99, inset 0 0 20px #6644ff33; border-color: #aa88ff; }
        }
      `}</style>

      {visible && (
        <div style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(calc(-50% + 20px))',
          zIndex: 100,
          animation: 'tickerSlideDown 4.5s ease-in-out forwards',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px 4px 5px',
            borderRadius: '40px',
            border: `2px solid ${isLegendary ? '#ffaa00' : '#6644ff'}`,
            background: isLegendary
              ? 'linear-gradient(135deg, rgba(20,12,0,0.95), rgba(40,25,0,0.95))'
              : 'linear-gradient(135deg, rgba(10,5,30,0.95), rgba(25,10,60,0.95))',
            animation: isLegendary ? 'goldBorder 1.5s ease-in-out infinite' : 'epicBorder 1.5s ease-in-out infinite',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}>
            {/* Icon badge */}
            <div style={{
              width: '24px', height: '24px',
              borderRadius: '50%',
              background: isLegendary ? 'rgba(255,170,0,0.2)' : 'rgba(102,68,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', flexShrink: 0,
            }}>
              {isLegendary ? '🏆' : '⚡'}
            </div>

            {/* Item image */}
            <img
              src={event.image}
              alt={event.item}
              style={{
                width: '24px', height: '24px',
                objectFit: 'contain', borderRadius: '4px', flexShrink: 0,
                filter: isEpic
                  ? 'drop-shadow(0 0 6px #6644ff)'
                  : 'drop-shadow(0 0 6px #ffaa00)',
              }}
              onError={e => { e.target.style.display = 'none'; }}
            />

            {/* Text */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline', fontFamily: 'monospace' }}>
              <span style={{
                fontWeight: 'bold', fontSize: '11px', color: '#fff',
              }}>
                {event.user}
              </span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                pulled a
              </span>
              <span style={{
                fontWeight: 'bold', fontSize: '11px',
                animation: isLegendary ? 'legendaryGlow 1.5s ease-in-out infinite' : 'epicGlow 1.5s ease-in-out infinite',
                color: isLegendary ? '#ffaa00' : '#aa88ff',
              }}>
                {`🌱 ${event.item}`}
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px',
                background: isLegendary ? '#ffaa00' : 'linear-gradient(90deg,#6644ff,#aa44ff)',
                color: isLegendary ? '#000' : '#fff',
                marginLeft: '2px',
              }}>
                {isLegendary ? 'LEGENDARY' : 'EPIC'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
