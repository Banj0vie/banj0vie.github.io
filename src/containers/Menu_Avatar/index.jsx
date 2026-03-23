import React, { useState, useEffect } from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import NFTBox from "./NFTBox";
import { useEquipmentRegistry } from "../../hooks/useContracts";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import CardView from "../../components/boxes/CardView";
const AvatarDialog = ({ onClose }) => {
  const { account } = useSolanaWallet();
  const { getAvatars, getTokenBoostPpm } = useEquipmentRegistry();
  const [avatars, setAvatars] = useState([{isEmpty: true}, {isEmpty: true}]);
  const [totalBoost, setTotalBoost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatarData = async () => {
      try {
        setLoading(true);

        // Fetch from local sandbox memory instead of the blockchain
        const sandboxAvatars = JSON.parse(localStorage.getItem('sandbox_avatars') || '{}');

        let boostPercentage = 0;

        // Create avatar data array
        const avatarData = [];
        for (let i = 0; i < 2; i++) {
          if (sandboxAvatars[i]) {
            boostPercentage += sandboxAvatars[i].boostPercentage || 0;
            avatarData.push({
              nft: sandboxAvatars[i], // Pass the whole object so the UI has access to the image
              tokenId: sandboxAvatars[i].tokenId,
              isEmpty: false
            });
          } else {
            avatarData.push({
              nft: null,
              tokenId: null,
              isEmpty: true
            });
          }
        }

        setAvatars(avatarData);
        setTotalBoost(boostPercentage);
      } catch (error) {
        console.error('Failed to fetch avatar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarData();
  }, [account]); // Removed getAvatars and getTokenBoostPpm from deps to prevent infinite loops (they're stubs)

  const hasAnyNFTs = avatars.some(avatar => !avatar.isEmpty);

  const handleAvatarChange = (slotIndex, selectedNFT) => {
    // Update the avatars state
    setAvatars(prevAvatars => {
      const newAvatars = [...prevAvatars];
      if (!selectedNFT) {
        newAvatars[slotIndex] = { nft: null, tokenId: null, isEmpty: true };
      } else {
        newAvatars[slotIndex] = {
          nft: selectedNFT,
          tokenId: selectedNFT.tokenId,
          isEmpty: false
        };
      }

      // Recalculate total boost dynamically based on the updated slots
      const newTotalBoost = (newAvatars[0].isEmpty ? 0 : (newAvatars[0].nft?.boostPercentage || 0)) + (newAvatars[1].isEmpty ? 0 : (newAvatars[1].nft?.boostPercentage || 0));
      setTotalBoost(newTotalBoost);
      return newAvatars;
    });
  };

  return <BaseDialog onClose={onClose} title="WORKERS" header="/images/dialog/modal-header-worker.png">
    <div className="avatar-dialog">
      <div className="nft-list">
        {loading ? (
          <>
            <NFTBox loading={true}></NFTBox>
            <NFTBox loading={true}></NFTBox>
          </>
        ) : (
          <>
            <NFTBox
              avatar={avatars[0]}
              slotIndex={0}
              onAvatarChange={handleAvatarChange}
              allAvatars={avatars}
            ></NFTBox>
            <NFTBox
              avatar={avatars[1]}
              slotIndex={1}
              onAvatarChange={handleAvatarChange}
              allAvatars={avatars}
            ></NFTBox>
          </>
        )}
      </div>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : hasAnyNFTs ? (
        <div className="text-center">Character NFTs equipped</div>
      ) : (
        <div className="text-center">You don't have any character NFTs</div>
      )}
      <CardView>
        <div className="text-center">Total Harvest Bonus: <span className="highlight">{totalBoost.toFixed(2)}%</span></div>
      </CardView>
    </div>
  </BaseDialog>;
};

export default AvatarDialog;
