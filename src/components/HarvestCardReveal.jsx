import React, { useEffect, useRef, useState } from "react";
import { CARD_FRONT_IMAGES, getBaseAndRarity } from "../containers/Market_Vendor/PokemonPackRipDialog";
import { ID_SEEDS } from "../constants/app_ids";

// Crop-card images keyed by [baseSeedId][rarityLevel]. Distinct from CARD_FRONT_IMAGES
// which holds the seed-pack art used by the vendor pack-rip flow. The harvest reveal
// + inventory/bank popup use these so the player sees the *crop* card, not the seed.
//
// File-naming is unfortunately inconsistent across crops — each entry below points to
// whatever filename actually exists in /public/images/cardfront/<folder>/.
export const CROP_CARD_IMAGES = {
  [ID_SEEDS.ONION]: {
    1: "/images/cardfront/onioncard/onioncom.png",
    2: "/images/cardfront/onioncard/uncomonion.png",
    3: "/images/cardfront/onioncard/rareonion.png",
    4: "/images/cardfront/onioncard/epiconion.png",
    5: "/images/cardfront/onioncard/legonion.png",
  },
  [ID_SEEDS.POTATO]: {
    1: "/images/cardfront/potatocard/potatocom.png",
    2: "/images/cardfront/potatocard/uncompotato.png",
    3: "/images/cardfront/potatocard/rarepotato.png",
    4: "/images/cardfront/potatocard/epicpotato.png",
    5: "/images/cardfront/potatocard/legpotato.png",
  },
  [ID_SEEDS.BLUEBERRY]: {
    1: "/images/cardfront/blueberry/bbcom.png",
    2: "/images/cardfront/blueberry/uncomblueberry.png",
    3: "/images/cardfront/blueberry/rareblueberry.png",
    4: "/images/cardfront/blueberry/epicblueberry.png",
    5: "/images/cardfront/blueberry/legblueberry.png",
  },
  [ID_SEEDS.BROCCOLI]: {
    1: "/images/cardfront/broccoli/broccom.png",
    2: "/images/cardfront/broccoli/uncombroc.png",
    3: "/images/cardfront/broccoli/rarebroccoli.png",
    4: "/images/cardfront/broccoli/epicbroccoli.png",
    5: "/images/cardfront/broccoli/legbroccoli.png",
  },
  [ID_SEEDS.CELERY]: {
    1: "/images/cardfront/celery/celcom.png",
    2: "/images/cardfront/celery/uncomcelery.png",
    3: "/images/cardfront/celery/rarecelery.png",
    4: "/images/cardfront/celery/epiccelery.png",
    5: "/images/cardfront/celery/legcelery.png",
  },
  [ID_SEEDS.GRAPES]: {
    1: "/images/cardfront/grape/grapecom.png",
    2: "/images/cardfront/grape/uncomgrape.png",
    3: "/images/cardfront/grape/raregrape.png",
    4: "/images/cardfront/grape/epicgrape.png",
    5: "/images/cardfront/grape/leggrape.png",
  },
  [ID_SEEDS.PEPPER]: {
    1: "/images/cardfront/pepper/peppercom.png",
    2: "/images/cardfront/pepper/uncompepper.png",
    3: "/images/cardfront/pepper/rarepepper.png",
    4: "/images/cardfront/pepper/epicpepper.png",
    5: "/images/cardfront/pepper/legpepper.png",
  },
  [ID_SEEDS.PINEAPPLE]: {
    1: "/images/cardfront/pineapplecard/pineapplecom.png",
    2: "/images/cardfront/pineapplecard/uncompineapple.png",
    3: "/images/cardfront/pineapplecard/rarepineapple.png",
    4: "/images/cardfront/pineapplecard/epicpineapple.png",
    5: "/images/cardfront/pineapplecard/legpineapple.png",
  },
  [ID_SEEDS.MANGO]: {
    1: "/images/cardfront/mango/mangocom.png",
    2: "/images/cardfront/mango/uncommango.png",
    3: "/images/cardfront/mango/raremango.png",
    4: "/images/cardfront/mango/epicmango.png",
    5: "/images/cardfront/mango/legmango.png",
  },
  [ID_SEEDS.PAPAYA]: {
    1: "/images/cardfront/papaya/papayacom.png",
    2: "/images/cardfront/papaya/uncompapaya.png",
    3: "/images/cardfront/papaya/rarepapaya.png",
    4: "/images/cardfront/papaya/epicpapaya.png",
    5: "/images/cardfront/papaya/legpapaya.png",
  },
  [ID_SEEDS.PUMPKIN]: {
    1: "/images/cardfront/pumpkin/pumpcom.png",
    2: "/images/cardfront/pumpkin/uncompumpkin.png",
    3: "/images/cardfront/pumpkin/rarepumpkin.png",
    4: "/images/cardfront/pumpkin/epicpumpkin.png",
    5: "/images/cardfront/pumpkin/legpumpkin.png",
  },
  [ID_SEEDS.TOMATO]: {
    1: "/images/cardfront/tomato/tomatocom.png",
    2: "/images/cardfront/tomato/uncomtomato.png",
    3: "/images/cardfront/tomato/raretomato.png",
    4: "/images/cardfront/tomato/epictomato.png",
    5: "/images/cardfront/tomato/legtomato.png",
  },
  [ID_SEEDS.TURNIP]: {
    1: "/images/cardfront/turnip/turcom.png",
    2: "/images/cardfront/turnip/uncomturnip.png",
    3: "/images/cardfront/turnip/rareturnip.png",
    4: "/images/cardfront/turnip/epicturnip.png",
    5: "/images/cardfront/turnip/legturnip.png",
  },
  [ID_SEEDS.DRAGON_FRUIT]: {
    1: "/images/cardfront/dragonfruit/dragcom.png",
    2: "/images/cardfront/dragonfruit/uncomdragonfruit.png",
    3: "/images/cardfront/dragonfruit/raredragonfruit.png",
    4: "/images/cardfront/dragonfruit/epicdragonfruit.png",
    5: "/images/cardfront/dragonfruit/legdragonfruit.png",
  },
  [ID_SEEDS.LETTUCE]: {
    1: "/images/cardfront/lettuce/lettucecom.png",
    2: "/images/cardfront/lettuce/uncomlettuce.png",
    3: "/images/cardfront/lettuce/rarelettuce.png",
    4: "/images/cardfront/lettuce/epiclettuce.png",
    5: "/images/cardfront/lettuce/leglettuce.png",
  },
  [ID_SEEDS.LICHI]: {
    1: "/images/cardfront/lychee/lycom.png",
    2: "/images/cardfront/lychee/uncomlychee.png",
    3: "/images/cardfront/lychee/rarelychee.png",
    4: "/images/cardfront/lychee/epiclychee.png",
    5: "/images/cardfront/lychee/leglychee.png",
  },
  [ID_SEEDS.RADISH]: {
    1: "/images/cardfront/radish/radcom.png",
    2: "/images/cardfront/radish/uncomradish.png",
    3: "/images/cardfront/radish/rareradish.png",
    4: "/images/cardfront/radish/epicradish.png",
    5: "/images/cardfront/radish/legradish.png",
  },
  [ID_SEEDS.AVOCADO]: {
    1: "/images/cardfront/avocado/avocom.png",
    2: "/images/cardfront/avocado/uncomavocado.png",
    3: "/images/cardfront/avocado/rareavocado.png",
    4: "/images/cardfront/avocado/epicavocado.png",
    5: "/images/cardfront/avocado/legavocado.png",
  },
  [ID_SEEDS.BANANA]: {
    1: "/images/cardfront/banana/bancom.png",
    2: "/images/cardfront/banana/uncombanana.png",
    3: "/images/cardfront/banana/rarebanana.png",
    4: "/images/cardfront/banana/epicbanana.png",
    5: "/images/cardfront/banana/legbanana.png",
  },
  [ID_SEEDS.CAULIFLOWER]: {
    1: "/images/cardfront/califlower/calicom.png",
    2: "/images/cardfront/califlower/uncomcauliflower.png",
    3: "/images/cardfront/califlower/rarecaliflower.png",
    4: "/images/cardfront/califlower/epiccauliflower.png",
    5: "/images/cardfront/califlower/legcauliflower.png",
  },
  [ID_SEEDS.CORN]: {
    1: "/images/cardfront/corn/corncom.png",
    2: "/images/cardfront/corn/uncomcorn.png",
    3: "/images/cardfront/corn/rarecorn.png",
    4: "/images/cardfront/corn/epiccorn.png",
    5: "/images/cardfront/corn/legconr.png",
  },
  [ID_SEEDS.BOKCHOY]: {
    1: "/images/cardfront/bokchoy/bokcom.png",
    2: "/images/cardfront/bokchoy/uncombokchoy.png",
    3: "/images/cardfront/bokchoy/rarebokchoy.png",
    4: "/images/cardfront/bokchoy/epicbokchoy.png",
    5: "/images/cardfront/bokchoy/legbokchoy.png",
  },
  [ID_SEEDS.CARROT]: {
    1: "/images/cardfront/carrot/carcom.png",
    2: "/images/cardfront/carrot/uncomcarrot.png",
    3: "/images/cardfront/carrot/rarecarrot.png",
    4: "/images/cardfront/carrot/epiccarrot.png",
    5: "/images/cardfront/carrot/legcarrot.png",
  },
  [ID_SEEDS.LAVENDER]: {
    1: "/images/cardfront/lavender/lavcom.png",
    2: "/images/cardfront/lavender/uncomlavender.png",
    3: "/images/cardfront/lavender/rarelavender.png",
    4: "/images/cardfront/lavender/epiclavender.png",
    5: "/images/cardfront/lavender/leglavender.png",
  },
  [ID_SEEDS.WHEAT]: {
    1: "/images/cardfront/wheat/wheatcom.png",
    2: "/images/cardfront/wheat/uncomwheat.png",
    3: "/images/cardfront/wheat/rarewheat.png",
    4: "/images/cardfront/wheat/epicwheat.png",
    5: "/images/cardfront/wheat/legwheat.png",
  },
  [ID_SEEDS.POMEGRANATE]: {
    1: "/images/cardfront/pomegranate/pomcom.png",
    2: "/images/cardfront/pomegranate/uncompomegrantate.png",
    3: "/images/cardfront/pomegranate/rarepomegranate.png",
    4: "/images/cardfront/pomegranate/epicpomogranate.png",
    5: "/images/cardfront/pomegranate/legpomofranate.png",
  },
  [ID_SEEDS.APPLE]: {
    1: "/images/cardfront/apple/appcom.png",
    2: "/images/cardfront/apple/uncomapple.png",
    3: "/images/cardfront/apple/rareapple.png",
    4: "/images/cardfront/apple/epicapple.png",
    5: "/images/cardfront/apple/legapple.png",
  },
  [ID_SEEDS.EGGPLANT]: {
    1: "/images/cardfront/eggplant/epcom.png",
    2: "/images/cardfront/eggplant/uncomeggplant.png",
    3: "/images/cardfront/eggplant/rareeggplant.png",
    4: "/images/cardfront/eggplant/epiceggplant.png",
    5: "/images/cardfront/eggplant/legeggplant.png",
  },
};

// Center-screen card reveal that fires every time a crop is harvested. Listens for the
// `cropHarvested` event dispatched from farm.jsx. Multiple harvests in quick succession
// stack into a queue — the front card flies up on tap or swipe-up, then the next one
// slides forward into focus. Stays on screen until the player clears the queue.
const HarvestCardReveal = () => {
  const [queue, setQueue] = useState([]); // FIFO of card descriptors
  const [exiting, setExiting] = useState(false); // true while front card animates away
  const [dragY, setDragY] = useState(0); // active swipe offset (negative = upward)
  const dragStartYRef = useRef(null);
  const wasDraggedRef = useRef(false);

  useEffect(() => {
    const onHarvested = (e) => {
      const detail = e?.detail || {};
      const seedId = Number(detail.seedId);
      if (!seedId) return;
      const { baseId, rarityLevel } = getBaseAndRarity(seedId);
      // Card art reflects the ROLLED outcome bracket (1-5), not the seed's
      // own tier — so a common seed that rolls epic shows the epic card art
      // (matching the purple glow + rarity label). Falls back to the seed's
      // own tier if the rolled bracket isn't available.
      const tierForArt = (typeof detail.bracket === 'number' && detail.bracket >= 1 && detail.bracket <= 5)
        ? detail.bracket
        : rarityLevel;
      const cardImg = CROP_CARD_IMAGES?.[baseId]?.[tierForArt]
                   || CROP_CARD_IMAGES?.[baseId]?.[rarityLevel]
                   || CARD_FRONT_IMAGES?.[baseId]?.[tierForArt]
                   || CARD_FRONT_IMAGES?.[baseId]?.[rarityLevel];
      if (!cardImg) return;
      setQueue((q) => [...q, {
        cardImg,
        weight: detail.weight,
        cropName: detail.cropName || detail.name,
        rarityColor: detail.rarityColor || '#f5d87a',
        rarityLabel: detail.rarityLabel || '',
        ts: Date.now(),
        key: `${Date.now()}-${Math.random()}`,
      }]);
    };
    // External dismiss — used by tutorial step 25, clears the entire queue.
    const onForceDismiss = () => {
      setQueue([]);
      setExiting(false);
      setDragY(0);
      dragStartYRef.current = null;
      wasDraggedRef.current = false;
    };
    window.addEventListener('cropHarvested', onHarvested);
    window.addEventListener('dismissHarvestReveal', onForceDismiss);
    return () => {
      window.removeEventListener('cropHarvested', onHarvested);
      window.removeEventListener('dismissHarvestReveal', onForceDismiss);
    };
  }, []);

  useEffect(() => {
    if (queue.length > 0) document.body.setAttribute('data-harvest-reveal-active', 'true');
    else document.body.removeAttribute('data-harvest-reveal-active');
    return () => document.body.removeAttribute('data-harvest-reveal-active');
  }, [queue.length]);

  if (queue.length === 0) return null;

  const isStep25 = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10) === 25;
  const current = queue[0];
  const next = queue[1] || null;

  const dismissCurrent = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      setQueue((q) => q.slice(1));
      setExiting(false);
      setDragY(0);
      dragStartYRef.current = null;
      wasDraggedRef.current = false;
    }, 420);
  };

  const onPointerDown = (e) => {
    if (isStep25 || exiting) return;
    dragStartYRef.current = e.clientY;
    wasDraggedRef.current = false;
    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    }
  };
  const onPointerMove = (e) => {
    if (dragStartYRef.current == null) return;
    const dy = e.clientY - dragStartYRef.current;
    if (Math.abs(dy) > 4) wasDraggedRef.current = true;
    setDragY(Math.min(0, dy));
  };
  const onPointerUp = (e) => {
    if (dragStartYRef.current == null) return;
    const dy = e.clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    if (dy < -80) dismissCurrent();
    else if (!wasDraggedRef.current) dismissCurrent(); // tap = dismiss
    else setDragY(0); // not far enough — spring back
  };

  const cardSharedStyle = {
    position: 'relative',
    cursor: isStep25 ? 'default' : 'pointer',
    touchAction: 'none',
    userSelect: 'none',
  };

  const renderGlow = (card) => (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', zIndex: 0,
        top: '50%', left: '50%',
        width: '130%', aspectRatio: '1 / 1',
        background: `radial-gradient(circle, ${card.rarityColor}cc 0%, ${card.rarityColor}66 30%, ${card.rarityColor}22 55%, transparent 75%)`,
        filter: 'blur(14px)',
        pointerEvents: 'none',
        animation: 'harvestRevealGlow 2.6s ease-in-out infinite',
      }}
    />
  );

  const renderImg = (card) => (
    <img
      src={card.cardImg}
      alt={card.cropName || ''}
      draggable={false}
      style={{
        position: 'relative', zIndex: 1,
        display: 'block',
        height: '60vmin', width: 'auto',
        userSelect: 'none', imageRendering: 'pixelated',
        filter: `drop-shadow(0 0 24px ${card.rarityColor}cc) drop-shadow(0 12px 32px rgba(0,0,0,0.6))`,
        pointerEvents: 'none',
      }}
    />
  );

  const renderStamp = (card) => (
    <div style={{
      position: 'absolute', zIndex: 2,
      bottom: 'calc(6% + 14px)', left: 0, right: 0,
      textAlign: 'center',
      fontFamily: 'GROBOLD, Cartoonist, sans-serif',
      color: '#fff',
      textShadow: '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
      lineHeight: 1.3,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: '13px', letterSpacing: 1 }}>
        Weight: {card.weight >= 1000 ? `${(card.weight / 1000).toFixed(2)} kg` : `${card.weight} g`}
      </div>
      <div style={{ fontSize: '13px', letterSpacing: 1 }}>
        Date Obtained: {(() => {
          const d = new Date(card.ts);
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${m}/${day}/${d.getFullYear()}`;
        })()}
      </div>
    </div>
  );

  // Front card transform — drag offset while dragging, fly-up while exiting.
  const frontTransform = exiting
    ? 'translateY(-110vh) scale(0.7) rotate(-4deg)'
    : (dragY ? `translateY(${dragY}px)` : 'translateY(0)');
  const frontTransition = exiting
    ? 'transform 0.42s cubic-bezier(0.6, 0, 0.4, 1)'
    : (dragStartYRef.current == null ? 'transform 0.22s ease-out' : 'none');

  return (
    <div
      onClick={isStep25 ? undefined : (e) => { if (e.target === e.currentTarget) dismissCurrent(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        cursor: isStep25 ? 'default' : 'pointer',
        animation: 'harvestRevealFade 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes harvestRevealFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes harvestRevealCardIn {
          0%   { transform: translateY(40px) scale(0.4); opacity: 0; }
          60%  { transform: translateY(0) scale(1.06); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes harvestRevealGlow {
          0%   { transform: translate(-50%, -50%) scale(1)    rotate(0deg); opacity: 0.65; }
          25%  { transform: translate(-50%, -50%) scale(1.10) rotate(2deg); opacity: 0.95; }
          50%  { transform: translate(-50%, -50%) scale(1.18) rotate(0deg); opacity: 1;    }
          75%  { transform: translate(-50%, -50%) scale(1.10) rotate(-2deg); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(1)    rotate(0deg); opacity: 0.65; }
        }
      `}</style>

      {/* Stack container — both current (front) and next (peeked behind) render here. */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Next card — only rendered while a second card is queued. Sits behind the
            front card with a slight Y-offset and reduced scale/opacity so the player
            can see another reveal is coming. */}
        {next && (
          <div
            key={next.key}
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: 'translateY(22px) scale(0.92)',
              opacity: 0.88,
              filter: 'brightness(0.85)',
              pointerEvents: 'none',
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div style={{ position: 'relative' }}>
              {renderGlow(next)}
              {renderImg(next)}
              {renderStamp(next)}
            </div>
          </div>
        )}

        {/* Front card — interactive, animates in on mount (key changes between cards),
            flies up on tap/swipe. */}
        <div
          key={current.key}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            ...cardSharedStyle,
            zIndex: 2,
            transform: frontTransform,
            transition: frontTransition,
            animation: exiting ? 'none' : 'harvestRevealCardIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {renderGlow(current)}
          {renderImg(current)}
          {renderStamp(current)}
        </div>
      </div>
    </div>
  );
};

export default HarvestCardReveal;
