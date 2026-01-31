import React, { useMemo, useState } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import ProfileView from "./ProfileView";
import { formatNumber } from "../../../utils/basic";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";
import { useSelector } from "react-redux";
import { selectBalanceRefreshing } from "../../../solana/store/slices/balanceSlice";
import { useProdMint } from "../../../hooks/useProdMint";
// Removed bnToNumber; using plain parsing based on 1e6 decimals for locked tokens

const ProfileBar = ({ isFarmMenu }) => {

  // Redux state
  const userData = useSelector((state) => state.user.userData);
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);
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
          {/* <ProfileButton
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
          /> */}
        </div>
        <div className="resource-badge" key={balanceKey}>
          <ProfileButton
            icon={
              <img
                alt="Locked Honey Balance"
                src="/images/profile_bar/locked_balance_icon.png"
              />
            }
            text={isBalanceRefreshing ? "••••••" : lockedHoney}
            title="Locked Honey Balance"
            className={isBalanceRefreshing ? "balance-loading" : ""}
            bg="/images/profile_bar/profile_badge_bg.png"
          />
          <ProfileButton
            icon={<img alt="Honey Balance" src="/images/profile_bar/unlocked_balance_icon.png" />}
            text={isBalanceRefreshing ? "••••••" : honeyBalance}
            title="Honey Balance"
            className={isBalanceRefreshing ? "balance-loading" : ""}
            bg="/images/profile_bar/profile_badge_bg.png"
          />
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
    </div>
  );
};

export default ProfileBar;
