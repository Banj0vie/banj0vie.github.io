import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import AvatarDialog from "../../../../containers/Menu_Avatar";

const Avatar = ({ src, alt = "avatar" }) => {
  const [isAvatarDialog, setIsAvatarDialog] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const hoverAudioRef = useRef(null);
  const clickAudioRef = useRef(null);


  const fallbackSrc = "/images/avatars/avatar-left-placeholder.png";

  useEffect(() => {
    const fetchAvatarImage = async () => {
      try {
        setLoading(true);

        // Fetch from local storage instead of smart contract
        const sandboxAvatars = JSON.parse(localStorage.getItem('sandbox_avatars') || '{}');
        
        if (sandboxAvatars[0] && sandboxAvatars[0].image) {
          setAvatarImage(sandboxAvatars[0].image);
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
  }, []);

  useEffect(() => {
    if (!hoverAudioRef.current) {
      hoverAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      hoverAudioRef.current.preload = "auto";
    }
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonClick.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  const resolvedSrc = src || avatarImage || fallbackSrc;

  return (
    <div className="avatar">
      <img src="/images/profile_bar/avatar_bg.png" alt="empty slot" className="avatar-bg"></img>
      <div className="avatar-content">
        {loading ? (
          <div className="loading-placeholder">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <img
            src={resolvedSrc}
            alt={alt}
            className="avatar-img"
            onClick={() => {
              const audio = clickAudioRef.current;
              if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
              }
              setIsAvatarDialog(true);
            }}
            onMouseEnter={() => {
              const audio = hoverAudioRef.current;
              if (!audio) return;
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }}
            onError={(e) => {
              e.target.src = fallbackSrc;
            }}
          />
        )}
      </div>
      {isAvatarDialog && <AvatarDialog onClose={() => setIsAvatarDialog(false)}></AvatarDialog>}
    </div>
  );
};

export default Avatar;
