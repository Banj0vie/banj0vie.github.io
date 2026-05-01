import React, { useMemo, useEffect, useState, useRef } from 'react';

// Global weather helper
export const getWeatherForDay = (day) => {
  // Lightning disabled for now — day 15 falls through to the normal cloud/rain rules.
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

const getEffectiveWeather = (simulatedDate) => {
  const tutorialStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
  if (tutorialStep < 36) return '☀️';
  const override = localStorage.getItem('sandbox_weather_override');
  if (override === 'rain') return '🌧️';
  if (override === 'storm') return '⚡';
  if (override === 'sunny') return '☀️';
  return getWeatherForDay(simulatedDate);
};

const WeatherOverlay = () => {
  const [simulatedDate, setSimulatedDate] = useState(() => getSimulatedDateInfo().date);
  const [weatherOverride, setWeatherOverride] = useState(() => localStorage.getItem('sandbox_weather_override') || null);
  const rainAudioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio('/sounds/rain/rainsound.mp3');
    audio.loop = true;
    audio.volume = 0.32;
    rainAudioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.type === 'changeSimulatedDate') setSimulatedDate(e.detail.date);
    };
    const handleOverride = () => setWeatherOverride(localStorage.getItem('sandbox_weather_override') || null);
    window.addEventListener('changeSimulatedDate', handleSync);
    window.addEventListener('weatherOverrideChanged', handleOverride);

    const interval = setInterval(() => {
      const info = getSimulatedDateInfo();
      if (info.date !== simulatedDate) setSimulatedDate(info.date);
    }, 60000);

    return () => {
      window.removeEventListener('changeSimulatedDate', handleSync);
      window.removeEventListener('weatherOverrideChanged', handleOverride);
      clearInterval(interval);
    };
  }, [simulatedDate]);

  const weather = getEffectiveWeather(simulatedDate);
  const isLightning = weather === '⚡';
  const isRaining = weather === '⚡' || weather === '🌧️';

  useEffect(() => {
    const audio = rainAudioRef.current;
    if (!audio) return;
    if (isRaining) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isRaining]);

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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 500, overflow: 'hidden' }}>
          <style>{`
            .rain-drop { position: absolute; bottom: 100%; width: 2px; height: 100px; background: linear-gradient(to bottom, rgba(200,230,255,0), rgba(200,230,255,0.6)); animation: rain-fall linear infinite; }
            @keyframes rain-fall { 0% { transform: translateY(0) translateX(0); } 100% { transform: translateY(120vh) translateX(-10vh); } }
            .lightning-flash { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: white; pointer-events: none; z-index: 499; animation: flash 8s infinite; opacity: 0; }
            @keyframes flash { 0%, 95%, 98%, 100% { opacity: 0; } 96%, 99% { opacity: 0.6; } }
            .rain-darken { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 20, 50, 0.25); pointer-events: none; z-index: 498; }
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