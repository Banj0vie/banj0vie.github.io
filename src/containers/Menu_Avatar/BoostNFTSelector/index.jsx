/* global BigInt */
import React, { useState, useEffect } from 'react';
import BaseDialog from '../../_BaseDialog';
import './style.css';
import { useSolanaWallet } from '../../../hooks/useSolanaWallet';
import CardView from '../../../components/boxes/CardView';
import BaseButton from '../../../components/buttons/BaseButton';

const BoostNFTSelector = ({ onClose, onSelect, slotIndex, equippedAvatars = [] }) => {
  const { account } = useSolanaWallet();
  // const { invalidate } = useAppData();
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Provide a static list of default characters instead of fetching from the blockchain
        let nfts = [
          {
            tokenId: 1, // Unique ID for this custom character
            name: "Worker Bee",
            image: "/pfp/beepfp.png", // Path to your public folder image
            boostPercentage: 5.0
          },
          {
            tokenId: 2, 
            name: "Golden Bee",
            image: "/pfp/beepfp.png", // Path to your public folder image
            boostPercentage: 15.0
          }
        ];
        
        // Filter out characters that are already equipped
        const equippedTokenIds = equippedAvatars
          .filter(avatar => !avatar.isEmpty && avatar.tokenId)
          .map(avatar => String(avatar.tokenId));
        
        const availableNFTs = nfts.filter(nft => 
          !equippedTokenIds.includes(String(nft.tokenId))
        );
        setOwnedNFTs(availableNFTs);
      } catch (err) {
        console.error('Failed to load characters:', err);
        setError(err.message);
        setOwnedNFTs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedNFTs();
  }, [equippedAvatars]);

  const handleSelectNFT = async (nft) => {
    try {
      // Save to local storage so the sandbox remembers your equipped character
      const sandboxAvatars = JSON.parse(localStorage.getItem('sandbox_avatars') || '{}');
      sandboxAvatars[slotIndex] = nft;
      localStorage.setItem('sandbox_avatars', JSON.stringify(sandboxAvatars));
      
      try {
        window.dispatchEvent(new CustomEvent('avatarsUpdated'));
      } catch {}
      
      if (typeof onSelect === 'function') {
        onSelect(nft);
      }
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Failed to equip character:', error);
      setError('Failed to equip character. Please try again.');
    }
  };

  return (
    <BaseDialog onClose={onClose} title="SELECT CHARACTER"  header="/images/dialog/modal-header-worker.png">
      <div className="select-character-dialog">
        <CardView className="p-0">
          <div className="character-list">
            {loading ? (
              <div className="loading">Loading your characters...</div>
            ) : error ? (
              <div className="error">Error: {error}</div>
            ) : ownedNFTs.length === 0 ? (
              <div className="no-nfts">
                <p>You don't have any characters available to equip.</p>
              </div>
            ) : (
              ownedNFTs.map((nft) => (
                <CardView key={nft.tokenId} className="p-0" secondary>
                  <div className="character-list-item">
                    <CardView className="p-0 icon">
                      <img 
                        src={nft.image || `/images/avatars/character-${nft.tokenId}.png`} 
                        alt={nft.name}
                        onError={(e) => {
                          e.target.src = "/images/avatars/avatar-left-placeholder.png";
                        }}
                      />
                    </CardView>
                    <div className="label">
                      <div className="character-name">{nft.name}</div>
                      <div className="character-boost">+{nft.boostPercentage.toFixed(2)}% Harvest</div>
                    </div>
                    <BaseButton
                      className="button"
                      label="Equip"
                      onClick={() => handleSelectNFT(nft)}
                    />
                  </div>
                </CardView>
              ))
            )}
          </div>
        </CardView>
      </div>
    </BaseDialog>
  );
};

export default BoostNFTSelector;
