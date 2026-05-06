import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
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
import AnimalFarm from "./router/animal.jsx";
import Valley from "./router/valley.jsx";
import ProfileBar from "./layouts/GameMenu/ProfileBar";
import { store } from "./store";
import { BG_COLORS } from "./constants/background_colors";
import BackgroundMusic from "./components/audio/BackgroundMusic";
import Jukebox from "./components/Jukebox";
import PlayerPullNotification from "./components/PlayerPullNotification";
import HarvestCardReveal from "./components/HarvestCardReveal";
import SkyOverlay from "./components/SkyOverlay";
import IrisTransition from "./components/IrisTransition";
import RouteCloudTransition from "./components/RouteCloudTransition";
import { useCloudSync } from "./hooks/useCloudSync";

const AppContent = () => {
  const location = useLocation();
  const [isFarmMenu, setIsFarmMenu] = useState(false);
  useCloudSync(); // Hydrate localStorage from Supabase + push changes back
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
        <RouteCloudTransition />
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
            <Route path="/valley" element={<Valley />} />
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

  return (
    <Provider store={store}>
      <NotificationProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <style>{`img { color: transparent; }`}</style>
          <BackgroundMusic />
          <Jukebox />
          <PlayerPullNotification />
          <HarvestCardReveal />
          <AppContent />
          <IrisTransition />
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
    </Provider>
  );
};

export default App;
