import React, { useState } from "react";
import "./style.css";
import WalletButton from "../../../../components/buttons/WalletButton";
import WalletDialog from "../../../../containers/WalletDialog";

const ProfileView = () => {
  const [isWalletDlg, setIsWalletDlg] = useState(false);
  return (
    <div className="name-pill">
      <div>kcat</div>
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
