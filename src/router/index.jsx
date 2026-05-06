import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNotification } from "../contexts/NotificationContext";
import { useItems } from "../hooks/useItems";
import { ALL_ITEMS } from "../constants/item_data";
import { ID_PRODUCE_ITEMS, ID_FISH_ITEMS, ID_POTION_ITEMS, ID_CHEST_ITEMS, ID_SEEDS, ID_BAIT_ITEMS } from "../constants/app_ids";
import { getSimulatedDateInfo, getWeatherForDay } from "../components/WeatherOverlay";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../constants/item_seed";
import { useLocation } from "react-router-dom";

const WeightContestDialog = React.lazy(() => import("./farm").then(m => ({ default: m.WeightContestDialog })));
const CalendarDialog = React.lazy(() => import("./farm").then(m => ({ default: m.CalendarDialog })));
const CraftingDialog = React.lazy(() => import("./farm").then(m => ({ default: m.CraftingDialog })));
const MailboxDialog = React.lazy(() => import("./farm").then(m => ({ default: m.MailboxDialog })));

const AdminPanel = () => {
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [autoSpawnEnabled, setAutoSpawnEnabled] = useState(() => localStorage.getItem('auto_spawn_enabled') !== 'false');
  const [showDebugLabels, setShowDebugLabels] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');
  const [consoleInput, setConsoleInput] = useState('');
  const [showTOC, setShowTOC] = useState(false);
  const { show } = useNotification();
  const location = useLocation();
  const { refetch, all: allItems, seeds: currentSeeds } = useItems();
  const [isDockRepaired, setIsDockRepaired] = useState(() => localStorage.getItem('sandbox_dock_repaired') === 'true');
  const [isTavernUnlocked, setIsTavernUnlocked] = useState(() => localStorage.getItem('quest_q2_rebuild_tavern_completed') === 'true');
  const [seenDockPrompt, setSeenDockPrompt] = useState(() => localStorage.getItem('seen_dock_repair_prompt') === 'true');

  // Global UI states
  const [showWeightContest, setShowWeightContest] = useState(false);
  const [craftingGoal, setCraftingGoal] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCraftingDialog, setShowCraftingDialog] = useState(false);
  
  const [simulatedDay, setSimulatedDay] = useState(() => getSimulatedDateInfo().day);
  const [simulatedDate, setSimulatedDate] = useState(() => getSimulatedDateInfo().date);
  const [hasUnclaimedDaily, setHasUnclaimedDaily] = useState(() => localStorage.getItem('sandbox_last_claim_date') !== new Date().toDateString());
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
  const [tutPage, setTutPage] = useState(() => parseInt(localStorage.getItem('sandbox_tut_page') || '1', 10));
  const [tutMarketPage, setTutMarketPage] = useState(() => parseInt(localStorage.getItem('sandbox_tut_market_page') || '0', 10));
  const [completedQuests, setCompletedQuests] = useState(() => JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]'));
  
  const [showMailboxDialog, setShowMailboxDialog] = useState(false);
  const [mailboxImageError, setMailboxImageError] = useState(false);
  const [readQuests, setReadQuests] = useState(() => JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]'));
  const [hasUnreadMail, setHasUnreadMail] = useState(false);
  const [hasReadyQuests, setHasReadyQuests] = useState(false);
  const [showTavernPopup, setShowTavernPopup] = useState(false);
  const [seenWeightContest, setSeenWeightContest] = useState(() => localStorage.getItem('seen_weight_contest_today') === new Date().toDateString());
  const [seenCrafting, setSeenCrafting] = useState(() => localStorage.getItem('seen_crafting_step_' + tutorialStep) === 'true');
  const [seenCalendar, setSeenCalendar] = useState(() => localStorage.getItem('seen_calendar_today') === new Date().toDateString());
  const [hasNewFishingMissions, setHasNewFishingMissions] = useState(false);
  const [hasNewFarmingMissions, setHasNewFarmingMissions] = useState(false);

  const [isPetOpen, setIsPetOpen] = useState(false);
  const [isSeedOpen, setIsSeedOpen] = useState(false);

  const adminPanelRef = useRef(null);
  const tocRef = useRef(null);

  // Handle clicking outside to close Admin Panel and Command List
  useEffect(() => {
    const handleClickOutside = (event) => {
      let clickedTOC = false;
      if (showTOC && tocRef.current) {
        if (!tocRef.current.contains(event.target)) {
          setShowTOC(false);
        } else {
          clickedTOC = true;
        }
      }
      
      if (isAdminPanelOpen && adminPanelRef.current && !adminPanelRef.current.contains(event.target) && !clickedTOC) {
        setIsAdminPanelOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isAdminPanelOpen, showTOC]);

  useEffect(() => {
    const handlePetOpen = (e) => setIsPetOpen(e.detail);
    const handleSeedOpen = (e) => setIsSeedOpen(e.detail);
    const handleOpenMailbox = () => setShowMailboxDialog(true);
    const handleCloseMailbox = () => setShowMailboxDialog(false);
    const handlePackOpened = () => {
      setShowMailboxDialog(false);
      setShowCraftingDialog(false);
      setShowCalendar(false);
      setShowWeightContest(false);
    };
    const handleCharPackOpen = () => {
      setShowMailboxDialog(false);
    };
    window.addEventListener('petDialogOpen', handlePetOpen);
    window.addEventListener('seedDialogOpen', handleSeedOpen);
    window.addEventListener('openMailbox', handleOpenMailbox);
    window.addEventListener('closeMailbox', handleCloseMailbox);
    window.addEventListener('packOpened', handlePackOpened);
    window.addEventListener('charPackOpen', handleCharPackOpen);
    return () => {
      window.removeEventListener('petDialogOpen', handlePetOpen);
      window.removeEventListener('seedDialogOpen', handleSeedOpen);
      window.removeEventListener('openMailbox', handleOpenMailbox);
      window.removeEventListener('closeMailbox', handleCloseMailbox);
      window.removeEventListener('packOpened', handlePackOpened);
      window.removeEventListener('charPackOpen', handleCharPackOpen);
    };
  }, []);

  const isPanelOpen = showCraftingDialog || showCalendar || showWeightContest || isPetOpen || isSeedOpen;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('globalDialogOpen', { detail: showCraftingDialog || showCalendar || showWeightContest }));
  }, [showCraftingDialog, showCalendar, showWeightContest]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mailUnreadChanged', { detail: hasUnreadMail }));
  }, [hasUnreadMail]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mailReadyChanged', { detail: hasReadyQuests }));
  }, [hasReadyQuests]);

  const [targetProduceId, setTargetProduceId] = useState(() => {
    const saved = localStorage.getItem('weight_contest_produce');
    const legacy = localStorage.getItem('weight_contest_crop');
    if (saved) return parseInt(saved, 10);
    if (legacy && Object.values(ID_PRODUCE_ITEMS || {}).includes(parseInt(legacy, 10))) return parseInt(legacy, 10);
    return ID_PRODUCE_ITEMS.ONION;
  });

  const [targetFishId, setTargetFishId] = useState(() => {
    const saved = localStorage.getItem('weight_contest_fish');
    const legacy = localStorage.getItem('weight_contest_crop');
    if (saved) return parseInt(saved, 10);
    if (legacy && Object.values(ID_FISH_ITEMS || {}).includes(parseInt(legacy, 10))) return parseInt(legacy, 10);
    const defaultFish = Object.values(ID_FISH_ITEMS || {})[0] || 10001; 
    return defaultFish;
  });

  const getTargetData = (id) => {
    let targetData = (allItems || []).find((item) => item.id === id);
    if (!targetData) {
      let fallbackLabel = "Unknown";
      let fallbackImage = "";
      let fallbackPos = 0;
      if (ALL_ITEMS[id]) {
        fallbackLabel = ALL_ITEMS[id].label;
        fallbackImage = ALL_ITEMS[id].image;
        fallbackPos = ALL_ITEMS[id].pos || 0;
      } else {
        const fishEntry = Object.entries(ID_FISH_ITEMS || {}).find(([k, v]) => v === id);
        if (fishEntry) fallbackLabel = fishEntry[0].replace(/_/g, ' ').toLowerCase();
        else {
          const prodEntry = Object.entries(ID_PRODUCE_ITEMS || {}).find(([k, v]) => v === id);
          if (prodEntry) fallbackLabel = prodEntry[0].replace(/_/g, ' ').toLowerCase();
        }
      }
      targetData = { id, label: fallbackLabel, count: 0, image: fallbackImage || "/images/items/seeds.png", pos: fallbackPos };
    }
    return targetData;
  };

  const targetProduceData = getTargetData(targetProduceId);
  const targetFishData = getTargetData(targetFishId);

  // Sync toggles with window events
  useEffect(() => {
    const handleStorage = () => {
      setAutoSpawnEnabled(localStorage.getItem('auto_spawn_enabled') !== 'false');
      setShowDebugLabels(localStorage.getItem('show_debug_labels') !== 'false');
      setIsDockRepaired(localStorage.getItem('sandbox_dock_repaired') === 'true');
      setIsTavernUnlocked(localStorage.getItem('quest_q2_rebuild_tavern_completed') === 'true');
      setSeenDockPrompt(localStorage.getItem('seen_dock_repair_prompt') === 'true');
      setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
    };
    window.addEventListener('storage', handleStorage);
    
    const handleSync = (e) => {
      if (e.type === 'toggleAutoSpawn') setAutoSpawnEnabled(e.detail);
      if (e.type === 'toggleDebugLabels') setShowDebugLabels(e.detail);
      if (e.type === 'dockRepaired') setIsDockRepaired(true);
      if (e.type === 'tavernUnlocked') setIsTavernUnlocked(true);
      if (e.type === 'tutorialStepChanged') setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
      if (e.type === 'tutPageChanged') setTutPage(parseInt(localStorage.getItem('sandbox_tut_page') || '1', 10));
      if (e.type === 'tutMarketPageChanged') setTutMarketPage(parseInt(localStorage.getItem('sandbox_tut_market_page') || '0', 10));
      if (e.type === 'seenDockPrompt') setSeenDockPrompt(true);
      if (e.type === 'questsRead') {
        import('./farm').then(m => {
          const allQuests = m.getQuestData();
          const step = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
          const comp = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
          
          const availFish = allQuests.filter(q => q.type === 'fishing' && q.unlockCondition(step, comp) && !comp.includes(q.id));
          setHasNewFishingMissions(availFish.some(q => !(localStorage.getItem('seen_fishing_missions_ids') || '').split(',').includes(q.id)));
          
          const availFarm = allQuests.filter(q => q.type === 'farming' && q.unlockCondition(step, comp) && !comp.includes(q.id));
          setHasNewFarmingMissions(availFarm.some(q => !(localStorage.getItem('seen_farming_missions_ids') || '').split(',').includes(q.id)));
        });
      }
    };
    window.addEventListener('toggleAutoSpawn', handleSync);
    window.addEventListener('toggleDebugLabels', handleSync);
    window.addEventListener('dockRepaired', handleSync);
    window.addEventListener('tavernUnlocked', handleSync);
    const handleTavernNav = () => setShowTavernPopup(true);
    window.addEventListener('tavernNavClicked', handleTavernNav);
    window.addEventListener('tutorialStepChanged', handleSync);
    window.addEventListener('tutPageChanged', handleSync);
    window.addEventListener('tutMarketPageChanged', handleSync);
    window.addEventListener('seenDockPrompt', handleSync);
    window.addEventListener('questsRead', handleSync);
    window.addEventListener('pfpUnlocked', handleSync);

    import('./farm').then(m => {
      const allQuests = m.getQuestData();
      const availableQuests = allQuests.filter(q => (!q.type || q.type === 'main') && q.unlockCondition(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10), JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')));
      const currentRead = JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]');
          const discarded = JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]');
          const unread = availableQuests.some(q => !discarded.includes(q.id) && !currentRead.includes(q.id));
      setHasUnreadMail(unread);
      
      const availFish = allQuests.filter(q => q.type === 'fishing' && q.unlockCondition(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10), JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')) && !JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]').includes(q.id));
      const seenFishArray = (localStorage.getItem('seen_fishing_missions_ids') || '').split(',').filter(Boolean);
      const hasNewFish = availFish.some(q => !seenFishArray.includes(q.id));
      setHasNewFishingMissions(hasNewFish);

      const availFarm = allQuests.filter(q => q.type === 'farming' && q.unlockCondition(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10), JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')) && !JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]').includes(q.id));
      const seenFarmArray = (localStorage.getItem('seen_farming_missions_ids') || '').split(',').filter(Boolean);
      const hasNewFarm = availFarm.some(q => !seenFarmArray.includes(q.id));
      setHasNewFarmingMissions(hasNewFarm);
    });

    const handleLevelUp = (e) => {
      import('./farm').then(m => {
        const allQuests = m.getQuestData();
        const step = parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10);
        const comp = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
        const availableQuests = allQuests.filter(q => (!q.type || q.type === 'main') && q.unlockCondition(step, comp));
        const currentRead = JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]');
        const discarded = JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]');
        setHasUnreadMail(availableQuests.some(q => !discarded.includes(q.id) && !currentRead.includes(q.id)));
      });
    };
    window.addEventListener('levelUp', handleLevelUp);

    const onChangeSimulatedDate = (e) => {
      setSimulatedDay(e.detail.day);
      setSimulatedDate(e.detail.date);
    };
    const handleOpenCrafting = (e) => {
      setCraftingGoal(e.detail);
      setShowCraftingDialog(true);
    };
    const onChangeContest = (e) => {
      const { targetId, isFish } = e.detail;
      if (isFish) {
        setTargetFishId(targetId);
        localStorage.setItem('weight_contest_fish', targetId.toString());
      } else {
        setTargetProduceId(targetId);
        localStorage.setItem('weight_contest_produce', targetId.toString());
      }
    };

    window.addEventListener('changeSimulatedDate', onChangeSimulatedDate);
    window.addEventListener('openCraftingFor', handleOpenCrafting);
    window.addEventListener('changeWeightContest', onChangeContest);
    
    const storageSyncInterval = setInterval(() => {
      setIsDockRepaired(localStorage.getItem('sandbox_dock_repaired') === 'true');
      setIsTavernUnlocked(localStorage.getItem('quest_q2_rebuild_tavern_completed') === 'true');
      setTutorialStep(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));
      setCompletedQuests(JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]'));
      setSeenDockPrompt(localStorage.getItem('seen_dock_repair_prompt') === 'true');
      
      import('./farm').then(m => {
        const allQuests = m.getQuestData();
        const availableQuests = allQuests.filter(q => (!q.type || q.type === 'main') && q.unlockCondition(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10), JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')));
        const currentRead = JSON.parse(localStorage.getItem('sandbox_read_quests') || '[]');
        const discarded = JSON.parse(localStorage.getItem('sandbox_discarded_quests') || '[]');
        const unread = availableQuests.some(q => !discarded.includes(q.id) && !currentRead.includes(q.id));
        setHasUnreadMail(unread);
        
        const availFish = allQuests.filter(q => q.type === 'fishing' && q.unlockCondition(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10), JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')) && !JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]').includes(q.id));
        const seenFishArray = (localStorage.getItem('seen_fishing_missions_ids') || '').split(',').filter(Boolean);
        const hasNewFish = availFish.some(q => !seenFishArray.includes(q.id));
        setHasNewFishingMissions(hasNewFish);

        const availFarm = allQuests.filter(q => q.type === 'farming' && q.unlockCondition(parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10), JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]')) && !JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]').includes(q.id));
        const seenFarmArray = (localStorage.getItem('seen_farming_missions_ids') || '').split(',').filter(Boolean);
        const hasNewFarm = availFarm.some(q => !seenFarmArray.includes(q.id));
        setHasNewFarmingMissions(hasNewFarm);

        const checkReqs = (reqs) => {
          if (!reqs || reqs.length === 0) return false;
          const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
          const produce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
          for (const req of reqs) {
            if (req.fn) { const v = req.fn(loot, produce); if ((typeof v === 'number' ? v : v ? 1 : 0) < req.count) return false; continue; }
            if (req.id === 'gold') { if (parseInt(localStorage.getItem('sandbox_gold') || '0', 10) < req.count) return false; continue; }
            const ids = Array.isArray(req.id) ? req.id : [req.id];
            let count = 0;
            for (const id of ids) { count += Array.isArray(produce[id]) ? produce[id].length : (Number(produce[id]) || 0) + (Number(loot[id]) || 0); }
            if (count < req.count) return false;
          }
          return true;
        };
        const comp = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
        const ready = availableQuests.some(q => q.reqs && q.reqs.length > 0 && !comp.includes(q.id) && checkReqs(q.reqs));
        setHasReadyQuests(ready);
      });
    }, 1000);

    return () => {
      clearInterval(storageSyncInterval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('toggleAutoSpawn', handleSync);
      window.removeEventListener('toggleDebugLabels', handleSync);
      window.removeEventListener('dockRepaired', handleSync);
      window.removeEventListener('tavernUnlocked', handleSync);
      window.removeEventListener('tavernNavClicked', handleTavernNav);
      window.removeEventListener('tutorialStepChanged', handleSync);
      window.removeEventListener('tutPageChanged', handleSync);
      window.removeEventListener('tutMarketPageChanged', handleSync);
      window.removeEventListener('changeSimulatedDate', onChangeSimulatedDate);
      window.removeEventListener('openCraftingFor', handleOpenCrafting);
      window.removeEventListener('changeWeightContest', onChangeContest);
      window.removeEventListener('levelUp', handleLevelUp);
      window.removeEventListener('seenDockPrompt', handleSync);
      window.removeEventListener('questsRead', handleSync);
      window.removeEventListener('pfpUnlocked', handleSync);
    };
  }, [location.pathname]);

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
  const handleForceSpawnRat = () => window.dispatchEvent(new CustomEvent('forceSpawnRat'));

  const handleConsoleSubmit = (e) => {
    e.preventDefault();
    let cmd = consoleInput.trim().toLowerCase().replace(/\s+/g, ' ');
    
    if (cmd.startsWith('add ')) {
      cmd = cmd.slice(4).trim();
    }
    
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

    const honeyMatch = cmd.match(/^honey (-?\d+)$/);
    if (honeyMatch) {
      const amount = parseInt(honeyMatch[1], 10);
      const current = parseFloat(localStorage.getItem('sandbox_honey') || '0');
      const newAmount = Math.max(0, current + amount);
      localStorage.setItem('sandbox_honey', newAmount.toString());
      window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: newAmount.toString() }));
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Honey`, "success");
      setConsoleInput('');
      return;
    }

    const diamondMatch = cmd.match(/^diamond (-?\d+)$/);
    if (diamondMatch) {
      const amount = parseInt(diamondMatch[1], 10);
      const current = parseInt(localStorage.getItem('sandbox_gems') || '0', 10);
      const newAmount = Math.max(0, current + amount);
      localStorage.setItem('sandbox_gems', newAmount.toString());
      window.dispatchEvent(new CustomEvent('sandboxGemsChanged', { detail: newAmount.toString() }));
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Gems`, "success");
      setConsoleInput('');
      return;
    }

    const lockedHoneyMatch = cmd.match(/^locked honey (-?\d+)$/);
    if (lockedHoneyMatch) {
      const amount = parseInt(lockedHoneyMatch[1], 10);
      const current = parseFloat(localStorage.getItem('sandbox_locked_honey') || '0');
      const newAmount = Math.max(0, current + amount);
      localStorage.setItem('sandbox_locked_honey', newAmount.toString());
      window.dispatchEvent(new CustomEvent('sandboxLockedHoneyChanged', { detail: newAmount.toString() }));
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Locked Honey`, "success");
      setConsoleInput('');
      return;
    }

    const setBeeLevelMatch = cmd.match(/^set bee level (\d+)$/);
    if (setBeeLevelMatch) {
      const level = parseInt(setBeeLevelMatch[1], 10);
      localStorage.setItem('sandbox_worker_bee_level', level.toString());
      window.dispatchEvent(new CustomEvent('workerBeeLevelChanged', { detail: level }));
      show(`Executed: Worker Bee level set to ${level}`, "success");
      setConsoleInput('');
      return;
    }

    const setUsernameMatch = consoleInput.trim().match(/^set username\s+(.+)$/i);
    if (setUsernameMatch) {
      const newUsername = setUsernameMatch[1].trim();
      localStorage.setItem('sandbox_username', newUsername);
      show(`Executed: username set to ${newUsername}`, "success");
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

    const ironPicaxeMatch = cmd.match(/^iron picaxe (-?\d+)$/) || cmd.match(/^iron pickaxe (-?\d+)$/);
    if (ironPicaxeMatch) {
      const amount = parseInt(ironPicaxeMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9981] = (sandboxLoot[9981] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Iron Pickaxe(s)`, "success");
      setConsoleInput('');
      return;
    }

    const netMatch = cmd.match(/^net (-?\d+)$/);
    if (netMatch) {
      const amount = parseInt(netMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9988] = (sandboxLoot[9988] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Bug Net(s)`, "success");
      setConsoleInput('');
      return;
    }

    const yarnMatch = cmd.match(/^yarn (-?\d+)$/);
    if (yarnMatch) {
      const amount = parseInt(yarnMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9955] = Math.max(0, (sandboxLoot[9955] || 0) + amount);
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Yarn`, "success");
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

    const specialWoodMatch = cmd.match(/^special wood (-?\d+)$/);
    if (specialWoodMatch) {
      const amount = parseInt(specialWoodMatch[1], 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9942] = (sandboxLoot[9942] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Special Wood`, "success");
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

    const plankMatch = cmd.match(/^(?:wooden )?plank(?:\s+(-?\d+))?$/);
    if (plankMatch) {
      const amount = parseInt(plankMatch[1] !== undefined ? plankMatch[1] : 1, 10);
      const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
      sandboxLoot[9989] = (sandboxLoot[9989] || 0) + amount;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      if (refetch) refetch();
      show(`Executed: ${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} Wooden Plank(s)`, "success");
      setConsoleInput('');
      return;
    }

    const weatherMatch = cmd.match(/^weather (sunny|rain|storm|clear)$/);
    if (weatherMatch) {
      const weather = weatherMatch[1];
      if (weather === 'clear') {
        localStorage.removeItem('sandbox_weather_override');
        window.dispatchEvent(new CustomEvent('weatherOverrideChanged'));
        show(`Executed: weather override cleared`, "success");
      } else {
        localStorage.setItem('sandbox_weather_override', weather);
        window.dispatchEvent(new CustomEvent('weatherOverrideChanged'));
        show(`Executed: weather set to ${weather}`, "success");
      }
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

    if (cmd === 'reset tavern') {
      localStorage.setItem('quest_q2_rebuild_tavern_completed', 'false');
      setIsTavernUnlocked(false);
      show("Executed: Tavern locked", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'skip') {
      window.dispatchEvent(new CustomEvent('skipTutorial'));
      show("Executed: skipped tutorial", "success");
      setConsoleInput('');
      return;
    }
    
    if (cmd === 'clear inventory') {
      localStorage.setItem('sandbox_loot', '{}');
      localStorage.setItem('sandbox_produce', '{}');
      localStorage.setItem('sandbox_honey', '0');
      localStorage.setItem('sandbox_locked_honey', '0');
      if (refetch) refetch();
      show("Executed: inventory and honey cleared", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'reset dock') {
      localStorage.setItem('sandbox_dock_repaired', 'false');
      localStorage.setItem('sandbox_dock_unlocked', 'false');
      setIsDockRepaired(false);
      show("Executed: Dock reset to unrepaired", "success");
      setConsoleInput('');
      return;
    }
    
    if (cmd === 'signout') {
      localStorage.removeItem('sandbox_loot');
      localStorage.removeItem('sandbox_produce');
      localStorage.removeItem('sandbox_honey');
      localStorage.removeItem('sandbox_locked_honey');
      localStorage.removeItem('sandbox_username');
      show("Executed: signed out", "success");
      window.location.reload();
      setConsoleInput('');
      return;
    }

    const cropCountMatch = cmd.match(/^crop (\d+)$/);
    if (cropCountMatch) {
      const amount = parseInt(cropCountMatch[1], 10);
      localStorage.setItem('sandbox_total_crops', amount.toString());
      window.dispatchEvent(new CustomEvent('soilProgressChanged'));
      show(`Crop count set to ${amount.toLocaleString()}`, "success");
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

    if (cmd === 'restart') {
      window.dispatchEvent(new CustomEvent('adminClearCrops'));
      window.dispatchEvent(new CustomEvent('adminClearPests'));
      window.dispatchEvent(new CustomEvent('adminDeleteSpot', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('adminDeleteLadybug', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('adminDeleteSprinkler', { detail: { id: null } }));
      window.dispatchEvent(new CustomEvent('adminDeleteUmbrella', { detail: { id: null } }));
      
      // Wipe local storage memory for all game elements
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('sandbox_') || k.startsWith('forest_') || k.startsWith('weight_contest_')) {
          localStorage.removeItem(k);
        }
      });
      
      window.location.reload();
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
      localStorage.setItem('sandbox_loot', '{}');
      localStorage.setItem('sandbox_produce', '{}');
      localStorage.setItem('sandbox_honey', '0');
      localStorage.setItem('sandbox_locked_honey', '0');
      if (refetch) refetch();
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

    if (cmd === 'reset mine') {
      localStorage.removeItem('mine_last_visited');
      show("Executed: mine timer reset", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'plots') {
      const allPlots = Array.from({ length: 30 }, (_, i) => i);
      localStorage.setItem('sandbox_unlocked_plots', JSON.stringify(allPlots));
      window.dispatchEvent(new CustomEvent('plotsUnlocked', { detail: allPlots }));
      show("Executed: all 30 plots unlocked", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'pfp all') {
      const allPfpIds = ['default','redpfp','orangepfp','yellowpfp','greenpfp','bluepfp','purplepfp','pinkpfp','benpotato','goldcarrot','goldpotato'];
      localStorage.setItem('sandbox_unlocked_pfps', JSON.stringify(allPfpIds));
      window.dispatchEvent(new CustomEvent('pfpUnlocksUpdated'));
      show("Executed: all PFPs unlocked", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'onion pack') {
      localStorage.setItem('admin_onion_pack_pending', '1');
      window.dispatchEvent(new CustomEvent('openDialog', { detail: 'ID_MARKET_HOTSPOTS_VENDOR' }));
      window.dispatchEvent(new CustomEvent('adminOnionPack'));
      show("Executed: onion pack opened", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'crazycat') {
      window.dispatchEvent(new CustomEvent('crazyCatShake'));
      show("Executed: Crazy cat shake!", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'cord') {
      const handler = (e) => {
        alert(`Coordinates logged to console -> X: ${e.clientX}, Y: ${e.clientY}`);
        window.removeEventListener('click', handler);
      };
      setTimeout(() => window.addEventListener('click', handler), 10);
      show("Executed: Click anywhere to get coordinates", "info");
      setConsoleInput('');
      return;
    }

    const setSkillMatch = cmd.match(/^set (farming|fishing|foraging|mining|crafting) (\d+)$/);
    if (setSkillMatch) {
      const skillName = setSkillMatch[1];
      const level = parseInt(setSkillMatch[2], 10);
      const xpNeeded = Math.pow(level - 1, 2) * 150;
      localStorage.setItem(`sandbox_${skillName}_xp`, xpNeeded.toString());
      window.dispatchEvent(new CustomEvent('ls-update', { detail: { key: `sandbox_${skillName}_xp`, value: xpNeeded.toString() } }));
      show(`Executed: ${skillName} level set to ${level}`, "success");
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

      const invItem = (allItems || []).find(i => (i.label || '').toLowerCase() === itemName) || 
                      (allItems || []).find(i => (i.label || '').toLowerCase().includes(itemName));
      
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
          let baseItemName = itemName;
          let isSeed = false;
          if (itemName.endsWith(' seed') || itemName.endsWith(' seeds')) {
            baseItemName = itemName.replace(/ seeds?$/, '').trim();
            isSeed = true;
          }

          if (isSeed && ID_SEEDS) {
            for (const [key, val] of Object.entries(ID_SEEDS)) {
              const readable = key.toLowerCase().replace(/_/g, ' ');
              if (readable === baseItemName || readable.includes(baseItemName)) {
                targetId = val;
                targetLabel = readable + " seed";
                break;
              }
            }
          }

          if (targetId === null) {
            const searchMaps = [ID_PRODUCE_ITEMS, ID_FISH_ITEMS, ID_POTION_ITEMS, ID_CHEST_ITEMS, ID_SEEDS, ID_BAIT_ITEMS];
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

    if (cmd === 'animal farm') {
      const comp = JSON.parse(localStorage.getItem('sandbox_completed_quests') || '[]');
      if (!comp.includes('q16_build_barn')) {
        comp.push('q16_build_barn');
        localStorage.setItem('sandbox_completed_quests', JSON.stringify(comp));
      }
      show("Executed: unlocked animal farm (please refresh)", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'skip time') {
      const skipAmount = 24 * 60 * 60 * 1000;
      
      const fVisit = localStorage.getItem('forest_last_visited');
      if (fVisit) localStorage.setItem('forest_last_visited', (parseInt(fVisit, 10) - skipAmount).toString());
      
      const mVisit = localStorage.getItem('mine_last_visited');
      if (mVisit) localStorage.setItem('mine_last_visited', (parseInt(mVisit, 10) - skipAmount).toString());
      
      window.dispatchEvent(new CustomEvent('skipTime'));
      show("Executed: Fast forwarded time by 24 hours", "success");
      setConsoleInput('');
      return;
    }

    if (cmd === 'skip cat') {
      const catTime = localStorage.getItem('sandbox_cat_first_fed_time');
      if (catTime) {
        localStorage.setItem('sandbox_cat_first_fed_time', (parseInt(catTime, 10) - 24 * 60 * 60 * 1000).toString());
        window.dispatchEvent(new CustomEvent('skipCatTime'));
        show("Executed: Skipped cat spawn wait time", "success");
      } else {
        show("Cat hasn't been fed yet!", "error");
      }
      setConsoleInput('');
      return;
    }

    if (cmd === 'toc') {
      setShowTOC(true);
      setConsoleInput('');
      return;
    }

    if (cmd === 'skip market') {
      localStorage.setItem('sandbox_tutorial_step', '10');
      setTutorialStep(10);
      window.dispatchEvent(new CustomEvent('tutorialStepChanged', { detail: { step: 10 } }));
      show('Executed: skipped to market tutorial (step 10)', 'success');
      setConsoleInput('');
      return;
    }

    if (cmd === 'x') {
      window.dispatchEvent(new CustomEvent('setAllPlotsX'));
      show('Executed: all plots set to X state', 'success');
      setConsoleInput('');
      return;
    }

    if (cmd !== '') show(`Unknown command: ${consoleInput}`, "error");
    setConsoleInput('');
  };

  const isConsoleInputValid = (input) => {
    if (!input) return true; // Empty input is always valid for partial typing

    let normalizedCmd = input.trim().toLowerCase().replace(/\s+/g, ' ');

    // Handle 'add ' prefix for item commands
    if (normalizedCmd.startsWith('add ')) {
      normalizedCmd = normalizedCmd.slice(4).trim();
    }

    const commands = {
      'delete spot': (arg) => arg === '' || /^\d+$/.test(arg),
      'delete ladybug': (arg) => arg === '' || /^\d+$/.test(arg),
      'delete lspot': (arg) => arg === '' || /^\d+$/.test(arg),
      'crop speed': (arg) => /^\d+%?$/.test(arg),
      'crop': (arg) => /^\d+$/.test(arg),
      'set username': (arg) => arg.length > 0,
      'set farming': (arg) => /^\d+$/.test(arg),
      'set fishing': (arg) => /^\d+$/.test(arg),
      'set foraging': (arg) => /^\d+$/.test(arg),
      'set mining': (arg) => /^\d+$/.test(arg),
      'set crafting': (arg) => /^\d+$/.test(arg),
      'honey': (arg) => /^-?\d+$/.test(arg),
      'locked honey': (arg) => /^-?\d+$/.test(arg),
      'axe': (arg) => /^-?\d+$/.test(arg),
      'picaxe': (arg) => /^-?\d+$/.test(arg),
      'iron picaxe': (arg) => /^-?\d+$/.test(arg),
      'iron pickaxe': (arg) => /^-?\d+$/.test(arg),
      'net': (arg) => /^-?\d+$/.test(arg),
      'yarn': (arg) => /^-?\d+$/.test(arg),
      'wood': (arg) => /^-?\d+$/.test(arg),
      'special wood': (arg) => /^-?\d+$/.test(arg),
      'stone': (arg) => /^-?\d+$/.test(arg),
      'plank': (arg) => /^-?\d+$/.test(arg),
      'wooden plank': (arg) => /^-?\d+$/.test(arg),
      'set bee level': (arg) => /^\d+$/.test(arg),
      'set contest': (arg) => arg.length > 0,
      'weather': (arg) => /^(sunny|rain|storm|clear)?$/.test(arg),
      'clear farm': () => true,
      'reset forest': () => true,
      'reset mine': () => true,
      'reset dock': () => true,
      'restart': () => true,
      'skip': () => true,
      'clear crop': () => true,
      'clear pest': () => true,
      'clear inventory': () => true,
      'signout': () => true,
      'toc': () => true,
      'crazycat': () => true,
      'cord': () => true,
      'animal farm': () => true,
      'skip time': () => true,
      'reset tavern': () => true,
      'skip cat': () => true,
      'skip market': () => true,
      'x': () => true,
    };

    for (const cmdPrefix in commands) {
      if (normalizedCmd.startsWith(cmdPrefix)) {
        const arg = normalizedCmd.slice(cmdPrefix.length).trim();
        // If it's a full command match or a partial command with a valid argument prefix
        if (normalizedCmd === cmdPrefix || commands[cmdPrefix](arg)) {
          return true;
        }
      } else if (cmdPrefix.startsWith(normalizedCmd) && normalizedCmd.length > 0) {
        // Allow partial command typing (e.g., "cle" for "clear farm")
        return true;
      }
    }

    // Generic item add command (e.g., "corn 5")
    const genericAddItemMatch = normalizedCmd.match(/^(.+?)\s+(-?\d+)$/);
    if (genericAddItemMatch) {
      // For generic add item, we just need the format to be correct,
      // actual item validation happens in handleConsoleSubmit
      return true;
    }

    return false; // No valid command or partial command found
  };

  const badgeStyle = {
    position: 'absolute', top: '-5px', right: '-5px', width: '22px', height: '22px',
    backgroundColor: '#ff4444', borderRadius: '50%', border: '2px solid white',
    zIndex: 11, display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: 'white', fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace',
    animation: 'pulse-dot 1s infinite', pointerEvents: 'none'
  };

  return (
    <>
      <style>{`
        /* Left Navigation Ordering & Visibility based on Tutorial Step */
        a[href*="/farm"] { order: 1; }
        a[href*="/market"] { order: 2; }
        a[href*="/house"] { order: 3; ${tutorialStep < 17 && tutMarketPage < 16 ? 'display: none !important;' : ''} }
        a[href*="/tavern" i] { order: 4; ${tutorialStep < 24 ? 'display: none !important;' : ''} }
        a[href*="/valley"] { order: 5; ${tutorialStep < 25 ? 'display: none !important;' : ''} }

        @keyframes pulse-dot { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        @keyframes mailboxAlert { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(255,255,255,0.3)); } 50% { transform: scale(0.9); filter: drop-shadow(0 0 12px rgba(255,255,255,1)); } }
        @keyframes mailboxHover { 0% { transform: scale(1.1) rotate(0deg); } 25% { transform: scale(1.1) rotate(-5deg); } 50% { transform: scale(1.1) rotate(5deg); } 75% { transform: scale(1.1) rotate(-5deg); } 100% { transform: scale(1.1) rotate(0deg); } }
      `}</style>
      {/* Global Persisted Elements */}

      {!isPanelOpen && location.pathname === '/farm' && (
        <>
          {/* Crafting Icon Overlay */}
          {false && tutorialStep >= 26 && (
          <div
            onClick={() => {
              setShowCraftingDialog(true);
              setSeenCrafting(true);
              localStorage.setItem('seen_crafting_step_' + tutorialStep, 'true');
            }}
            onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }}
          style={{ position: 'fixed', top: '420px', right: '20px', zIndex: tutorialStep === 26 ? 100001 : 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))', animation: tutorialStep === 26 ? 'craftingGlow 1.5s infinite' : 'none', borderRadius: '12px' }}
          >
          {(!seenCrafting && tutorialStep >= 26) && <div style={badgeStyle}>!</div>}
          <img src="/images/crafting/crafting.png" alt="Crafting" style={{ height: '240px', objectFit: 'contain' }} onError={(e) => { e.target.onerror = null; e.target.src = '/images/crafting/Crafting.png'; }} />
          </div>
          )}

          {/* Weight Contest Icon Overlay */}
          {false && tutorialStep >= 29 && (
          <div 
            onClick={() => {
              setShowWeightContest(true);
              setSeenWeightContest(true);
              localStorage.setItem('seen_weight_contest_today', new Date().toDateString());
              if (tutorialStep === 29) {
                setTutorialStep(30);
                localStorage.setItem('sandbox_tutorial_step', '30');
                window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
              }
            }}
            onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 234, 0, 0.8))';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }}
          style={{ position: 'fixed', top: '170px', right: '20px', zIndex: tutorialStep === 29 ? 100001 : 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))', animation: tutorialStep === 29 ? 'craftingGlow 1.5s infinite' : 'none', borderRadius: '12px' }}
          >
          {(!seenWeightContest && tutorialStep >= 29) && <div style={badgeStyle}>!</div>}
          <img src="/images/weight/weightcontest.png" alt="Weight Contest" style={{ height: '240px', objectFit: 'contain' }} />
            {targetProduceData && (
              <div style={{
              position: 'absolute', top: '84px', left: '30%', transform: 'translateX(-50%)',
              width: '60px', height: '60px', background: 'rgba(0,0,0,0.6)', 
              border: '3px solid #5a402a', borderRadius: '50%', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
              }}>
                {targetProduceData.image && targetProduceData.image.includes('crop') ? (
                   <div style={{ 
                       width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, 
                       backgroundImage: `url(${targetProduceData.image})`, 
                       backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(targetProduceData.pos || 0) * ONE_SEED_HEIGHT}px`,
                     transform: 'scale(0.9)', backgroundRepeat: 'no-repeat'
                   }} />
                ) : targetProduceData.image && targetProduceData.image.includes('seeds') ? (
                 <div className="item-icon item-icon-seeds" style={{ transform: 'scale(0.9)', backgroundPositionY: targetProduceData.pos ? `-${targetProduceData.pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div>
                ) : (
                   <img src={targetProduceData.image} alt={targetProduceData.label} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                )}
              </div>
            )}
            {targetFishData && (
              <div style={{
              position: 'absolute', top: '84px', left: '70%', transform: 'translateX(-50%)',
              width: '60px', height: '60px', background: 'rgba(0,0,0,0.6)', 
              border: '3px solid #5a402a', borderRadius: '50%', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
              }}>
                <img src={targetFishData.image} alt={targetFishData.label} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
              </div>
            )}
          </div>
          )}

          {/* Calendar Icon Overlay */}
          {false && tutorialStep >= 27 && (
          <div 
            onClick={() => {
              setShowCalendar(true);
              setSeenCalendar(true);
              localStorage.setItem('seen_calendar_today', new Date().toDateString());
              if (tutorialStep === 27) {
                setTutorialStep(28);
                localStorage.setItem('sandbox_tutorial_step', '28');
                window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
              }
            }}
            onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }}
          style={{ position: 'fixed', top: '670px', right: '20px', zIndex: tutorialStep === 27 ? 100001 : 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))', animation: tutorialStep === 27 ? 'craftingGlow 1.5s infinite' : 'none', borderRadius: '12px' }}
          >
          {(hasUnclaimedDaily && !seenCalendar) && <div style={badgeStyle}>!</div>}
          <img src="/images/calendar/calendar.png" alt="Calendar" style={{ height: '240px', objectFit: 'contain' }} />
          </div>
          )}
        </>
      )}


      {/* Dialogs */}
      <React.Suspense fallback={null}>
        {false && showWeightContest && <WeightContestDialog onClose={() => setShowWeightContest(false)} simulatedDay={simulatedDay} targetProduceId={targetProduceId} targetFishId={targetFishId} onProduceChange={setTargetProduceId} onFishChange={setTargetFishId} targetProduceData={targetProduceData} targetFishData={targetFishData} refetchItems={refetch} />}
        {false && showCalendar && <CalendarDialog onClose={() => { setShowCalendar(false); setSeenCalendar(false); }} simulatedDay={simulatedDay} simulatedDate={simulatedDate} refetch={refetch} onClaimed={() => { setHasUnclaimedDaily(false); setSeenCalendar(false); }} />}
        {false && showCraftingDialog && <CraftingDialog onClose={() => { setShowCraftingDialog(false); setCraftingGoal(null); }} refetchSeeds={refetch} tutorialStep={tutorialStep} craftingGoal={craftingGoal} onAdvanceTutorial={() => { setTutorialStep(27); localStorage.setItem('sandbox_tutorial_step', '27'); window.dispatchEvent(new CustomEvent('tutorialStepChanged')); setShowCraftingDialog(false); }} />}
        {showMailboxDialog && (
          <MailboxDialog
            onClose={() => setShowMailboxDialog(false)}
            tutorialStep={tutorialStep}
            completedQuests={completedQuests}
            setCompletedQuests={setCompletedQuests}
            readQuests={readQuests}
            setReadQuests={setReadQuests}
            refetch={refetch}
            onTutorialAdvance={() => {
              if (tutorialStep === 0) {
                setTutorialStep(1);
                localStorage.setItem('sandbox_tutorial_step', '1');
                window.dispatchEvent(new CustomEvent('tutorialStepChanged'));
              }
            }}
          />
        )}
      </React.Suspense>


      {(() => {
        const needsToFish = hasNewFishingMissions;
        return (((!isDockRepaired && !seenDockPrompt) || needsToFish) || (!isTavernUnlocked && tutorialStep >= 36)) ? (
        <style>{`
          @keyframes quest-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
          }
          @keyframes quest-bounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-10px); }
          }

          ${((!isDockRepaired && !seenDockPrompt) || needsToFish) ? `
          /* Global Map Icon Quest Indicator */
          a[href*="/house"], img[src*="house"] {
            position: relative;
            overflow: visible !important;
          }
          a[href*="/house"]::after {
            content: "!";
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-family: monospace;
            font-size: 16px;
            z-index: 100000;
            border: 2px solid white;
            animation: quest-pulse 1s infinite;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          }
          
          /* Specific Hotspot Quest Indicator (House Scene) */
          .quest-active-hotspot {
            overflow: visible !important;
          }
          .quest-active-hotspot::after {
            content: "!";
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-family: monospace;
            font-size: 20px;
            z-index: 100000;
            border: 2px solid white;
            animation: quest-bounce 1.5s infinite ease-in-out;
            pointer-events: none;
            box-shadow: 0 4px 6px rgba(0,0,0,0.5);
          }
          ` : ''}

          ${(!isTavernUnlocked && tutorialStep >= 36) ? `
          /* Tavern Quest Indicator */
          a[href*="/tavern" i] {
            position: relative;
            overflow: visible !important;
          }
          a[href*="/tavern" i]::after {
            content: "!";
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ffea00;
            color: black;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-family: monospace;
            font-size: 16px;
            z-index: 100000;
            border: 2px solid black;
            animation: quest-pulse 1s infinite;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          }
          ` : ''}

        `}</style>
        ) : null;
      })()}
      <div ref={adminPanelRef} style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '90vh' }}>
        {isAdminPanelOpen && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '2px solid #00ff41', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px', overflowY: 'auto' }}>
            <h3 style={{ color: '#00ff41', margin: '0 0 10px 0', borderBottom: '1px solid #00ff41', paddingBottom: '5px', fontFamily: 'monospace', fontSize: '16px' }}>ADMIN PANEL</h3>
            
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ backgroundColor: '#000', color: '#ff4444', border: '1px solid #ff4444', padding: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>
              [WIPE SAVE DATA]
            </button>
            
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
              <button onClick={handleForceSpawnRat} style={{ flex: 1, backgroundColor: '#000', color: '#ff4444', border: '1px solid #ff4444', padding: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px' }}>
                + RAT
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
        <div ref={tocRef} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.95)', border: '2px solid #00ff41', padding: '20px', borderRadius: '8px', zIndex: 10002, color: '#00ff41', fontFamily: 'monospace', minWidth: '350px', maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0, borderBottom: '1px solid #00ff41', paddingBottom: '10px', fontSize: '18px' }}>&gt;_ COMMAND_LIST</h2>
          <ul style={{ listStyleType: 'none', padding: 0, lineHeight: '1.8', fontSize: '14px' }}>
            <li><strong style={{color: '#fff'}}>delete spot [x]</strong> - Removes scarecrow from spot x</li>
            <li><strong style={{color: '#fff'}}>delete spot</strong>     - Removes all scarecrows</li>
            <li><strong style={{color: '#fff'}}>delete lspot [x]</strong> - Removes ladybug from lspot x</li>
            <li><strong style={{color: '#fff'}}>delete lspot</strong>    - Removes all ladybugs</li>
            <li><strong style={{color: '#fff'}}>crop [x]</strong>        - Sets total crop harvest count to x (for soil unlocks)</li>
            <li><strong style={{color: '#fff'}}>crop speed [x]</strong>  - Sets growth speed to x% (e.g. 200)</li>
            <li><strong style={{color: '#fff'}}>clear crop</strong>      - Deletes all planted crops</li>
            <li><strong style={{color: '#fff'}}>clear pest</strong>      - Clears all active bugs and crows</li>
            <li><strong style={{color: '#fff'}}>clear farm</strong>      - Resets entire farm state</li>
            <li><strong style={{color: '#fff'}}>restart</strong>         - Restarts account, setting everything to 0</li>
            <li><strong style={{color: '#fff'}}>skip</strong>            - Skips the intro tutorial</li>
            <li><strong style={{color: '#fff'}}>clear inventory</strong> - Resets all items and honey to 0</li>
            <li><strong style={{color: '#fff'}}>signout</strong>         - Signs out of the game</li>
            <li><strong style={{color: '#fff'}}>reset dock</strong>      - Resets dock repair quest</li>
            <li><strong style={{color: '#fff'}}>set username [x]</strong>- Changes your username</li>
            <li><strong style={{color: '#fff'}}>set [skill] [x]</strong> - Sets level for skill (e.g. set farming 10)</li>
            <li><strong style={{color: '#fff'}}>diamond [x]</strong>     - Adds x gems (can be negative)</li>
            <li><strong style={{color: '#fff'}}>add honey [x]</strong>   - Adds x honey (coins)</li>
            <li><strong style={{color: '#fff'}}>add locked honey [x]</strong> - Adds x locked honey</li>
            <li><strong style={{color: '#fff'}}>axe [x]</strong>         - Adds x axes (can be negative)</li>
            <li><strong style={{color: '#fff'}}>picaxe [x]</strong>      - Adds x pickaxes (can be negative)</li>
            <li><strong style={{color: '#fff'}}>iron picaxe [x]</strong> - Adds x iron pickaxes</li>
            <li><strong style={{color: '#fff'}}>wood [x]</strong>        - Adds x wood logs (can be negative)</li>
            <li><strong style={{color: '#fff'}}>special wood [x]</strong>- Adds x special wood (can be negative)</li>
            <li><strong style={{color: '#fff'}}>stone [x]</strong>       - Adds x stones (can be negative)</li>
            <li><strong style={{color: '#fff'}}>plank [x]</strong>       - Adds x wooden planks (can be negative)</li>
            <li><strong style={{color: '#fff'}}>[item] [x]</strong>      - Adds x amount of any item (e.g. "corn 5")</li>
            <li><strong style={{color: '#fff'}}>[crop] seed [x]</strong> - Adds x amount of a seed (e.g. "pumpkin seed 10")</li>
            <li><strong style={{color: '#fff'}}>net [x]</strong>         - Adds x bug nets</li>
            <li><strong style={{color: '#fff'}}>yarn [x]</strong>        - Adds x yarn</li>
            <li><strong style={{color: '#fff'}}>set bee level [x]</strong> - Forces Worker Bee to level x</li>
            <li><strong style={{color: '#fff'}}>set contest [item]</strong> - Sets weight contest target</li>
            <li><strong style={{color: '#fff'}}>reset forest</strong>    - Resets the 45-min forest lock</li>
            <li><strong style={{color: '#fff'}}>reset mine</strong>      - Resets the 45-min mine lock</li>
            <li><strong style={{color: '#fff'}}>crazycat</strong>        - Forces the hungry cat shake</li>
            <li><strong style={{color: '#fff'}}>cord</strong>            - Get screen coordinates on next click</li>
            <li><strong style={{color: '#fff'}}>animal farm</strong>     - Unlocks the Animal Farm feature</li>
            <li><strong style={{color: '#fff'}}>skip time</strong>       - Fast forwards time by 24 hours</li>
            <li><strong style={{color: '#fff'}}>skip cat</strong>        - Skips the wait time for the cat to spawn</li>
            <li><strong style={{color: '#fff'}}>weather [type]</strong>  - sunny, rain, storm, or clear</li>
            <li><strong style={{color: '#fff'}}>toc</strong>             - Opens this command list</li>
          </ul>
          <button onClick={() => setShowTOC(false)} style={{ backgroundColor: '#000', color: '#ff4444', border: '1px solid #ff4444', padding: '8px 12px', cursor: 'pointer', fontFamily: 'monospace', width: '100%', marginTop: '10px', transition: 'all 0.2s' }}>
            [CLOSE]
          </button>
        </div>
      )}

      {showTavernPopup && (
        <TavernClosedPopup
          completedQuests={completedQuests}
          onClose={() => setShowTavernPopup(false)}
          onUnlock={() => {
            setIsTavernUnlocked(true);
            setShowTavernPopup(false);
          }}
        />
      )}

    </>
  );
};

const TavernClosedPopup = ({ onClose }) => {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <style>{`@keyframes tavernPopupFade { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: 'GROBOLD, Cartoonist, sans-serif', textAlign: 'center', background: 'rgba(18,9,3,0.97)', border: '2px solid #5a402a', borderRadius: '16px', padding: '36px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '380px', animation: 'tavernPopupFade 0.3s ease-out forwards' }}
      >
        <div style={{ fontSize: '42px' }}>🍺</div>
        <div style={{ fontSize: '24px', color: '#f5d87a', textShadow: '2px 2px 0 #000' }}>Tavern is Closed</div>
        <div style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.6, maxWidth: '280px' }}>
          The local tavern has fallen into ruin and its doors are shut. Help out around town and you may be able to restore it to its former glory.
        </div>
        <div onClick={onClose} style={{ marginTop: '6px', fontSize: '14px', color: '#ccc', background: 'rgba(255,255,255,0.1)', padding: '8px 28px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)' }}>
          Close
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;