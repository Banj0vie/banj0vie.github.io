import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './style.css';

const MenuItem = ({ path, icon, label, isActive }) => {
  const hoverAudioRef = useRef(null);
  const clickAudioRef = useRef(null);

  useEffect(() => {
    if (!hoverAudioRef.current) {
      hoverAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      hoverAudioRef.current.preload = "auto";
    }
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonClick.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  return (
    <Link
      to={path}
      className={`menu-item ${isActive ? 'active' : ''}`}
      onMouseEnter={() => {
        const audio = hoverAudioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }}
      onClick={() => {
        const audio = clickAudioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }}
    >
      <div className="menu-icon">
        <img src={icon} alt={label} className="menu-icon-img" />
      </div>
    </Link>
  );
}

export default MenuItem;
