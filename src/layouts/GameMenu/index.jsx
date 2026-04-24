import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../../constants/app_menu';
import MenuItem from './MenuItem';
import './style.css';

const getTutState = () => ({
  step: parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10),
  page: parseInt(localStorage.getItem('sandbox_tut_page') || '1', 10),
  marketPage: parseInt(localStorage.getItem('sandbox_tut_market_page') || '0', 10),
  marketStarted: localStorage.getItem('sandbox_tut_market') === 'true',
});

const GameMenu = () => {
  const location = useLocation();
  const [tutState, setTutState] = useState(getTutState);
  const [isTavernUnlocked] = useState(false);

  useEffect(() => {
    const update = () => setTutState(getTutState());
    window.addEventListener('tutorialStepChanged', update);
    window.addEventListener('tutPageChanged', update);
    window.addEventListener('tutMarketPageChanged', update);
    return () => {
      window.removeEventListener('tutorialStepChanged', update);
      window.removeEventListener('tutPageChanged', update);
      window.removeEventListener('tutMarketPageChanged', update);
    };
  }, []);

  return (
    <nav className="game-menu">
      <div style={{marginBottom: 120}}></div>
      <div style={{marginLeft: '-20px'}}>
      {MENU_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        const isTavernItem = item.path === '/tavern';
        const tavernOverride = isTavernItem && !isTavernUnlocked
          ? () => window.dispatchEvent(new CustomEvent('tavernNavClicked'))
          : null;
        return (
          <MenuItem
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            labelIcon={item.labelIcon}
            iconScale={item.iconScale}
            isActive={isActive}
            highlight={false}
            onClickOverride={tavernOverride}
          />
        );
      })}
      </div>
    </nav>
  );
}

export default GameMenu;
