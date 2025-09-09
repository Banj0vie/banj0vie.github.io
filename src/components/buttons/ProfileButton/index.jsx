import React from 'react';
import './style.css';
import { profileAssets } from '../../../assets/images/baseimages';

const ProfileButton = ({ icon, text, title, ariaLabel, style, bg }) => {
  const backgroundUrl = bg || profileAssets.buttonBg;
  const className = `profile-btn${text ? ' with-text' : ' only-icon'}`;
  return (
    <div
      className={className}
      title={title}
      aria-label={ariaLabel || title}
      role="button"
      tabIndex={0}
      style={bg ? { '--profile-btn-bg': `url(${backgroundUrl})`, ...style } : style}
    >
      {icon ? <span className="pb-icon" aria-hidden>{icon}</span> : null}
      {text ? <span className="pb-text">{text}</span> : null}
    </div>
  );
};

export default ProfileButton;


