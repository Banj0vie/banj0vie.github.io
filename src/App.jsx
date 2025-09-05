import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Valley from './router/valley.jsx';
import House from './router/house.jsx';
import GameMenu from './layouts/GameMenu';

export default function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#2F2F2F',
        padding: '0',
        margin: '0'
      }}>
        <GameMenu />
        <div style={{ 
          padding: '80px 20px 20px 20px',
          marginLeft: '100px' // Space for the fixed menu
        }}>
          <Routes>
            <Route path="/" element={<Valley />} />
            <Route path="/house" element={<House />} />
            <Route path="/farm" element={<div style={{color: 'white'}}>Farm - Coming Soon!</div>} />
            <Route path="/market" element={<div style={{color: 'white'}}>Market - Coming Soon!</div>} />
            <Route path="/tavern" element={<div style={{color: 'white'}}>Tavern - Coming Soon!</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
} 