import React from 'react';
import { useLocation } from 'react-router-dom';
import { menuIcons } from '../../assets/images/baseimages';
import MenuItem from './MenuItem';
import ProfileBar from './ProfileBar';
import './style.css';

const GameMenu = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/house', icon: menuIcons.house, label: 'House' },
    { path: '/farm', icon: menuIcons.farm, label: 'Farm' },
    { path: '/market', icon: menuIcons.market, label: 'Market' },
    { path: '/tavern', icon: menuIcons.tavern, label: 'Tavern' },
    { path: '/', icon: menuIcons.valley, label: 'Valley' },
  ];

  return (
    <nav className="game-menu">
      <ProfileBar />
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <MenuItem
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            isActive={isActive}
          />
        );
      })}
    </nav>
  );
}

export default GameMenu;
