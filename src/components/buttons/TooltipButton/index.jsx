import React, { useEffect, useRef } from 'react';
import './style.css';

const TooltipButton = ({ label, labelImg, style, className = '', onClick, "data-hotspot": dataHotspot, frameSrc, onMouseEnter, onMouseLeave, disableHoverSound = false }) => {
  const combinedClass = `tooltip-btn ${className}`.trim();
  const backgroundImage = frameSrc || '/images/backgrounds/tooltip_bg.png';
  const hoverAudioRef = useRef(null);
  const clickAudioRef = useRef(null);

  useEffect(() => {
    if (!hoverAudioRef.current) {
      hoverAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      hoverAudioRef.current.preload = "auto";
    }
  }, []);
  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonClick.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  const handleMouseEnter = (event) => {
    if (!disableHoverSound) {
      const audio = hoverAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    }
    if (onMouseEnter) onMouseEnter(event);
  };

  const handleMouseLeave = (event) => {
    if (onMouseLeave) onMouseLeave(event);
  };
  const handleClick = (event) => {
    const audio = clickAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    if (onClick) onClick(event);
  };
  return (
    <div
      className={combinedClass}
      style={{ ...(label ? { backgroundImage: `url(${backgroundImage})` } : {}), ...style }}
      onClick={handleClick}
      data-hotspot={dataHotspot}
      title={label}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {labelImg ? <img src={labelImg} alt={label} style={{ maxWidth: '130%', maxHeight: '130%', objectFit: 'contain', pointerEvents: 'none' }} /> : label && <span>{label}</span>}
    </div>
  );
};

export default TooltipButton;


