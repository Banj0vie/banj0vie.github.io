import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

// Reads the persisted state for whether the mayor's market-intro letter has been read,
// whether the user has actually visited the market (which stops the intro pulse), and
// whether the bank-intro letter was just folded (triggers a follow-up pulse).
const getMarketIntroState = () => {
  let read = [];
  try { read = JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]'); } catch (_) {}
  return {
    introRead: Array.isArray(read) && read.includes('q_mayor_market_intro'),
    marketVisited: localStorage.getItem('sandbox_mayor_market_visited') === 'true',
    bankPulse: localStorage.getItem('sandbox_market_pulse_bank') === 'true',
    dockLetterRead: localStorage.getItem('sandbox_dock_letter_read') === 'true',
    dockVisited: localStorage.getItem('sandbox_beejamin_dock_visited') === 'true',
  };
};

const GameMenu = () => {
  const location = useLocation();
  const [tutState, setTutState] = useState(getTutState);
  const [marketIntro, setMarketIntro] = useState(getMarketIntroState);
  const [isTavernUnlocked] = useState(false);

  useEffect(() => {
    const update = () => setTutState(getTutState());
    const updateMarket = () => setMarketIntro(getMarketIntroState());
    window.addEventListener('tutorialStepChanged', update);
    window.addEventListener('tutPageChanged', update);
    window.addEventListener('tutMarketPageChanged', update);
    window.addEventListener('questStateChanged', updateMarket);
    return () => {
      window.removeEventListener('tutorialStepChanged', update);
      window.removeEventListener('tutPageChanged', update);
      window.removeEventListener('tutMarketPageChanged', update);
      window.removeEventListener('questStateChanged', updateMarket);
    };
  }, []);

  // Show the market icon once the mayor's letter has been read. Pulse it until the user
  // has actually clicked through to the market for the first time, OR re-pulse when the
  // bank-intro letter has just been folded (cleared on next market visit).
  const showMarket = marketIntro.introRead;
  const pulseMarket = (marketIntro.introRead && !marketIntro.marketVisited) || marketIntro.bankPulse;
  const showDock = marketIntro.dockLetterRead;
  const pulseDock = marketIntro.dockLetterRead && !marketIntro.dockVisited;

  // Render via portal directly into document.body so the nav escapes any parent stacking
  // context (specifically .panzoom-root, which is position:fixed and creates one). This way
  // .game-menu's z-index 600 is at the App root level — above any global overlays (like the
  // night-time multiply tint) that sit at lower z-indices in the root context.
  const nav = (
    <nav className="game-menu">
      <div style={{marginBottom: 120}}></div>
      <div style={{marginLeft: '-20px'}}>
      {MENU_ITEMS.filter(item => (item.path !== '/market' || showMarket) && (item.path !== '/house' || showDock) && item.path !== '/valley').map((item) => {
        const isActive = location.pathname === item.path;
        const isTavernItem = item.path === '/tavern';
        const isMarketItem = item.path === '/market';
        const isDockItem = item.path === '/house';
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
            highlight={(isMarketItem && pulseMarket) || (isDockItem && pulseDock)}
            onClickOverride={tavernOverride}
            noHover={tutState.step < 32}
          />
        );
      })}
      </div>
    </nav>
  );
  return typeof document !== 'undefined' ? createPortal(nav, document.body) : nav;
}

export default GameMenu;
