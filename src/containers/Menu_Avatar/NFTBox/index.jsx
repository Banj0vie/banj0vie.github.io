import React, { useState, useEffect } from 'react';
import './style.css';
import { useEquipmentRegistry } from '../../../hooks/useContracts';
import BoostNFTSelector from '../BoostNFTSelector';
import CardImgView from '../../../components/boxes/CardImgView';

const NFTBox = ({ avatar, loading, slotIndex, onAvatarChange, allAvatars = [] }) => {
    const [nftData, setNftData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const { getNFTMetadata } = useEquipmentRegistry();

    useEffect(() => {
        const fetchNFTData = async () => {
            if (!avatar || avatar.isEmpty || loading) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Use the hook function to get NFT metadata
                const metadata = await getNFTMetadata(avatar.tokenId);
                if (metadata) {
                    setNftData({
                        tokenId: avatar.tokenId,
                        name: metadata.name,
                        image: metadata.image,
                        boost: metadata.boostPercentage.toFixed(2)
                    });
                } else {
                    // Fallback data
                    setNftData({
                        tokenId: avatar.tokenId,
                        name: `Character #${avatar.tokenId}`,
                        boost: '0.00'
                    });
                }
            } catch (error) {
                console.error('Failed to fetch NFT data:', error);
                // Fallback data
                setNftData({
                    tokenId: avatar.tokenId,
                    name: `Character #${avatar.tokenId}`,
                    boost: '0.00'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchNFTData();
    }, [avatar, loading, getNFTMetadata]);

    const handleClick = () => {
        setShowSelector(true);
    };

    const handleNFTSelect = (selectedNFT) => {
        // Update the avatar data
        setNftData({
            tokenId: selectedNFT.tokenId,
            name: selectedNFT.name,
            image: selectedNFT.image,
            boost: selectedNFT.boostPercentage.toFixed(2)
        });

        // Notify parent component
        if (onAvatarChange) {
            onAvatarChange(slotIndex, selectedNFT);
        }
    };

    if (loading || isLoading) {
        return <div className="nft-box">
            <CardImgView className="nft-card">
                <div className="loading-placeholder">
                    <div className="loading-spinner"></div>
                </div>
            </CardImgView>
            <div className="name">
                Loading...
            </div>
        </div>
    }

    return (
        <>
            <div className="nft-box clickable" onClick={handleClick}>
                <CardImgView className="nft-card">
                    {!avatar || avatar.isEmpty ? (
                        <img src="/images/avatars/avatar-left-placeholder.png" alt="empty slot"></img>
                    ) : (
                        <img
                            src={nftData?.image || `/images/avatars/character-${avatar.tokenId}.png`}
                            alt={`Character ${avatar.tokenId}`}
                            onError={(e) => {
                                // Fallback to placeholder if specific character image doesn't exist
                                e.target.src = "/images/avatars/avatar-left-placeholder.png";
                            }}
                        />
                    )}
                </CardImgView>
                <div className="name">
                    {!avatar || avatar.isEmpty ? 'EMPTY' : (nftData ? nftData.name : `Character #${avatar.tokenId}`)}
                </div>
            </div>

            {showSelector && (
                <BoostNFTSelector
                    onClose={() => setShowSelector(false)}
                    onSelect={handleNFTSelect}
                    slotIndex={slotIndex}
                    equippedAvatars={allAvatars}
                />
            )}
        </>
    )
}

export default NFTBox;