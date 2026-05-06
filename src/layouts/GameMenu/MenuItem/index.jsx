import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { navigateWithClouds } from '../../../components/RouteCloudTransition';

const MenuItem = ({ path, icon, label, labelIcon, iconScale, isActive, highlight, onClickOverride, noHover = false }) => {
  const clickAudioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    const audio = clickAudioRef.current;
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
    if (onClickOverride) { onClickOverride(); return; }
    navigateWithClouds(navigate, path);
  };

  return (
    <a
      href={path}
      className={`menu-item ${isActive ? 'active' : ''} ${noHover ? 'no-hover' : ''}`}
      onClick={handleClick}
    >
      <div className={`menu-icon${highlight ? ' menu-icon-highlight' : ''}`}>
        <img src={icon} alt={label} className="menu-icon-img" style={iconScale ? { width: `${iconScale * 100}%`, height: `${iconScale * 100}%` } : undefined} />
        {labelIcon && <img src={labelIcon} alt={`${label} label`} style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', width: '70%', pointerEvents: 'none' }} />}
      </div>
    </a>
  );
}

export default MenuItem;
