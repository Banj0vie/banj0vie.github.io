import React, { useState, useEffect } from "react";
import "./style.css";
import WalletButton from "../../../../components/buttons/WalletButton";
import WalletDialog from "../../../../containers/WalletDialog";
import { useAgwEthersAndService } from "../../../../hooks/useAgwEthersAndService";

const ProfileView = () => {
  const [isWalletDlg, setIsWalletDlg] = useState(false);
  const [username, setUsername] = useState("");
  const { contractService, account } = useAgwEthersAndService();

  useEffect(() => {
    const loadUsername = async () => {
      if (contractService && account) {
        try {
          const username = contractService.getUsername(account);
          const profileUsername = await username;
          setUsername(profileUsername || "Player");
        } catch (error) {
          console.error('Failed to load username:', error);
          setUsername("Player");
        }
      }
    };

    loadUsername();
  }, [contractService, account]);

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
