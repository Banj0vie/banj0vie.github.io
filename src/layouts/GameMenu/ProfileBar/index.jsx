import React from 'react';
import './style.css';
import Avatar from './Avatar';
import ProfileButton from '../../../components/buttons/ProfileButton';
import { profileAssets } from '../../../assets/images/baseimages';

const ProfileBar = () => {
  return (
    <div className="profile-bar">
      <Avatar />
      <div className="name-pill">kcat</div>
      
      <ProfileButton icon={<img alt="Settings" src={profileAssets.btnSettings} />} title="Settings" />
      <ProfileButton icon={<img alt="Inventory" src={profileAssets.btnInventory} />} title="Inventory" />
      <ProfileButton icon={<img alt="Tutorial" src={profileAssets.btnTutorial} />} title="Tutorial" />
      <div className="resource-badge">
        <ProfileButton icon={<img alt="Locked Yield Balance" src={profileAssets.btnLockedYield} />} text="7.36k" title="Locked Yield Balance" />
        <ProfileButton icon={<img alt="Yield Balance" src={profileAssets.btnYield} />} text="12.77k" title="Yield Balance" />
      </div>
    </div>
  );
}

export default ProfileBar;


