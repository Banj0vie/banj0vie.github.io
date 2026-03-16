import React, { useState, useEffect } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { useItems } from "../hooks/useItems";
import { useNotification } from "../contexts/NotificationContext";
import WeatherOverlay from "../components/WeatherOverlay";

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
];

const Forest = () => {
  // Standard sizes matching a generic viewport canvas
  const width = 1920;
  const height = 1080;

  const { refetch } = useItems();
  const { show } = useNotification();

  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
  const axeCount = (sandboxLoot[9991] || 0) + 5; // Keep the starter bonus
  const pickaxeCount = (sandboxLoot[9992] || 0) + 5;

  const [minigame, setMinigame] = useState(null);
  const [flashingTarget, setFlashingTarget] = useState(null);
  const [clearedTrees, setClearedTrees] = useState([]);
  const [clearedRocks, setClearedRocks] = useState([]);

  const [forestTrees, setForestTrees] = useState([]);
  const [forestRocks, setForestRocks] = useState([]);
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const lastVisited = localStorage.getItem('forest_last_visited');
    if (lastVisited) {
      const elapsed = Date.now() - parseInt(lastVisited, 10);
      const twoHours = 2 * 60 * 60 * 1000;
      if (elapsed < twoHours) {
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
      setForestRocks(parsed.rocks);
    } else {
      const spots = [...FOREST_SPOTS];
      for (let i = spots.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [spots[i], spots[j]] = [spots[j], spots[i]];
      }
      
      const numTrees = Math.floor(Math.random() * 9) + 4; // 4 to 12
      const trees = [];
      const rocks = [];
      
      for (let i = 0; i < 16; i++) {
          const spot = spots[i];
          if (i < numTrees) {
              trees.push({ id: i + 1, image: TREE_IMAGES[Math.floor(Math.random() * TREE_IMAGES.length)], x: spot.x, y: spot.y, width: Math.floor(140 + Math.random() * 50), zIndex: spot.zIndex });
          } else {
              const rockRoll = Math.random();
              let image = "/images/forest/rock.png";
              let rewardId = 9994; // Stone
              if (rockRoll < 0.05) { // 5% chance
                  image = "/images/forest/goldrock.png";
                  rewardId = 9997; // Gold
              } else if (rockRoll < 0.20) { // 15% chance
                  image = "/images/forest/ironrock.png";
                  rewardId = 9996; // Iron
              }
              rocks.push({ id: i + 100, image, rewardId, x: spot.x, y: spot.y, width: Math.floor(80 + Math.random() * 30), zIndex: spot.zIndex });
          }
      }
      
      setForestTrees(trees);
      setForestRocks(rocks);
      sessionStorage.setItem('forest_current_layout', JSON.stringify({ trees, rocks }));
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
        let speed = 0.15 + (prev.phase * 0.08); 
        let newCursor = prev.cursor + (speed * deltaTime * prev.direction);

        // Wrap around the 360-degree circle
        if (newCursor >= 360) {
          newCursor -= 360;
        } else if (newCursor < 0) {
          newCursor += 360;
        }

        return { ...prev, cursor: newCursor };
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [minigame?.status]);

  const startChopping = (treeId) => {
    if (minigame) return;
    if (axeCount <= 0) {
      show("You need an Axe to chop trees!", "error");
      return;
    }

    // Deduct 1 Axe immediately upon starting
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9991] = (sandboxLoot[9991] || 0) - 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();

    setMinigame({ active: true, targetId: treeId, type: 'tree', phase: 1, cursor: 0, direction: 1, status: 'playing', targetStart: Math.random() * 300, targetWidth: 60 });
  };

  const startMining = (rockId) => {
    if (minigame) return;
    if (pickaxeCount <= 0) {
      show("You need a Pickaxe to mine rocks!", "error");
      return;
    }

    // Deduct 1 Pickaxe immediately upon starting
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9992] = (sandboxLoot[9992] || 0) - 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();

    setMinigame({ active: true, targetId: rockId, type: 'rock', phase: 1, cursor: 0, direction: 1, status: 'playing', targetStart: Math.random() * 300, targetWidth: 60 });
  };

  const handleAction = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!minigame || minigame.status !== 'playing') return;

    // Target Hit Zone based on degrees
    const isHit = minigame.cursor >= minigame.targetStart && minigame.cursor <= (minigame.targetStart + minigame.targetWidth);

    if (isHit) {
      setFlashingTarget(minigame.targetId);
      setTimeout(() => setFlashingTarget(null), 300); // Visual flash & shake duration

      const isTree = minigame.type === 'tree';
      let rewardId = 9993; // Wood
      let rewardLabel = 'Wood Log';
      if (!isTree) {
        const targetRock = forestRocks.find(r => r.id === minigame.targetId);
        rewardId = targetRock ? targetRock.rewardId : 9994;
        rewardLabel = rewardId === 9997 ? 'Gold Ore' : (rewardId === 9996 ? 'Iron Ore' : 'Stone');
      }
      
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[rewardId] = (sandboxLoot[rewardId] || 0) + 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`+1 ${rewardLabel}!`, 'success');

      if (minigame.phase < 3) {
        setMinigame(prev => {
          const newWidth = Math.max(25, prev.targetWidth - 15); // Shrink hit zone to make it harder
          return { 
            ...prev, 
            phase: prev.phase + 1, 
            direction: prev.direction * -1, // Reverse direction
            targetStart: Math.random() * (360 - newWidth), // Pick new random spot
            targetWidth: newWidth
          };
        });
      } else {
        setMinigame(prev => ({ ...prev, status: 'success' }));
        if (isTree) {
          setClearedTrees(prev => [...prev, minigame.targetId]);
        } else {
          setClearedRocks(prev => [...prev, minigame.targetId]);
        }
        setTimeout(() => setMinigame(null), 1500);
      }
    } else {
      setMinigame(prev => ({ ...prev, status: 'fail' }));
      setTimeout(() => setMinigame(null), 1500);
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
      {/* Render rocks (piles with grayscale filter) directly onto the viewport canvas */}
      {forestRocks.filter(r => !clearedRocks.includes(r.id)).map((rock) => {
        const isFlashing = flashingTarget === rock.id;
        return (
          <img
            key={rock.id}
            src={rock.image}
            alt="Rock"
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
            onMouseEnter={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(200, 200, 200, 0.8))'; } }}
            onMouseLeave={(e) => { if (!isFlashing) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; } }}
            onPointerDown={(e) => { e.stopPropagation(); startMining(rock.id); }}
          />
        );
      })}
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
            onPointerDown={(e) => { e.stopPropagation(); startChopping(tree.id); }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          <img src="/images/forest/axe.png" alt="Axe" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>x {axeCount}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}>
          <img src="/images/forest/picaxe.png" alt="Pickaxe" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold' }}>x {pickaxeCount}</span>
        </div>
      </div>

      {/* Chopping Minigame Overlay */}
      {minigame && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onPointerDown={handleAction}
        >
          <div 
            style={{ backgroundColor: '#2c221a', border: '4px solid #a67c52', borderRadius: '16px', padding: '30px', textAlign: 'center', color: '#fff', fontFamily: 'monospace', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', minWidth: '400px' }}
            onPointerDown={(e) => { e.stopPropagation(); handleAction(e); }}
          >
            <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', fontSize: '28px' }}>{minigame.type === 'tree' ? 'CHOPPING TREE' : 'MINING ROCK'}</h2>
            
            {minigame.status === 'playing' ? (
              <>
                <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '16px' }}>Phase {minigame.phase} / 3<br/>Click anywhere when the needle is in the green zone!</p>
                
                <div style={{ 
                  width: '160px', height: '160px', backgroundColor: '#000', border: '4px solid #5a402a', 
                  position: 'relative', borderRadius: '50%', margin: '0 auto 30px auto',
                  background: `conic-gradient(transparent 0deg, transparent ${minigame.targetStart}deg, rgba(0, 255, 65, 0.5) ${minigame.targetStart}deg, rgba(0, 255, 65, 0.5) ${minigame.targetStart + minigame.targetWidth}deg, transparent ${minigame.targetStart + minigame.targetWidth}deg)`
                }}>
                  {/* Center Pivot Point */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', width: '12px', height: '12px', backgroundColor: '#5a402a', borderRadius: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 }} />
                  {/* Rotating Needle Cursor */}
                  <div style={{ position: 'absolute', top: '4px', left: 'calc(50% - 2px)', width: '4px', height: 'calc(50% - 4px)', backgroundColor: '#fff', transformOrigin: 'bottom center', transform: `rotate(${minigame.cursor}deg)`, boxShadow: '0 0 8px #fff', borderRadius: '2px', zIndex: 4 }} />
                </div>

                <button 
                  style={{ padding: '12px 24px', backgroundColor: '#00ff41', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', width: '100%' }}
                >
                  {minigame.type === 'tree' ? 'CHOP!' : 'MINE!'}
                </button>
              </>
            ) : minigame.status === 'success' ? (
              <h3 style={{ color: '#00ff41', margin: '20px 0', fontSize: '24px' }}>{minigame.type === 'tree' ? 'TIMBER! Tree Chopped!' : 'SMASH! Rock Destroyed!'}</h3>
            ) : (
              <h3 style={{ color: '#ff4444', margin: '20px 0', fontSize: '24px' }}>Missed! {minigame.type === 'tree' ? 'Axe' : 'Pickaxe'} consumed.</h3>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Forest;
