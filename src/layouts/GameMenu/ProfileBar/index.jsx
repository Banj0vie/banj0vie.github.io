import React, { useMemo, useState } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import { profileAssets } from "../../../constants/_baseimages";
import ProfileView from "./ProfileView";
import { formatNumber } from "../../../utils/basic";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";
import { useSelector } from "react-redux";
// Removed bnToNumber; using plain parsing based on 1e6 decimals for locked tokens

const ProfileBar = ({ isFarmMenu }) => {

  // Redux state
  const userData = useSelector((state) => state.user.userData);
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);
  const gameToken = useSelector((state) => state.balance.gameToken);
  // locked_tokens stored as string (lamports with 1e6 decimals). Convert to UI units.
  const lockedTokensUi = useMemo(() => {
    const raw = userData?.locked_tokens ?? '0';
    const n = parseFloat(raw);
    if (!isFinite(n)) return '0';
    return (n / 1e6).toString();
  }, [userData?.locked_tokens]);

  const lockedHoney = useMemo(() => formatNumber(lockedTokensUi), [lockedTokensUi]);
  const honeyBalance = useMemo(() => formatNumber((gameToken || "0").toString()), [gameToken]);

  return (
    <div className="profile-bar" style={{ display: isFarmMenu ? 'none' : 'flex' }}>
      <img
        alt="Profile"
        src={profileAssets.profileBg}
        className="profile-background"
      />
      <Avatar />
      <ProfileView username={userData?.name} />
      <ProfileButton
        icon={<img alt="Settings" src={profileAssets.btnSettings} />}
        title="Settings"
        onClick={() => setIsSettingsDialog(true)}
      />
      <ProfileButton
        icon={<img alt="Inventory" src={profileAssets.btnInventory} />}
        title="Inventory"
        onClick={() => setIsInventoryDialog(true)}
      />
      <div className="resource-badge">
        <ProfileButton
          icon={
            <img
              alt="Locked Honey Balance"
              src={profileAssets.btnLockedHoney}
            />
          }
          text={lockedHoney}
          title="Locked Honey Balance"
        />
        <ProfileButton
          icon={<img alt="Honey Balance" src={profileAssets.btnHoney} />}
          text={honeyBalance}
          title="Honey Balance"
        />
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
