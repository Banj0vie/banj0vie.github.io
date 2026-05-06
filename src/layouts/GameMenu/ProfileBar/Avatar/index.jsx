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
  const [profileTab, setProfileTab] = useState(0);
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
        <div
          style={{ width: '100%', height: '100%', position: 'relative', transition: 'transform 0.15s ease-out', transformOrigin: 'center' }}
          onMouseEnter={e => {
            const tutStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
            const skipped = localStorage.getItem('sandbox_tutorial_skipped') === 'true';
            if (tutStep < 36 && !skipped) return;
            e.currentTarget.style.transform = 'scale(1.12)';
          }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseDown={e => {
            const tutStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
            const skipped = localStorage.getItem('sandbox_tutorial_skipped') === 'true';
            if (tutStep < 36 && !skipped) return;
            e.currentTarget.style.transform = 'scale(0.93)';
          }}
          onMouseUp={e => {
            const tutStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
            const skipped = localStorage.getItem('sandbox_tutorial_skipped') === 'true';
            if (tutStep < 36 && !skipped) return;
            e.currentTarget.style.transform = 'scale(1.12)';
          }}
          onClick={() => {
            const tutStep = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
            const skipped = localStorage.getItem('sandbox_tutorial_skipped') === 'true';
            if (tutStep < 36 && !skipped) return;
            const audio = clickAudioRef.current;
            if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
            setProfileTab(0);
            setIsAvatarDialog(prev => !prev);
          }}
        >
          <img
            src={resolvedSrc}
            alt={alt}
            className="avatar-img"
            style={{ width: '100%', height: '100%', objectFit: resolvedSrc.endsWith('.jpg') ? 'cover' : 'contain', cursor: 'pointer' }}
            onError={(e) => { e.target.src = fallbackSrc; }}
          />
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
        </div>
      )}
      {isAvatarDialog && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => { setIsAvatarDialog(false); setHasNewPfp(checkHasNewPfp()); }}
        >
          <div style={{ position: 'relative', userSelect: 'none' }} onClick={e => e.stopPropagation()}>
            <img src="/images/profile/profile/profiles.png" alt="Profile" draggable={false} style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain', display: 'block' }} />
            <img
              src="/images/profile/profile/x.png"
              alt="Close"
              draggable={false}
              onClick={() => { setIsAvatarDialog(false); setHasNewPfp(checkHasNewPfp()); }}
              style={{ position: 'absolute', top: 'calc(2% + 60px)', right: 'calc(-2% - 4px)', width: '8%', cursor: 'pointer', transition: 'transform 0.1s, filter 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
            />
            <style>{`
              .profile-tab-btn { transition: transform 0.1s; cursor: pointer; flex: 1; width: 0; object-fit: contain; }
              .profile-tab-btn:hover { transform: scale(1.06); }
              .profile-tab-btn:active { transform: scale(0.95); }
            `}</style>
            {/* Tab buttons */}
            <div style={{ position: 'absolute', top: 'calc(27% - 60px)', left: '8%', width: '84%', display: 'flex', gap: '2%' }}>
              {[
                { src: '/images/profile/pfp/pfps.png', activeSrc: '/images/profile/pfp/pfpselect.png', label: 'pfp', clip: false },
                { src: '/images/profile/background/bgs.png', activeSrc: '/images/profile/background/bgselect.png', label: 'bg', clip: false },
                { src: '/images/profile/badges/badges.png', activeSrc: '/images/profile/badges/badgeselect.png', label: 'badges', clip: true },
              ].map((tab, i) => {
                const isActive = profileTab === i;
                const usingSrc = isActive ? tab.activeSrc : tab.src;
                if (tab.clip && isActive) {
                  return (
                    <div key={tab.label} style={{ flex: 1, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.1s, filter 0.1s' }}
                      className={`profile-tab-btn${isActive ? ' active' : ''}`}
                      onClick={() => setProfileTab(i)}>
                      <img src={usingSrc} draggable={false} style={{ width: '300%', transform: 'translateX(-66.67%)', display: 'block', pointerEvents: 'none' }} />
                    </div>
                  );
                }
                return (
                  <img
                    key={tab.label}
                    src={usingSrc}
                    draggable={false}
                    className={`profile-tab-btn${isActive ? ' active' : ''}`}
                    onClick={() => setProfileTab(i)}
                  />
                );
              })}
            </div>
            {profileTab === 2 ? (
              <>
                <img src="/images/profile/profile/comingsoon.png" draggable={false} style={{ position: 'absolute', top: '35%', left: '20%', width: '60%', objectFit: 'contain' }} />
                <img src="/images/profile/profile/comingsoon.png" draggable={false} style={{ position: 'absolute', top: '55%', left: '20%', width: '60%', objectFit: 'contain' }} />
                <img src="/images/profile/profile/comingsoon.png" draggable={false} style={{ position: 'absolute', top: '74%', left: '20%', width: '60%', objectFit: 'contain' }} />
              </>
            ) : profileTab === 0 ? (
              ['calc(32% - 10px)', 'calc(40% - 12px)', 'calc(52% - 13px)', 'calc(60% - 15px)', 'calc(72% - 15px)', 'calc(80% - 17px)'].map((top, i) => (
                <div key={i} style={{ position: 'absolute', top, left: 'calc(9% + 12px)', width: '83%', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 'calc(1% - 2px)' }}>
                  {Array.from({ length: 10 }).map((_, j) => {
                    const isPfp = i === 0 && j === 0;
                    const pfpSrc = '/images/pfp/defultpfp.png';
                    const isSelected = isPfp && avatarImage === pfpSrc;
                    return isPfp ? (
                      <img
                        key={j}
                        src={pfpSrc}
                        draggable={false}
                        onClick={() => {
                          localStorage.setItem('sandbox_pfp', pfpSrc);
                          setAvatarImage(pfpSrc);
                          window.dispatchEvent(new CustomEvent('pfpUpdated', { detail: pfpSrc }));
                        }}
                        style={{
                          width: '100%', objectFit: 'contain', cursor: 'pointer',
                          borderRadius: '6px',
                          outline: isSelected ? '2px solid #ffea00' : 'none',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      />
                    ) : (
                      <img key={j} src="/images/profile/profile/questionmark.png" draggable={false} style={{ width: '100%', objectFit: 'contain' }} />
                    );
                  })}
                </div>
              ))
            ) : profileTab === 1 ? (
              ['calc(32% - 10px)', 'calc(40% - 12px)', 'calc(52% - 13px)', 'calc(60% - 15px)', 'calc(72% - 15px)', 'calc(80% - 17px)'].map((top, i) => (
                <div key={i} style={{ position: 'absolute', top, left: 'calc(9% + 12px)', width: '83%', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 'calc(1% - 2px)' }}>
                  {Array.from({ length: 10 }).map((_, j) => {
                    const isBg = i === 0 && j === 0;
                    const bgSrc = '/images/profile/background/defultbg.png';
                    const bgId = 'bg_default';
                    const isSelected = isBg && localStorage.getItem('sandbox_profile_bg') === bgId;
                    return isBg ? (
                      <img
                        key={j}
                        src={bgSrc}
                        draggable={false}
                        onClick={() => {
                          localStorage.setItem('sandbox_profile_bg', bgId);
                          localStorage.removeItem('sandbox_profile_banner_img');
                          window.dispatchEvent(new CustomEvent('profileBgUpdated', { detail: 'linear-gradient(135deg, #2d1a0e, #4a2c10)' }));
                        }}
                        style={{
                          width: '100%', objectFit: 'contain', cursor: 'pointer',
                          borderRadius: '6px',
                          outline: isSelected ? '2px solid #ffea00' : 'none',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      />
                    ) : (
                      <img key={j} src="/images/profile/profile/questionmark.png" draggable={false} style={{ width: '100%', objectFit: 'contain' }} />
                    );
                  })}
                </div>
              ))
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Avatar;
