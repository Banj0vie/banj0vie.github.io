import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./style.css";
import Avatar from "./Avatar";
import ProfileButton from "../../../components/buttons/ProfileButton";
import ProfileView from "./ProfileView";
import { formatNumber } from "../../../utils/basic";
import InventoryDialog from "../../../containers/Menu_Inventory";
import SettingsDialog from "../../../containers/Menu_Settings";
import Shop from "../../../containers/Shop";
import AchievementsDialog from "../../../containers/AchievementsDialog";
import { useSelector } from "react-redux";
import { selectBalanceRefreshing } from "../../../store/slices/balanceSlice";
import { useProdMint } from "../../../hooks/useProdMint";
// Removed bnToNumber; using plain parsing based on 1e9 decimals for locked tokens

const ProfileBar = ({ isFarmMenu }) => {
  // Redux state
  const userData = useSelector((state) => state.user.userData);
  const [isInventoryDialog, setIsInventoryDialog] = useState(false);
  const [isSettingsDialog, setIsSettingsDialog] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  // Which news tab is active inside the news popup.
  const [newsView, setNewsView] = useState('welcome');
  // Feedback form draft.
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Set/clear body[data-news-open] so the nav icons (farm/market/dock) dim behind the popup.
  useEffect(() => {
    if (isNewsOpen) {
      document.body.setAttribute('data-news-open', 'true');
      return () => document.body.removeAttribute('data-news-open');
    }
  }, [isNewsOpen]);

  // Auto-open the news popup on initial mount (every game load), unless the user
  // is mid-tutorial — they shouldn't be interrupted by it. Always lands on Welcome.
  useEffect(() => {
    const step = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
    const skipped = localStorage.getItem('sandbox_tutorial_skipped') === 'true';
    const inTut = step < 36 && !skipped;
    if (!inTut) {
      setNewsView('welcome');
      setIsNewsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [shopInitialTab, setShopInitialTab] = useState(0);
  const [hasUnreadMail, setHasUnreadMail] = useState(false);
  const [hasReadyQuests, setHasReadyQuests] = useState(false);
  const [gems, setGems] = useState(() => parseInt(localStorage.getItem('sandbox_gems') || '0', 10));
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [tutorialSkipped, setTutorialSkipped] = useState(() => localStorage.getItem('sandbox_tutorial_skipped') === 'true');
  const inTutorial = tutorialStep < 36 && !tutorialSkipped;

  useEffect(() => {
    const handler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    const skipHandler = () => setTutorialSkipped(localStorage.getItem('sandbox_tutorial_skipped') === 'true');
    window.addEventListener('tutorialStepChanged', handler);
    window.addEventListener('tutorialSkipChanged', skipHandler);
    return () => {
      window.removeEventListener('tutorialStepChanged', handler);
      window.removeEventListener('tutorialSkipChanged', skipHandler);
    };
  }, []);

  const BG_GRADIENTS = {
    bg_default: 'linear-gradient(135deg, #2d1a0e, #4a2c10)',
    bg_red:     'linear-gradient(135deg, #5a0a0a, #c0392b)',
    bg_orange:  'linear-gradient(135deg, #7a3200, #e67e22)',
    bg_yellow:  'linear-gradient(135deg, #6a5500, #f1c40f)',
    bg_green:   'linear-gradient(135deg, #0a3a1a, #27ae60)',
    bg_blue:    'linear-gradient(135deg, #0a1a4a, #2980b9)',
    bg_purple:  'linear-gradient(135deg, #2a0a4a, #8e44ad)',
    bg_night:   'linear-gradient(135deg, #050510, #1a1a3a)',
    bg_sunset:  'linear-gradient(135deg, #6a0a2a, #ff6b35)',
    bg_cosmic:  'linear-gradient(135deg, #0a0020, #7c3aed)',
  };

  const getProfileBg = () => {
    const id = localStorage.getItem('sandbox_profile_bg') || 'bg_default';
    return BG_GRADIENTS[id] || BG_GRADIENTS.bg_default;
  };

  const [profileBg, setProfileBg] = useState(getProfileBg);

  useEffect(() => {
    const handler = () => setGems(parseInt(localStorage.getItem('sandbox_gems') || '0', 10));
    window.addEventListener('sandboxGemsChanged', handler);
    return () => window.removeEventListener('sandboxGemsChanged', handler);
  }, []);

  // Gold counter — single source of truth is localStorage's sandbox_gold,
  // updated by quest rewards, mission board turn-ins, the daily chest, and
  // the tutorial farewell pack. Listens to sandboxGoldChanged for refreshes.
  const [goldRaw, setGoldRaw] = useState(() => parseInt(localStorage.getItem('sandbox_gold') || '0', 10));
  useEffect(() => {
    const handler = () => setGoldRaw(parseInt(localStorage.getItem('sandbox_gold') || '0', 10));
    window.addEventListener('sandboxGoldChanged', handler);
    return () => window.removeEventListener('sandboxGoldChanged', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setProfileBg(e.detail || BG_GRADIENTS.bg_default);
    window.addEventListener('profileBgUpdated', handler);
    return () => window.removeEventListener('profileBgUpdated', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setHasUnreadMail(e.detail);
    window.addEventListener('mailUnreadChanged', handler);
    return () => window.removeEventListener('mailUnreadChanged', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => setHasReadyQuests(e.detail);
    window.addEventListener('mailReadyChanged', handler);
    return () => window.removeEventListener('mailReadyChanged', handler);
  }, []);
  const { prodMint, loading: prodMintLoading } = useProdMint();
  const gameToken = useSelector((state) => state.balance.gameToken);
  const stakedBalance = useSelector((state) => state.balance.stakedBalance);
  const isBalanceRefreshing = useSelector(selectBalanceRefreshing);

  // Force re-render when balance refresh completes (less aggressive)
  const balanceKey = useMemo(() => {
    return `${gameToken}-${stakedBalance}-${isBalanceRefreshing}`;
  }, [gameToken, stakedBalance, isBalanceRefreshing]);

  // Use balance slice data instead of user slice for consistency
  const lockedTokensUi = useMemo(() => {
    return stakedBalance || '0';
  }, [stakedBalance]);

  const lockedHoney = useMemo(() => {
    const formatted = formatNumber(lockedTokensUi);
    return formatted;
  }, [lockedTokensUi, stakedBalance, isBalanceRefreshing]);

  const honeyBalance = useMemo(() => {
    // Reads sandbox_gold via the goldRaw state — the redux gameToken value
    // tracked the wallet token balance, which is removed in the sandbox.
    const num = Number(goldRaw || 0);
    if (isNaN(num)) return "-";
    if (num >= 1_000_000_000) return Math.floor(num / 1_000_000_000) + "B";
    if (num >= 1_000_000) return Math.floor(num / 1_000_000) + "M";
    if (num >= 1_000) return Math.floor(num).toLocaleString('en-US');
    return Math.floor(num).toString();
  }, [goldRaw]);

  return (
    <div className="profile-bar" style={{ display: isFarmMenu ? 'none' : 'flex' }}>
      <Avatar />
      <div className="profile-bar-content">
        <div className="profile-bar-content-top">
          <ProfileView username={userData?.name} />
          {/* ACHIEVEMENTS BUTTON - hidden for now, re-enable when ready
          <ProfileButton
            icon={<span style={{ fontSize: "22px", lineHeight: 1 }}>🏆</span>}
            title="Achievements"
            bg="/images/profile_bar/profile_button_bg.png"
            onClick={() => setIsAchievementsOpen(true)}
          />
          AchievementsDialog is imported from src/containers/AchievementsDialog/
          State: isAchievementsOpen / setIsAchievementsOpen (already declared in this file)
          */}
          {![0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].includes(tutorialStep) && (
            <ProfileButton
              icon={<img alt="Inventory" src="/images/profile_bar/btn_inventory.png" />}
              title="Inventory"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => { if (inTutorial) return; setIsInventoryDialog(true); }}
            />
          )}
          {![0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].includes(tutorialStep) && (
            <div style={{ position: 'relative', left: '8px', top: '-1px' }}>
              <ProfileButton
                icon={
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <style>{`@keyframes mailShake { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(8deg)} 60%{transform:rotate(-6deg)} 80%{transform:rotate(6deg)} }`}</style>
                    <img
                      alt="Mail"
                      src="/images/mail/realmail.png"
                      style={{ width: '32px', height: '32px', objectFit: 'contain', animation: hasUnreadMail ? 'mailShake 1.2s infinite ease-in-out' : 'none' }}
                    />
                    {hasUnreadMail
                      ? <img src="/images/mail/!.png" alt="!" className="badge-pulse" style={{ position: 'absolute', top: '-14px', right: '-14px', width: '20px', height: '20px', pointerEvents: 'none' }} draggable={false} />
                      : hasReadyQuests && <img src="/images/farming/checkmark.png" alt="✓" className="badge-pulse" style={{ position: 'absolute', top: '-14px', right: '-14px', width: '20px', height: '20px', pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))', animation: 'badge-pulse 0.9s infinite ease-in-out' }} draggable={false} />
                    }
                  </div>
                }
                title="Mail"
                bg="/images/profile_bar/profile_button_bg.png"
                onClick={() => window.dispatchEvent(new CustomEvent('openMailbox'))}
              />
            </div>
          )}
          {![0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].includes(tutorialStep) && (
            <div style={{ position: 'relative', top: '52px', marginLeft: '-92px' }}>
              <ProfileButton
                icon={<img alt="Settings" src="/images/profile_bar/btn_setting.png" />}
                title="Settings"
                bg="/images/profile_bar/profile_button_bg.png"
                onClick={() => setIsSettingsDialog(true)}
              />
            </div>
          )}
          {![0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].includes(tutorialStep) && (
            <div style={{ position: 'relative', top: '51.5px', marginLeft: '8px' }} className="news-btn-wrapper">
              <style>{`.news-btn-wrapper .pb-bg { top: calc(50% - 1px); }`}</style>
              <ProfileButton
                icon={<img alt="News" src="/images/news/news.png" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />}
                title="News"
                bg="/images/profile_bar/profile_button_bg.png"
                onClick={() => { setNewsView('welcome'); setIsNewsOpen(true); }}
              />
            </div>
          )}
          <div style={{ display: 'none' }}>
            <ProfileButton
              icon={<img alt="Test Mint" src="/images/profile_bar/btn_inventory.png" />}
              title="Test Mint"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => prodMint(0)}
              disabled={prodMintLoading}
            />
            <ProfileButton
              icon={<img alt="Test Mint" src="/images/profile_bar/btn_inventory.png" />}
              title="Test Mint"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => prodMint(1)}
              disabled={prodMintLoading}
            />
            <ProfileButton
              icon={<img alt="Test Mint" src="/images/profile_bar/btn_inventory.png" />}
              title="Test Mint"
              bg="/images/profile_bar/profile_button_bg.png"
              onClick={() => prodMint(2)}
              disabled={prodMintLoading}
            />
          </div>
        </div>
        <div className={`resource-badge ${inTutorial ? 'no-hover' : ''}`} key={balanceKey} style={{ cursor: 'pointer' }}>
          <ProfileButton
            icon={<img alt="Honey Balance" src="/images/profile_bar/hny.png" />}
            text={isBalanceRefreshing ? "••••••" : honeyBalance}
            title="Honey Balance"
            className={isBalanceRefreshing ? "balance-loading" : ""}
            bg="/images/profile_bar/profile_badge_bg.png"
          />
          <div
            onClick={() => { if (inTutorial) return; setShopInitialTab(1); setIsShopOpen(true); }}
          >
            <ProfileButton
              icon={<img src="/images/profile_bar/diamond.png" alt="Gems" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />}
              text={Number(gems).toLocaleString('en-US')}
              title="Gems"
              bg="/images/profile_bar/profile_badge_bg.png"
            />
          </div>
        </div>
      </div>
      {isInventoryDialog && (
        <InventoryDialog
          onClose={() => setIsInventoryDialog(false)}
        ></InventoryDialog>
      )}
      {isSettingsDialog && (
        <SettingsDialog
          onClose={() => setIsSettingsDialog(false)}
        ></SettingsDialog>
      )}
      {isShopOpen && (
        <Shop onClose={() => setIsShopOpen(false)} initialTab={shopInitialTab} />
      )}
      {isAchievementsOpen && (
        <AchievementsDialog onClose={() => setIsAchievementsOpen(false)} />
      )}
      {isNewsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
          }}
          onClick={() => setIsNewsOpen(false)}
        >
          <div
            style={{ position: 'relative', display: 'inline-block' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/images/news/newsbackground.png"
              alt="News"
              draggable={false}
              style={{ display: 'block', maxHeight: '90vh', maxWidth: '90vw', userSelect: 'none' }}
            />

            {/* Right-column content panel — switches based on the active tab. */}
            <div
              style={{
                position: 'absolute',
                top: '20%',
                left: '28%',
                width: '67%',
                bottom: '6%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#fff',
                fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                pointerEvents: 'none',
              }}
            >
              {newsView === 'feedback' && (
                <>
                  <img
                    src="/images/transition/hvlogo.png"
                    alt="Honey Valleys"
                    draggable={false}
                    style={{
                      width: '42%',
                      height: 'auto',
                      objectFit: 'contain',
                      marginTop: '3%',
                      userSelect: 'none',
                    }}
                  />
                  <img
                    src="/images/news/feedbackform.png"
                    alt="Feedback Form"
                    draggable={false}
                    style={{
                      width: '50%',
                      height: 'auto',
                      objectFit: 'contain',
                      marginTop: '2%',
                      userSelect: 'none',
                    }}
                  />
                  <img
                    src="/images/news/gotfeedback.png"
                    alt="Got feedback? We'd love to hear it!"
                    draggable={false}
                    style={{
                      width: '60%',
                      height: 'auto',
                      objectFit: 'contain',
                      marginTop: '2%',
                      userSelect: 'none',
                    }}
                  />

                  {/* feedbackbox.png is the outer panel; feedbacktop (subject row)
                      and feedbackbottom (description row) sit on top of it. */}
                  <div style={{ position: 'relative', width: '88%', marginTop: 'calc(3% + 15px)', marginLeft: 30 }}>
                    <img
                      src="/images/news/feedbackbox.png"
                      alt=""
                      draggable={false}
                      style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none', transform: 'translateY(5px)' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        padding: '5% 5%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4%',
                      }}
                    >
                      {/* Subject row — feedbacktop.png with input + label-image overlay. */}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <img
                          src="/images/news/feedbacktop.png"
                          alt=""
                          draggable={false}
                          style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
                        />
                        {!feedbackSubject && (
                          <img
                            src="/images/news/subject.png"
                            alt="Subject"
                            draggable={false}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '4%',
                              transform: 'translateY(-50%)',
                              height: '60%',
                              width: 'auto',
                              objectFit: 'contain',
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                          />
                        )}
                        <input
                          type="text"
                          value={feedbackSubject}
                          onChange={(e) => setFeedbackSubject(e.target.value)}
                          maxLength={120}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            padding: '0 4%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                            fontSize: '2vmin',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 0 #000',
                            pointerEvents: 'auto',
                          }}
                        />
                      </div>

                      {/* Description row — feedbackbottom.png with textarea + label-image overlay. */}
                      <div style={{ position: 'relative', width: '100%', flex: 1 }}>
                        <img
                          src="/images/news/feedbackbottom.png"
                          alt=""
                          draggable={false}
                          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill', userSelect: 'none' }}
                        />
                        {!feedbackDescription && (
                          <img
                            src="/images/news/description.png"
                            alt="Description (Max 600 characters)"
                            draggable={false}
                            style={{
                              position: 'absolute',
                              top: '4%',
                              left: '4%',
                              height: '14%',
                              width: 'auto',
                              objectFit: 'contain',
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                          />
                        )}
                        <textarea
                          value={feedbackDescription}
                          onChange={(e) => setFeedbackDescription(e.target.value.slice(0, 600))}
                          maxLength={600}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            padding: '3% 4%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            color: '#fff',
                            fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                            fontSize: '2vmin',
                            fontWeight: 'bold',
                            lineHeight: 1.4,
                            textShadow: '1px 1px 0 #000',
                            pointerEvents: 'auto',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT button. */}
                  <div
                    onClick={() => {
                      const subject = feedbackSubject.trim();
                      const description = feedbackDescription.trim();
                      if (!subject || !description || feedbackSubmitting) return;
                      setFeedbackSubmitting(true);
                      try { console.log('[feedback]', { subject, description }); } catch (_) {}
                      setFeedbackSubject('');
                      setFeedbackDescription('');
                      setTimeout(() => setFeedbackSubmitting(false), 800);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(255,220,100,0.85))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'none';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                      e.currentTarget.style.filter = 'brightness(0.9)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(255,220,100,0.85))';
                    }}
                    style={{
                      marginTop: '2%',
                      padding: '1.2vmin 6vmin',
                      borderRadius: 12,
                      background: 'linear-gradient(180deg, #5fb7e5 0%, #2e7fb5 100%)',
                      border: '3px solid #6a3f1a',
                      boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                      fontSize: '1.6vmin',
                      letterSpacing: '0.08em',
                      textShadow: '2px 2px 0 #000',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                    }}
                  >
                    {feedbackSubmitting ? 'SENDING…' : 'SUBMIT'}
                  </div>
                </>
              )}
              {newsView === 'socials' && (
                <div
                  style={{
                    width: '88%',
                    marginTop: 'calc(6% - 20px)',
                    marginLeft: 38,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2%',
                    pointerEvents: 'auto',
                  }}
                >
                  {[
                    { src: '/images/news/insta.png',   alt: 'Instagram', url: 'https://www.instagram.com/playhoneyland' },
                    { src: '/images/news/tiktok.png',  alt: 'TikTok',    url: 'https://www.tiktok.com/@playhoneyland' },
                    { src: '/images/news/youtube.png', alt: 'YouTube',   url: 'https://www.youtube.com/@PlayHoneyland' },
                    { src: '/images/news/twitter.png', alt: 'Twitter',   url: 'https://x.com/PlayHoneyland' },
                  ].map((s) => (
                    <img
                      key={s.alt}
                      src={s.src}
                      alt={s.alt}
                      draggable={false}
                      onClick={() => window.open(s.url, '_blank', 'noopener,noreferrer')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.06)';
                        e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(255,220,100,0.85))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.filter = 'none';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.96)';
                        e.currentTarget.style.filter = 'brightness(0.9)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1.06)';
                        e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(255,220,100,0.85))';
                      }}
                      style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                      }}
                    />
                  ))}
                </div>
              )}
              {newsView === 'community' && (
                <>
                  <img
                    src="/images/news/join.png"
                    alt="Join the Hive in our Discord!"
                    draggable={false}
                    style={{
                      width: '88%',
                      height: 'auto',
                      objectFit: 'contain',
                      marginTop: 'calc(4% - 11px)',
                      marginLeft: 38,
                      userSelect: 'none',
                    }}
                  />
                  <img
                    src="/images/news/takemethere.png"
                    alt="Take me there"
                    draggable={false}
                    onClick={() => window.open('https://discord.gg/2CMnKEhGpY', '_blank', 'noopener,noreferrer')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(255,220,100,0.85))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'none';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                      e.currentTarget.style.filter = 'brightness(0.9)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.filter = 'brightness(1.1) drop-shadow(0 0 8px rgba(255,220,100,0.85))';
                    }}
                    style={{
                      width: '60%',
                      height: 'auto',
                      objectFit: 'contain',
                      marginTop: 'calc(5% - 100px)',
                      marginLeft: 35,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                    }}
                  />
                </>
              )}
            </div>

            {/* Tab buttons — stacked vertically in the left column. Active one
                stays bright + glowing; inactive ones dim slightly. */}
            <div
              style={{
                position: 'absolute',
                top: '14%',
                bottom: '7%',
                left: '6%',
                width: '24%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                pointerEvents: 'none',
              }}
            >
              {[
                { key: 'welcome',   src: '/images/news/welcome.png' },
                { key: 'community', src: '/images/news/community.png' },
                { key: 'socials',   src: '/images/news/socials.png' },
                { key: 'feedback',  src: '/images/news/feedback.png' },
              ].map((tab, i) => {
                const active = newsView === tab.key;
                return (
                  <img
                    key={tab.key}
                    src={tab.src}
                    alt={tab.key}
                    draggable={false}
                    onClick={() => setNewsView(tab.key)}
                    onMouseEnter={(e) => {
                      if (active) return;
                      e.currentTarget.style.transform = 'scale(1.06)';
                      e.currentTarget.style.filter = 'brightness(1.05) drop-shadow(0 0 6px rgba(255,220,100,0.7))';
                    }}
                    onMouseLeave={(e) => {
                      if (active) return;
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'brightness(0.7) saturate(0.85)';
                    }}
                    style={{
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      userSelect: 'none',
                      marginTop: i === 0 ? 40 : 0,
                      marginBottom: i === 3 ? 20 : 0,
                      transform: active ? 'scale(1.05)' : 'scale(1)',
                      filter: active
                        ? 'brightness(1.15) drop-shadow(0 0 8px rgba(255,220,100,0.95))'
                        : 'brightness(0.7) saturate(0.85)',
                      transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                    }}
                  />
                );
              })}
            </div>

            <img
              src="/images/leaderboard/x.png"
              alt="Close"
              draggable={false}
              onClick={() => setIsNewsOpen(false)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; e.currentTarget.style.filter = 'brightness(0.8)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.filter = 'brightness(1.25)'; }}
              style={{
                position: 'absolute',
                top: 78,
                right: -19,
                width: 60,
                height: 60,
                cursor: 'pointer',
                objectFit: 'contain',
                pointerEvents: 'auto',
                transition: 'transform 0.1s, filter 0.1s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileBar;
