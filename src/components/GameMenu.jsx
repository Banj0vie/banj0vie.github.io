import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function GameMenu() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '🏠', label: 'House' },
    { path: '/farm', icon: '🎃', label: 'Farm' },
    { path: '/market', icon: '🏪', label: 'Market' },
    { path: '/tavern', icon: '🍺', label: 'Tavern' },
    { path: '/valley', icon: '🏰', label: 'Valley' }
  ];

  const menuStyle = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '12px'
  };

  const menuItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#8B4513',
    padding: '8px',
    backgroundColor: '#DEB887',
    border: '2px solid #8B4513',
    borderRadius: '4px',
    minWidth: '60px',
    transition: 'all 0.2s ease',
    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  };

  const activeMenuItemStyle = {
    ...menuItemStyle,
    backgroundColor: '#D2691E',
    color: '#FFF',
    transform: 'scale(1.05)'
  };

  const iconStyle = {
    fontSize: '20px',
    marginBottom: '4px',
    imageRendering: 'pixelated'
  };

  const labelStyle = {
    fontWeight: 'bold',
    textAlign: 'center'
  };

  return (
    <nav style={menuStyle}>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={isActive ? activeMenuItemStyle : menuItemStyle}
          >
            <div style={iconStyle}>{item.icon}</div>
            <div style={labelStyle}>{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );
}
