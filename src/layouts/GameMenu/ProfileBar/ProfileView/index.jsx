import React, { useState } from "react";
import "./style.css";
import WalletButton from "../../../../components/buttons/WalletButton";
import WalletDialog from "../../../../containers/Menu_Wallet";

const ProfileView = ({ username }) => {
  const [isWalletDlg, setIsWalletDlg] = useState(false);

  return (
    <div className="name-pill">
      <img src="/images/profile_bar/profile_bg.png" alt="name pill bg" className="name-pill-bg"></img>
      <div className="name-pill-content">
        <div>{username}</div>
        <WalletButton
          onClick={() => {
            setIsWalletDlg(true);
          }}
        />
        {isWalletDlg && <WalletDialog onClose={() => setIsWalletDlg(false)}></WalletDialog>}
      </div>
    </div>
  );
};

export default ProfileView;
