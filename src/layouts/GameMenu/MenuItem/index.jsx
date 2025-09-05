import React from 'react';
import { Link } from 'react-router-dom';
import './style.css';

export default function MenuItem({ path, icon, label, isActive }) {
  return (
    <Link
      to={path}
      className={`menu-item ${isActive ? 'active' : ''}`}
    >
      <div className="menu-icon">
        {icon.startsWith('data:') ? (
          <img src={icon} alt={label} className="menu-icon-img" />
        ) : (
          icon
        )}
      </div>
      <p className="menu-label">{label}</p>
    </Link>
  );
}
