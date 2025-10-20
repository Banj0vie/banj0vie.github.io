import React, { useState, useEffect } from "react";
import "./style.css";
import AvatarDialog from "../../../../containers/Menu_Avatar";
import { useEquipmentRegistry } from "../../../../hooks/useContracts";
import { useSolanaWallet } from "../../../../hooks/useSolanaWallet";

const Avatar = ({ src, alt = "avatar" }) => {
  const [isAvatarDialog, setIsAvatarDialog] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { account } = useSolanaWallet();
  const { getAvatars, getNFTMetadata } = useEquipmentRegistry();
  
  const fallbackSrc = "/images/avatars/avatar-left-placeholder.png";

  useEffect(() => {
    const fetchAvatarImage = async () => {
      if (!account || !getAvatars || !getNFTMetadata) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get equipped avatars (cached via context when available)
        const avatarResult = await getAvatars(account);
        const [nfts, tokenIds] = avatarResult;
        
        // Check if we have any equipped avatars
        if (nfts && Array.isArray(nfts) && nfts.length >= 2) {
          setAvatarImage(nfts[0].image);
          setLoading(false);
          return;
        }
        
        // No equipped avatar found, use placeholder
        setAvatarImage(null);
      } catch (error) {
        console.error('Failed to fetch avatar image:', error);
        setAvatarImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarImage();

    // Listen for avatar updates to refresh image immediately after equip
    const handler = () => {
      fetchAvatarImage();
    };
    window.addEventListener('avatarsUpdated', handler);
    return () => window.removeEventListener('avatarsUpdated', handler);
  }, [account, getAvatars, getNFTMetadata]);

  const resolvedSrc = src || avatarImage || fallbackSrc;

  return (
    <div className="avatar">
      {loading ? (
        <div className="loading-placeholder">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <img
          src={resolvedSrc}
          alt={alt}
          className="avatar-img"
          onClick={() => setIsAvatarDialog(true)}
          onError={(e) => {
            e.target.src = fallbackSrc;
          }}
        />
      )}
      {isAvatarDialog && <AvatarDialog onClose={()=>setIsAvatarDialog(false)}></AvatarDialog>}
    </div>
  );
};

export default Avatar;
