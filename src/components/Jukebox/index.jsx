import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../store';
import { selectSettings } from '../../store/slices/uiSlice';
import { defaultSettings } from '../../utils/settings';
import { clampVolume } from '../../utils/basic';

const TRACKS = [
  { name: 'Valley Theme', src: '/sounds/theme.wav' },
  { name: 'Honey Groove', src: '/sounds/newthemesong.mp3' },
];

const Jukebox = () => {
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tick, setTick] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const audioRef = useRef(null);

  useEffect(() => {
    const handler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', handler);
    return () => window.removeEventListener('tutorialStepChanged', handler);
  }, []);

  const volume = clampVolume(parseFloat(settings?.musicVolume ?? defaultSettings.musicVolume) / 100);

  // Boot audio
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('jukeboxReady'));
    const audio = new Audio(TRACKS[0].src);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    const unlock = () => { tryPlay(); window.removeEventListener('pointerdown', unlock, true); };
    window.addEventListener('pointerdown', unlock, true);

    return () => {
      audio.pause();
      audioRef.current = null;
      window.dispatchEvent(new CustomEvent('jukeboxDestroyed'));
      window.removeEventListener('pointerdown', unlock, true);
    };
  }, []);

  // Volume sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (volume <= 0) audio.pause();
    else if (playing) audio.play().catch(() => {});
  }, [volume]);

  // Track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = !audio.paused;
    audio.pause();
    audio.src = TRACKS[trackIdx].src;
    audio.load();
    if (wasPlaying && volume > 0) audio.play().catch(() => {});
  }, [trackIdx]);

  // Play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && volume > 0) audio.play().catch(() => {});
    else audio.pause();
  }, [playing]);

  // Vinyl spin tick (only when playing)
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, [playing]);

  const prev = () => setTrackIdx(i => (i - 1 + TRACKS.length) % TRACKS.length);
  const next = () => setTrackIdx(i => (i + 1) % TRACKS.length);

  const rotation = (tick * 3) % 360;
  const track = TRACKS[trackIdx];

  // Hide the UI during the tutorial (music keeps playing)
  if (tutorialStep < 36) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 800,
        fontFamily: 'GROBOLD, Cartoonist, monospace',
        userSelect: 'none',
      }}
    >
      {expanded ? (
        <div
          style={{
            background: 'linear-gradient(160deg, #3b1a05, #5c2c0c)',
            border: '3px solid #c8821a',
            borderRadius: '18px',
            padding: '14px 16px 12px',
            width: 200,
            boxShadow: '0 6px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,200,80,0.15)',
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#f5d87a', letterSpacing: 1 }}>🎵 JUKEBOX</span>
            <span
              onClick={() => setExpanded(false)}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1 }}
            >✕</span>
          </div>

          {/* Vinyl + track name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {/* Vinyl disc */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 38%, #555 0%, #111 60%, #2a2a2a 100%)',
              border: '2px solid #444',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `rotate(${rotation}deg)`,
              transition: playing ? 'none' : 'transform 0.3s',
              boxShadow: playing ? '0 0 8px rgba(255,180,0,0.3)' : 'none',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c8821a', border: '1.5px solid #f5d87a' }} />
            </div>

            {/* Track name */}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>NOW PLAYING</div>
              <div style={{
                fontSize: 12, color: '#f5d87a', fontWeight: 'bold',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{track.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                Track {trackIdx + 1} / {TRACKS.length}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {[
              { label: '⏮', action: prev, title: 'Previous' },
              { label: playing ? '⏸' : '▶', action: () => setPlaying(p => !p), title: playing ? 'Pause' : 'Play', primary: true },
              { label: '⏭', action: next, title: 'Next' },
            ].map(({ label, action, title, primary }) => (
              <button
                key={title}
                onClick={action}
                title={title}
                style={{
                  background: primary ? 'linear-gradient(180deg, #c8821a, #7a4a08)' : 'rgba(255,255,255,0.08)',
                  border: primary ? '1.5px solid #f5d87a' : '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: primary ? '50%' : 8,
                  width: primary ? 38 : 30,
                  height: primary ? 38 : 30,
                  color: '#fff',
                  fontSize: primary ? 16 : 13,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.1s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.12)'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Collapsed pill */
        <div
          onClick={() => setExpanded(true)}
          title="Open Jukebox"
          style={{
            background: 'linear-gradient(160deg, #3b1a05, #5c2c0c)',
            border: '3px solid #c8821a',
            borderRadius: 50,
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 38%, #555 0%, #111 60%)',
            border: '1.5px solid #444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `rotate(${rotation}deg)`,
            flexShrink: 0,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c8821a' }} />
          </div>
          <span style={{ fontSize: 11, color: '#f5d87a', whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {track.name}
          </span>
          <span style={{ fontSize: 12, color: playing ? '#a5d6a7' : 'rgba(255,255,255,0.35)' }}>
            {playing ? '▶' : '⏸'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Jukebox;
