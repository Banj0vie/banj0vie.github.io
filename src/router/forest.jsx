import React, { useState, useEffect, useRef } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { useItems } from "../hooks/useItems";
import { useNotification } from "../contexts/NotificationContext";
import WeatherOverlay from "../components/WeatherOverlay";
import { ID_POTION_ITEMS } from "../constants/app_ids";
import AdminPanel from "./index";

const TREE_IMAGES = [
  "/images/forest/tree1.png",
  "/images/forest/tree2.png",
  "/images/forest/tree3.png",
  "/images/forest/tree4.png"
];

const FOREST_SPOTS = [
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

const Forest = () => {
  // Standard sizes matching a generic viewport canvas
  const width = 1920;
  const height = 1080;

  const { refetch } = useItems();
  const { show } = useNotification();

  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
  const axeCount = (sandboxLoot[9991] || 0); 
  const netCount = (sandboxLoot[9988] || 0);

  const [foragingXp, setForagingXp] = useState(() => parseInt(localStorage.getItem('sandbox_foraging_xp') || '0', 10));
  const foragingLevel = Math.floor(Math.sqrt((foragingXp || 0) / 150)) + 1;
  const foragingProgress = ((foragingXp - Math.pow(foragingLevel - 1, 2) * 150) / (Math.pow(foragingLevel, 2) * 150 - Math.pow(foragingLevel - 1, 2) * 150)) * 100;

  useEffect(() => {
    const handleLsUpdate = (e) => {
      if (e.detail.key === 'sandbox_foraging_xp') setForagingXp(parseInt(e.detail.value, 10));
    };
    window.addEventListener('ls-update', handleLsUpdate);
    return () => window.removeEventListener('ls-update', handleLsUpdate);
  }, []);

  const [minigame, setMinigame] = useState(null);
  const [flashingTarget, setFlashingTarget] = useState(null);
  const [hitText, setHitText] = useState(null);
  const [clearedTrees, setClearedTrees] = useState([]);
  const [clearedBushes, setClearedBushes] = useState([]);

  const [forestTrees, setForestTrees] = useState([]);
  const [forestBushes, setForestBushes] = useState([]);
  const [isLocked, setIsLocked] = useState(true);
  const [brokenTool, setBrokenTool] = useState(null);

  const isMouseDownRef = useRef(false);
  const minigameRef = useRef(minigame);
  useEffect(() => {
    minigameRef.current = minigame;
  }, [minigame]);

  useEffect(() => {
    const lastVisited = localStorage.getItem('forest_last_visited');
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
      localStorage.setItem('forest_last_visited', Date.now().toString());
      sessionStorage.removeItem('forest_current_layout');
    };
    window.addEventListener('beforeunload', handleUnload);

    const savedLayout = sessionStorage.getItem('forest_current_layout');
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout);
      setForestTrees(parsed.trees);
      setForestBushes(parsed.bushes || []);
    } else {
      const spots = [...FOREST_SPOTS];
      for (let i = spots.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [spots[i], spots[j]] = [spots[j], spots[i]];
      }
      
      const numTrees = Math.floor(Math.random() * 10) + 20; // 20 to 29 trees
      const numGrandTrees = Math.floor(Math.random() * 2) + 1; // 1 to 2
      const trees = [];
      const bushes = [];
      
      for (let i = 0; i < spots.length; i++) {
          const spot = spots[i];
          if (i < numTrees) {
              const isGrand = i < numGrandTrees;
              trees.push({ id: i + 1, type: isGrand ? 'grandtree' : 'tree', image: isGrand ? "/images/forest/Grandtree.png" : TREE_IMAGES[Math.floor(Math.random() * TREE_IMAGES.length)], x: spot.x, y: spot.y, width: isGrand ? Math.floor(180 + Math.random() * 40) : Math.floor(140 + Math.random() * 50), zIndex: spot.zIndex });
          } else {
              bushes.push({ id: i + 200, image: "/images/forest/bush.png", x: spot.x, y: spot.y, width: Math.floor(100 + Math.random() * 40), zIndex: spot.zIndex });
          }
      }
      
      setForestTrees(trees);
      setForestBushes(bushes);
      sessionStorage.setItem('forest_current_layout', JSON.stringify({ trees, bushes }));
    }

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  // Minigame cursor animation loop
  useEffect(() => {
    if (!minigame || minigame.status !== 'playing') return;
    let animationFrameId;
    let lastTime = performance.now();

    const animate = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setMinigame(prev => {
        if (!prev || prev.status !== 'playing') return prev;
        // Speed gets slightly faster each phase
        let speed = 0.07 + (prev.phase * 0.02); 
        let newCursor = prev.cursor + (speed * deltaTime * prev.direction);
        let newDirection = prev.direction;

        // Bounce back and forth between 0 and 100
        if (newCursor >= 100) {
          newCursor = 100 - (newCursor - 100);
          newDirection = -1;
        } else if (newCursor <= 0) {
          newCursor = -newCursor;
          newDirection = 1;
        }

        let newCharge = prev.charge || 0;
        let newBeeState = prev.beeState || 'idle';

        if (prev.type === 'tree' && isMouseDownRef.current) {
          newCharge = Math.min(100, newCharge + (0.15 * deltaTime)); // takes ~660ms to charge
          if (newCharge >= 100) {
            newBeeState = 'full';
          } else {
            newBeeState = 'idle';
          }
        } else if (!isMouseDownRef.current) {
          newCharge = 0;
          if (prev.beeState !== 'hit') {
            newBeeState = 'idle';
          }
        }

        return { ...prev, cursor: newCursor, direction: newDirection, charge: newCharge, beeState: newBeeState };
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [minigame?.status]);

  const startChopping = (treeId, isGrandtree = false) => {
    if (minigame) return;
    if (axeCount <= 0) {
      show("You need an Axe to chop trees!", "error");
      return;
    }

    let brokeTool = null;
    // 5% chance to break the Axe
    if (Math.random() < 0.05) {
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9991] = Math.max(0, (sandboxLoot[9991] || 0) - 1);
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      brokeTool = "Axe";
    }

    setMinigame({ active: true, targetId: treeId, type: 'tree', isGrandtree, phase: 1, cursor: 0, direction: 1, status: 'playing', targetStart: Math.random() * 60, targetWidth: isGrandtree ? 25 : 40, charge: 0, beeState: 'idle', toolBroke: brokeTool });
  };

  const startCatching = (bushId) => {
    if (minigame) return;
    if (netCount <= 0) {
      show("You need a Bug Net to catch bugs in bushes!", "error");
      return;
    }

    let brokeTool = null;
    // 5% chance to break the Net
    if (Math.random() < 0.05) {
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9988] = Math.max(0, (sandboxLoot[9988] || 0) - 1);
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      brokeTool = "Bug Net";
    }

    setMinigame({ active: true, targetId: bushId, type: 'bush', phase: 1, cursor: 0, direction: 1, status: 'playing', targetStart: Math.random() * 60, targetWidth: 40, charge: 0, beeState: 'idle', toolBroke: brokeTool });
  };

  const executeHit = (currentGame) => {
    // Target Hit Zone based on percentage
    const isHit = currentGame.cursor >= currentGame.targetStart && currentGame.cursor <= (currentGame.targetStart + currentGame.targetWidth);
    
    // Perfect Hit Zone is the middle 40% of the target area
    const perfectStart = currentGame.targetStart + currentGame.targetWidth * 0.3;
    const perfectEnd = currentGame.targetStart + currentGame.targetWidth * 0.7;
    const isPerfectHit = currentGame.cursor >= perfectStart && currentGame.cursor <= perfectEnd;

    if (isHit) {
      setFlashingTarget(currentGame.targetId);
      setTimeout(() => setFlashingTarget(null), 300); // Visual flash & shake duration
      
      setHitText({
        text: isPerfectHit ? "PERFECT HIT!" : "HIT!",
        color: isPerfectHit ? "#00ff41" : "#ffea00",
        id: Date.now()
      });
      setTimeout(() => setHitText(null), 800); // Clear popup after animation

      const isTree = currentGame.type === 'tree';
      const isGrandtree = currentGame.isGrandtree;
      
      let rewardId = 9993; // Wood
      let rewardLabel = 'Wood Log';
      if (!isTree) {
        rewardId = ID_POTION_ITEMS ? ID_POTION_ITEMS.LADYBUG : 132101;
        rewardLabel = 'Ladybug';
      } else if (isGrandtree) {
        rewardId = 9942;
        rewardLabel = 'Special Wood';
      }
      
      let rewardAmount = 0;
      if (isTree) {
        if (currentGame.phase < 3) {
          rewardAmount = isPerfectHit ? 1 : 0;
        } else {
          rewardAmount = isPerfectHit ? (isGrandtree ? 3 : 5) : (isGrandtree ? 1 : 3);
        }
      } else {
        rewardAmount = isPerfectHit ? 10 : 5;
      }

      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      if (rewardAmount > 0) {
        sandboxLoot[rewardId] = (sandboxLoot[rewardId] || 0) + rewardAmount;
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        if (refetch) refetch();
      }

      const hitXp = isPerfectHit ? 50 : 25;

      if (currentGame.phase < 3) {
        if (isPerfectHit) {
          show(`PERFECT HIT! +${rewardAmount} ${rewardLabel}`, 'success');
        } else {
          if (rewardAmount > 0) {
            show(`+${rewardAmount} ${rewardLabel}`, 'success');
          } else {
            show(`HIT!`, 'success');
          }
        }

        setMinigame(prev => {
          const newWidth = Math.max(20, prev.targetWidth - 5); // Shrink hit zone less to make it more forgiving
          return { 
            ...prev, 
            phase: prev.phase + 1, 
            targetStart: Math.random() * (100 - newWidth), // Pick new random spot
            targetWidth: newWidth,
            accumulatedXp: (prev.accumulatedXp || 0) + hitXp,
            charge: 0,
            beeState: currentGame.type === 'tree' ? 'hit' : prev.beeState
          };
        });
        if (currentGame.type === 'tree') {
          setTimeout(() => {
            setMinigame(prev => (prev && prev.beeState === 'hit') ? { ...prev, beeState: 'idle' } : prev);
          }, 1000);
        }
      } else {
        const totalXp = (currentGame.accumulatedXp || 0) + hitXp;
        const currentForagingXp = parseInt(localStorage.getItem('sandbox_foraging_xp') || '0', 10);
        const oldLevel = Math.floor(Math.sqrt((currentForagingXp || 0) / 150)) + 1;
        const newForagingXp = currentForagingXp + totalXp;
        localStorage.setItem('sandbox_foraging_xp', newForagingXp.toString());
        setForagingXp(newForagingXp);
        const newLevel = Math.floor(Math.sqrt((newForagingXp || 0) / 150)) + 1;
        if (newLevel > oldLevel) {
          window.dispatchEvent(new CustomEvent('levelUp', { detail: { skill: 'Foraging', level: newLevel } }));
        }

        setMinigame(prev => ({ ...prev, status: 'success', beeState: currentGame.type === 'tree' ? 'hit' : prev.beeState }));
        const currentLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        
        let successMsg = "";
        if (isTree) {
          setClearedTrees(prev => [...prev, currentGame.targetId]);
          const leavesDropped = isGrandtree ? Math.floor(Math.random() * 5) + 5 : Math.floor(Math.random() * 3) + 3; // 5 to 9 for Grandtree
          currentLoot[9956] = (currentLoot[9956] || 0) + leavesDropped;
          if (isGrandtree) {
             currentLoot[9993] = (currentLoot[9993] || 0) + (isPerfectHit ? 3 : 1); // Also drop some normal wood
          }
          successMsg = `TIMBER! +${rewardAmount} ${rewardLabel}, +${leavesDropped} Leaves & +${totalXp} XP!`;
          if (!localStorage.getItem('easter_yellow_egg')) {
             localStorage.setItem('easter_yellow_egg', 'true');
             currentLoot[9983] = (currentLoot[9983] || 0) + 1;
             currentLoot[9987] = 1; // Basket
             setTimeout(() => show("🐣 You found the Yellow Easter Egg in the tree!", 'success'), 500);
          }
        } else {
          setClearedBushes(prev => [...prev, currentGame.targetId]);
          successMsg = `GOTCHA! +${rewardAmount} ${rewardLabel} & +${totalXp} XP!`;
          if (!localStorage.getItem('easter_green_egg')) {
             localStorage.setItem('easter_green_egg', 'true');
             currentLoot[9986] = (currentLoot[9986] || 0) + 1;
             currentLoot[9987] = 1;
             setTimeout(() => show("🐣 You found the Green Easter Egg in the bush!", 'success'), 500);
          }
        }
        localStorage.setItem('sandbox_loot', JSON.stringify(currentLoot));
        show(successMsg, 'success');
        setTimeout(() => {
          if (currentGame.toolBroke) setBrokenTool(currentGame.toolBroke);
          setMinigame(null);
        }, 1500);
      }
    } else {
      setMinigame(prev => ({ ...prev, status: 'fail', beeState: currentGame.type === 'tree' ? 'hit' : prev.beeState }));
      setTimeout(() => {
        if (currentGame.toolBroke) setBrokenTool(currentGame.toolBroke);
        setMinigame(null);
      }, 1500);
    }
  };

  const handlePointerDown = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const currentMinigame = minigameRef.current;
    if (!currentMinigame || currentMinigame.status !== 'playing') return;

    if (currentMinigame.type === 'tree') {
      isMouseDownRef.current = true;
    } else {
      executeHit(currentMinigame);
    }
  };

  const handlePointerUp = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const currentMinigame = minigameRef.current;
    if (!currentMinigame || currentMinigame.status !== 'playing') return;

    if (currentMinigame.type === 'tree' && isMouseDownRef.current) {
      isMouseDownRef.current = false;
      if (currentMinigame.charge >= 100) {
        executeHit(currentMinigame);
      } else {
        setMinigame(prev => prev ? { ...prev, charge: 0, beeState: 'hit' } : prev);
        setTimeout(() => {
          setMinigame(prev => (prev && prev.beeState === 'hit') ? { ...prev, beeState: 'idle' } : prev);
        }, 1000);
      }
    }
  };

  if (isLocked) return null;

  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/forest.webp"
        hotspots={[]}
        dialogs={[]}
        width={width}
        height={height}
      >
      {/* Render trees directly onto the viewport canvas */}
      {forestTrees.filter(t => !clearedTrees.includes(t.id)).map((tree) => {
        const isFlashing = flashingTarget === tree.id;
        return (
          <img
            key={tree.id}
            src={tree.image}
            alt="Tree"
            style={{
              position: 'absolute',
              left: `${tree.x}px`,
              top: `${tree.y}px`,
              width: `${tree.width}px`,
              height: 'auto',
              zIndex: tree.zIndex,
              cursor: 'pointer',
              transition: 'transform 0.1s ease, filter 0.1s ease',
              filter: isFlashing ? 'brightness(2.5) drop-shadow(0px 0px 15px white)' : 'none',
              transform: isFlashing ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
            }}
            onMouseEnter={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(0, 255, 65, 0.8))'; } }}
            onMouseLeave={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; } }}
            onPointerDown={(e) => { e.stopPropagation(); startChopping(tree.id, tree.type === 'grandtree'); }}
          />
        );
      })}
      {forestBushes.filter(b => !clearedBushes.includes(b.id)).map((bush) => {
        const isFlashing = flashingTarget === bush.id;
        return (
          <img
            key={bush.id}
            src={bush.image}
            alt="Bush"
            onError={(e) => { e.target.src = '/images/items/seeds.png'; }}
            style={{
              position: 'absolute', left: `${bush.x}px`, top: `${bush.y}px`, width: `${bush.width}px`,
              height: 'auto', zIndex: bush.zIndex, cursor: 'pointer', transition: 'transform 0.1s ease, filter 0.1s ease',
              filter: isFlashing ? 'brightness(2.5) drop-shadow(0px 0px 15px white)' : 'none',
              transform: isFlashing ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
            }}
            onMouseEnter={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(0, 255, 65, 0.8))'; } }}
            onMouseLeave={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; } }}
            onPointerDown={(e) => { e.stopPropagation(); startCatching(bush.id); }}
          />
        );
      })}
      </PanZoomViewport>

      {/* Return to Farm Button */}
      <div 
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          localStorage.setItem('forest_last_visited', Date.now().toString());
          sessionStorage.removeItem('forest_current_layout');
          window.location.href = '/farm';
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10000, backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', cursor: 'pointer', transition: 'transform 0.1s ease', display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>⬅ RETURN TO FARM</span>
      </div>

      {/* Tool Inventory Overlay */}
      <div style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '15px', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto', flexDirection: 'column', width: '150px' }}>
          <span style={{ color: '#ccc', fontFamily: 'monospace', fontSize: '14px' }}>FORAGING LEVEL</span>
          <span style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '28px', fontWeight: 'bold' }}>{foragingLevel}</span>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${foragingProgress}%`, height: '100%', backgroundColor: '#00ff41', transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          <img src="/images/forest/axe.png" alt="Axe" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>x {axeCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          <img src="/images/forest/net.png" alt="Net" onError={(e) => e.target.src='/images/items/seeds.png'} style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>x {netCount}</span>
        </div>
      </div>

      {/* Chopping Minigame Overlay */}
      {minigame && (() => {
        const targetTree = forestTrees.find(t => t.id === minigame.targetId);
        const treeSrc = targetTree ? targetTree.image : TREE_IMAGES[0];
        const minigameImageSrc = minigame.type === 'tree' ? treeSrc : '/images/forest/bush.png';

        return (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div 
              style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', minWidth: '400px' }}
              onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e); }}
              onPointerUp={(e) => { e.stopPropagation(); handlePointerUp(e); }}
              onPointerLeave={(e) => { e.stopPropagation(); handlePointerUp(e); }}
            >
              <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', fontSize: '28px' }}>{minigame.type === 'tree' ? 'CHOPPING TREE' : 'CATCHING BUGS'}</h2>
              
              {minigame.status === 'playing' && (
                <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '16px' }}>
                  Phase {minigame.phase} / 3<br/>
                  {minigame.type === 'tree' ? 'Hold left click to charge, release when the tool is in the target zone!' : 'Click anywhere when the tool is in the target zone!'}
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
                @keyframes treeFall {
                  0% { transform: rotate(0deg); opacity: 1; }
                  100% { transform: rotate(90deg) translate(50px, 100px); opacity: 0; }
                }
                @keyframes floatUp {
                  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
                  100% { opacity: 0; transform: translate(-50%, -150%) scale(1.2); }
                }
              `}</style>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', height: '250px', marginBottom: '30px' }}>
                {minigame.type === 'tree' && (() => {
                  let beeImageSrc = "/images/forest/beeaxeidle.png";
                  if (minigame.beeState === 'full') beeImageSrc = "/images/forest/beeaxecharge.png";
                  else if (minigame.beeState === 'hit') beeImageSrc = "/images/forest/beeaxehit.png";

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <img 
                        src={beeImageSrc} 
                        alt="Bee" 
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = '/images/farm/bee.png'; // Failsafe just in case the image isn't found
                        }}
                        style={{ width: '240px', transform: 'scaleX(1)', filter: minigame.beeState === 'full' ? 'drop-shadow(0 0 10px #ffea00)' : 'none', transition: 'filter 0.2s' }} 
                      />
                      {minigame.status === 'playing' && (
                        <div style={{ width: '240px', height: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${minigame.charge || 0}%`, height: '100%', backgroundColor: minigame.charge >= 100 ? '#ffea00' : '#00ff41', transition: 'width 0.1s linear, background-color 0.2s' }} />
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  {minigame.status === 'success' && minigame.type === 'tree' ? (
                    <>
                      <img src={treeSrc} alt="Tree Bottom" style={{ height: '250px', position: 'absolute', bottom: '0', clipPath: 'inset(80% 0 0 0)' }} />
                      <img src={treeSrc} alt="Tree Top" style={{ height: '250px', position: 'absolute', bottom: '0', clipPath: 'inset(0 0 20% 0)', transformOrigin: 'right 80%', animation: 'treeFall 1.5s forwards' }} />
                    </>
                  ) : (
                    <img 
                      src={minigameImageSrc} 
                      alt="Target" 
                      style={{ height: minigame.type === 'tree' ? '250px' : '150px', animation: flashingTarget === minigame.targetId ? 'chopShake 0.3s' : 'none' }} 
                    />
                  )}

                  {hitText && (
                    <div key={hitText.id} style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', color: hitText.color, fontWeight: 'bold', fontSize: '36px', textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 4px 10px rgba(0,0,0,0.8)', zIndex: 100, pointerEvents: 'none', animation: 'floatUp 0.8s ease-out forwards', whiteSpace: 'nowrap' }}>
                      {hitText.text}
                    </div>
                  )}

                  {minigame.status === 'playing' && (
                    <div style={{ position: 'absolute', left: '100%', top: '0', height: '100%', width: '30px', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '15px', marginLeft: '10px' }}>
                      {/* Yellow Bar (Decent Hit) */}
                      <div style={{ position: 'absolute', bottom: `${minigame.targetStart}%`, height: `${minigame.targetWidth}%`, width: '100%', backgroundColor: 'rgba(255, 234, 0, 0.6)', borderRadius: '8px', border: '1px solid #ffea00', boxSizing: 'border-box' }} />
                      
                      {/* Green Bar (Perfect Hit) */}
                      <div style={{ position: 'absolute', bottom: `${minigame.targetStart + minigame.targetWidth * 0.3}%`, height: `${minigame.targetWidth * 0.4}%`, width: '100%', backgroundColor: 'rgba(0, 255, 65, 0.8)', borderRadius: '4px', border: '1px solid #00ff41', boxSizing: 'border-box' }} />
                      
                      <div style={{ position: 'absolute', bottom: `calc(${minigame.cursor}% - 40px)`, left: '-50px', width: '50px', height: '50px', transition: 'bottom 0.05s linear' }}>
                        <img src={minigame.type === 'tree' ? '/images/forest/axe.png' : '/images/forest/net.png'} alt="Tool" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px black)' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {minigame.status === 'playing' ? (
                <button 
                  style={{ padding: '12px 24px', backgroundColor: '#00ff41', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', width: '100%', pointerEvents: 'none' }}
                >
                  {minigame.type === 'tree' ? (minigame.charge >= 100 ? 'RELEASE!' : 'HOLD TO CHOP!') : 'CATCH!'}
                </button>
              ) : minigame.status === 'success' ? (
                <h3 style={{ color: '#00ff41', margin: '0', fontSize: '24px' }}>{minigame.type === 'tree' ? 'TIMBER! Tree Chopped!' : 'GOTCHA! Bug Caught!'}</h3>
              ) : (
                <h3 style={{ color: '#ff4444', margin: '0', fontSize: '24px' }}>Missed!</h3>
              )}
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

export default Forest;
