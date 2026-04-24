import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Phase timing (ms)
const CLOUDS_IN   = 600;  // clouds rise to cover screen
const CROW_IN     = 400;  // crow zooms in after clouds start
const NAV_AT      = 950;  // navigate at this point (screen hidden)
const CROW_OUT    = 900;  // crow flies away (extra time for images to load)
const CLOUDS_OUT  = 600;  // clouds fall back down

const CLOUD_SHAPES = [
  { left: '-5%',  bottom: '-10px', width: '340px', height: '180px', delay: '0ms'   },
  { left: '20%',  bottom: '-20px', width: '280px', height: '150px', delay: '40ms'  },
  { left: '45%',  bottom: '-5px',  width: '320px', height: '170px', delay: '20ms'  },
  { left: '65%',  bottom: '-15px', width: '300px', height: '160px', delay: '60ms'  },
  { left: '85%',  bottom: '-10px', width: '260px', height: '140px', delay: '30ms'  },
  { left: '-10%', bottom: '-30px', width: '400px', height: '200px', delay: '80ms'  },
  { left: '30%',  bottom: '-25px', width: '350px', height: '190px', delay: '50ms'  },
  { left: '70%',  bottom: '-20px', width: '380px', height: '195px', delay: '10ms'  },
];

export default function PageTransition() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle'); // idle | clouds-in | crow-in | crow-out | clouds-out
  const [pendingPath, setPendingPath] = useState(null);
  const timerRefs = useRef([]);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const addTimer = (fn, delay) => {
    const id = setTimeout(fn, delay);
    timerRefs.current.push(id);
    return id;
  };

  useEffect(() => {
    const handler = (e) => {
      const { path } = e.detail;
      setPendingPath(path);
      setPhase('clouds-in');

      addTimer(() => setPhase('crow-in'), CROW_IN);
      addTimer(() => {
        navigate(path);
      }, NAV_AT);
      addTimer(() => setPhase('crow-out'), NAV_AT + 80);
      addTimer(() => setPhase('clouds-out'), NAV_AT + CROW_OUT);
      addTimer(() => setPhase('idle'), NAV_AT + CROW_OUT + CLOUDS_OUT + 100);
    };

    window.addEventListener('pageTransition', handler);
    return () => {
      window.removeEventListener('pageTransition', handler);
      clearTimers();
    };
  }, [navigate]);

  if (phase === 'idle') return null;

  const cloudsIn   = phase === 'clouds-in' || phase === 'crow-in' || phase === 'crow-out';
  const cloudsOut  = phase === 'clouds-out';
  const showCrow   = phase === 'crow-in' || phase === 'crow-out';
  const crowLeave  = phase === 'crow-out';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      pointerEvents: phase === 'idle' ? 'none' : 'all',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes cloudRiseIn {
          from { transform: translateY(0); }
          to   { transform: translateY(-110vh); }
        }
        @keyframes cloudFallOut {
          from { transform: translateY(-110vh); }
          to   { transform: translateY(0); }
        }
        @keyframes crowZoomIn {
          from { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
        }
        @keyframes crowFlyAway {
          from { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
          to   { transform: translate(-50%, -180%) scale(0.4); opacity: 0; }
        }
      `}</style>

      {/* Cloud layer */}
      {CLOUD_SHAPES.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.left,
            bottom: c.bottom,
            width: c.width,
            height: c.height,
            background: 'radial-gradient(ellipse at 50% 80%, #e8e8e8, #fff)',
            borderRadius: '50% 50% 20% 20% / 60% 60% 40% 40%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: cloudsOut
              ? `cloudFallOut ${CLOUDS_OUT}ms ease-in ${c.delay} forwards`
              : `cloudRiseIn ${CLOUDS_IN}ms ease-out ${c.delay} forwards`,
            transform: cloudsOut ? 'translateY(-110vh)' : 'translateY(0)',
          }}
        />
      ))}

      {/* Crow gif */}
      {showCrow && (
        <img
          src={`/images/badanimals/crowfly.gif?t=${Date.now()}`}
          alt="crow"
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '100vw', height: '100vh',
            objectFit: 'cover',
            animation: crowLeave
              ? `crowFlyAway ${CROW_OUT}ms ease-in forwards`
              : `crowZoomIn ${CROW_IN}ms ease-out forwards`,
          }}
        />
      )}
    </div>
  );
}
