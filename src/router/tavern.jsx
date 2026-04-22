import React, { useState, useEffect, useRef } from "react";
import { TAVERN_BEES, TAVERN_HOTSPOTS, TAVERN_STUFFS, TAVERN_VIEWPORT } from "../constants/scene_tavern";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { ID_TAVERN_HOTSPOTS } from "../constants/app_ids";
import PotionDialog from "../containers/Tavern_Potion";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";
import { useItems } from "../hooks/useItems";
import { ALL_ITEMS } from "../constants/item_data";
import { useNotification } from "../contexts/NotificationContext";
import "../styles/KitchenMinigame.css";

const RECIPES = [
  {
      id: 9952, name: "Tomato Soup", icon: "🍅", dish: "🥣", difficulty: "⭐", difficultyLabel: "Easy",
      reqs: [{ name: 'Tomato', count: 2 }, { name: 'Onion', count: 1 }],
      steps: [
          { type: 'chop', ingredient: '🍅', name: 'Chop Tomatoes', count: 6, instruction: 'Tap the cutting board to chop!' },
          { type: 'chop', ingredient: '🧅', name: 'Dice Onion', count: 4, instruction: 'Tap to dice the onion!' },
          { type: 'add', name: 'Add Ingredients', instruction: 'Tap ingredients to add to pot!', items: ['🧅', '🍅', '🍅'] },
          { type: 'stir', name: 'Stir Soup', instruction: 'Drag your mouse in circles to stir!', count: 8, color: '#ff6347' },
          { type: 'timer', name: 'Simmer', instruction: 'Press STOP in the green zone!', speed: 2, sweetSpot: [60, 80] }
      ]
  },
  {
      id: 9950, name: "Hearty Stew", icon: "🥘", dish: "🍲", difficulty: "⭐⭐", difficultyLabel: "Medium",
      reqs: [{ name: 'Potato', count: 1 }, { name: 'Carrot', count: 1 }, { name: 'Onion', count: 1 }],
      steps: [
          { type: 'peel', ingredient: '🥔', name: 'Peel Potatoes', count: 4, instruction: 'Drag down to peel the skin!' },
          { type: 'chop', ingredient: '🥕', name: 'Slice Carrots', count: 6, instruction: 'Drag across the cutting board to slice!' },
          { type: 'add', name: 'Add to Pot', instruction: 'Add ingredients exactly in order!', items: ['🧅', '🥕', '🥔'] },
          { type: 'stir', name: 'Stir Stew', instruction: 'Drag your mouse in circles to mix!', count: 10, color: '#8b5a2b' },
          { type: 'season', name: 'Season', instruction: 'Click shaker, stop in green zone!', seasoning: '🧂', target: [50, 70] },
          { type: 'timer', name: 'Slow Cook', instruction: 'Stop at the right moment!', speed: 2.5, sweetSpot: [55, 75] }
      ]
  },
  {
      id: 9951, name: "Fish & Chips", icon: "🐟", dish: "🍱", difficulty: "⭐⭐", difficultyLabel: "Medium",
      reqs: [{ name: 'Normal fish', count: 1 }, { name: 'Potato', count: 2 }],
      steps: [
          { type: 'chop', ingredient: '🥔', name: 'Chop Potatoes', count: 10, instruction: 'Chop potatoes for chips!' },
          { type: 'add', name: 'Batter & Fry', instruction: 'Add ingredients to the fryer!', items: ['🥔', '🥔', '🐟'] },
          { type: 'timer', name: 'Fry Chips', instruction: 'Fry until golden!', speed: 3, sweetSpot: [65, 85] },
          { type: 'season', name: 'Salt & Vinegar', instruction: 'Season well!', seasoning: '🧂', target: [45, 75] }
      ]
  }
];

const KitchenMinigame = ({ onClose }) => {
  const { all: allItems, refetch } = useItems();
  const { show } = useNotification();
  
  const [screen, setScreen] = useState('title'); // 'title', 'cooking', 'results'
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [miniGameActive, setMiniGameActive] = useState(false);
  const [gameData, setGameData] = useState({});
  const [mamaState, setMamaState] = useState({ face: '👩‍🍳', speech: "Let's cook!" });
  const [flashClass, setFlashClass] = useState('');
  
  const [dragStart, setDragStart] = useState(null);
  const [lastAngle, setLastAngle] = useState(null);
  const [accumAngle, setAccumAngle] = useState(0);
  
  const timerRef = useRef(null);

  const handleSelectRecipe = (recipe) => {
    const matchedIngredients = [];
    for (const req of recipe.reqs) {
      const item = allItems.find(i => i.label?.toLowerCase() === req.name.toLowerCase() || ALL_ITEMS[i.id]?.label?.toLowerCase() === req.name.toLowerCase());
      if (!item || item.count < req.count) return show(`You need ${req.count}x ${req.name}!`, "error");
      matchedIngredients.push({ item, req });
    }
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    for (const { item, req } of matchedIngredients) {
      let needed = req.count;
      let pVal = sandboxProduce[item.id];
      if (pVal !== undefined) {
        if (Array.isArray(pVal)) { while(needed > 0 && pVal.length > 0) { pVal.pop(); needed--; } }
        else if (typeof pVal === 'number') {
          const num = Number(pVal) || 0; const deduct = Math.min(num, needed);
          sandboxProduce[item.id] = num - deduct; needed -= deduct;
        }
      }
      if (needed > 0 && sandboxLoot[item.id] > 0) {
        sandboxLoot[item.id] = Math.max(0, sandboxLoot[item.id] - needed);
      }
    }
    
    localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    
    setActiveRecipe(recipe);
    setScore(0);
    setCurrentStepIndex(0);
    setScreen('cooking');
  };

  useEffect(() => {
    if (screen === 'cooking' && activeRecipe) {
      const step = activeRecipe.steps[currentStepIndex];
      let initData = {};
      if (step.type === 'add') {
        initData = { shuffled: [...step.items].sort(() => Math.random() - 0.5), placed: 0, correctOrder: 0, placedItems: [], usedIdxs: [] };
      } else if (step.type === 'season') {
        initData = { fillAmount: 0, stopped: false };
      } else if (step.type === 'timer') {
        initData = { barWidth: 0, direction: 1 };
      }
      
      setGameData(initData);
      setMiniGameActive(true);
      setMamaState({ face: '👩‍🍳', speech: step.instruction });
      setDragStart(null);
      setLastAngle(null);
      setAccumAngle(0);
    }
  }, [currentStepIndex, screen, activeRecipe]);

  const completeStep = (scorePercent) => {
    if (!miniGameActive) return;
    setMiniGameActive(false);
    
    const clamped = Math.max(0, Math.min(100, scorePercent));
    setScore(s => s + Math.round(clamped));
    
    if (clamped >= 80) setMamaState({ face: '😍', speech: 'Perfect!' });
    else if (clamped >= 50) setMamaState({ face: '😊', speech: 'Good job!' });
    else setMamaState({ face: '😅', speech: "Keep trying!" });
    
    setFlashClass(clamped >= 50 ? 'cm-flash-green' : 'cm-flash-red');
    setTimeout(() => {
      setFlashClass('');
      if (currentStepIndex + 1 < activeRecipe.steps.length) {
        setCurrentStepIndex(i => i + 1);
      } else {
        setScreen('results');
      }
    }, 1200);
  };

  useEffect(() => {
    if (miniGameActive && activeRecipe?.steps[currentStepIndex]?.type === 'timer') {
      timerRef.current = setInterval(() => {
        setGameData(prev => {
          const speed = activeRecipe.steps[currentStepIndex].speed || 2;
          let w = (prev.barWidth || 0) + speed * (prev.direction || 1);
          let d = prev.direction || 1;
          if (w >= 100) { w = 100; d = -1; }
          if (w <= 0) { w = 0; d = 1; }
          return { ...prev, barWidth: w, direction: d };
        });
      }, 30);
      return () => clearInterval(timerRef.current);
    }
  }, [miniGameActive, currentStepIndex, activeRecipe]);

  const handleTimerStop = () => {
    if (!miniGameActive) return;
    const step = activeRecipe.steps[currentStepIndex];
    const [sweetStart, sweetEnd] = step.sweetSpot;
    const w = gameData.barWidth || 0;
    let s = 10;
    if (w >= sweetStart && w <= sweetEnd) s = 100;
    else {
      const dist = Math.min(Math.abs(w - sweetStart), Math.abs(w - sweetEnd));
      s = Math.max(10, 80 - dist * 1.5);
    }
    completeStep(s);
  };

  const handleAddClick = (item, idx) => {
    if (!miniGameActive || gameData.usedIdxs?.includes(idx)) return;
    const step = activeRecipe.steps[currentStepIndex];
    setGameData(prev => {
      const placed = prev.placed || 0;
      const isCorrect = item === step.items[placed];
      const correctOrder = (prev.correctOrder || 0) + (isCorrect ? 1 : 0);
      const nextPlaced = placed + 1;
      
      if (nextPlaced >= step.items.length) {
        setTimeout(() => completeStep((correctOrder / step.items.length) * 100), 500);
      }
      return { ...prev, placed: nextPlaced, correctOrder, usedIdxs: [...(prev.usedIdxs||[]), idx], placedItems: [...(prev.placedItems||[]), item] };
    });
  };

  const handleSeasonStop = () => {
    if (!miniGameActive || gameData.stopped) return;
    setGameData(prev => ({...prev, stopped: true}));
    const amt = gameData.fillAmount || 0;
    const [start, end] = activeRecipe.steps[currentStepIndex].target;
    let s = 10;
    if (amt >= start && amt <= end) s = 100;
    else { const dist = Math.min(Math.abs(amt-start), Math.abs(amt-end)); s = Math.max(10, 80 - dist * 2); }
    completeStep(s);
  };

  // --- RENDERERS ---
  return (
    <div className="cm-overlay">
      <div className="cm-game">
        {/* TITLE SCREEN */}
        {screen === 'title' && (
          <div className="cm-screen cm-title-screen">
            <button onClick={onClose} className="cm-btn cm-btn-close" style={{position:'absolute', top:15, right:15}}>✖</button>
            <div className="cm-mama-face">👩‍🍳</div>
            <h1>🍳 Cooking Mama</h1>
            <h2>Farm Kitchen Edition</h2>
            <p className="cm-subtitle">Cook with fresh ingredients from your farm!</p>
            
            <div className="cm-recipe-grid">
              {RECIPES.map(r => {
                const canCook = r.reqs.every(req => {
                  const item = allItems.find(i => i.label?.toLowerCase() === req.name.toLowerCase());
                  return item && item.count >= req.count;
                });
                return (
                  <button key={r.id} disabled={!canCook} className="cm-recipe-card" onClick={() => handleSelectRecipe(r)}>
                    <span className="cm-recipe-icon">{r.icon}</span>
                    <div className="cm-recipe-name">{r.name}</div>
                    <div className="cm-recipe-reqs">
                      {r.reqs.map(req => {
                        const count = allItems.find(i => i.label?.toLowerCase() === req.name.toLowerCase())?.count || 0;
                        return <span key={req.name} style={{ color: count >= req.count ? '#06d6a0' : '#ef476f' }}>{req.name}: {count}/{req.count}</span>;
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* COOKING SCREEN */}
        {screen === 'cooking' && activeRecipe && (
          <div className="cm-screen cm-cooking-screen">
            <div className="cm-cooking-header">
              <div className="cm-recipe-title">{activeRecipe.icon} {activeRecipe.name}</div>
              <div className="cm-step-indicator">Step {currentStepIndex + 1} / {activeRecipe.steps.length}</div>
              <div className="cm-score-display">⭐ {score}</div>
            </div>
            
            <div className="cm-mama-instructor">
              <div style={{fontSize: 40}}>{mamaState.face}</div>
              <div className="cm-speech-bubble">{mamaState.speech}</div>
            </div>

            <div className={`cm-cooking-area ${flashClass}`}>
              {activeRecipe.steps[currentStepIndex].type === 'chop' && (
                <div style={{textAlign:'center'}}>
                  <div className="cm-cutting-board" 
                       onPointerDown={(e) => setDragStart({x: e.clientX, y: e.clientY})}
                       onPointerMove={(e) => {
                         if (!miniGameActive) return;
                         if (dragStart && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > 120) {
                           setGameData(prev => {
                             const nextChops = (prev.chops || 0) + 1;
                             if (nextChops >= activeRecipe.steps[currentStepIndex].count) setTimeout(() => completeStep(100), 200);
                             return { ...prev, chops: nextChops, chopped: !prev.chopped };
                           });
                           setDragStart(null);
                         }
                       }}
                       onPointerUp={() => setDragStart(null)}
                       onPointerLeave={() => setDragStart(null)}
                  >
                    <div style={{ position: 'absolute', width: '100%', height: '4px', borderTop: '6px dashed rgba(255,255,255,0.4)', top: '50%', pointerEvents: 'none', zIndex: 1 }} />
                    <span style={{fontSize:40, position:'absolute', right:20, top:10, animation:'cm-mama-bounce 1s infinite'}}>🔪</span>
                    <span className={`cm-ingredient-on-board ${gameData.chopped ? 'cm-ingredient-chopped' : ''}`}>{activeRecipe.steps[currentStepIndex].ingredient}</span>
                  </div>
                  <div style={{fontSize:22, fontWeight:800, color:'#8b5e3c', marginTop:15}}>
                    Chops: <span style={{color:'#ef476f'}}>{gameData.chops || 0}</span> / {activeRecipe.steps[currentStepIndex].count}
                  </div>
                </div>
              )}

              {activeRecipe.steps[currentStepIndex].type === 'peel' && (
                <div style={{textAlign:'center'}}>
                  <div className="cm-cutting-board" 
                       onPointerDown={(e) => setDragStart({x: e.clientX, y: e.clientY})}
                       onPointerMove={(e) => {
                         if (!miniGameActive) return;
                         if (dragStart && (e.clientY - dragStart.y) > 80) { // Dragged downwards
                           setGameData(prev => {
                             const nextPeels = (prev.peels || 0) + 1;
                             if (nextPeels >= activeRecipe.steps[currentStepIndex].count) setTimeout(() => completeStep(100), 200);
                             return { ...prev, peels: nextPeels, peeled: !prev.peeled };
                           });
                           setDragStart(null);
                         }
                       }}
                       onPointerUp={() => setDragStart(null)}
                       onPointerLeave={() => setDragStart(null)}
                  >
                    <div style={{ position: 'absolute', width: '20px', height: '100%', borderLeft: '6px dashed rgba(255,255,255,0.4)', left: '50%', pointerEvents: 'none', zIndex: 1 }} />
                    <span className={`cm-ingredient-on-board ${gameData.peeled ? 'cm-ingredient-chopped' : ''}`} style={{ transition: 'transform 0.1s' }}>{activeRecipe.steps[currentStepIndex].ingredient}</span>
                  </div>
                  <div style={{fontSize:22, fontWeight:800, color:'#8b5e3c', marginTop:15}}>
                    Peels: <span style={{color:'#ef476f'}}>{gameData.peels || 0}</span> / {activeRecipe.steps[currentStepIndex].count}
                  </div>
                </div>
              )}

              {activeRecipe.steps[currentStepIndex].type === 'add' && (
                <div style={{textAlign:'center'}}>
                  <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:20, flexWrap:'wrap'}}>
                    {gameData.shuffled?.map((item, i) => (
                       <div key={i} onClick={() => handleAddClick(item, i)} style={{ width: 60, height: 60, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 35, cursor: 'pointer', border: '2px solid #ddd', opacity: gameData.usedIdxs?.includes(i) ? 0.3 : 1 }}>
                         {item}
                       </div>
                    ))}
                  </div>
                  <div style={{ width: 250, height: 120, background: 'linear-gradient(180deg, #e0e0e0, #bbb)', borderRadius: '0 0 50% 50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '4px solid #999' }}>
                     {gameData.placedItems?.map((p, i) => <span key={i} style={{fontSize: 30}}>{p}</span>)}
                  </div>
                </div>
              )}

              {activeRecipe.steps[currentStepIndex].type === 'stir' && (
                <div style={{textAlign:'center'}}>
                  <div className="cm-pot-container"
                       onPointerDown={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         setDragStart({ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 });
                       }}
                       onPointerMove={(e) => {
                         if (!dragStart || !miniGameActive) return;
                         const angle = Math.atan2(e.clientY - dragStart.cy, e.clientX - dragStart.cx);
                         if (lastAngle !== null) {
                           let delta = angle - lastAngle;
                           if (delta > Math.PI) delta -= 2 * Math.PI;
                           if (delta < -Math.PI) delta += 2 * Math.PI;
                           const newAcc = accumAngle + Math.abs(delta);
                           if (newAcc > Math.PI * 2) {
                             setGameData(prev => {
                               const nextHits = (prev.hits || 0) + 1;
                               if (nextHits >= activeRecipe.steps[currentStepIndex].count) setTimeout(() => completeStep(100), 200);
                               return { ...prev, hits: nextHits };
                             });
                             setAccumAngle(0);
                           } else {
                             setAccumAngle(newAcc);
                           }
                         }
                         setLastAngle(angle);
                       }}
                       onPointerUp={() => { setDragStart(null); setLastAngle(null); setAccumAngle(0); }}
                       onPointerLeave={() => { setDragStart(null); setLastAngle(null); setAccumAngle(0); }}
                       style={{ cursor: dragStart ? 'grabbing' : 'grab' }}
                  >
                    <div style={{ width: 240, height: 20, background: '#777', borderRadius: 10, margin: '0 auto', position: 'absolute', top: 50, left: 5, zIndex: 2 }} />
                    <div className="cm-pot">
                      <div className="cm-pot-contents" style={{background: activeRecipe.steps[currentStepIndex].color || '#ff6347'}} />
                    </div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '50px', pointerEvents: 'none', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>🥄</div>
                  </div>
                  <div style={{fontSize:22, fontWeight:800, color:'#8b5e3c', marginTop:15}}>
                    Stirs: <span style={{color:'#ef476f'}}>{gameData.hits || 0}</span> / {activeRecipe.steps[currentStepIndex].count}
                  </div>
                </div>
              )}

              {activeRecipe.steps[currentStepIndex].type === 'timer' && (
                <div style={{textAlign:'center'}}>
                  <div className="cm-oven">
                    <div className="cm-oven-window">{activeRecipe.dish}</div>
                  </div>
                  <div className="cm-timer-bar-container">
                    <div className="cm-timer-sweet-spot" style={{ left: `${activeRecipe.steps[currentStepIndex].sweetSpot[0]}%`, width: `${activeRecipe.steps[currentStepIndex].sweetSpot[1] - activeRecipe.steps[currentStepIndex].sweetSpot[0]}%` }} />
                    <div className="cm-timer-bar-fill" style={{ width: `${gameData.barWidth || 0}%`, background: (gameData.barWidth >= activeRecipe.steps[currentStepIndex].sweetSpot[0] && gameData.barWidth <= activeRecipe.steps[currentStepIndex].sweetSpot[1]) ? '#06d6a0' : 'linear-gradient(90deg, #06d6a0, #ffd166, #ef476f)' }} />
                  </div>
                  <button className="cm-timer-btn" onClick={handleTimerStop}>🛑 STOP!</button>
                </div>
              )}

              {activeRecipe.steps[currentStepIndex].type === 'season' && (
                <div style={{textAlign:'center'}}>
                  <div className="cm-timer-bar-container" style={{height: 35, background: '#eee'}}>
                    <div className="cm-timer-sweet-spot" style={{ left: `${activeRecipe.steps[currentStepIndex].target[0]}%`, width: `${activeRecipe.steps[currentStepIndex].target[1] - activeRecipe.steps[currentStepIndex].target[0]}%` }} />
                    <div className="cm-timer-bar-fill" style={{ width: `${gameData.fillAmount || 0}%`, background: 'linear-gradient(90deg, #90EE90, #FFD700, #FF6347)' }} />
                  </div>
                  <div onClick={() => { if(!gameData.stopped) setGameData(p => ({...p, fillAmount: Math.min(100, (p.fillAmount||0) + 5 + Math.random()*5), shaking: !p.shaking})) }} style={{ fontSize: 70, cursor: 'pointer', margin: 20, transform: gameData.shaking ? 'rotate(20deg)' : 'rotate(-20deg)', transition: 'transform 0.1s' }}>
                    {activeRecipe.steps[currentStepIndex].seasoning}
                  </div>
                  <button className="cm-btn cm-btn-secondary" onClick={handleSeasonStop}>✅ Done!</button>
                </div>
              )}
            </div>
            
            <div className="cm-cooking-footer">
              <div className="cm-progress-bar-container">
                 <div className="cm-progress-bar" style={{width: `${(currentStepIndex / activeRecipe.steps.length) * 100}%`}} />
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === 'results' && activeRecipe && (
          <div className="cm-screen cm-results-screen">
            <div style={{fontSize: 60}}>👩‍🍳</div>
            <h2 style={{fontFamily: "'Fredoka One', cursive", fontSize: 26, color: '#8b5e3c'}}>
              {score / (activeRecipe.steps.length * 100) >= 0.8 ? "PERFECT! Mama is so proud! 💖" : "Great cooking! Very tasty! 😋"}
            </h2>
            <div style={{fontSize: 80, margin: '15px 0'}}>{activeRecipe.dish}</div>
            
            <div style={{fontSize: 40, letterSpacing: 5}}>
              {[...Array(3)].map((_, i) => {
                 const stars = Math.floor((score / (activeRecipe.steps.length * 100)) * 3.5);
                 return <span key={i} style={{ filter: i < stars ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>;
              })}
            </div>
            <div style={{fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#ff8c42', marginBottom: 20}}>Score: {score}</div>
            
            <div style={{display: 'flex', gap: 15, justifyContent: 'center'}}>
              <button className="cm-btn cm-btn-primary" onClick={() => {
                const stars = Math.floor((score / (activeRecipe.steps.length * 100)) * 3.5);
                if (stars > 0) {
                  const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
                  sandboxLoot[activeRecipe.id] = (sandboxLoot[activeRecipe.id] || 0) + 1;
                  localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
                  if (refetch) refetch();
                  show(`Perfect! You kept a delicious ${activeRecipe.name}!`, "success");
                }
                setScreen('title');
              }}>Claim & Cook More</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const Tavern = () => {
  const { width, height } = TAVERN_VIEWPORT;
  const hotspots = TAVERN_HOTSPOTS;
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [showKitchen, setShowKitchen] = useState(false);
  const [isTavernUnlocked, setIsTavernUnlocked] = useState(() => localStorage.getItem('quest_q2_rebuild_tavern_completed') === 'true');

  useEffect(() => {
    // If somehow they get here too early in the tutorial, push them to house
    if (tutorialStep === 17 || tutorialStep === 18 || tutorialStep === 19) {
      setTutorialStep(20);
      localStorage.setItem('sandbox_tutorial_step', '20');
      window.location.href = '/house';
    }
    const stepHandler = () => setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    window.addEventListener('tutorialStepChanged', stepHandler);
    return () => window.removeEventListener('tutorialStepChanged', stepHandler);
  }, [tutorialStep]);

  const advanceTutorial = () => {
    const nextStep = tutorialStep + 1;
    setTutorialStep(nextStep);
    localStorage.setItem('sandbox_tutorial_step', nextStep.toString());
  };

  const getActiveHotspots = () => {
    if (tutorialStep >= 32) return hotspots;
    if (tutorialStep >= 24) return hotspots.map(h => ({ ...h, disabled: true }));
    return [];
  };

  const dialogs = [
    {
        id: ID_TAVERN_HOTSPOTS.POTION,
        component: PotionDialog,
        label: "POTION MASTER",
        header: "/images/dialog/modal-header-potion.png",
    }
  ];

  if (!isTavernUnlocked) {
    const TAVERN_REQS = [
      { id: 9993, name: "Wood Logs", count: 50, image: "/images/forest/wood.png" },
      { id: 9994, name: "Stones", count: 50, image: "/images/forest/rock.png" },
      { id: 131586, name: "Potatoes", count: 10, image: ALL_ITEMS[131586]?.image || "/images/items/potato.png" },
    ];

    const getItemCounts = () => {
      const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
      return TAVERN_REQS.map(req => {
        let current = 0;
        if (Array.isArray(produce[req.id])) current += produce[req.id].length;
        else current += (Number(produce[req.id]) || 0) + (Number(loot[req.id]) || 0);
        return { ...req, current: Math.min(current, req.count) };
      });
    };

    const TavernRebuildUI = () => {
      const { show } = useNotification();
      const [counts, setCounts] = React.useState(() => getItemCounts());

      React.useEffect(() => {
        const handler = () => setCounts(getItemCounts());
        window.addEventListener('ls-update', handler);
        return () => window.removeEventListener('ls-update', handler);
      }, []);

      const canRebuild = counts.every(r => r.current >= r.count);

      const handleRebuild = () => {
        if (!canRebuild) return;
        const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

        for (const req of TAVERN_REQS) {
          let remaining = req.count;
          if (Array.isArray(produce[req.id])) {
            while (remaining > 0 && produce[req.id].length > 0) { produce[req.id].pop(); remaining--; }
          } else {
            const fromProduce = Math.min(Number(produce[req.id]) || 0, remaining);
            produce[req.id] = (Number(produce[req.id]) || 0) - fromProduce;
            remaining -= fromProduce;
          }
          if (remaining > 0 && loot[req.id]) {
            const fromLoot = Math.min(Number(loot[req.id]), remaining);
            loot[req.id] -= fromLoot;
          }
        }

        // Give 500 honey reward
        const currentHoney = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
        localStorage.setItem('sandbox_honey', (currentHoney + 500).toString());
        window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (currentHoney + 500).toString() }));

        localStorage.setItem('sandbox_loot', JSON.stringify(loot));
        localStorage.setItem('sandbox_produce', JSON.stringify(produce));
        localStorage.setItem('quest_q2_rebuild_tavern_completed', 'true');

        // Mark quest completed
        const completed = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
        if (!completed.includes('q2_rebuild_tavern')) {
          completed.push('q2_rebuild_tavern');
          localStorage.setItem('sandbox_completed_quests', JSON.stringify(completed));
        }

        window.dispatchEvent(new CustomEvent('tavernUnlocked'));
        setIsTavernUnlocked(true);
        show('Tavern rebuilt! +500 Honey', 'success');
      };

      return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1008', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', fontFamily: 'monospace', gap: '24px' }}>
          <h1 style={{ color: '#ffea00', fontSize: '42px', margin: 0, textShadow: '0 4px 10px rgba(0,0,0,0.8)' }}>Tavern is Ruined!</h1>
          <p style={{ fontSize: '16px', color: '#ccc', textAlign: 'center', maxWidth: '500px', lineHeight: '1.6', margin: 0 }}>
            Gather the materials below and submit them here to rebuild the Tavern.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '12px', padding: '24px', minWidth: '340px' }}>
            {counts.map((req) => {
              const pct = Math.min(100, (req.current / req.count) * 100);
              const done = req.current >= req.count;
              return (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={req.image} alt={req.name} style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} onError={(e) => { e.target.onerror = null; e.target.src = '/images/forest/rock.png'; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: done ? '#00ff41' : '#ccc' }}>{req.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: done ? '#00ff41' : '#ffea00' }}>{req.current}/{req.count}</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: done ? '#00ff41' : '#ffea00', transition: 'width 0.3s', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={handleRebuild}
              disabled={!canRebuild}
              style={{ padding: '14px 32px', fontSize: '18px', backgroundColor: canRebuild ? '#ffea00' : '#444', color: canRebuild ? '#000' : '#888', border: 'none', borderRadius: '8px', cursor: canRebuild ? 'pointer' : 'not-allowed', fontWeight: 'bold', boxShadow: canRebuild ? '0 4px 12px rgba(255,234,0,0.4)' : 'none', transition: 'all 0.2s', fontFamily: 'monospace' }}
              onMouseEnter={(e) => { if (canRebuild) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Rebuild Tavern
            </button>
            <button
              onClick={() => window.location.href = '/farm'}
              style={{ padding: '14px 28px', fontSize: '16px', backgroundColor: 'transparent', color: '#ccc', border: '2px solid #5a402a', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ccc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#5a402a'; }}
            >
              Return to Farm
            </button>
          </div>
        </div>
      );
    };

    return <TavernRebuildUI />;
  }

  return (
    <>
      <style>{`.map-btn { animation-duration: 6s !important; }`}</style>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/tavern.webp"
        hotspots={getActiveHotspots()}
        dialogs={dialogs}
        width={width}
        height={height}
        stuffs={TAVERN_STUFFS}
        bees={TAVERN_BEES}
        initialScale={1.53}
        backgroundOffsetX={-1}
        backgroundOffsetY={-50}
        disablePanZoom
        hotspotScale={0.75}
      />
      
      {/* KITCHEN BUTTON - hidden */}

      {/* KITCHEN MINIGAME OVERLAY */}
      {showKitchen && <KitchenMinigame onClose={() => setShowKitchen(false)} />}
      <AdminPanel />

      {(tutorialStep === 24 || tutorialStep === 25) && (
        <>
          <style>{`
            a[href*="/farm"], a[href*="/house"], a[href*="/valley"], a[href*="/market"], a[href*="/tavern"] { pointer-events: none !important; }
            div[title], button[title], .hotspot, .map-btn { pointer-events: none !important; }
            @keyframes valleyIconPulse { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1); } }
            ${tutorialStep === 25 ? `a[href*="/valley"] { animation: valleyIconPulse 1.5s infinite !important; position: relative; z-index: 100001; pointer-events: auto !important; }` : ''}
          `}</style>
          <div style={{ position: 'fixed', right: '0px', bottom: '0px', zIndex: 100000 }}>
            <div style={{ position: 'relative', width: '666px' }}>
              <img src="/images/tutorial/sirbeetextbox.png" alt="Tutorial" style={{ width: '666px', objectFit: 'contain' }} />
              <div style={{ position: 'absolute', top: 'calc(10% + 45px)', left: '22%', right: '10%', bottom: '22%', display: 'flex', alignItems: 'flex-start' }}>
                {tutorialStep === 24 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Welcome to the Tavern! This is where you can brew powerful Potions using ingredients from your farm, and cook up delicious meals in the Kitchen. Both will give you helpful boosts as you grow your farm!
                  </p>
                )}
                {tutorialStep === 25 && (
                  <p style={{ fontFamily: 'Cartoonist', fontSize: '11px', color: '#3b1f0a', lineHeight: '1.5', margin: 0 }}>
                    Now click the Valley icon to take a look at the whole valley!
                  </p>
                )}
              </div>
              {tutorialStep === 24 && (
                <div className="tut-arrow" onClick={advanceTutorial}>
                  <img src="/images/tutorial/next.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Tavern;