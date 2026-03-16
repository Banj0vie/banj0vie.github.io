import React, { useState, useEffect } from "react";
import { useNotification } from "../contexts/NotificationContext";
import { useItems } from "../hooks/useItems";
import { ALL_ITEMS } from "../constants/item_data";
import { ID_PRODUCE_ITEMS, ID_FISH_ITEMS, ID_POTION_ITEMS, ID_CHEST_ITEMS, ID_SEEDS } from "../constants/app_ids";
import { setSimulatedDateInfo } from "../components/WeatherOverlay";

const AdminPanel = () => {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [autoSpawnEnabled, setAutoSpawnEnabled] = useState(() => localStorage.getItem('auto_spawn_enabled') !== 'false');
  const [showDebugLabels, setShowDebugLabels] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');
  const [consoleInput, setConsoleInput] = useState('');
  const [showTOC, setShowTOC] = useState(false);
  const { show } = useNotification();
  const { refetch, all: allItems } = useItems();

  // Sync toggles with window events
  useEffect(() => {
    const handleStorage = () => {
      setAutoSpawnEnabled(localStorage.getItem('auto_spawn_enabled') !== 'false');
      setShowDebugLabels(localStorage.getItem('show_debug_labels') !== 'false');
    };
    window.addEventListener('storage', handleStorage);
    
    const handleSync = (e) => {
      if (e.type === 'toggleAutoSpawn') setAutoSpawnEnabled(e.detail);
      if (e.type === 'toggleDebugLabels') setShowDebugLabels(e.detail);
    };
    window.addEventListener('toggleAutoSpawn', handleSync);
    window.addEventListener('toggleDebugLabels', handleSync);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('toggleAutoSpawn', handleSync);
      window.removeEventListener('toggleDebugLabels', handleSync);
    };
  }, []);

  const toggleAutoSpawn = () => {
    const newVal = !autoSpawnEnabled;
    setAutoSpawnEnabled(newVal);
    localStorage.setItem('auto_spawn_enabled', newVal);
    window.dispatchEvent(new CustomEvent('toggleAutoSpawn', { detail: newVal }));
  };

  const toggleDebugLabels = () => {
    const newVal = !showDebugLabels;
    setShowDebugLabels(newVal);
    localStorage.setItem('show_debug_labels', newVal);
    window.dispatchEvent(new CustomEvent('toggleDebugLabels', { detail: newVal }));
  };

  const handleForceSpawnBug = () => window.dispatchEvent(new CustomEvent('forceSpawnBug'));
  const handleForceSpawnCrow = () => window.dispatchEvent(new CustomEvent('forceSpawnCrow'));

  const handleConsoleSubmit = (e) => {
    e.preventDefault();
    const cmd = consoleInput.trim().toLowerCase().replace(/\s+/g, ' ');
    
    const deleteMatch = cmd.match(/^delete spot (\d+)$/);
    if (deleteMatch) {
      window.dispatchEvent(new CustomEvent('adminDeleteSpot', { detail: { id: parseInt(deleteMatch[1], 10) } }));
      show(`Executed: removed scarecrow from spot ${deleteMatch[1]}`, "success");
      setConsoleInput('');
      return;
    }
    
    const deleteLadyMatch = cmd.match(/^delete ladybug (\d+)$/);
    if (deleteLadyMatch) {
      window.dispatchEvent(new CustomEvent('adminDeleteLadybug', { detail: { id: parseInt(deleteLadyMatch[1], 10) } }));
      show(`Executed: removed ladybug from spot ${deleteLadyMatch[1]}`, "success");
      setConsoleInput('');
      return;
    }

    const deleteLSpotMatch = cmd.match(/^delete lspot (\d+)$/);
    if (deleteLSpotMatch) {
      window.dispatchEvent(new CustomEvent('adminDeleteLadybug', { detail: { id: parseInt(deleteLSpotMatch[1], 10) } }));
      show(`Executed: removed ladybug from lspot ${deleteLSpotMatch[1]}`, "success");
      setConsoleInput('');
      return;
    }

    const setWeekdayMatch = cmd.match(/^set day (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
    if (setWeekdayMatch) {
      const dayStr = setWeekdayMatch[1];
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayIndex = days.indexOf(dayStr);
      const newDate = dayIndex === 0 ? 7 : dayIndex;
      setSimulatedDateInfo(newDate);
      window.dispatchEvent(new CustomEvent('changeSimulatedDate', { detail: { day: dayIndex, date: newDate } }));
      show(`Executed: changed day to ${dayStr.charAt(0).toUpperCase() + dayStr.slice(1)}`, "success");
      setConsoleInput('');
      return;
    }

    const setDateMatch = cmd.match(/^set date (\d+)$/);
    if (setDateMatch) {
      const newDate = parseInt(setDateMatch[1], 10);
      if (newDate >= 1 && newDate <= 31) {
        setSimulatedDateInfo(newDate);
        window.dispatchEvent(new CustomEvent('changeSimulatedDate', { detail: { day: newDate % 7, date: newDate } }));
        show(`Executed: changed date to Day ${newDate}`, "success");
      } else {
        show("Date must be between 1 and 31", "error");
      }
      setConsoleInput('');
      return;
    }

    const axeMatch = cmd.match(/^axe (-?\d+)$/);
    if (axeMatch) {
      const amount = parseInt(axeMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9991] = (sandboxLoot[9991] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Axe(s)`, "success");
      setConsoleInput('');
      return;
    }

    const picaxeMatch = cmd.match(/^picaxe (-?\d+)$/);
    if (picaxeMatch) {
      const amount = parseInt(picaxeMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9992] = (sandboxLoot[9992] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Pickaxe(s)`, "success");
      setConsoleInput('');
      return;
    }

    const woodMatch = cmd.match(/^wood (-?\d+)$/);
    if (woodMatch) {
      const amount = parseInt(woodMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9993] = (sandboxLoot[9993] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Wood Log(s)`, "success");
      setConsoleInput('');
      return;
    }

    const stoneMatch = cmd.match(/^stone (-?\d+)$/);
    if (stoneMatch) {
      const amount = parseInt(stoneMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9994] = (sandboxLoot[9994] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Stone(s)`, "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'delete spot') {
      window.dispatchEvent(new CustomEvent('adminDeleteSpot', { detail: { id: null } }));
      show("Executed: removed all scarecrows", "success");
      setConsoleInput('');
      return;
    }
    
    if (cmd === 'delete ladybug' || cmd === 'delete lspot') {
      window.dispatchEvent(new CustomEvent('adminDeleteLadybug', { detail: { id: null } }));
      show("Executed: removed all ladybugs", "success");
      setConsoleInput('');
      return;
    }

    const speedMatch = cmd.match(/^crop speed (\d+)(?:%)?$/);
    if (speedMatch) {
      const speed = parseInt(speedMatch[1], 10);
      if (speed <= 0) {
        show("Speed must be greater than 0!", "error");
        return;
      }
      localStorage.setItem('sandbox_crop_speed', speed);
      show(`Executed: crop growth speed set to ${speed}%`, "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'clear farm') {
      window.dispatchEvent(new CustomEvent('adminClearCrops'));
      window.dispatchEvent(new CustomEvent('adminClearPests'));
      window.dispatchEvent(new CustomEvent('adminDeleteSpot', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('adminDeleteLadybug', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('adminDeleteSprinkler', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('adminDeleteUmbrella', { detail: { id: null } }));
      show("Executed: farm completely cleared", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'clear crop') {
      window.dispatchEvent(new CustomEvent('adminClearCrops'));
      show("Executed: all crops cleared", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'clear pest') {
      window.dispatchEvent(new CustomEvent('adminClearPests'));
      show("Executed: all pests cleared", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'reset forest') {
      localStorage.removeItem('forest_last_visited');
      show("Executed: forest timer reset", "success");
      setConsoleInput('');
      return;
    }

    const setContestMatch = cmd.match(/^set contest (.+)$/);
    if (setContestMatch) {
      const itemName = setContestMatch[1].trim().toLowerCase();
      
      let targetId = null;
      let targetLabel = "";

      // 1. Try user's inventory items
      const invItem = allItems.find(i => (i.label || '').toLowerCase() === itemName) || 
                      allItems.find(i => (i.label || '').toLowerCase().includes(itemName));
      
      if (invItem) {
        targetId = invItem.id;
        targetLabel = invItem.label;
      } else {
        // 2. Try global ALL_ITEMS
        const allItem = Object.values(ALL_ITEMS || {}).find(i => (i.label || '').toLowerCase() === itemName) || 
                        Object.values(ALL_ITEMS || {}).find(i => (i.label || '').toLowerCase().includes(itemName));
        if (allItem) {
          targetId = allItem.id;
          targetLabel = allItem.label;
        } else {
          // 3. Try ID mappings directly for dynamically created items
          const searchMaps = [ID_PRODUCE_ITEMS, ID_FISH_ITEMS];
          for (const idMap of searchMaps) {
            if (!idMap) continue;
            for (const [key, val] of Object.entries(idMap)) {
              const readable = key.toLowerCase().replace(/_/g, ' ');
              if (readable === itemName || readable.includes(itemName)) {
                targetId = val;
                targetLabel = readable;
                break;
              }
            }
            if (targetId !== null) break;
          }
        }
      }

      if (targetId !== null) {
        const isFish = Object.values(ID_FISH_ITEMS || {}).includes(targetId);
        window.dispatchEvent(new CustomEvent('changeWeightContest', { detail: { targetId, isFish } }));
        show(`Executed: contest set to ${targetLabel}`, "success");
      } else {
        show(`Item '${itemName}' not found.`, "error");
      }
      setConsoleInput('');
      return;
    }

    const matchAddItem = cmd.match(/^(.+?)\s+(-?\d+)$/);
    if (matchAddItem) {
      const itemName = matchAddItem[1].trim();
      const amount = parseInt(matchAddItem[2], 10);
      
      let targetId = null;
      let targetLabel = "";

      const invItem = allItems.find(i => (i.label || '').toLowerCase() === itemName) || 
                      allItems.find(i => (i.label || '').toLowerCase().includes(itemName));
      
      if (invItem) {
        targetId = invItem.id;
        targetLabel = invItem.label;
      } else {
        const allItem = Object.values(ALL_ITEMS || {}).find(i => (i.label || '').toLowerCase() === itemName) || 
                        Object.values(ALL_ITEMS || {}).find(i => (i.label || '').toLowerCase().includes(itemName));
        if (allItem) {
          targetId = allItem.id;
          targetLabel = allItem.label;
        } else {
          const searchMaps = [ID_PRODUCE_ITEMS, ID_FISH_ITEMS, ID_POTION_ITEMS, ID_CHEST_ITEMS, ID_SEEDS];
          for (const idMap of searchMaps) {
            if (!idMap) continue;
            for (const [key, val] of Object.entries(idMap)) {
              const readable = key.toLowerCase().replace(/_/g, ' ');
              if (readable === itemName || readable.includes(itemName)) {
                targetId = val;
                targetLabel = readable;
                break;
              }
            }
            if (targetId !== null) break;
          }
        }
      }

      if (targetId !== null) {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        sandboxLoot[targetId] = Math.max(0, (sandboxLoot[targetId] || 0) + amount);
        localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
        if (refetch) refetch();
        show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} ${targetLabel}(s)`, "success");
        setConsoleInput('');
        return;
      }
    }

    if (cmd === 'toc') {
      setShowTOC(true);
      setConsoleInput('');
      return;
    }

    if (cmd !== '') show(`Unknown command: ${consoleInput}`, "error");
    setConsoleInput('');
  };

  const isConsoleInputValid = (input) => {
    if (!input) return true;
    const cmd = input.trimStart().toLowerCase().replace(/\s+/g, ' ');
    if ("delete spot ".startsWith(cmd)) return true;
    if (cmd.startsWith("delete spot ")) return /^\d*$/.test(cmd.slice(12));
    if ("delete ladybug ".startsWith(cmd)) return true;
    if (cmd.startsWith("delete ladybug ")) return /^\d*$/.test(cmd.slice(15));
    if ("delete lspot ".startsWith(cmd)) return true;
    if (cmd.startsWith("delete lspot ")) return /^\d*$/.test(cmd.slice(13));
    if ("crop speed ".startsWith(cmd)) return true;
    if (cmd.startsWith("crop speed ")) return /^\d+%?$/.test(cmd.slice(11));
    if ("set day ".startsWith(cmd)) return true;
    if (cmd.startsWith("set day ")) {
      const arg = cmd.slice(8);
      return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].some(d => d.startsWith(arg));
    }
    if ("set date ".startsWith(cmd)) return true;
    if (cmd.startsWith("set date ")) return /^\d*$/.test(cmd.slice(9));
    if ("axe ".startsWith(cmd)) return true;
    if (cmd.startsWith("axe ")) return /^-?\d*$/.test(cmd.slice(4));
    if ("picaxe ".startsWith(cmd)) return true;
    if (cmd.startsWith("picaxe ")) return /^-?\d*$/.test(cmd.slice(7));
    if ("wood ".startsWith(cmd)) return true;
    if (cmd.startsWith("wood ")) return /^-?\d*$/.test(cmd.slice(5));
    if ("stone ".startsWith(cmd)) return true;
    if (cmd.startsWith("stone ")) return /^-?\d*$/.test(cmd.slice(6));
    if ("set contest ".startsWith(cmd)) return true;
    if (cmd.startsWith("set contest ")) return true;
    if ("clear farm".startsWith(cmd) || cmd === "clear farm") return true;
    if ("reset forest".startsWith(cmd) || cmd === "reset forest") return true;
    
    if ("clear crop".startsWith(cmd) || cmd === "clear crop") return true;
    if ("clear pest".startsWith(cmd) || cmd === "clear pest") return true;
    if ("toc".startsWith(cmd) || cmd === "toc") return true;
    if ("delete ladybug".startsWith(cmd) || cmd === "delete ladybug") return true;
    if ("delete lspot".startsWith(cmd) || cmd === "delete lspot") return true;

    const matchAddItem = cmd.match(/^(.+?)\s+(-?\d+)$/);
    if (matchAddItem) {
      const itemName = matchAddItem[1].trim();
      if (!["delete spot", "delete ladybug", "delete lspot", "crop speed", "set day", "set date", "force rat", "set contest"].includes(itemName)) {
        return true;
      }
    }

    return false;
  };

  return (
    <>
      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isAdminPanelOpen && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '2px solid #00ff41', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
            <h3 style={{ color: '#00ff41', margin: '0 0 10px 0', borderBottom: '1px solid #00ff41', paddingBottom: '5px', fontFamily: 'monospace', fontSize: '16px' }}>ADMIN PANEL</h3>
            
            <button onClick={toggleAutoSpawn} style={{ backgroundColor: '#000', color: autoSpawnEnabled ? '#00ff41' : '#ff4444', border: `1px solid ${autoSpawnEnabled ? '#00ff41' : '#ff4444'}`, padding: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px' }}>
              AUTO SPAWN: {autoSpawnEnabled ? 'ON' : 'OFF'}
            </button>
            
            <button onClick={toggleDebugLabels} style={{ backgroundColor: '#000', color: '#00ff41', border: '1px solid #00ff41', padding: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px' }}>
              {showDebugLabels ? '[HIDE PLOT LABELS]' : '[SHOW PLOT LABELS]'}
            </button>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleForceSpawnBug} style={{ flex: 1, backgroundColor: '#000', color: '#ff4444', border: '1px solid #ff4444', padding: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px' }}>
                + BUG
              </button>
              <button onClick={handleForceSpawnCrow} style={{ flex: 1, backgroundColor: '#000', color: '#ff4444', border: '1px solid #ff4444', padding: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px' }}>
                + CROW
              </button>
            </div>
            
            <form onSubmit={handleConsoleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
              <span style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '14px' }}>&gt;_ CONSOLE</span>
              <input type="text" value={consoleInput} onChange={(e) => setConsoleInput(e.target.value)} placeholder="e.g. 'crop speed 200'" style={{ backgroundColor: '#000', color: isConsoleInputValid(consoleInput) ? '#00ff41' : '#ff4444', border: `1px solid ${isConsoleInputValid(consoleInput) ? '#00ff41' : '#ff4444'}`, padding: '8px', fontFamily: 'monospace', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease' }} />
            </form>
          </div>
        )}
        
        <button onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)} style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#00ff41', border: '1px solid #00ff41', padding: '8px 12px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px', alignSelf: 'flex-start' }}>
          {isAdminPanelOpen ? '[CLOSE ADMIN]' : '[OPEN ADMIN]'}
        </button>
      </div>

      {showTOC && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.95)', border: '2px solid #00ff41', padding: '20px', borderRadius: '8px', zIndex: 10002, color: '#00ff41', fontFamily: 'monospace', minWidth: '350px' }}>
          <h2 style={{ marginTop: 0, borderBottom: '1px solid #00ff41', paddingBottom: '10px', fontSize: '18px' }}>&gt;_ COMMAND_LIST</h2>
          <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '1.8', fontSize: '14px' }}>
            <li><strong style={{color: '#fff'}}>delete spot [x]</strong> - Removes scarecrow from spot x</li>
            <li><strong style={{color: '#fff'}}>delete spot</strong>     - Removes all scarecrows</li>
            <li><strong style={{color: '#fff'}}>delete lspot [x]</strong> - Removes ladybug from lspot x</li>
            <li><strong style={{color: '#fff'}}>delete lspot</strong>    - Removes all ladybugs</li>
            <li><strong style={{color: '#fff'}}>crop speed [x]</strong>  - Sets growth speed to x% (e.g. 200)</li>
            <li><strong style={{color: '#fff'}}>clear crop</strong>      - Deletes all planted crops</li>
            <li><strong style={{color: '#fff'}}>clear pest</strong>      - Clears all active bugs and crows</li>
            <li><strong style={{color: '#fff'}}>clear farm</strong>      - Resets entire farm state</li>
            <li><strong style={{color: '#fff'}}>set day [day]</strong>   - Changes simulated day (e.g. sunday)</li>
            <li><strong style={{color: '#fff'}}>set date [x]</strong>    - Jumps to a specific date (1-31)</li>
            <li><strong style={{color: '#fff'}}>axe [x]</strong>         - Adds x axes (can be negative)</li>
            <li><strong style={{color: '#fff'}}>picaxe [x]</strong>      - Adds x pickaxes (can be negative)</li>
            <li><strong style={{color: '#fff'}}>wood [x]</strong>        - Adds x wood logs (can be negative)</li>
            <li><strong style={{color: '#fff'}}>stone [x]</strong>       - Adds x stones (can be negative)</li>
            <li><strong style={{color: '#fff'}}>[item] [x]</strong>      - Adds x amount of any item (e.g. "corn 5")</li>
            <li><strong style={{color: '#fff'}}>set contest [item]</strong> - Sets weight contest target</li>
            <li><strong style={{color: '#fff'}}>reset forest</strong>    - Resets the 2-hour forest lock</li>
            <li><strong style={{color: '#fff'}}>toc</strong>             - Opens this command list</li>
          </ul>
          <button onClick={() => setShowTOC(false)} style={{ backgroundColor: '#000', color: '#ff4444', border: '1px solid #ff4444', padding: '8px 12px', cursor: 'pointer', fontFamily: 'monospace', width: '100%', marginTop: '10px', transition: 'all 0.2s' }}>
            [CLOSE]
          </button>
        </div>
      )}

    </>
  );
};

export default AdminPanel;