import React from 'react';
import './style.css';
import { buttonFrames } from '../../../assets/images/baseimages';

const TooltipButton = ({ label, style, className = '', onClick, "data-hotspot": dataHotspot, frameSrc }) => {
  const combinedClass = `tooltip-btn ${className}`.trim();
  const backgroundImage = frameSrc || buttonFrames.tooltipBg;
  return (
    <div
      className={combinedClass}
      style={{ backgroundImage: `url(${backgroundImage})`, ...style }}
      onClick={onClick}
      data-hotspot={dataHotspot}
    >
      <span>{label}</span>
    </div>
  );
};

export default TooltipButton;


