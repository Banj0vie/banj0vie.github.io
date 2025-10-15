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
import { bnToNumber } from "../../../solana/utils/tokenUtils";

const ProfileBar = ({ isFarmMenu }) => {

  // Redux state
  const userData = useSelector((state) => state.user.userData);
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);
  const gameToken = useSelector((state) => state.balance.gameToken);
  const lockedTokens = bnToNumber(userData?.lockedTokens);

  const lockedHoney = useMemo(() => formatNumber(lockedTokens.toString()), [lockedTokens]);
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
