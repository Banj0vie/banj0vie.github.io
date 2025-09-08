import React from 'react';
import './style.css';
import Avatar from './Avatar';

const ProfileBar = () => {
  return (
    <div className="profile-bar">
      <Avatar />
      <div className="name-pill">kcat</div>
      <button className="icon-btn" aria-label="Settings" title="Settings">⚙️</button>
      <button className="icon-btn" aria-label="Inventory" title="Inventory">🎒</button>
    </div>
  );
}

export default ProfileBar;


