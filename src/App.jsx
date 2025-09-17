import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./contexts/Web3Context";
import { GameStateProvider } from "./contexts/GameStateContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import AuthPage from "./layouts/AuthPage";
// ...existing imports
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

const AppContent = () => {
  const { isConnected, account, hasProfile } = useWeb3();

  // Show AuthPage if not connected, no account, or no profile
  if (!isConnected || !account || !hasProfile) {
    return <AuthPage />;
  }

  // Show main app if connected
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#2F2F2F",
        padding: "0",
        margin: "0",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "80px 20px 20px 20px",
          marginLeft: "100px", // Space for the fixed menu
        }}
      >
        <Routes>
          <Route path="/" element={<Market />} />
          {/* <Route path="/house" element={<House />} /> */}
          <Route path="/market" element={<Market />} />
          <Route path="/farm" element={<Farm />} />
          {/* <Route
            path="/tavern"
            element={
              <div style={{ color: "white" }}>Tavern - Coming Soon!</div>
            }
          /> */}
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
    <Web3Provider>
      <GameStateProvider>
        <NotificationProvider>
          <Router>
            <AppContent />
          </Router>
        </NotificationProvider>
      </GameStateProvider>
    </Web3Provider>
  );
};

export default App;
