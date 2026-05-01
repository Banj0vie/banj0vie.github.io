import React, { useEffect, useState, useRef } from 'react';

/**
 * Listens for a global `playerPullNoti` event and shows the matching rarity banner+box.
 *
 * Trigger from anywhere:
 *   window.dispatchEvent(new CustomEvent('playerPullNoti', {
 *     detail: { rarity: 'legendary', itemImage: '/path/to/item.png', itemName: 'Pomegranate' }
 *   }));
 *
 * Accepted rarity values: 'rare', 'epic', 'legendary' (case-insensitive).
 */
const RARITY_TO_ASSETS = {
  rare: {
    banner: '/images/notifications/player%20pull/rare/rarebanner.png',
    box:    '/images/notifications/player%20pull/rare/rarebox.png',
  },
  epic: {
    banner: '/images/notifications/player%20pull/epic/epicbanner.png',
    box:    '/images/notifications/player%20pull/epic/epicbox.png',
  },
  legendary: {
    banner: '/images/notifications/player%20pull/legendary/legbanner.png',
    box:    '/images/notifications/player%20pull/legendary/legbox.png',
  },
};

// Maps a crop name to its seed folder and file prefix.
// Folder and prefix can differ (e.g. Banana → bananaseed/ban<rarity>.png).
const CROP_SEED_PATHS = {
  Apple:         { folder: 'appleseed',      prefix: 'apple' },
  Avocado:       { folder: 'avocadoseed',    prefix: 'avocado' },
  Banana:        { folder: 'bananaseed',     prefix: 'ban' },
  Blueberry:     { folder: 'blueberryseed',  prefix: 'blueberry' },
  'Bok Choy':    { folder: 'bochoyseed',     prefix: 'boc' },
  Bokchoy:       { folder: 'bochoyseed',     prefix: 'boc' },
  Broccoli:      { folder: 'brocseed',       prefix: 'broc' },
  Cauliflower:   { folder: 'califlowerseed', prefix: 'califlower' },
  Carrot:        { folder: 'carrotseed',     prefix: 'carrot' },
  Celery:        { folder: 'celseed',        prefix: 'cel' },
  Corn:          { folder: 'cornseed',       prefix: 'corn' },
  'Dragon Fruit':{ folder: 'dragonfruitseed', prefix: 'drag' },
  Dragonfruit:   { folder: 'dragonfruitseed', prefix: 'drag' },
  Eggplant:      { folder: 'eggplantseed',   prefix: 'egg' },
  Grape:         { folder: 'grapeseed',      prefix: 'grape' },
  Grapes:        { folder: 'grapeseed',      prefix: 'grape' },
  Lavender:      { folder: 'lavendarseed',   prefix: 'lav' },
  Lettuce:       { folder: 'lettuceseed',    prefix: 'lettuce' },
  Lychee:        { folder: 'lycheeseed',     prefix: 'ly' },
  Lichi:         { folder: 'lycheeseed',     prefix: 'ly' },
  Mango:         { folder: 'mangoseed',      prefix: 'mango' },
  Onion:         { folder: 'onseed',         prefix: 'on' },
  Papaya:        { folder: 'papyaseed',      prefix: 'pap' },
  Pepper:        { folder: 'pepperseed',     prefix: 'pepper' },
  Pineapple:     { folder: 'pineseed',       prefix: 'pine' },
  Pomegranate:   { folder: 'pomseed',        prefix: 'pom' },
  Potato:        { folder: 'potseed',        prefix: 'pot' },
  Pumpkin:       { folder: 'pumpkinseed',    prefix: 'pumpkin' },
  Radish:        { folder: 'raddishseed',    prefix: 'raddish' },
  Tomato:        { folder: 'tomatoseed',     prefix: 'tom' },
  Turnip:        { folder: 'turnipseed',     prefix: 'turnip' },
  Wheat:         { folder: 'wheatseed',      prefix: 'wheat' },
};

const RARITY_TO_FILE_CODE = { rare: 'rare', epic: 'epic', legendary: 'leg' };

// Returns the seed-art image for a (cropName, rarity).
const getSeedImage = (cropName, rarity) => {
  const data = CROP_SEED_PATHS[cropName];
  const code = RARITY_TO_FILE_CODE[rarity];
  if (!data || !code) return null;
  return `/images/seeds/${data.folder}/${data.prefix}${code}.png`;
};

// Default per-crop "grew" image — what shows in the notification box when a crop is harvested.
// File naming has some quirks (banana → defultbanaa, broccoli → defultbroc, etc.).
const CROP_DEFAULT_IMAGES = {
  Apple:         '/images/crops/new/apple/defultapple.png',
  Avocado:       '/images/crops/new/avocado/defultavocado.png',
  Banana:        '/images/crops/new/banana/defultbanaa.png',
  Blueberry:     '/images/crops/new/blueberry/defultblueberry.png',
  'Bok Choy':    '/images/crops/new/wheat/defultbokchoy.png',
  Bokchoy:       '/images/crops/new/wheat/defultbokchoy.png',
  Broccoli:      '/images/crops/new/brocoli/defultbroc.png',
  Cauliflower:   '/images/crops/new/califlower/defultcaliflower.png',
  Carrot:        '/images/crops/new/carrot/defultcarrot.png',
  Celery:        '/images/crops/new/cellary/defultcellary.png',
  Cabbage:       '/images/crops/new/cellary/defultcellary.png', // labeled "Celery" in produce
  Corn:          '/images/crops/new/corn/defultcorn.png',
  'Dragon Fruit':'/images/crops/new/dragonfruit/defultdragon.png',
  Dragonfruit:   '/images/crops/new/dragonfruit/defultdragon.png',
  Eggplant:      '/images/crops/new/eggplant/defulteggplant.png',
  Grape:         '/images/crops/new/grape/defultgrape.png',
  Grapes:        '/images/crops/new/grape/defultgrape.png',
  Lavender:      '/images/crops/new/lavendar/defultlavendar.png',
  Lettuce:       '/images/crops/new/lettuce/defultlettuce.png',
  Lychee:        '/images/crops/new/lychee/defultlychee.png',
  Lichi:         '/images/crops/new/lychee/defultlychee.png',
  Mango:         '/images/crops/new/mango/defultmango.png',
  Onion:         '/images/crops/new/onion/defultonion.png',
  Papaya:        '/images/crops/new/papaya/defultpapaya.png',
  Pepper:        '/images/crops/new/pepper/defultpepper.png',
  Pineapple:     '/images/crops/new/pineapple/defultpineapple.png',
  Pomegranate:   '/images/crops/new/pomagrante/defultpom.png',
  Potato:        '/images/crops/new/potato/defultpotato.png',
  Pumpkin:       '/images/crops/new/pumpkin/defultpumpkin.png',
  Radish:        '/images/crops/new/raddish/defultraddish.png',
  Tomato:        '/images/crops/new/tomato/defulttomato.png',
  Turnip:        '/images/crops/new/turnip/defultturnip.png',
  Wheat:         '/images/crops/new/wheat/defultwheat.png',
};

const getCropDefaultImage = (cropName) => CROP_DEFAULT_IMAGES[cropName] || null;

const PlayerPullNotification = () => {
  const [activeRarity, setActiveRarity] = useState(null);
  const [exiting, setExiting] = useState(false);
  const dismissTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    // Suppress all pull notifications (real + sim) until the tutorial is finished.
    const isTutorialActive = () => {
      const step = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
      return step < 36;
    };
    // Suppress while a mail letter is open or a cutscene is playing so popups don't distract the user.
    const isLetterOpen = () => document.body.getAttribute('data-letter-open') === 'true';
    const isCutsceneActive = () => document.body.getAttribute('data-cutscene-active') === 'true';
    const isBankOpen = () => document.body.getAttribute('data-bank-open') === 'true';
    const isSuppressed = () => isTutorialActive() || isLetterOpen() || isCutsceneActive() || isBankOpen();

    const onPull = (e) => {
      if (isSuppressed()) return;
      const raw = (e?.detail?.rarity || '').toString().toLowerCase();
      if (!RARITY_TO_ASSETS[raw]) return;
      setExiting(false);
      setActiveRarity({
        rarity: raw,
        itemImage: e?.detail?.itemImage || null,
        itemName:  e?.detail?.itemName  || null,
        username:  e?.detail?.username  || (localStorage.getItem('sandbox_username') || 'Player'),
        action:    e?.detail?.action    || 'pulled', // 'pulled' (seeds/items) or 'grew' (crops)
        tag:       e?.detail?.tag       || null,    // optional: 'heaviest_day' | 'heaviest_crop'
        weight:    e?.detail?.weight    || null,    // grams, for heaviest tags
      });
      clearTimeout(dismissTimerRef.current);
      clearTimeout(exitTimerRef.current);
      // After the swing-in (~4.6s) plus ~1.4s read time, trigger the swing-out.
      dismissTimerRef.current = setTimeout(() => {
        setExiting(true);
        exitTimerRef.current = setTimeout(() => {
          setExiting(false);
          setActiveRarity(null);
        }, 1100);
      }, 6000);
    };
    window.addEventListener('playerPullNoti', onPull);

    // When a mail letter opens, immediately tear down any visible notification so it
    // doesn't sit on top of the letter dialog distracting the reader.
    const onLetterOpened = () => {
      clearTimeout(dismissTimerRef.current);
      clearTimeout(exitTimerRef.current);
      setExiting(false);
      setActiveRarity(null);
    };
    window.addEventListener('letterOpened', onLetterOpened);

    // Dev/test helper: window.testPullNoti('rare' | 'epic' | 'legendary')
    if (typeof window !== 'undefined') {
      window.testPullNoti = (rarity = 'legendary') => {
        window.dispatchEvent(new CustomEvent('playerPullNoti', {
          detail: { rarity, itemName: `Test ${rarity}` },
        }));
      };
    }

    // Simulation — fakes other-player pulls/grows for ambient activity feel.
    const SIM_NAMES = {
      rare:      ['Pumpkin', 'Eggplant', 'Tomato', 'Carrot', 'Pepper', 'Broccoli', 'Cauliflower', 'Grapes'],
      epic:      ['Dragon Fruit', 'Mango', 'Pineapple', 'Lychee', 'Papaya', 'Lavender'],
      legendary: ['Avocado', 'Pomegranate', 'Banana', 'Blueberry', 'Apple'],
    };
    const SIM_USERS = ['FarmKing', 'SunSue', 'TaterTot', 'CropTop', 'HarvestMoon', 'PlowMaster', 'GoldenRow', 'SeedWhisperer', 'VeggieVibes', 'GreenThumb', 'BumperCrop', 'CornQueen'];
    const RARITIES = ['rare', 'epic', 'legendary'];
    const ACTIONS = ['pulled', 'grew'];
    let simTimer;
    const fireOne = () => {
      // Skip the fire while tutorial is active OR a letter is open, but keep polling so we resume right after.
      if (!isSuppressed()) {
        const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)];
        const name   = SIM_NAMES[rarity][Math.floor(Math.random() * SIM_NAMES[rarity].length)];
        const user   = SIM_USERS[Math.floor(Math.random() * SIM_USERS.length)];
        const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        window.dispatchEvent(new CustomEvent('playerPullNoti', {
          detail: { rarity, itemName: name, username: user, action },
        }));
        // After display (~6s + 1.1s slide-out) + ~1.5s gap → schedule next.
        simTimer = setTimeout(fireOne, 6000 + 1100 + 1500);
      } else {
        simTimer = setTimeout(fireOne, 1500);
      }
    };
    simTimer = setTimeout(fireOne, 3000 + Math.random() * 4000);

    return () => {
      window.removeEventListener('playerPullNoti', onPull);
      window.removeEventListener('letterOpened', onLetterOpened);
      clearTimeout(dismissTimerRef.current);
      clearTimeout(exitTimerRef.current);
      clearTimeout(simTimer);
    };
  }, []);

  if (!activeRarity) return null;

  const { rarity, itemImage, itemName, username, action, tag, weight } = activeRarity;
  const RARITY_COLOR = { rare: '#3aa0ff', epic: '#b85cff', legendary: '#ffd13a' };
  const rarityColor = RARITY_COLOR[rarity] || '#fff';
  const verbPhrase = action === 'grew' ? 'just grew a' : 'pulled a';
  const formatWeight = (w) => (w >= 1000 ? `${(w / 1000).toFixed(2)}kg` : `${w}g`);
  // 'pulled' → rarity-specific seed art from /images/seeds/...
  // 'grew'   → per-crop default image from /images/crops/new/<crop>/defult*.png
  const resolvedItemImage = action === 'pulled'
    ? (getSeedImage(itemName, rarity) || itemImage)
    : (getCropDefaultImage(itemName) || itemImage || getSeedImage(itemName, rarity));

  const dismiss = () => {
    clearTimeout(dismissTimerRef.current);
    clearTimeout(exitTimerRef.current);
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setExiting(false);
      setActiveRarity(null);
    }, 1100);
  };

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200001,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'auto',
        cursor: 'pointer',
        perspective: '900px',           // gives the rotateX swing real depth
        perspectiveOrigin: '50% 0%',    // viewpoint sits above the hook
      }}
    >
      <style>{`
        /* Sign descends on a rope from off-screen above — face-down throughout the rope
           paying out — then snaps into the swing-up to present once the rope's end is reached.
           Per-keyframe timing functions chain the descent → swing → decay seamlessly with
           no perceivable pause: the descent eases-in (gathers speed toward the rope's end),
           the swing eases-out (snaps up then slows at the apex), decay flows naturally. */
        @keyframes pullNotiSwingIn {
          /* Off-screen above, face-down on the rope. */
          0%   { transform: translateY(-220%) rotateX(-95deg); opacity: 1;
                 animation-timing-function: cubic-bezier(0.55, 0, 0.85, 0.4); }
          /* Rope reaches end — sign is at rest Y, still face-down. */
          50%  { transform: translateY(0)     rotateX(-90deg);
                 animation-timing-function: cubic-bezier(0.2, 0.4, 0.3, 1); }
          /* Snap into swing-up — rotation accelerates past flat. */
          70%  { transform: translateY(0)     rotateX(22deg);
                 animation-timing-function: ease-in-out; }
          /* Back-and-forth depth decay as the rope settles. */
          81%  { transform: translateY(0)     rotateX(-12deg); }
          90%  { transform: translateY(0)     rotateX(6deg); }
          96%  { transform: translateY(0)     rotateX(-2deg); }
          100% { transform: translateY(0)     rotateX(0deg); }
        }
        @keyframes pullNotiSwingOut {
          0%   { transform: translateY(0)     rotateX(0deg);   opacity: 1; }
          25%  { transform: translateY(0)     rotateX(15deg);  opacity: 1; }
          100% { transform: translateY(-220%) rotateX(-95deg); opacity: 0; }
        }
        @keyframes pullNotiGleam {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(255,220,100,0.7)) drop-shadow(0 0 28px rgba(255,180,40,0.5)); }
          50%      { filter: drop-shadow(0 0 22px rgba(255,220,100,0.95)) drop-shadow(0 0 44px rgba(255,180,40,0.85)); }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px',
          marginTop: '12px',
          // Pendulum swing — pivot from the top so it reads as "hanging in from the ceiling".
          transformOrigin: 'top center',
          animation: exiting
            ? 'pullNotiSwingOut 1.1s ease-in forwards'
            : 'pullNotiSwingIn 4.4s linear both',
        }}
      >
        {/* Box (with the item image overlaid inside its central area) */}
        <div style={{ position: 'relative', display: 'inline-block', transform: 'translateX(3px)' }}>
          <img
            src={RARITY_TO_ASSETS[rarity].box}
            alt={`${rarity} box`}
            draggable={false}
            style={{
              display: 'block',
              maxWidth: '9vw',
              maxHeight: '5.5vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
          {resolvedItemImage && (
            <img
              src={resolvedItemImage}
              alt={itemName || ''}
              draggable={false}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
                objectFit: 'contain',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Banner (with the item name overlaid inside) */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={RARITY_TO_ASSETS[rarity].banner}
            alt={`${rarity} banner`}
            draggable={false}
            style={{
              display: 'block',
              maxWidth: '36vw',
              maxHeight: '5.5vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
          {itemName && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'GROBOLD, Cartoonist, sans-serif',
                fontSize: 'clamp(7px, 0.75vw, 10px)',
                color: '#fff',
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {tag === 'heaviest_day' ? (
                <>
                  <span style={{ color: '#ffa53a' }}>{username}</span>
                  {' grew the '}
                  <span style={{ color: rarityColor }}>HEAVIEST</span>
                  {' crop today! '}
                  {weight && formatWeight(weight)}
                </>
              ) : tag === 'heaviest_crop' ? (
                <>
                  <span style={{ color: '#ffa53a' }}>{username}</span>
                  {' grew the '}
                  <span style={{ color: rarityColor }}>HEAVIEST</span>
                  {' '}{itemName}{' ever! '}
                  {weight && formatWeight(weight)}
                </>
              ) : (
                <>
                  <span style={{ color: '#ffa53a' }}>{username}</span>
                  {' '}{verbPhrase}{' '}
                  <span style={{ color: rarityColor }}>{rarity.toUpperCase()}</span>
                  {' '}{itemName}{action === 'pulled' ? ' seed' : ''}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPullNotification;
