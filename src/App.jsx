import React, { useEffect, useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
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
import Forest from "./router/forest.jsx";
import Mine from "./router/mine.jsx";
import AnimalFarm from "./router/animal.jsx";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { FINAL_RPC_ENDPOINT } from './solana/constants/programId';
import { getClusterDisplayName } from './solana/utils/clusterUtils';
import Tavern from "./router/tavern.jsx";
import Valley from "./router/valley.jsx";
import ProfileBar from "./layouts/GameMenu/ProfileBar";
import wallets from "./config/solanaWallet";
import store from "./solana/store";
import { BG_COLORS } from "./constants/background_colors";
import BackgroundMusic from "./components/audio/BackgroundMusic";
import { db, auth, googleProvider } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
  }

  return <AuthPage />;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "Players", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || !userDoc.data().username) {
          setNeedsUsername(true);
        } else {
          const data = userDoc.data();
          const localUid = localStorage.getItem('sandbox_uid');
          
          // Only pull from cloud if this is a fresh login, so we don't overwrite on page refresh
          if (localUid !== currentUser.uid) {
            localStorage.setItem('sandbox_loot', data.sandbox_loot || '{}');
            localStorage.setItem('sandbox_produce', data.sandbox_produce || '{}');
            
            if (data.sandbox_honey) {
              localStorage.setItem('sandbox_honey', data.sandbox_honey);
              window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: data.sandbox_honey }));
            } else {
              localStorage.setItem('sandbox_honey', '0');
            }
            if (data.sandbox_locked_honey) {
              localStorage.setItem('sandbox_locked_honey', data.sandbox_locked_honey);
              window.dispatchEvent(new CustomEvent('sandboxLockedHoneyChanged', { detail: data.sandbox_locked_honey }));
            } else {
              localStorage.setItem('sandbox_locked_honey', '0');
            }
            if (data.sandbox_dock_unlocked) {
              localStorage.setItem('sandbox_dock_unlocked', data.sandbox_dock_unlocked);
            } else {
              localStorage.setItem('sandbox_dock_unlocked', 'false');
            }
            localStorage.setItem('sandbox_uid', currentUser.uid);
          }
          setNeedsUsername(false);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setNeedsUsername(false);
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    if (!usernameInput.trim()) return;
    setIsCreatingAccount(true);
    setAuthError("");
    try {
      // Update Google profile so the game uses the chosen username everywhere
      await updateProfile(user, { displayName: usernameInput.trim() });

      const userDocRef = doc(db, "Players", user.uid);
      await setDoc(userDocRef, {
        username: usernameInput.trim(),
        name: usernameInput.trim(),
        email: user.email,
        photo: user.photoURL,
        honey: 5000,
        sandbox_honey: "5000",
        level: 1,
        createdAt: new Date(),
      });

      // Force 0 values across the entire inventory system
      localStorage.setItem('sandbox_honey', '5000');
      localStorage.setItem('sandbox_locked_honey', '0');
      localStorage.setItem('sandbox_dock_unlocked', 'false');
      localStorage.setItem('sandbox_loot', '{}');
      localStorage.setItem('sandbox_produce', '{}');
      localStorage.setItem('sandbox_uid', user.uid);
      localStorage.setItem('sandbox_water_state', '{}');
      localStorage.setItem('sandbox_plot_prep', '{}');
      localStorage.setItem('sandbox_scarecrows', '{}');
      localStorage.setItem('sandbox_ladybugs', '{}');
      localStorage.setItem('sandbox_sprinklers', '{}');
      localStorage.setItem('sandbox_umbrellas', '{}');
      const emptyCrops = new Array(30).fill(null).map(() => ({ id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 }));
      localStorage.setItem('sandbox_crops', JSON.stringify(emptyCrops));
      
      setNeedsUsername(false);
    } catch (error) {
      console.error("Error creating account:", error);
      setAuthError(error.message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const loginWithGoogle = async () => {
    setAuthError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in as:", user.displayName);
    } catch (error) {
      console.error("Google Login Error:", error);
      setAuthError(error.message);
    }
  };

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
  const clusterDisplayName = getClusterDisplayName();

  const renderContent = () => {
    if (isCheckingAuth) {
      return <div style={{ minHeight: "100vh", background: "#12121a", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>Loading...</div>;
    }
    
    if (!user) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1b1f3b, #12121a)",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "rgba(0, 0, 0, 0.6)",
              borderRadius: "12px",
              padding: "24px",
              color: "#fff",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            }}
          >
            <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", textAlign: "center", color: "#fff", fontFamily: "monospace" }}>
              Player Login
            </h2>
            <p style={{ margin: "0 0 16px 0", opacity: 0.75, fontSize: "14px", textAlign: "center" }}>
              Welcome back to Honey Valleys.
            </p>
            {authError && (
              <div style={{ color: "#ff9c9c", marginBottom: "12px", fontSize: "14px", textAlign: "center" }}>
                {authError}
              </div>
            )}
            <button
              onClick={loginWithGoogle}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#4285F4",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" style={{ width: "24px", height: "24px", background: "white", borderRadius: "50%", padding: "2px" }} />
              Sign in with Google
            </button>
          </div>
        </div>
      );
    }

    if (user && needsUsername) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1b1f3b, #12121a)",
            padding: "24px",
          }}
        >
          <form
            onSubmit={handleCreateAccount}
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "rgba(0, 0, 0, 0.6)",
              borderRadius: "12px",
              padding: "24px",
              color: "#fff",
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
            }}
          >
            <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", textAlign: "center", color: "#00ff41", fontFamily: "monospace" }}>
              Create Account
            </h2>
            <p style={{ margin: "0 0 16px 0", opacity: 0.75, fontSize: "14px", textAlign: "center" }}>
              Welcome! Please choose a username to get started.
            </p>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Username"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                marginBottom: "12px",
                boxSizing: "border-box"
              }}
            />
            {authError && (
              <div style={{ color: "#ff9c9c", marginBottom: "12px", fontSize: "14px", textAlign: "center" }}>
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={isCreatingAccount}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#00ff41", color: "#000", fontWeight: "bold", cursor: "pointer", fontSize: "16px", marginBottom: "15px", opacity: isCreatingAccount ? 0.7 : 1 }}
            >
              {isCreatingAccount ? "Creating..." : "Start Farming"}
            </button>
          </form>
        </div>
      );
    }

    return <AppContent />;
  };

  return (
    <Provider store={store}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <NotificationProvider>
              <Router basename={process.env.PUBLIC_URL}>
                <BackgroundMusic />
                
                <div style={{
                  position: 'fixed',
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
                
                {user && (
                  <button 
                    onClick={async () => {
                      if (user) {
                        // Save to cloud before signing out
                        await setDoc(doc(db, "Players", user.uid), {
                          sandbox_loot: localStorage.getItem('sandbox_loot') || '{}',
                          sandbox_produce: localStorage.getItem('sandbox_produce') || '{}',
                          sandbox_honey: localStorage.getItem('sandbox_honey') || '0',
                          sandbox_locked_honey: localStorage.getItem('sandbox_locked_honey') || '0',
                          sandbox_dock_unlocked: localStorage.getItem('sandbox_dock_unlocked') || 'false'
                        }, { merge: true });
                      }
                      
                      signOut(auth);
                      // Clear data on signout so next login is fresh
                      localStorage.removeItem('sandbox_loot');
                      localStorage.removeItem('sandbox_produce');
                      localStorage.removeItem('sandbox_honey');
                      localStorage.removeItem('sandbox_locked_honey');
                      localStorage.removeItem('sandbox_dock_unlocked');
                      localStorage.removeItem('sandbox_uid');
                    }}
                    style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 10000, padding: '10px 20px', backgroundColor: '#ff4444', color: '#fff', border: '2px solid #fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}
                  >
                    SIGN OUT
                  </button>
                )}
                
                {renderContent()}
              </Router>
            </NotificationProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </Provider>
  );
};

export default App;
