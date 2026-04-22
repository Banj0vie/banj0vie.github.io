import React, { useState, useEffect, useRef, useMemo } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { useItems } from "../hooks/useItems";
import { useNotification } from "../contexts/NotificationContext";
import WeatherOverlay from "../components/WeatherOverlay";
import AdminPanel from "./index";

const MINE_SPOTS = [
  { x: 200, y: 300, zIndex: 10 },
  { x: 450, y: 150, zIndex: 9 },
  { x: 800, y: 400, zIndex: 11 },
  { x: 1200, y: 250, zIndex: 10 },
  { x: 1500, y: 500, zIndex: 12 },
  { x: 150, y: 700, zIndex: 13 },
  { x: 600, y: 800, zIndex: 14 },
  { x: 1000, y: 750, zIndex: 13 },
  { x: 1300, y: 850, zIndex: 15 },
  { x: 1700, y: 700, zIndex: 14 },
  { x: 300, y: 200, zIndex: 5 },
  { x: 750, y: 550, zIndex: 12 },
  { x: 1100, y: 300, zIndex: 8 },
  { x: 1450, y: 700, zIndex: 14 },
  { x: 400, y: 850, zIndex: 15 },
  { x: 900, y: 800, zIndex: 14 },
  { x: 100, y: 450, zIndex: 10 },
  { x: 350, y: 600, zIndex: 12 },
  { x: 550, y: 300, zIndex: 10 },
  { x: 850, y: 150, zIndex: 8 },
  { x: 1050, y: 550, zIndex: 12 },
  { x: 1350, y: 400, zIndex: 11 },
  { x: 1600, y: 200, zIndex: 9 },
  { x: 1800, y: 450, zIndex: 11 },
  { x: 1650, y: 850, zIndex: 15 },
  { x: 1150, y: 900, zIndex: 15 },
  { x: 800, y: 950, zIndex: 16 },
  { x: 250, y: 900, zIndex: 15 },
  { x: 50, y: 800, zIndex: 14 },
  { x: 1850, y: 750, zIndex: 14 },
  { x: 250, y: 100, zIndex: 8 },
  { x: 650, y: 100, zIndex: 8 },
  { x: 1400, y: 100, zIndex: 8 },
  { x: 1750, y: 150, zIndex: 9 },
];

const BatsOverlay = React.memo(() => {
  const bats = useMemo(() => Array.from({ length: 12 }).map(() => ({
    top: `${Math.random() * 80}%`,
    animationDuration: `${6 + Math.random() * 8}s`,
    animationDelay: `${Math.random() * 5}s`,
    scale: 0.4 + Math.random() * 0.8,
  })), []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9990, overflow: 'hidden' }}>
      <style>{`
        .bat-fly {
          position: absolute;
          left: -100px;
          font-size: 50px;
          animation: fly-across linear infinite;
          filter: drop-shadow(0px 5px 8px rgba(0,0,0,0.9));
        }
        @keyframes fly-across {
          0% { transform: translateX(0vw) translateY(0) scale(var(--scale)); }
          25% { transform: translateX(30vw) translateY(40px) scale(var(--scale)); }
          50% { transform: translateX(60vw) translateY(-40px) scale(var(--scale)); }
          75% { transform: translateX(90vw) translateY(40px) scale(var(--scale)); }
          100% { transform: translateX(120vw) translateY(0) scale(var(--scale)); }
        }
      `}</style>
      {bats.map((b, i) => (
        <div key={i} className="bat-fly" style={{ top: b.top, animationDuration: b.animationDuration, animationDelay: b.animationDelay, '--scale': b.scale }}>
          🦇
        </div>
      ))}
    </div>
  );
});

const generateDots = () => {
  const dots = [];
  const incorrectIndex = Math.floor(Math.random() * 3);
  let perfectIndex = Math.floor(Math.random() * 3);
  while (perfectIndex === incorrectIndex) {
    perfectIndex = Math.floor(Math.random() * 3);
  }
  const regions = [
    { t: 40, l: 40 },
    { t: 40, l: 60 },
    { t: 60, l: 50 }
  ];
  regions.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < 3; i++) {
    dots.push({
      id: i,
      top: regions[i].t + (Math.random() * 10 - 5),
      left: regions[i].l + (Math.random() * 10 - 5),
      isCorrect: i !== incorrectIndex,
      isPerfect: i === perfectIndex
    });
  }
  return dots;
};

const Mine = () => {
  const width = 1920;
  const height = 1080;

  const { refetch } = useItems();
  const { show } = useNotification();

  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
  const pickaxeCount = (sandboxLoot[9992] || 0); 
  const ironPickaxeCount = (sandboxLoot[9981] || 0);

  const [miningXp, setMiningXp] = useState(() => parseInt(localStorage.getItem('sandbox_mining_xp') || '0', 10));
  const miningLevel = Math.floor(Math.sqrt((miningXp || 0) / 150)) + 1;
  const miningProgress = ((miningXp - Math.pow(miningLevel - 1, 2) * 150) / (Math.pow(miningLevel, 2) * 150 - Math.pow(miningLevel - 1, 2) * 150)) * 100;

  useEffect(() => {
    const handleLsUpdate = (e) => {
      if (e.detail.key === 'sandbox_mining_xp') setMiningXp(parseInt(e.detail.value, 10));
    };
    window.addEventListener('ls-update', handleLsUpdate);
    return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  const [minigame, setMinigame] = useState(null);
  const [flashingTarget, setFlashingTarget] = useState(null);
  const [hitText, setHitText] = useState(null);
  const [clearedRocks, setClearedRocks] = useState([]);
  const [mineRocks, setMineRocks] = useState([]);
  const [sparks, setSparks] = useState([]);
  const [isLocked, setIsLocked] = useState(true);
  const [brokenTool, setBrokenTool] = useState(null);
  
  const explosionParticles = useMemo(() => Array.from({ length: 30 }).map(() => ({
    tx: (Math.random() - 0.5) * 300, // -150px to +150px
    ty: (Math.random() - 0.5) * 300,
    size: 6 + Math.random() * 14,
    rot: Math.random() * 720,
    delay: Math.random() * 0.05
  })), []);

  const minigameRef = useRef(minigame);
  useEffect(() => {
    minigameRef.current = minigame;
  }, [minigame]);

  useEffect(() => {
    const lastVisited = localStorage.getItem('mine_last_visited');
    if (lastVisited) {
      const elapsed = Date.now() - parseInt(lastVisited, 10);
      const fortyFiveMins = 45 * 60 * 1000;
      if (elapsed < fortyFiveMins) {
        window.location.href = '/farm';
        return;
      }
    }
    setIsLocked(false);

    const handleUnload = () => {
      localStorage.setItem('mine_last_visited', Date.now().toString());
      sessionStorage.removeItem('mine_current_layout');
    };
    window.addEventListener('beforeunload', handleUnload);

    const savedLayout = sessionStorage.getItem('mine_current_layout');
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout);
      setMineRocks(parsed.rocks || []);
    } else {
      const spots = [...MINE_SPOTS];
      for (let i = spots.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [spots[i], spots[j]] = [spots[j], spots[i]];
      }
      
      const numRocks = Math.floor(Math.random() * 15) + 20; // 20 to 34 rocks
      const rocks = [];
      
      for (let i = 0; i < spots.length; i++) {
          const spot = spots[i];
          if (i < numRocks) {
              const rand = Math.random();
              let type = 'stone';
              let image = '/images/forest/rock.png';
              let rewardId = 9994;
              if (rand < 0.10) {
                type = 'gold';
                image = '/images/forest/goldrock.png';
                rewardId = 9997;
              } else if (rand < 0.25) {
                type = 'coal';
                image = '/images/forest/coalrock.png';
                rewardId = 9973;
              } else if (rand < 0.45) {
                type = 'copper';
                image = '/images/forest/copperrock.png';
                rewardId = 9974;
              } else if (rand < 0.70) {
                type = 'iron';
                image = '/images/forest/ironrock.png';
                rewardId = 9996;
              }
              rocks.push({ id: i + 300, type, rewardId, image, x: spot.x, y: spot.y, width: Math.floor(80 + Math.random() * 40), zIndex: spot.zIndex });
          }
      }
      
      setMineRocks(rocks);
      sessionStorage.setItem('mine_current_layout', JSON.stringify({ rocks }));
    }

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  const startMining = (rockId, rockType) => {
    if (minigame) return;
    
    if (rockType === 'gold' && ironPickaxeCount <= 0) {
      show("You need an Iron Pickaxe to mine gold rocks!", "error");
      return;
    }
    if (rockType !== 'gold' && pickaxeCount <= 0 && ironPickaxeCount <= 0) {
      show("You need a Pickaxe to mine rocks!", "error");
      return;
    }

    let brokeTool = null;
    if (Math.random() < 0.05) {
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      if (rockType === 'gold') {
        sandboxLoot[9981] = Math.max(0, (sandboxLoot[9981] || 0) - 1);
        brokeTool = "Iron Pickaxe";
      } else {
        if (pickaxeCount > 0) {
          sandboxLoot[9992] = Math.max(0, (sandboxLoot[9992] || 0) - 1);
          brokeTool = "Pickaxe";
        } else {
          sandboxLoot[9981] = Math.max(0, (sandboxLoot[9981] || 0) - 1);
          brokeTool = "Iron Pickaxe";
        }
      }
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
    }

    setMinigame({ active: true, targetId: rockId, type: 'rock', rockType, phase: 1, lives: 3, status: 'playing', dots: generateDots(), toolBroke: brokeTool });
  };

  const handleDotClick = (e, isCorrect, isPerfect) => {
    e.stopPropagation();
    e.preventDefault();
    if (!minigame || minigame.status !== 'playing') return;

    if (isCorrect) {
      setFlashingTarget(minigame.targetId);
      setTimeout(() => setFlashingTarget(null), 300);
      
      setHitText({
        text: isPerfect ? "PERFECT CRACK!" : "CRACK!",
        color: isPerfect ? "#00ffff" : "#00ff41",
        id: Date.now()
      });
      setTimeout(() => setHitText(null), 800);

      const targetRock = mineRocks.find(r => r.id === minigame.targetId);
      
      let rewardId = 9994;
      if (targetRock) {
        if (targetRock.rewardId) {
          rewardId = targetRock.rewardId;
        } else {
          // Fallback for older cached sessionStorage layouts
          if (targetRock.type === 'gold') rewardId = 9997;
          else if (targetRock.type === 'coal') rewardId = 9973;
          else if (targetRock.type === 'copper') rewardId = 9974;
          else if (targetRock.type === 'iron') rewardId = 9996;
        }
      }
      
      const rewardLabel = rewardId === 9997 ? 'Gold Ore' : (rewardId === 9996 ? 'Iron Ore' : (rewardId === 9974 ? 'Copper Ore' : (rewardId === 9973 ? 'Coal' : 'Stone')));
      
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      const isFinal = minigame.phase >= 3;

      let rewardAmount = 0;
      if (isFinal) {
        rewardAmount = isPerfect ? 5 : 3;
      } else {
        rewardAmount = isPerfect ? 1 : 0;
      }

      if (rewardAmount > 0) {
        sandboxLoot[rewardId] = (sandboxLoot[rewardId] || 0) + rewardAmount;
      }
      const hitXp = isPerfect ? 50 : 25;

      if (isFinal) {
        const totalXp = (minigame.accumulatedXp || 0) + hitXp;
        const currentMiningXp = parseInt(localStorage.getItem('sandbox_mining_xp') || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentMiningXp || 0) / 150)) + 1;
        const newMiningXp = currentMiningXp + totalXp;
        localStorage.setItem('sandbox_mining_xp', newMiningXp.toString());
        setMiningXp(newMiningXp);
        const newLevel = Math.floor(Math.sqrt((newMiningXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
          window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Mining', level: newLevel } }));
        }

        setMinigame(prev => ({ ...prev, status: 'success' }));
        setClearedRocks(prev => [...prev, minigame.targetId]);
        
        if (!localStorage.getItem('easter_red_egg')) {
             localStorage.setItem('easter_red_egg', 'true');
             sandboxLoot[9982] = (sandboxLoot[9982] || 0) + 1;
             sandboxLoot[9987] = 1;
             setTimeout(() => show("🐣 You found the Red Easter Egg under the rock!", 'success'), 500);
        }
        
        // Gem Drop Logic
        const roll = Math.random();
        let gemName = null;
        let gemId = null;
        let gemColor = '#ffffff';
        
        if (roll < 0.01) { // 1% chance
          gemId = 9963; gemName = "Yellow Gem"; gemColor = '#ffea00';
        } else if (roll < 0.03) { // 2% chance (1% + 2% = 3%)
          gemId = 9962; gemName = "Green Gem"; gemColor = '#00ff41';
        } else if (roll < 0.13) { // 10% chance (3% + 10% = 13%)
          gemId = 9961; gemName = "Red Gem"; gemColor = '#ff4444';
        } else if (roll < 0.33) { // 20% chance (13% + 20% = 33%)
          gemId = 9960; gemName = "Blue Gem"; gemColor = '#00bfff';
        }
        
        let dropMsg = `ROCK DESTROYED! +${rewardAmount} ${rewardLabel} & +${totalXp} XP!`;
        if (gemId) {
          sandboxLoot[gemId] = (sandboxLoot[gemId] || 0) + 1;
          dropMsg = `ROCK DESTROYED! +${rewardAmount} ${rewardLabel}, +${totalXp} XP & a ${gemName} 💎!`;
        }

        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        if (refetch) refetch();
        show(dropMsg, 'success');
        if (gemId) {
          setTimeout(() => show(`💎 You found a ${gemName}!`, "success"), 500);
          // Add colored floating text for the gem!
          setTimeout(() => {
            setHitText({
              text: `+1 ${gemName} 💎`,
              color: gemColor,
              id: Date.now()
            });
          }, 400); // Show shortly after the "CRACK!" text
        }

        setTimeout(() => {
          if (minigame.toolBroke) setBrokenTool(minigame.toolBroke);
          setMinigame(null);
        }, 1500);
      } else {
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        if (refetch) refetch();
        if (rewardAmount > 0) {
          show(`CRACK! +${rewardAmount} ${rewardLabel}!`, 'success');
        } else {
          show(`CRACK!`, 'success');
        }

        setMinigame(prev => ({
          ...prev,
          phase: prev.phase + 1,
          accumulatedXp: (prev.accumulatedXp || 0) + hitXp,
          dots: generateDots()
        }));
      }
    } else {
      setHitText({
        text: "MISS!",
        color: "#ff4444",
        id: Date.now()
      });
      setTimeout(() => setHitText(null), 800);

      const newLives = (minigame.lives || 3) - 1;
      if (newLives > 0) {
        setMinigame(prev => ({
          ...prev,
          lives: newLives,
          dots: generateDots()
        }));
      } else {
        setMinigame(prev => ({ ...prev, status: 'fail' }));
        setTimeout(() => {
          if (minigame.toolBroke) setBrokenTool(minigame.toolBroke);
          setMinigame(null);
        }, 1500);
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!minigame || minigame.status !== 'playing') return;
    const newSpark = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      size: 4 + Math.random() * 8
    };
    setSparks(prev => [...prev, newSpark]);
    setTimeout(() => {
      setSparks(prev => prev.filter(s => s.id !== newSpark.id));
    }, 500);
  };

  if (isLocked) return null;

  return (
    <>
      <WeatherOverlay />
      
      {/* Dark Cave Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 5, 20, 0.55)', pointerEvents: 'none', zIndex: 9989 }} />
      <BatsOverlay />

      <PanZoomViewport
        backgroundSrc="/images/backgrounds/cave.webp"
        hotspots={[]}
        dialogs={[]}
        width={width}
        height={height}
        initialScale={1.3}
        initialOffsetX={-85}
        backgroundOffsetY={-15}
        disablePanZoom
      >
      {mineRocks.filter(r => !clearedRocks.includes(r.id)).map((rock) => {
        const isFlashing = flashingTarget === rock.id;
        return (
          <img
            key={rock.id}
            src={rock.image}
            alt="Rock"
            onError={(e) => { e.target.src = '/images/forest/rock.png'; }}
            style={{
              position: 'absolute',
              left: `${rock.x}px`,
              top: `${rock.y}px`,
              width: `${rock.width}px`,
              height: 'auto',
              zIndex: rock.zIndex,
              cursor: 'pointer',
              transition: 'transform 0.1s ease, filter 0.1s ease',
              filter: isFlashing ? 'brightness(2.5) drop-shadow(0px 0px 15px white)' : 'none',
              transform: isFlashing ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
            }}
            onMouseEnter={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))'; } }}
            onMouseLeave={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; } }}
            onPointerDown={(e) => { e.stopPropagation(); startMining(rock.id, rock.type); }}
          />
        );
      })}
      </PanZoomViewport>

      <div 
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          localStorage.setItem('mine_last_visited', Date.now().toString());
          sessionStorage.removeItem('mine_current_layout');
          window.location.href = '/farm';
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10000, backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', cursor: 'pointer', transition: 'transform 0.1s ease', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>⬅ RETURN TO FARM</span>
      </div>

      <div style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto', flexDirection: 'column', width: '150px' }}>
          <span style={{ color: '#ccc', fontFamily: 'monospace', fontSize: '14px' }}>MINING LEVEL</span>
          <span style={{ color: '#ffea00', fontFamily: 'monospace', fontSize: '28px', fontWeight: 'bold' }}>{miningLevel}</span>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${miningProgress}%`, height: '100%', backgroundColor: '#ffea00', transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          <img src="/images/forest/picaxe.png" alt="Pickaxe" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>x {pickaxeCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          <img src="/images/forest/picaxe.png" alt="Iron Pickaxe" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 0px 5px #00ff41) brightness(1.2)' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>x {ironPickaxeCount}</span>
        </div>
      </div>

      {minigame && (() => {
        const targetRock = mineRocks.find(r => r.id === minigame.targetId);
        const rockSrc = targetRock?.image || '/images/forest/rock.png';

        return (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
            onPointerMove={handlePointerMove}
          >
            {sparks.map(s => (
              <div key={s.id} style={{
                position: 'fixed',
                top: `${s.y}px`,
                left: `${s.x}px`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                backgroundColor: '#ffea00',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 8px #ffea00, 0 0 12px #ff8800',
                animation: 'sparkFade 0.5s linear forwards',
                zIndex: 10002
              }} />
            ))}
            <div 
              style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', minWidth: '400px' }}
            >
              <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', fontSize: '28px' }}>MINING ROCK</h2>
              
              {minigame.status === 'playing' && (
                <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                  Phase {minigame.phase} / 3 | Lives: {minigame.lives} ❤️<br/>
                  Find and click the correct glowing weak point!
                </p>
              )}

              <style>{`
                @keyframes chopShake {
                  0% { transform: translateX(0); }
                  25% { transform: translateX(-5px) rotate(-3deg); }
                  50% { transform: translateX(5px) rotate(3deg); }
                  75% { transform: translateX(-5px) rotate(-3deg); }
                  100% { transform: translateX(0); }
                }
                @keyframes floatUp {
                  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
                  100% { opacity: 0; transform: translate(-50%, -150%) scale(1.2); }
                }
                @keyframes sparkFade {
                  0% { transform: scale(1) translate(-50%, -50%); opacity: 1; }
                  100% { transform: scale(0) translate(-50%, 10px); opacity: 0; }
                }
                .mine-dot {
                  animation: dotPulse 0.8s infinite alternate;
                }
                .mine-dot.mine-dot-correct:hover {
                  animation: dotPulseCorrect 0.4s infinite alternate;
                  background-color: rgba(0, 255, 65, 0.9) !important;
                  z-index: 10;
                }
                .mine-dot.mine-dot-perfect:hover {
                  animation: dotPulsePerfect 0.4s infinite alternate;
                  background-color: rgba(0, 255, 255, 0.9) !important;
                  z-index: 10;
                }
                @keyframes dotPulse {
                  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; box-shadow: 0 0 5px #ffea00; }
                  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; box-shadow: 0 0 15px #ffea00, inset 0 0 5px #fff; }
                }
                @keyframes dotPulseCorrect {
                  0% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.9; box-shadow: 0 0 15px #00ff41; }
                  100% { transform: translate(-50%, -50%) scale(1.7); opacity: 1; box-shadow: 0 0 30px #00ff41, inset 0 0 10px #fff; }
                }
                @keyframes dotPulsePerfect {
                  0% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.9; box-shadow: 0 0 15px #00ffff; }
                  100% { transform: translate(-50%, -50%) scale(1.7); opacity: 1; box-shadow: 0 0 30px #00ffff, inset 0 0 10px #fff; }
                }
                @keyframes rockSmash {
                  0% { transform: scale(1); filter: brightness(2); opacity: 1; }
                  100% { transform: scale(0.2); filter: brightness(1); opacity: 0; }
                }
                @keyframes particleExplode {
                  0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
                  100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(0); opacity: 0; }
                }
              `}</style>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', height: '800px', marginBottom: '30px' }}>
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={rockSrc} 
                    alt="Target" 
                    onError={(e) => { e.target.src = '/images/forest/rock.png'; }}
                    style={{ height: '800px', width: 'auto', animation: minigame.status === 'success' ? 'rockSmash 0.2s forwards' : (flashingTarget === minigame.targetId ? 'chopShake 0.3s' : 'none') }} 
                  />

                  {hitText && (
                    <div key={hitText.id} style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', color: hitText.color, fontWeight: 'bold', fontSize: '36px', textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 4px 10px rgba(0,0,0,0.8)', zIndex: 100, pointerEvents: 'none', animation: 'floatUp 0.8s ease-out forwards', whiteSpace: 'nowrap' }}>
                      {hitText.text}
                    </div>
                  )}

                  {minigame.status === 'success' && explosionParticles.map((p, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      backgroundColor: minigame.rockType === 'gold' ? '#ffd700' : (minigame.rockType === 'iron' ? '#a19d94' : '#6b6b6b'),
                      borderRadius: '3px',
                      pointerEvents: 'none',
                      '--tx': `${p.tx}px`,
                      '--ty': `${p.ty}px`,
                      '--rot': `${p.rot}deg`,
                      animation: `particleExplode 0.6s ease-out forwards ${p.delay}s`
                    }} />
                  ))}

                  {minigame.status === 'playing' && minigame.dots && minigame.dots.map(dot => (
                    <div
                      className={`mine-dot ${dot.isPerfect ? 'mine-dot-perfect' : (dot.isCorrect ? 'mine-dot-correct' : '')}`}
                      key={dot.id}
                      onPointerDown={(e) => handleDotClick(e, dot.isCorrect, dot.isPerfect)}
                      style={{
                        position: 'absolute',
                        top: `${dot.top}%`,
                        left: `${dot.left}%`,
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'rgba(255, 234, 0, 0.9)',
                        borderRadius: '50%',
                        cursor: 'crosshair'
                      }}
                    />
                  ))}
                </div>
              </div>

              {minigame.status === 'success' ? (
                <h3 style={{ color: '#00ff41', margin: '0', fontSize: '24px' }}>SMASH! Rock Destroyed!</h3>
              ) : minigame.status === 'fail' ? (
                <h3 style={{ color: '#ff4444', margin: '0', fontSize: '24px' }}>Missed!</h3>
              ) : null}
            </div>
          </div>
        );
      })()}

      {brokenTool && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1000000, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ backgroundColor: '#2c221a', border: '4px solid #ff4444', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 0 30px #ff4444' }}>
            <h2 style={{ color: '#ff4444', fontSize: '32px', margin: '0 0 15px 0' }}>Oh no!</h2>
            <p style={{ fontSize: '20px', marginBottom: '20px' }}>Your <strong>{brokenTool}</strong> broke during use!</p>
            <button onClick={() => setBrokenTool(null)} style={{ padding: '10px 20px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>Okay</button>
          </div>
        </div>
      )}
      <AdminPanel />
    </>
  );
};

export default Mine;