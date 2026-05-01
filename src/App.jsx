import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { useSolanaWallet } from "./hooks/useSolanaWallet";
import { NotificationProvider } from "./contexts/NotificationContext";
import LoadingPage from "./layouts/LoadingPage";
import Market from "./router/market.jsx";
import {
  baseFrames,
  buttonFrames,
  checkboxFrames,
  dialogFrames,
  profileAssets,
  sliderImages,
} from "./constants/_baseimages.js";
import Farm from "./router/farm.jsx";
import House from "./router/house.jsx";
import Forest from "./router/forest.jsx";
import Mine from "./router/mine.jsx";
import AnimalFarm from "./router/animal.jsx";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { FINAL_RPC_ENDPOINT } from './solana/constants/programId';
import Tavern from "./router/tavern.jsx";
import Valley from "./router/valley.jsx";
import ProfileBar from "./layouts/GameMenu/ProfileBar";
import wallets from "./config/solanaWallet";
import store from "./solana/store";
import { BG_COLORS } from "./constants/background_colors";
import BackgroundMusic from "./components/audio/BackgroundMusic";
import Jukebox from "./components/Jukebox";
import PlayerPullNotification from "./components/PlayerPullNotification";
import SkyOverlay from "./components/SkyOverlay";
import { useCloudSync } from "./hooks/useCloudSync";

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const AppContent = () => {
  const location = useLocation();
  const [isFarmMenu, setIsFarmMenu] = useState(false);
  useSolanaWallet(); // Initialize sandbox profile data
  useCloudSync(); // Hydrate localStorage from Supabase + push changes back
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const prevPathRef = React.useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current === location.pathname) return;
    prevPathRef.current = location.pathname;
    setIsRouteLoading(true);
    const t = setTimeout(() => setIsRouteLoading(false), 900);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Get background color based on current route
  const backgroundColor = useMemo(() => {
    const path = location.pathname;
    let colorKey;
    
    if (path === '/house') {
      colorKey = 'BLUE';
    } else if (path === '/farm') {
      colorKey = 'GREEN';
    } else if (path === '/market') {
      colorKey = 'YELLOW';
    } else if (path === '/tavern') {
      colorKey = 'RED';
    } else {
      // Default to blue for other routes
      colorKey = 'BLUE';
    }
    
    const colors = BG_COLORS[colorKey];
    return `linear-gradient(135deg, ${colors.from}, ${colors.to})`;
  }, [location.pathname]);

  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
       setIsInitialLoad(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);
  if (isInitialLoad) {
    return <LoadingPage />;
  }

  return (
      <div
        style={{
          minHeight: "100vh",
          background: backgroundColor,
          padding: "0",
          margin: "0",
          position: "relative",
        }}
      >
        <SkyOverlay />
        {isRouteLoading && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '14px',
          }}>
            <img src="/images/loading/loading.png" alt="" style={{ width: 120, height: 120, objectFit: 'contain', imageRendering: 'pixelated' }} />
            <div style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', fontSize: 22, color: '#fff', textShadow: '2px 2px 0 #000', letterSpacing: 2 }}>Loading...</div>
          </div>
        )}
          {/* Header */}
          <div className="game-menu">
            <ProfileBar isFarmMenu={isFarmMenu} />
          </div>
        <div
          style={{
            padding: "80px 20px 20px 20px",
            marginLeft: "0px",
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/farm" replace />} />
            <Route path="/house" element={<House />} />
            <Route path="/market" element={<Market />} />
            <Route path="/farm" element={<Farm isFarmMenu={isFarmMenu} setIsFarmMenu={setIsFarmMenu} />} />
            <Route path="/tavern" element={<Tavern />} />
            <Route path="/valley" element={<Valley />} />
            <Route path="/forest" element={<Forest />} />
            <Route path="/mine" element={<Mine />} />
            <Route path="/animal" element={<AnimalFarm />} />
          </Routes>
        </div>
      </div>
    );
};

const App = () => {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--profile-btn-bg",
      `url(${profileAssets.buttonBg})`
    );
    document.documentElement.style.setProperty(
      "--primary-bg",
      `url(${baseFrames.primaryBg})`
    );
    document.documentElement.style.setProperty(
      "--secondary-bg",
      `url(${baseFrames.secondaryBg})`
    );
    document.documentElement.style.setProperty(
      "--tetiary-bg",
      `url(${baseFrames.tetiaryBg})`
    );
    document.documentElement.style.setProperty(
      "--crop-circle-bg",
      `url(${baseFrames.cropCircleBg})`
    );
    document.documentElement.style.setProperty(
      "--dialog-edge-bg",
      `url(${dialogFrames.modalBgTopLeft}), url(${dialogFrames.modalBgTopRight}), url(${dialogFrames.modalBgBottomLeft}), url(${dialogFrames.modalBgBottomRight})`
    );
    document.documentElement.style.setProperty(
      "--dialog-close",
      `url(${dialogFrames.modalClose})`
    );
    document.documentElement.style.setProperty(
      "--dialog-bg",
      `url(${dialogFrames.modalBgLeft}), url(${dialogFrames.modalBgRight}), url(${dialogFrames.modalBgTop}), url(${dialogFrames.modalBgBottom})`
    );
    document.documentElement.style.setProperty(
      "--input-bg",
      `url(${baseFrames.inputBg})`
    );
    document.documentElement.style.setProperty(
      "--base-button-bg",
      `url(${buttonFrames.baseButtonBg})`
    );
    document.documentElement.style.setProperty(
      "--scroll-button-bg",
      `url(${buttonFrames.scrollButtonBg})`
    );
    document.documentElement.style.setProperty(
      "--base-button-active-bg",
      `url(${buttonFrames.baseButtonActiveBg})`
    );
    document.documentElement.style.setProperty(
      "--red-down-button",
      `url(${buttonFrames.redDown})`
    );
    document.documentElement.style.setProperty(
      "--green-down-button",
      `url(${buttonFrames.greenDown})`
    );
    document.documentElement.style.setProperty(
      "--slider-bg",
      `url(${sliderImages.sliderBg})`
    );
    document.documentElement.style.setProperty(
      "--checkbox-checked",
      `url(${checkboxFrames.checked})`
    );
    document.documentElement.style.setProperty(
      "--checkbox-unchecked",
      `url(${checkboxFrames.unchecked})`
    );
  }, []);

  const endpoint = useMemo(() => FINAL_RPC_ENDPOINT, []);

  return (
    <Provider store={store}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <NotificationProvider>
              <Router basename={process.env.PUBLIC_URL}>
                <style>{`img { color: transparent; }`}</style>
                

                
                <BackgroundMusic />
                <Jukebox />
                <PlayerPullNotification />
                <AppContent />
                {/* Subtle vignette — shadows bleeding in from all four edges */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 850,
                    boxShadow: 'inset 0 0 140px 20px rgba(0,0,0,0.55)',
                  }}
                />
              </Router>
            </NotificationProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </Provider>
  );
};

export default App;
