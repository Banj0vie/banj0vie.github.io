import React, { useState, useEffect } from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import { useEquipmentRegistry } from "../../hooks/useContracts";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";

const PFP_OPTIONS = [
  { id: 'default',         src: '/images/pfp/defultpfp.png',         label: 'Default',      unlockType: 'always' },
  { id: 'redpfp',          src: '/images/pfp/redpfp.png',            label: 'Red',          unlockType: 'total_crops', threshold: 10 },
  { id: 'benpotato',       src: '/images/pfp/benpotato.jpg',         label: 'Ben Potato',   unlockType: 'special', objectFit: 'cover' },
  { id: 'goldcarrot',      src: '/images/pfp/goldcarrot.jpg',        label: 'Gold Carrot',  unlockType: 'special', objectFit: 'cover' },
  { id: 'goldpotato',      src: '/images/pfp/goldpotato.jpg',        label: 'Gold Potato',  unlockType: 'special', objectFit: 'cover' },
  { id: 'crowattackpfp',   src: '/images/pfp/crowattackpfp.png',     label: 'Crow Attack',  unlockType: 'special' },
  { id: 'flyattackpfp',    src: '/images/pfp/flyattackpfp.png',      label: 'Fly Attack',   unlockType: 'special' },
  { id: 'potatopfp',       src: '/images/pfp/potatopfp.png',         label: 'Potato',       unlockType: 'special' },
  { id: 'farmerpfp',       src: '/images/pfp/famerpfp.png',          label: 'Farmer',       unlockType: 'special' },
  { id: 'spendingfirstgem', src: '/images/pfp/spendingfirstgem.png', label: 'Gem Spender',  unlockType: 'special' },
  { id: 'rodpfp',           src: '/images/pfp/rodpfp.png',            label: 'Angler',       unlockType: 'special' },
  // Hidden until unlocked (easter eggs / secret achievements)
  { id: 'betapfp',         src: '/images/pfp/betapfp.png',           label: 'Beta Tester',  unlockType: 'special', hidden: true },
  { id: 'banjopfp',        src: '/images/pfp/banjopfp.png',          label: 'Banjo',        unlockType: 'special', hidden: true },
];

const BACKGROUND_OPTIONS = [
  { id: 'bg_default',    label: 'Default',    unlockType: 'always',      gradient: 'linear-gradient(135deg, #2d1a0e, #4a2c10)' },
  { id: 'bg_honeydrop',  label: 'Honey Drip', unlockType: 'always',      image: '/images/profile_bar/profile_bg.png' },
  { id: 'bg_pinkyellow', label: 'Pink & Gold', unlockType: 'always',     image: '/images/banner/pinkyellowbanner.png' },
  { id: 'bg_steel',      label: 'Steel',      unlockType: 'always',      image: '/images/banner/steelbanner.png' },
  { id: 'bg_red',        label: 'Red',        unlockType: 'total_crops', threshold: 10,   gradient: 'linear-gradient(135deg, #5a0a0a, #c0392b)' },
  { id: 'bg_orange',     label: 'Orange',     unlockType: 'total_crops', threshold: 25,   gradient: 'linear-gradient(135deg, #7a3200, #e67e22)' },
  { id: 'bg_yellow',     label: 'Yellow',     unlockType: 'total_crops', threshold: 50,   gradient: 'linear-gradient(135deg, #6a5500, #f1c40f)' },
  { id: 'bg_green',      label: 'Green',      unlockType: 'total_crops', threshold: 100,  gradient: 'linear-gradient(135deg, #0a3a1a, #27ae60)' },
  { id: 'bg_blue',       label: 'Blue',       unlockType: 'total_crops', threshold: 200,  gradient: 'linear-gradient(135deg, #0a1a4a, #2980b9)' },
  { id: 'bg_purple',     label: 'Purple',     unlockType: 'total_crops', threshold: 350,  gradient: 'linear-gradient(135deg, #2a0a4a, #8e44ad)' },
  { id: 'bg_night',      label: 'Night',      unlockType: 'total_crops', threshold: 500,  gradient: 'linear-gradient(135deg, #050510, #1a1a3a)' },
  { id: 'bg_sunset',     label: 'Sunset',     unlockType: 'total_crops', threshold: 750,  gradient: 'linear-gradient(135deg, #6a0a2a, #ff6b35)' },
  { id: 'bg_cosmic',     label: 'Cosmic',     unlockType: 'total_crops', threshold: 2000, gradient: 'linear-gradient(135deg, #0a0020, #7c3aed)' },
];

const DEFAULT_PFP_SRC = '/images/pfp/defultpfp.png';
const DEFAULT_BG_ID = 'bg_default';

const getUnlockedPfps = () => {
  try { return JSON.parse(localStorage.getItem('sandbox_claimed_pfps') || '[]'); }
  catch { return []; }
};

const isUnlocked = (item, totalCrops, unlockedPfps = []) => {
  if (item.unlockType === 'always') return true;
  if (item.unlockType === 'total_crops') return totalCrops >= item.threshold;
  if (item.unlockType === 'special') return unlockedPfps.includes(item.id);
  return false;
};

const TABS = ['Picture', 'Banner', 'Badge'];

const AvatarDialog = ({ onClose }) => {
  const { account } = useSolanaWallet();
  const { getAvatars, getTokenBoostPpm } = useEquipmentRegistry();

  const [tab, setTab] = useState(0);
  const [totalCrops, setTotalCrops] = useState(() => parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10));
  const [unlockedPfps, setUnlockedPfps] = useState(getUnlockedPfps);
  const [unseenPfps, setUnseenPfps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sandbox_unseen_pfps') || '[]'); } catch { return []; }
  });
  const [username] = useState(() => localStorage.getItem('sandbox_username') || 'Farmer');

  // Active (saved) state
  const [activePfpSrc, setActivePfpSrc] = useState(() => localStorage.getItem('sandbox_pfp') || DEFAULT_PFP_SRC);
  const [activeBgId, setActiveBgId] = useState(() => localStorage.getItem('sandbox_profile_bg') || DEFAULT_BG_ID);

  // Preview (pending) state
  const [previewPfpSrc, setPreviewPfpSrc] = useState(activePfpSrc);
  const [previewBgId, setPreviewBgId] = useState(activeBgId);

  const previewBg = BACKGROUND_OPTIONS.find(b => b.id === previewBgId) || BACKGROUND_OPTIONS[0];
  const previewPfp = PFP_OPTIONS.find(p => p.src === previewPfpSrc) || PFP_OPTIONS[0];

  const isDirty = previewPfpSrc !== activePfpSrc || previewBgId !== activeBgId;

  useEffect(() => {
    if (!localStorage.getItem('sandbox_pfp')) {
      localStorage.setItem('sandbox_pfp', DEFAULT_PFP_SRC);
      window.dispatchEvent(new CustomEvent('pfpUpdated', { detail: DEFAULT_PFP_SRC }));
    }
  }, []);

  useEffect(() => {
    const handler = () => setTotalCrops(parseInt(localStorage.getItem('sandbox_total_crops') || '0', 10));
    window.addEventListener('soilProgressChanged', handler);
    return () => window.removeEventListener('soilProgressChanged', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setUnlockedPfps(getUnlockedPfps());
      try { setUnseenPfps(JSON.parse(localStorage.getItem('sandbox_unseen_pfps') || '[]')); } catch {}
    };
    window.addEventListener('pfpUnlocked', handler);
    window.addEventListener('pfpUnlocksUpdated', handler);
    window.addEventListener('pfpEarned', handler);
    return () => {
      window.removeEventListener('pfpUnlocked', handler);
      window.removeEventListener('pfpUnlocksUpdated', handler);
      window.removeEventListener('pfpEarned', handler);
    };
  }, []);

  const handleEquip = () => {
    setActivePfpSrc(previewPfpSrc);
    setActiveBgId(previewBgId);
    localStorage.setItem('sandbox_pfp', previewPfpSrc);
    localStorage.setItem('sandbox_profile_bg', previewBgId);
    const bg = BACKGROUND_OPTIONS.find(b => b.id === previewBgId);
    if (bg?.image) localStorage.setItem('sandbox_profile_banner_img', bg.image);
    else localStorage.removeItem('sandbox_profile_banner_img');
    window.dispatchEvent(new CustomEvent('pfpUpdated', { detail: previewPfpSrc }));
    window.dispatchEvent(new CustomEvent('profileBannerUpdated', { detail: bg?.image || null }));
  };

  return (
    <BaseDialog onClose={onClose} title="Profile" header="/images/dialog/modal-header-worker.png">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px', width: '520px' }}>

        {/* Preview */}
        <div style={{
          borderRadius: '14px', overflow: 'hidden', height: '110px', position: 'relative',
          background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '16px',
          padding: '0 20px', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <img
            src={previewPfpSrc}
            alt="pfp preview"
            style={{ width: '80px', height: '80px', objectFit: previewPfp.objectFit || 'contain', borderRadius: '12px', flexShrink: 0 }}
          />
          {/* Name pill — replaces pill image with selected banner */}
          <div style={{ position: 'relative', width: '200px', flexShrink: 0, marginBottom: '24px' }}>
            <img
              src={previewBg.image || '/images/profile_bar/profile_bg.png'}
              alt=""
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px' }}
            />
            {previewBg.id === 'bg_honeydrop' && (
              <img src="/images/banner/hdripextentsion.png" alt="" style={{ position: 'absolute', bottom: '-17px', left: '-4.5%', width: '109%', pointerEvents: 'none' }} />
            )}
            {!previewBg.image && previewBg.gradient && (
              <div style={{ position: 'absolute', inset: 0, background: previewBg.gradient, mixBlendMode: 'color', opacity: 0.75, borderRadius: '4px' }} />
            )}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '85%', textAlign: 'center',
              fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {username}
            </div>
          </div>
          <span style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' }}>PREVIEW</span>
        </div>

        {/* Tabs + Grid */}
        <div style={{ display: 'flex', gap: '10px' }}>

          {/* Left tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                style={{
                  width: '108px', padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
                  background: tab === i ? '#a67c52' : 'rgba(255,255,255,0.06)',
                  color: tab === i ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s',
                }}
              >
                {t === 'Picture' ? '🖼️' : t === 'Banner' ? '🎨' : '🏅'} {t}
              </button>
            ))}
          </div>

          {/* Right grid */}
          <div style={{ flex: 1, maxHeight: '300px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', padding: '2px' }}>
            {tab === 0 && PFP_OPTIONS.filter(pfp => !pfp.hidden || isUnlocked(pfp, totalCrops, unlockedPfps)).map(pfp => {
              const unlocked = isUnlocked(pfp, totalCrops, unlockedPfps);
              const isSelected = previewPfpSrc === pfp.src;
              const isNew = unlocked && unseenPfps.includes(pfp.id);
              return (
                <div
                  key={pfp.id}
                  onClick={() => {
                    if (!unlocked) return;
                    setPreviewPfpSrc(pfp.src);
                    if (isNew) {
                      const next = unseenPfps.filter(id => id !== pfp.id);
                      setUnseenPfps(next);
                      localStorage.setItem('sandbox_unseen_pfps', JSON.stringify(next));
                    }
                  }}
                  title={unlocked ? pfp.label : '???'}
                  style={{
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    borderRadius: '10px', padding: '6px',
                    border: `2px solid ${isSelected ? '#ffea00' : isNew ? '#ff4444' : 'rgba(255,255,255,0.1)'}`,
                    background: isSelected ? 'rgba(255,234,0,0.1)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 0 8px rgba(255,234,0,0.3)' : isNew ? '0 0 8px rgba(255,68,68,0.4)' : 'none',
                    position: 'relative',
                  }}
                >
                  {isNew && (
                    <img src="/images/mail/!.png" alt="!" className="badge-pulse" style={{ position: 'absolute', top: '-8px', right: '-8px', width: '18px', height: '18px', zIndex: 2, pointerEvents: 'none' }} draggable={false} />
                  )}
                  <div style={{ position: 'relative' }}>
                    <img src={pfp.src} alt={pfp.label} style={{ width: '62px', height: '62px', objectFit: pfp.objectFit || 'contain', borderRadius: '8px', filter: unlocked ? 'none' : 'grayscale(100%) brightness(0.5)' }} />
                    {!unlocked && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔒</div>}
                  </div>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: unlocked ? (isSelected ? '#ffea00' : '#ccc') : '#555', textAlign: 'center' }}>
                    {unlocked ? pfp.label : '???'}
                  </span>
                </div>
              );
            })}

            {tab === 1 && BACKGROUND_OPTIONS.map(bg => {
              const unlocked = isUnlocked(bg, totalCrops);
              const isSelected = previewBgId === bg.id;
              return (
                <div
                  key={bg.id}
                  onClick={() => unlocked && setPreviewBgId(bg.id)}
                  title={unlocked ? bg.label : '???'}
                  style={{
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    borderRadius: '10px', padding: '6px',
                    border: `2px solid ${isSelected ? '#ffea00' : 'rgba(255,255,255,0.1)'}`,
                    background: isSelected ? 'rgba(255,234,0,0.1)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 0 8px rgba(255,234,0,0.3)' : 'none',
                  }}
                >
                  <div style={{ position: 'relative', width: '62px', height: '62px', borderRadius: '8px', overflow: 'hidden', background: bg.gradient || '#222' }}>
                    {bg.image && <img src={bg.image} alt={bg.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    {!unlocked && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🔒</div>}
                  </div>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: unlocked ? (isSelected ? '#ffea00' : '#ccc') : '#555', textAlign: 'center' }}>
                    {unlocked ? bg.label : '???'}
                  </span>
                </div>
              );
            })}

            {tab === 2 && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: '12px' }}>
                Badges coming soon
              </div>
            )}
          </div>
        </div>

        {/* Equip button */}
        <button
          onClick={handleEquip}
          disabled={!isDirty}
          style={{
            padding: '10px', borderRadius: '10px', border: 'none', cursor: isDirty ? 'pointer' : 'default',
            fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold',
            background: isDirty ? 'linear-gradient(135deg, #a67c52, #c8944a)' : 'rgba(255,255,255,0.08)',
            color: isDirty ? '#fff' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {isDirty ? 'Equip' : 'In Use'}
        </button>

      </div>
    </BaseDialog>
  );
};

export default AvatarDialog;
