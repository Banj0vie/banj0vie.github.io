import React, { useState, useEffect } from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import NFTBox from "./NFTBox";
import BaseDivider from "../../components/dividers/BaseDivider";
import { useEquipmentRegistry } from "../../hooks/useContracts";
import { useAppData } from "../../context/AppDataContext";
import { useAgwEthersAndService } from "../../hooks/useContractBase";

const AvatarDialog = ({ onClose }) => {
  const { account } = useAgwEthersAndService();
  const { getAvatars, getTokenBoostPpm } = useEquipmentRegistry();
  const { getAvatarsCached, getBoostCached } = useAppData();
  const [avatars, setAvatars] = useState([]);
  const [totalBoost, setTotalBoost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatarData = async () => {
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get equipped avatars
        const avatarResult = await (getAvatarsCached ? getAvatarsCached() : getAvatars(account));
        console.log('Avatar result:', avatarResult);
        
        // Handle case where getAvatars returns null
        if (!avatarResult || !Array.isArray(avatarResult) || avatarResult.length < 2) {
          console.log('No avatar data available, using empty state');
          setAvatars([
            { nft: null, tokenId: null, isEmpty: true },
            { nft: null, tokenId: null, isEmpty: true }
          ]);
          setTotalBoost(0);
          return;
        }
        
        const [nfts, tokenIds] = avatarResult;
        
        // Get total boost
        const boostPpm = await (getBoostCached ? getBoostCached() : getTokenBoostPpm(account));
        const boostPercentage = boostPpm ? boostPpm / 1000 : 0; // Convert from ppm to percentage, default to 0 if null
        
        // Create avatar data array
        const avatarData = [];
        for (let i = 0; i < 2; i++) {
          if (i < nfts.length && nfts[i] !== "0x0000000000000000000000000000000000000000") {
            avatarData.push({
              nft: nfts[i],
              tokenId: tokenIds[i],
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
        // Set empty state on error
        setAvatars([
          { nft: null, tokenId: null, isEmpty: true },
          { nft: null, tokenId: null, isEmpty: true }
        ]);
        setTotalBoost(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarData();
  }, [account, getAvatars, getTokenBoostPpm]);

  const hasAnyNFTs = avatars.some(avatar => !avatar.isEmpty);

  const handleAvatarChange = (slotIndex, selectedNFT) => {
    // Update the avatars state
    setAvatars(prevAvatars => {
      const newAvatars = [...prevAvatars];
      newAvatars[slotIndex] = {
        nft: selectedNFT.tokenId,
        tokenId: selectedNFT.tokenId,
        isEmpty: false
      };
      return newAvatars;
    });

    // Recalculate total boost
    const newTotalBoost = selectedNFT.boostPercentage;
    setTotalBoost(newTotalBoost);
  };

  return <BaseDialog onClose={onClose} title="WORKERS">
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
        <BaseDivider></BaseDivider>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : hasAnyNFTs ? (
          <div className="text-center">Character NFTs equipped</div>
        ) : (
          <div className="text-center">You don't have any character NFTs</div>
        )}
        <BaseDivider></BaseDivider>
        <div className="text-center">Total Harvest Bonus: <span className="highlight">{totalBoost.toFixed(2)}%</span></div>
    </div>
  </BaseDialog>;
};

export default AvatarDialog;
