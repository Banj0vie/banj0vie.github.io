import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './style.css';

const MenuItem = ({ path, icon, label, isActive }) => {
  const clickAudioRef = useRef(null);

  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  return (
    <Link
      to={path}
      className={`menu-item ${isActive ? 'active' : ''}`}
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
