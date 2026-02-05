import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Provider } from 'react-redux';
import { useSolanaWallet } from "./hooks/useSolanaWallet";
import { NotificationProvider } from "./contexts/NotificationContext";
import AuthPage from "./layouts/AuthPage";
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
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { FINAL_RPC_ENDPOINT, getCurrentCluster, getCurrentClusterConfig } from './solana/constants/programId';
import { getClusterWarning, getClusterDisplayName } from './solana/utils/clusterUtils';
import Tavern from "./router/tavern.jsx";
import Valley from "./router/valley.jsx";
import ProfileBar from "./layouts/GameMenu/ProfileBar";
import wallets from "./config/solanaWallet";
import store from "./solana/store";
import { BG_COLORS } from "./constants/background_colors";
import BackgroundMusic from "./components/audio/BackgroundMusic";

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const AppContent = () => {
  const location = useLocation();
  const [isFarmMenu, setIsFarmMenu] = useState(false);
  const { isConnected, account, hasProfile } = useSolanaWallet();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [, setHasCheckedInitialState] = useState(false);

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
        setHasCheckedInitialState(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  if (isInitialLoad) {
    return <LoadingPage />;
  }

  if (!isConnected || !account) {
    return <AuthPage />;
  }

  if (isConnected && account && hasProfile === null) {
    return <AuthPage />;
  }

  if (isConnected && account && hasProfile === false) {
    return <AuthPage />;
  }

  if (isConnected && account && hasProfile) {
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
        
          {/* Header */}
          <div className="game-menu">
            <ProfileBar isFarmMenu={isFarmMenu} />
          </div>
        <div
          style={{
          padding: "80px 20px 20px 20px",
            marginLeft: "100px",
          }}
        >
          <Routes>
            <Route path="/" element={<Market />} />
            <Route path="/house" element={<House />} />
            <Route path="/market" element={<Market />} />
            <Route path="/farm" element={<Farm isFarmMenu={isFarmMenu} setIsFarmMenu={setIsFarmMenu} />} />
            <Route path="/tavern" element={<Tavern />} />
            <Route path="/valley" element={<Valley />} />
          </Routes>
        </div>
      </div>
    );
  }

  return <AuthPage />;
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
  
  const currentCluster = getCurrentCluster();
  const clusterConfig = getCurrentClusterConfig();
  const clusterWarning = getClusterWarning();
  const clusterDisplayName = getClusterDisplayName();

  return (
    <Provider store={store}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <NotificationProvider>
              <Router>
                <BackgroundMusic />
                {clusterWarning && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#ff6b6b',
                    color: 'white',
                    padding: '8px 16px',
                    textAlign: 'center',
                    zIndex: 9999,
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {clusterWarning}
                  </div>
                )}
                
                <div style={{
                  position: 'fixed',
                  top: clusterWarning ? '40px' : '0',
                  right: '20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  zIndex: 9998
                }}>
                  Network: {clusterDisplayName}
                </div>
                
                <AppContent />
              </Router>
            </NotificationProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </Provider>
  );
};

export default App;
