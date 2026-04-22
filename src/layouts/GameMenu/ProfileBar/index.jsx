import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import ProfileView from "./ProfileView";
import { formatNumber } from "../../../utils/basic";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";
import Shop from "../../../containers/Shop";
import AchievementsDialog from "../../../containers/AchievementsDialog";
import { useSelector } from "react-redux";
import { selectBalanceRefreshing } from "../../../solana/store/slices/balanceSlice";
import { useProdMint } from "../../../hooks/useProdMint";
// Removed bnToNumber; using plain parsing based on 1e9 decimals for locked tokens

const ProfileBar = ({ isFarmMenu }) => {
  // Redux state
  const userData = useSelector((state) => state.user.userData);
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [shopInitialTab, setShopInitialTab] = useState(0);
  const [hasUnreadMail, setHasUnreadMail] = useState(false);
  const [hasReadyQuests, setHasReadyQuests] = useState(false);
  const [gems, setGems] = useState(() => parseInt(localStorage.getItem('sandbox_gems') || '0', 10));

  const BG_GRADIENTS = {
    bg_default: 'linear-gradient(135deg, #2d1a0e, #4a2c10)',
    bg_red:     'linear-gradient(135deg, #5a0a0a, #c0392b)',
    bg_orange:  'linear-gradient(135deg, #7a3200, #e67e22)',
    bg_yellow:  'linear-gradient(135deg, #6a5500, #f1c40f)',
    bg_green:   'linear-gradient(135deg, #0a3a1a, #27ae60)',
    bg_blue:    'linear-gradient(135deg, #0a1a4a, #2980b9)',
    bg_purple:  'linear-gradient(135deg, #2a0a4a, #8e44ad)',
    bg_night:   'linear-gradient(135deg, #050510, #1a1a3a)',
    bg_sunset:  'linear-gradient(135deg, #6a0a2a, #ff6b35)',
    bg_cosmic:  'linear-gradient(135deg, #0a0020, #7c3aed)',
  };

  const getProfileBg = () => {
    const id = localStorage.getItem('sandbox_profile_bg') || 'bg_default';
    return BG_GRADIENTS[id] || BG_GRADIENTS.bg_default;
  };

  const [profileBg, setProfileBg] = useState(getProfileBg);

  useEffect(() => {
    const handler = () => setGems(parseInt(localStorage.getItem('sandbox_gems') || '0', 10));
    window.addEventListener('sandboxGemsChanged', handler);
    return () => window.removeEventListener('sandboxGemsChanged', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setProfileBg(e.detail || BG_GRADIENTS.bg_default);
    window.addEventListener('profileBgUpdated', handler);
    return () => window.removeEventListener('profileBgUpdated', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setHasUnreadMail(e.detail);
    window.addEventListener('mailUnreadChanged', handler);
    return () => window.removeEventListener('mailUnreadChanged', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setHasReadyQuests(e.detail);
    window.addEventListener('mailReadyChanged', handler);
    return () => window.removeEventListener('mailReadyChanged', handler);
  }, []);
  const { prodMint, loading: prodMintLoading } = useProdMint();
  const gameToken = useSelector((state) => state.balance.gameToken);
  const stakedBalance = useSelector((state) => state.balance.stakedBalance);
  const isBalanceRefreshing = useSelector(selectBalanceRefreshing);

  // Force re-render when balance refresh completes (less aggressive)
  const balanceKey = useMemo(() => {
    return `${gameToken}-${stakedBalance}-${isBalanceRefreshing}`;
  }, [gameToken, stakedBalance, isBalanceRefreshing]);

  // Use balance slice data instead of user slice for consistency
  const lockedTokensUi = useMemo(() => {
    return stakedBalance || '0';
  }, [stakedBalance]);

  const lockedHoney = useMemo(() => {
    const formatted = formatNumber(lockedTokensUi);
    return formatted;
  }, [lockedTokensUi, stakedBalance, isBalanceRefreshing]);

  const honeyBalance = useMemo(() => {
    const formatted = formatNumber((gameToken || "0").toString());
    return formatted;
  }, [gameToken, isBalanceRefreshing]);

  return (
    <div className="profile-bar" style={{ display: isFarmMenu ? 'none' : 'flex' }}>
      <Avatar />
      <div className="profile-bar-content">
        <div className="profile-bar-content-top">
          <ProfileView username={userData?.name} />
          {/* ACHIEVEMENTS BUTTON - hidden for now, re-enable when ready
          <ProfileButton
            icon={<span style={{ fontSize: "22px", lineHeight: 1 }}>🏆</span>}
            title="Achievements"
            bg="/images/profile_bar/profile_button_bg.png"
            onClick={() => setIsAchievementsOpen(true)}
          />
          AchievementsDialog is imported from src/containers/AchievementsDialog/
          State: isAchievementsOpen / setIsAchievementsOpen (already declared in this file)
          */}
          <ProfileButton
            icon={<img alt="Settings" src="/images/profile_bar/btn_setting.png" />}
            title="Settings"
            bg="/images/profile_bar/profile_button_bg.png"
            onClick={() => setIsSettingsDialog(true)}
          />
          <ProfileButton
            icon={<img alt="Inventory" src="/images/profile_bar/btn_inventory.png" />}
            title="Inventory"
            bg="/images/profile_bar/profile_button_bg.png"
            onClick={() => setIsInventoryDialog(true)}
          />
          <ProfileButton
            icon={
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <style>{`@keyframes mailShake { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-6deg)} 80%{transform:rotate(6deg)} }`}</style>
                <img
                  alt="Mail"
                  src="/images/mail/realmail.png"
                  style={{ width: '32px', height: '32px', objectFit: 'contain', animation: hasUnreadMail ? 'mailShake 1.2s infinite ease-in-out' : 'none' }}
                />
                {hasUnreadMail
                  ? <img src="/images/mail/!.png" alt="!" className="badge-pulse" style={{ position: 'absolute', top: '-14px', right: '-14px', width: '20px', height: '20px', pointerEvents: 'none' }} draggable={false} />
                  : hasReadyQuests && <img src="/images/farming/checkmark.png" alt="✓" style={{ position: 'absolute', top: '-14px', right: '-14px', width: '20px', height: '20px', pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} draggable={false} />
                }
              </div>
            }
            title="Mail"
            bg="/images/profile_bar/profile_button_bg.png"
            onClick={() => window.dispatchEvent(new CustomEvent('openMailbox'))}
          />
          <div style={{ display: 'none' }}>
            <ProfileButton
              icon={<img alt="Test Mint" src="/images/profile_bar/btn_inventory.png" />}
              title="Test Mint"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => prodMint(0)}
              disabled={prodMintLoading}
            />
            <ProfileButton
              icon={<img alt="Test Mint" src="/images/profile_bar/btn_inventory.png" />}
              title="Test Mint"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => prodMint(1)}
              disabled={prodMintLoading}
            />
            <ProfileButton
              icon={<img alt="Test Mint" src="/images/profile_bar/btn_inventory.png" />}
              title="Test Mint"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => prodMint(2)}
              disabled={prodMintLoading}
            />
          </div>
        </div>
        <div className="resource-badge" key={balanceKey} style={{ cursor: 'pointer' }}>
          <ProfileButton
            icon={<img alt="Honey Balance" src="/images/profile_bar/hny.png" />}
            text={isBalanceRefreshing ? "••••••" : honeyBalance}
            title="Honey Balance"
            className={isBalanceRefreshing ? "balance-loading" : ""}
            bg="/images/profile_bar/profile_badge_bg.png"
          />
          <div onClick={() => { setShopInitialTab(1); setIsShopOpen(true); }}>
            <ProfileButton
              icon={<img src="/images/profile_bar/diamond.png" alt="Gems" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />}
              text={Number(gems).toLocaleString('en-US')}
              title="Gems"
              bg="/images/profile_bar/profile_badge_bg.png"
            />
          </div>
        </div>
      </div>
      {isInventoryDialog && (
        <InventoryDialog
          onClose={() => setIsInventoryDialog(false)}
        ></InventoryDialog>
      )}
      {isSettingsDialog && (
        <SettingsDialog
          onClose={() => setIsSettingsDialog(false)}
        ></SettingsDialog>
      )}
      {isShopOpen && (
        <Shop onClose={() => setIsShopOpen(false)} initialTab={shopInitialTab} />
      )}
      {isAchievementsOpen && (
        <AchievementsDialog onClose={() => setIsAchievementsOpen(false)} />
      )}
    </div>
  );
};

export default ProfileBar;
