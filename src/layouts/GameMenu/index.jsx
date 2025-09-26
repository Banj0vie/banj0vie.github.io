import React from 'react';
import { useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../../constants/app_menu';
import MenuItem from './MenuItem';
import ProfileBar from './ProfileBar';
import './style.css';

const GameMenu = () => {
  const location = useLocation();

  const menuItems = MENU_ITEMS;

  return (
    <nav className="game-menu">
      <div style={{marginBottom: 100}}></div>
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
