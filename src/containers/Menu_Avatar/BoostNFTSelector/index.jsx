/* global BigInt */
import React, { useState, useEffect } from 'react';
import BaseDialog from '../../_BaseDialog';
import './style.css';
import { useSolanaWallet } from '../../../hooks/useSolanaWallet';
import { useEquipmentRegistry } from '../../../hooks/useContracts';
import CardView from '../../../components/boxes/CardView';
import BaseButton from '../../../components/buttons/BaseButton';

const BoostNFTSelector = ({ onClose, onSelect, slotIndex, equippedAvatars = [] }) => {
  const { account } = useSolanaWallet();
  const { setAvatar, getOwnedBoostNFTs, getContract } = useEquipmentRegistry();
  // const { invalidate } = useAppData();
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchOwnedNFTs = async () => {
      if (!account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const nfts = await getOwnedBoostNFTs(account);
        
        // Filter out NFTs that are already equipped as avatars
        const equippedTokenIds = equippedAvatars
          .filter(avatar => !avatar.isEmpty && avatar.tokenId)
          .map(avatar => BigInt(avatar.tokenId));
        
        const availableNFTs = (nfts || []).filter(nft => 
          !equippedTokenIds.includes(BigInt(nft.tokenId))
        );
        setOwnedNFTs(availableNFTs);
      } catch (err) {
        console.error('Failed to fetch owned NFTs:', err);
        setError(err.message);
        setOwnedNFTs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedNFTs();
  }, [account, equippedAvatars]); // Removed getOwnedBoostNFTs from deps to prevent infinite loops (it's a stub)

  const handleSelectNFT = async (nft) => {
    try {
      // Get the BoostNFT contract address
      const boostNFT = getContract('BOOST_NFT');
      if (!boostNFT) {
        throw new Error('BoostNFT contract not available');
      }

      // Equip the NFT to the selected slot
      await setAvatar(slotIndex, boostNFT.address, nft.tokenId);

      // Invalidate cached avatars/boost and notify listeners to refresh UI
      // try {
      //   if (invalidate) {
      //     invalidate('avatars');
      //     invalidate('boost');
      //   }
      // } catch {}
      try {
        window.dispatchEvent(new CustomEvent('avatarsUpdated'));
      } catch {}
      
      // Call the onSelect callback to update the parent
      onSelect(nft);
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Failed to equip NFT:', error);
      setError('Failed to equip NFT. Please try again.');
    }
  };

  return (
    <BaseDialog onClose={onClose} title="SELECT CHARACTER"  header="/images/dialog/modal-header-worker.png">
      <div className="select-character-dialog">
        <CardView className="p-0">
          <div className="character-list">
            {loading ? (
              <div className="loading">Loading your NFTs...</div>
            ) : error ? (
              <div className="error">Error: {error}</div>
            ) : ownedNFTs.length === 0 ? (
              <div className="no-nfts">
                <p>You don't own any BoostNFTs yet.</p>
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
