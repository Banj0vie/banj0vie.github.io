import React, { useState, useEffect } from "react";
import "./style.css";
import WalletButton from "../../../../components/buttons/WalletButton";
import WalletDialog from "../../../../containers/WalletDialog";
import { useWeb3 } from "../../../../contexts/Web3Context";

const ProfileView = () => {
  const [isWalletDlg, setIsWalletDlg] = useState(false);
  const [username, setUsername] = useState("");
  const { contractService, account } = useWeb3();

  useEffect(() => {
    const loadUsername = async () => {
      if (contractService && account) {
        try {
          const playerStore = contractService.getContract('PLAYER_STORE');
          const profileUsername = await playerStore.usernameOf(account);
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
