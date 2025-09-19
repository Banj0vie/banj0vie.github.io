import React, { useState } from "react";
import "./style.css";
import WalletButton from "../../../../components/buttons/WalletButton";
import WalletDialog from "../../../../containers/WalletDialog";
import { useProfile } from "../../../../contexts/ProfileContext";

const ProfileView = () => {
  const [isWalletDlg, setIsWalletDlg] = useState(false);
  const { profileData } = useProfile();
  
  const username = profileData?.username || "";

  return (
    <div className="name-pill">
      <div>{username}</div>
      <WalletButton
        onClick={() => {
          setIsWalletDlg(true);
        }}
      />
      {isWalletDlg && <WalletDialog onClose={()=>setIsWalletDlg(false)}></WalletDialog>}
    </div>
  );
};

export default ProfileView;
