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
  let saved = localStorage.getItem('simulated_date_info');
  if (saved) {
    try {
       const info = JSON.parse(saved);
       const now = new Date();
       const savedDate = new Date(info.savedRealDateStr);
       
       // Use UTC to avoid daylight savings time boundary skips
       const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
       const utcSaved = Date.UTC(savedDate.getFullYear(), savedDate.getMonth(), savedDate.getDate());
       const diffDays = Math.max(0, Math.floor((utcNow - utcSaved) / (1000 * 60 * 60 * 24)));
       
       let currentSimDate = info.savedSimDate + diffDays;
       currentSimDate = currentSimDate % 28;
       if (currentSimDate === 0) currentSimDate = 28; // Keep 1-28 boundary
       
       return {
          date: currentSimDate,
          day: currentSimDate % 7 === 0 ? 0 : currentSimDate % 7 // Match Sunday to 0
       };
    } catch(e) {
       console.error("Failed to parse simulated_date_info", e);
    }
  }
  
  // Default fallback if never set
  const d = new Date().getDay();
  const mapped = d === 0 ? 7 : d;
  return { date: mapped, day: d };
};

// Records the override in local storage starting from the current real-world day
export const setSimulatedDateInfo = (simDate) => {
   localStorage.setItem('simulated_date_info', JSON.stringify({
      savedRealDateStr: new Date().toDateString(),
      savedSimDate: simDate
   }));
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

  const weather = getWeatherForDay(simulatedDate);
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
  );
};

export default React.memo(WeatherOverlay);