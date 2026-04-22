import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import AvatarDialog from "../../../../containers/Menu_Avatar";

const Avatar = ({ src, alt = "avatar" }) => {
  const [isAvatarDialog, setIsAvatarDialog] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkHasNewPfp = () => {
    try {
      const unseen = JSON.parse(localStorage.getItem('sandbox_unseen_pfps') || '[]');
      const unlocked = JSON.parse(localStorage.getItem('sandbox_unlocked_pfps') || '[]');
      const claimed = JSON.parse(localStorage.getItem('sandbox_claimed_pfps') || '[]');
      return unseen.length > 0 || unlocked.some(id => !claimed.includes(id));
    } catch { return false; }
  };
  const [hasNewPfp, setHasNewPfp] = useState(checkHasNewPfp);
  const clickAudioRef = useRef(null);


  const fallbackSrc = "/images/pfp/defultpfp.png";

  useEffect(() => {
    const fetchAvatarImage = async () => {
      try {
        setLoading(true);

        // Check for selected pfp first — default to defultpfp if nothing saved
        const savedPfp = localStorage.getItem('sandbox_pfp') || '/images/pfp/defultpfp.png';
        if (!localStorage.getItem('sandbox_pfp')) {
          localStorage.setItem('sandbox_pfp', savedPfp);
        }
        setAvatarImage(savedPfp);
        setLoading(false);
        return;

        // Fetch from local storage instead of smart contract
        const sandboxAvatars = JSON.parse(localStorage.getItem('sandbox_avatars') || '{}');
        if (sandboxAvatars[0] && sandboxAvatars[0].image) {
          setAvatarImage(sandboxAvatars[0].image);
          setLoading(false);
          return;
        }

        setAvatarImage(null);
      } catch (error) {
        console.error('Failed to fetch avatar image:', error);
        setAvatarImage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarImage();

    const handler = () => fetchAvatarImage();
    const pfpHandler = (e) => setAvatarImage(e.detail);
    const newPfpHandler = () => setHasNewPfp(checkHasNewPfp());
    window.addEventListener('avatarsUpdated', handler);
    window.addEventListener('pfpUpdated', pfpHandler);
    window.addEventListener('pfpUnlocked', newPfpHandler);
    window.addEventListener('pfpEarned', newPfpHandler);
    return () => {
      window.removeEventListener('avatarsUpdated', handler);
      window.removeEventListener('pfpUpdated', pfpHandler);
      window.removeEventListener('pfpUnlocked', newPfpHandler);
      window.removeEventListener('pfpEarned', newPfpHandler);
    };
  }, []);

  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, []);

  const isPfp = !!localStorage.getItem('sandbox_pfp');
  const resolvedSrc = src || avatarImage || fallbackSrc;

  return (
    <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {loading ? (
        <div className="loading-placeholder">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <img
          src={resolvedSrc}
          alt={alt}
          className="avatar-img"
          style={{ width: '100%', height: '100%', objectFit: resolvedSrc.endsWith('.jpg') ? 'cover' : 'contain', cursor: 'pointer' }}
          onClick={() => {
            const audio = clickAudioRef.current;
            if (audio) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }
            setIsAvatarDialog(true);
          }}
          onError={(e) => {
            e.target.src = fallbackSrc;
          }}
        />
      )}
      {hasNewPfp && (
        <>
          <style>{`@keyframes pfpBadgePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }`}</style>
          <img
            src="/images/mail/!.png"
            alt="!"
            draggable={false}
            style={{ position: 'absolute', top: '-11px', right: '-11px', width: '29px', height: '29px', pointerEvents: 'none', zIndex: 10, animation: 'pfpBadgePulse 1.1s ease-in-out infinite' }}
          />
        </>
      )}
      {isAvatarDialog && <AvatarDialog onClose={() => { setIsAvatarDialog(false); setHasNewPfp(checkHasNewPfp()); }} />}
    </div>
  );
};

export default Avatar;
