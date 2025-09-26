import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAgwEthersAndService } from "./hooks/useContractBase";
import { GameStateProvider } from "./contexts/GameStateContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ProfileProvider } from "./contexts/ProfileContext";
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
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { AppDataProvider } from "./context/AppDataContext";
import { abstractTestnet } from "viem/chains";
import Tavern from "./router/tavern.jsx";
import Valley from "./router/valley.jsx";
import ProfileBar from "./layouts/GameMenu/ProfileBar";

const AppContent = () => {
  const [isFarmMenu, setIsFarmMenu] = useState(false);
  const { isConnected, account, hasProfile } = useAgwEthersAndService();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [, setHasCheckedInitialState] = useState(false);

  useEffect(() => {
    // Initial app load: check wallet connection and profile status
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        setHasCheckedInitialState(true);
      }, 3000); // Initial loading time to check wallet/profile (3 seconds)

      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Show loading page only during initial app load
  if (isInitialLoad) {
    return <LoadingPage />;
  }

  // After initial load, show appropriate page based on connection and profile status
  if (!isConnected || !account) {
    return <AuthPage />;
  }

  // If connected but profile status is unknown, show connect wallet page with "Connecting..." state
  if (isConnected && account && hasProfile === null) {
    return <AuthPage />;
  }

  // If connected but no profile, show create profile page
  if (isConnected && account && hasProfile === false) {
    return <AuthPage />;
  }

  // If connected and has profile, show game
  if (isConnected && account && hasProfile) {
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
        
          {/* Header */}
          <div className="game-menu">
            <ProfileBar isFarmMenu={isFarmMenu} />
          </div>
        <div
          style={{
          padding: "80px 20px 20px 20px",
            marginLeft: "100px", // Space for the fixed menu
          }}
        >
          <Routes>
            <Route path="/" element={<Market />} />
            <Route path="/house" element={<House />} />
            <Route path="/market" element={<Market />} />
            <Route path="/farm" element={<Farm isFarmMenu={isFarmMenu} setIsFarmMenu={setIsFarmMenu} />} />
            <Route path="/tavern" element={<Tavern />} />
            <Route path="/valley" element={<Valley />} />
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
  }

  // Fallback: should not reach here, but just in case
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

  return (
    <AbstractWalletProvider chain={abstractTestnet}>
        <GameStateProvider>
          <NotificationProvider>
            <ProfileProvider>
              <AppDataProvider>
                <Router>
                  <AppContent />
                </Router>
              </AppDataProvider>
            </ProfileProvider>
          </NotificationProvider>
        </GameStateProvider>
    </AbstractWalletProvider>
  );
};

export default App;
