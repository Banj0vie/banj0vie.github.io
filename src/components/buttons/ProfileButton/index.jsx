import React, { useEffect, useRef } from 'react';
import './style.css';
import { profileAssets } from '../../../constants/_baseimages';

const ProfileButton = ({ icon, text, title, ariaLabel, style, bg, onClick, disabled, className }) => {
  const backgroundUrl = bg || profileAssets.buttonBg;
  const baseClassName = `profile-btn${text ? ' with-text' : ' only-icon'}${disabled ? ' disabled' : ''}`;
  const finalClassName = className ? `${baseClassName} ${className}` : baseClassName;
  const clickAudioRef = useRef(null);

  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);
  
  const handleClick = (e) => {
    if (disabled) return;
    const audio = clickAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    if (onClick) onClick(e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      const audio = clickAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      onClick(e);
    }
  };

  return (
    <div
      className={finalClassName}
      title={title}
      aria-label={ariaLabel || title}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={style}
    >
      {bg && <img src={bg} alt="" className={`pb-bg${text ? '-with-text' : ''}`} aria-hidden="true" />}
      {icon ? <span className="pb-icon" aria-hidden>{icon}</span> : null}
      {text ? <span className="pb-text">{text}</span> : null}
    </div>
  );
};

export default ProfileButton;
