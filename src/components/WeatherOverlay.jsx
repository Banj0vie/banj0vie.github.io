import React, { useMemo, useEffect, useState } from 'react';

// Global weather helper
export const getWeatherForDay = (day) => {
  if (day === 15) return '⚡'; // 1 day of lightning
  if (day % 4 === 0) return '🌧️'; // Standard rainy days
  if (day % 3 === 0 || day % 5 === 0) return '☁️'; // Mix of cloudy
  return '☀️'; // Sunny by default
};

// Reliable date sync that naturally increments 1 day for every 24h passed
export const getSimulatedDateInfo = () => {
  const now = new Date();
  const date = now.getDate();
  const day = now.getDay();
  return { date, day };
};


const WeatherOverlay = () => {
  const [simulatedDate, setSimulatedDate] = useState(() => getSimulatedDateInfo().date);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.type === 'changeSimulatedDate') setSimulatedDate(e.detail.date);
    };
    window.addEventListener('changeSimulatedDate', handleSync);
    
    // Check exactly once a minute if the real-world day crossed over midnight
    const interval = setInterval(() => {
      const info = getSimulatedDateInfo();
      if (info.date !== simulatedDate) setSimulatedDate(info.date);
    }, 60000);

    return () => {
      window.removeEventListener('changeSimulatedDate', handleSync);
      clearInterval(interval);
    };
  }, [simulatedDate]);

  const tutorialStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
  const weather = tutorialStep < 32 ? '☀️' : getWeatherForDay(simulatedDate);
  const isLightning = weather === '⚡';
  const isRaining = weather === '⚡' || weather === '🌧️';

  const drops = useMemo(() => Array.from({ length: 150 }).map((_, i) => ({
    left: `${Math.random() * 120 - 10}%`, 
    animationDuration: `${0.3 + Math.random() * 0.4}s`, 
    animationDelay: `${Math.random() * 2}s`,
    opacity: 0.3 + Math.random() * 0.5
  })), []);

  if (!isRaining) return null;

  return (
    <>
      {isRaining && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9990, overflow: 'hidden' }}>
          <style>{`
            .rain-drop { position: absolute; bottom: 100%; width: 2px; height: 100px; background: linear-gradient(to bottom, rgba(200,230,255,0), rgba(200,230,255,0.6)); animation: rain-fall linear infinite; }
            @keyframes rain-fall { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(120vh) translateX(-10vh); } }
            .lightning-flash { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: white; pointer-events: none; z-index: 9989; animation: flash 8s infinite; opacity: 0; }
            @keyframes flash { 0%, 95%, 98%, 100% { opacity: 0; } 96%, 99% { opacity: 0.6; } }
            .rain-darken { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 20, 50, 0.25); pointer-events: none; z-index: 9988; }
          `}</style>
          <div className="rain-darken" />
          {isLightning && <div className="lightning-flash" />}
          {drops.map((style, i) => <div key={i} className="rain-drop" style={style} />)}
        </div>
      )}
    </>
  );
};

export default React.memo(WeatherOverlay);