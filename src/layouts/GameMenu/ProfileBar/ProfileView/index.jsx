import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import { trackGemSpend } from "../../../../utils/pfpUnlocks";

const RENAME_COST = 500;

const ProfileView = ({ username }) => {
  const [bannerImg, setBannerImg] = useState(() => localStorage.getItem('sandbox_profile_banner_img') || null);
  const [customName, setCustomName] = useState(() => localStorage.getItem('sandbox_username') || null);
  const [renaming, setRenaming] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [renameError, setRenameError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => setBannerImg(e.detail || null);
    window.addEventListener('profileBannerUpdated', handler);
    return () => window.removeEventListener('profileBannerUpdated', handler);
  }, []);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  const displayName = customName || username;

  const savedBgId = localStorage.getItem('sandbox_profile_bg') || 'bg_default';
  const isHoneyDrip = savedBgId === 'bg_honeydrop';

  const openRename = () => {
    setInputVal(displayName || '');
    setRenameError('');
    setRenaming(true);
  };

  const confirmRename = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) { setRenameError('Name cannot be empty.'); return; }
    if (trimmed.length > 20) { setRenameError('Max 20 characters.'); return; }
    const gems = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
    if (gems < RENAME_COST) {
      setRenameError(`Need ${RENAME_COST} 💎 gems.`);
      return;
    }
    const newGems = gems - RENAME_COST;
    localStorage.setItem('sandbox_gems', String(newGems));
    window.dispatchEvent(new CustomEvent('sandboxGemsChanged'));
    trackGemSpend(RENAME_COST);
    localStorage.setItem('sandbox_username', trimmed);
    setCustomName(trimmed);
setRenaming(false);
  };

  return (
    <>
      <div className="name-pill" onClick={openRename} style={{ cursor: 'pointer' }} title="Click to rename (500 💎)">
        <img src={bannerImg || '/images/profile_bar/profile_bg.png'} alt="name pill bg" className="name-pill-bg" />
        {isHoneyDrip && (
          <img src="/images/banner/hdripextentsion.png" alt="" style={{ position: 'absolute', bottom: '-23px', left: '-4.5%', width: '109%', pointerEvents: 'none', zIndex: 10 }} />
        )}
        <div className="name-pill-content">
          <div>{displayName}</div>
        </div>
      </div>

      {renaming && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setRenaming(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #2d1a0e, #4a2c10)',
              border: '2px solid #c8821a',
              borderRadius: '14px',
              padding: '28px 32px',
              minWidth: '300px',
              textAlign: 'center',
              fontFamily: 'GROBOLD, Cartoonist, sans-serif',
            }}
          >
            <div style={{ fontSize: '20px', color: '#f5d87a', marginBottom: '6px', textShadow: '1px 1px 0 #000' }}>
              Change Name
            </div>
            <div style={{ fontSize: '13px', color: '#c8a46a', marginBottom: '18px' }}>
              Costs <img src="/images/profile_bar/diamond.png" alt="gem" style={{ width: '13px', verticalAlign: 'middle' }} /> {RENAME_COST} gems
            </div>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value); setRenameError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setRenaming(false); }}
              maxLength={20}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', fontSize: '16px',
                borderRadius: '8px', border: '2px solid #c8821a',
                background: '#1a0e05', color: '#fff',
                fontFamily: 'inherit', outline: 'none', marginBottom: '8px',
              }}
            />
            {renameError && (
              <div style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '10px' }}>{renameError}</div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
              <button
                onClick={confirmRename}
                style={{ padding: '9px 22px', background: '#c8821a', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Confirm
              </button>
              <button
                onClick={() => setRenaming(false)}
                style={{ padding: '9px 22px', background: '#444', border: 'none', borderRadius: '8px', color: '#ccc', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileView;
