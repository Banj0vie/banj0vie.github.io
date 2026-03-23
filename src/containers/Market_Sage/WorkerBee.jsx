import React, { useState, useEffect } from "react";
import BaseButton from "../../components/buttons/BaseButton";
import { useItems } from "../../hooks/useItems";
import { useNotification } from "../../contexts/NotificationContext";

const WorkerBee = ({ onBack }) => {
  const { all: allItems, refetch } = useItems();
  const { show } = useNotification();
  
  // Crucial fix: Track the level in a React state so it updates the UI immediately!
  const [beeLevel, setBeeLevel] = useState(() => {
    const savedStr = localStorage.getItem('sandbox_worker_bee_level');
    const saved = parseInt(savedStr, 10);
    return isNaN(saved) ? 1 : saved;
  });

  const woodCount = allItems.find(i => i.id === 9993)?.count || 0;
  const stoneCount = allItems.find(i => i.id === 9994)?.count || 0;
  const plankCount = allItems.find(i => i.id === 9989)?.count || 0;

  // Listen for level changes from outside just in case
  useEffect(() => {
    const handleLevelChange = (e) => {
      setBeeLevel(parseInt(e.detail, 10) || 1);
    };
    window.addEventListener('workerBeeLevelChanged', handleLevelChange);
    return () => window.removeEventListener('workerBeeLevelChanged', handleLevelChange);
  }, []);

  const getUpgradeCost = (level) => {
    if (level >= 10) return null; // Max level
    return { wood: level * 10, stone: level * 10, plank: 0 };
  };

  const cost = getUpgradeCost(beeLevel);

  const handleUpgrade = () => {
    // Dynamically grab the current level directly from storage to prevent any stale React closures
    let currentLevel = parseInt(localStorage.getItem('sandbox_worker_bee_level'), 10);
    if (isNaN(currentLevel)) currentLevel = 1;
    
    const currentCost = getUpgradeCost(currentLevel);
    if (!currentCost) return;

    if (woodCount < currentCost.wood || stoneCount < currentCost.stone || plankCount < currentCost.plank) {
      show("Not enough materials!", "error");
      return;
    }

    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    if (currentCost.wood > 0) sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - currentCost.wood);
    if (currentCost.stone > 0) sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - currentCost.stone);
    if (currentCost.plank > 0) sandboxLoot[9989] = Math.max(0, (sandboxLoot[9989] || 0) - currentCost.plank);
    
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    const newLevel = currentLevel + 1;
    localStorage.setItem('sandbox_worker_bee_level', newLevel.toString());
    setBeeLevel(newLevel);

    window.dispatchEvent(new CustomEvent('workerBeeLevelChanged', { detail: newLevel }));
    
    if (refetch) refetch();
    show(`Worker Bee upgraded to Level ${newLevel}!`, "success");
  };

  return (
    <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center' }}>
      <h2 style={{ color: '#ffea00', fontSize: '24px', margin: '0 0 10px 0' }}>Worker Bee Status</h2>
      <p style={{ margin: '0 0 20px 0', color: '#aaa' }}>Current Level: <strong style={{ color: '#00ff41', fontSize: '24px' }}>{beeLevel}</strong></p>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
        <img src="/pfp/beepfp.png" onError={(e) => { e.target.onerror = null; e.target.src='/images/farm/bee.png'; }} alt="Worker Bee" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255, 234, 0, 0.5))' }} />
      </div>

      {cost ? (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '8px', border: '2px solid #5a402a', margin: '0 auto', maxWidth: '300px' }}>
          <h3 style={{ color: '#00ff41', margin: '0 0 15px 0' }}>Upgrade to Level {beeLevel + 1}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '20px' }}>
            {cost.wood > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#ccc' }}>Wood Logs:</span><span style={{ color: woodCount >= cost.wood ? '#00ff41' : '#ff4444' }}>{woodCount} / {cost.wood}</span></div>}
            {cost.stone > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#ccc' }}>Stones:</span><span style={{ color: stoneCount >= cost.stone ? '#00ff41' : '#ff4444' }}>{stoneCount} / {cost.stone}</span></div>}
            {cost.plank > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#ccc' }}>Wooden Planks:</span><span style={{ color: plankCount >= cost.plank ? '#00ff41' : '#ff4444' }}>{plankCount} / {cost.plank}</span></div>}
          </div>
          
          <button 
            onClick={handleUpgrade} 
            disabled={woodCount < cost.wood || stoneCount < cost.stone || plankCount < cost.plank}
            style={{ width: '100%', padding: '12px', backgroundColor: (woodCount >= cost.wood && stoneCount >= cost.stone && plankCount >= cost.plank) ? '#00ff41' : '#444', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: (woodCount >= cost.wood && stoneCount >= cost.stone && plankCount >= cost.plank) ? 'pointer' : 'not-allowed' }}
          >
            CONFIRM UPGRADE
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: 'rgba(0,255,65,0.1)', padding: '20px', borderRadius: '8px', border: '2px solid #00ff41', margin: '0 auto', maxWidth: '300px' }}><h3 style={{ color: '#00ff41', margin: 0 }}>MAX LEVEL REACHED!</h3><p style={{ color: '#ccc', margin: '10px 0 0 0', fontSize: '14px' }}>Your Worker Bee is fully upgraded!</p></div>
      )}
      <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}><BaseButton label="Back" onClick={onBack} /></div>
    </div>
  );
};

export default WorkerBee;