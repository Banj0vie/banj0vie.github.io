import React, { useState, useEffect } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import BaseDialog from "../containers/_BaseDialog";
import BaseButton from "../components/buttons/BaseButton";
import { useNotification } from "../contexts/NotificationContext";
import { useItems } from "../hooks/useItems";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";

const AnimalFarm = () => {
  const width = 1920;
  const height = 1080;
  const { show } = useNotification();
  const { refetch, all: allItems } = useItems();

  const [farmData, setFarmData] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('sandbox_animal_farm') || '{"coop":{"status":"unbuilt","buildStartTime":0,"chickens":[]},"sheepcage":{"status":"unbuilt","buildStartTime":0,"sheep":[]}}');
    if (!saved.sheepcage) saved.sheepcage = { status: 'unbuilt', buildStartTime: 0, sheep: [] };
    if (!saved.cowbarn) saved.cowbarn = { status: 'unbuilt', buildStartTime: 0, cows: [] };
    return saved;
  });
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [showSheepBuildDialog, setShowSheepBuildDialog] = useState(false);
  const [showCowBuildDialog, setShowCowBuildDialog] = useState(false);
  const [showCoopDialog, setShowCoopDialog] = useState(false);
  const [showSheepcageDialog, setShowSheepcageDialog] = useState(false);
  const [showCowbarnDialog, setShowCowbarnDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSkipTime = () => {
      setFarmData(prev => {
        const skipAmount = 24 * 60 * 60 * 1000; // 24 hours in ms
        const newData = { ...prev };
        if (newData.coop.buildStartTime > 0) newData.coop.buildStartTime -= skipAmount;
        if (newData.coop.chickens) {
          newData.coop.chickens = newData.coop.chickens.map(c => ({
            ...c,
            buyTime: c.buyTime > 0 ? c.buyTime - skipAmount : 0,
            lastEggTime: c.lastEggTime > 0 ? c.lastEggTime - skipAmount : 0,
          }));
        }
        if (newData.sheepcage && newData.sheepcage.buildStartTime > 0) {
          newData.sheepcage.buildStartTime -= skipAmount;
        }
        if (newData.sheepcage && newData.sheepcage.sheep) {
          newData.sheepcage.sheep = newData.sheepcage.sheep.map(s => ({
            ...s,
            buyTime: s.buyTime > 0 ? s.buyTime - skipAmount : 0,
            lastWoolTime: s.lastWoolTime > 0 ? s.lastWoolTime - skipAmount : 0,
          }));
        }
        if (newData.cowbarn && newData.cowbarn.buildStartTime > 0) {
          newData.cowbarn.buildStartTime -= skipAmount;
        }
        if (newData.cowbarn && newData.cowbarn.cows) {
          newData.cowbarn.cows = newData.cowbarn.cows.map(c => ({
            ...c,
            buyTime: c.buyTime > 0 ? c.buyTime - skipAmount : 0,
            lastMilkTime: c.lastMilkTime > 0 ? c.lastMilkTime - skipAmount : 0,
          }));
        }
        localStorage.setItem('sandbox_animal_farm', JSON.stringify(newData));
        return newData;
      });
    };
    window.addEventListener('skipTime', handleSkipTime);
    return () => window.removeEventListener('skipTime', handleSkipTime);
  }, []);

  const saveFarmData = (data) => {
    setFarmData(data);
    localStorage.setItem('sandbox_animal_farm', JSON.stringify(data));
  };

  const coopStatus = farmData.coop.status;
  const buildStartTime = farmData.coop.buildStartTime;
  const buildDuration = 3 * 60 * 60 * 1000; // 3 hours
  const animalIncubateDuration = 1 * 60 * 60 * 1000; // 1 hour
  const productDuration = 24 * 60 * 60 * 1000; // 24 hours

  let coopIsBuilding = false;
  let coopTimeLeft = 0;
  if (coopStatus === 'building') {
    const elapsed = currentTime - buildStartTime;
    if (elapsed >= buildDuration) {
      saveFarmData({ ...farmData, coop: { ...farmData.coop, status: 'built' } });
    } else {
      coopIsBuilding = true;
      coopTimeLeft = buildDuration - elapsed;
    }
  }
  
  const sheepcageStatus = farmData.sheepcage.status;
  const sheepcageBuildStartTime = farmData.sheepcage.buildStartTime;
  let sheepcageIsBuilding = false;
  let sheepcageTimeLeft = 0;
  if (sheepcageStatus === 'building') {
    const elapsed = currentTime - sheepcageBuildStartTime;
    if (elapsed >= buildDuration) {
      saveFarmData({ ...farmData, sheepcage: { ...farmData.sheepcage, status: 'built' } });
    } else {
      sheepcageIsBuilding = true;
      sheepcageTimeLeft = buildDuration - elapsed;
    }
  }
  
  const cowbarnStatus = farmData.cowbarn.status;
  const cowbarnBuildStartTime = farmData.cowbarn.buildStartTime;
  let cowbarnIsBuilding = false;
  let cowbarnTimeLeft = 0;
  if (cowbarnStatus === 'building') {
    const elapsed = currentTime - cowbarnBuildStartTime;
    if (elapsed >= buildDuration) {
      saveFarmData({ ...farmData, cowbarn: { ...farmData.cowbarn, status: 'built' } });
    } else {
      cowbarnIsBuilding = true;
      cowbarnTimeLeft = buildDuration - elapsed;
    }
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleBuildCoop = () => {
    const honey = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
    const wood = allItems.find(i => i.id === 9993)?.count || 0;
    const stone = allItems.find(i => i.id === 9994)?.count || 0;
    const iron = allItems.find(i => i.id === 9996)?.count || 0;

    if (honey < 500 || wood < 50 || stone < 30 || iron < 10) {
      show("Not enough resources to build the Coop!", "error");
      return;
    }

    localStorage.setItem('sandbox_honey', (honey - 500).toString());
    window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[9993] = Math.max(0, (loot[9993] || 0) - 50);
    loot[9994] = Math.max(0, (loot[9994] || 0) - 30);
    loot[9996] = Math.max(0, (loot[9996] || 0) - 10);
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    if (refetch) refetch();

    saveFarmData({
      ...farmData,
      coop: { ...farmData.coop, status: 'building', buildStartTime: Date.now() }
    });
    setShowBuildDialog(false);
    show("Started building the Coop! It will be ready in 3 hours.", "success");
  };

  const handleBuildSheepcage = () => {
    const honey = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
    const wood = allItems.find(i => i.id === 9993)?.count || 0;
    const stone = allItems.find(i => i.id === 9994)?.count || 0;
    const iron = allItems.find(i => i.id === 9996)?.count || 0;

    if (honey < 500 || wood < 50 || stone < 30 || iron < 10) {
      show("Not enough resources to build the Sheep Cage!", "error");
      return;
    }

    localStorage.setItem('sandbox_honey', (honey - 500).toString());
    window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[9993] = Math.max(0, (loot[9993] || 0) - 50);
    loot[9994] = Math.max(0, (loot[9994] || 0) - 30);
    loot[9996] = Math.max(0, (loot[9996] || 0) - 10);
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    if (refetch) refetch();

    saveFarmData({ ...farmData, sheepcage: { ...farmData.sheepcage, status: 'building', buildStartTime: Date.now() } });
    setShowSheepBuildDialog(false);
    show("Started building the Sheep Cage! It will be ready in 3 hours.", "success");
  };

  const handleBuildCowbarn = () => {
    const honey = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
    const wood = allItems.find(i => i.id === 9993)?.count || 0;
    const stone = allItems.find(i => i.id === 9994)?.count || 0;
    const iron = allItems.find(i => i.id === 9996)?.count || 0;

    if (honey < 500 || wood < 50 || stone < 30 || iron < 10) {
      show("Not enough resources to build the Cow Barn!", "error");
      return;
    }

    localStorage.setItem('sandbox_honey', (honey - 500).toString());
    window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 500).toString() }));

    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[9993] = Math.max(0, (loot[9993] || 0) - 50);
    loot[9994] = Math.max(0, (loot[9994] || 0) - 30);
    loot[9996] = Math.max(0, (loot[9996] || 0) - 10);
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    if (refetch) refetch();

    saveFarmData({ ...farmData, cowbarn: { ...farmData.cowbarn, status: 'building', buildStartTime: Date.now() } });
    setShowCowBuildDialog(false);
    show("Started building the Cow Barn! It will be ready in 3 hours.", "success");
  };

  const handleBuyChicken = () => {
    const honey = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
    if (honey < 100) {
      show("Not enough Honey! Chickens cost 100 Honey.", "error");
      return;
    }

    localStorage.setItem('sandbox_honey', (honey - 100).toString());
    window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 100).toString() }));

    const newChickens = [...farmData.coop.chickens, {
      id: Date.now(),
      status: 'incubating',
      buyTime: Date.now(),
      lastEggTime: 0,
      image: Math.random() > 0.5 ? '/images/barn/chicken1.png' : '/images/barn/chicken2.png'
    }];

    saveFarmData({
      ...farmData,
      coop: { ...farmData.coop, chickens: newChickens }
    });
    show("Purchased a chicken! It will arrive in 1 hour.", "success");
  };

  const handleBuySheep = () => {
    const honey = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
    if (honey < 100) {
      show("Not enough Honey! Sheep cost 100 Honey.", "error");
      return;
    }

    localStorage.setItem('sandbox_honey', (honey - 100).toString());
    window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 100).toString() }));

    const newSheep = [...farmData.sheepcage.sheep, {
      id: Date.now(),
      status: 'incubating',
      buyTime: Date.now(),
      lastWoolTime: 0,
      image: Math.random() > 0.5 ? '/images/barn/sheep1.png' : '/images/barn/sheep2.png'
    }];

    saveFarmData({ ...farmData, sheepcage: { ...farmData.sheepcage, sheep: newSheep } });
    show("Purchased a sheep! It will arrive in 1 hour.", "success");
  };

  const handleBuyCow = () => {
    const honey = parseInt(localStorage.getItem('sandbox_honey') || '0', 10);
    if (honey < 100) {
      show("Not enough Honey! Cows cost 100 Honey.", "error");
      return;
    }

    localStorage.setItem('sandbox_honey', (honey - 100).toString());
    window.dispatchEvent(new CustomEvent('sandboxHoneyChanged', { detail: (honey - 100).toString() }));

    const newCows = [...farmData.cowbarn.cows, {
      id: Date.now(),
      status: 'incubating',
      buyTime: Date.now(),
      lastMilkTime: 0,
      image: '/images/barn/cow1.png'
    }];

    saveFarmData({ ...farmData, cowbarn: { ...farmData.cowbarn, cows: newCows } });
    show("Purchased a cow! It will arrive in 1 hour.", "success");
  };

  const handleCollectEgg = (chickenId) => {
    const basket = allItems.find(i => i.id === 9940); // Egg Basket
    if (!basket || basket.count <= 0) {
      show("You need an Egg Basket to collect eggs! Craft one in the Farm Menu.", "error");
      return;
    }

    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[9941] = (loot[9941] || 0) + 1; // Normal Egg
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    if (refetch) refetch();

    const newChickens = farmData.coop.chickens.map(c => {
      if (c.id === chickenId) {
        return { ...c, lastEggTime: Date.now() };
      }
      return c;
    });

    saveFarmData({
      ...farmData,
      coop: { ...farmData.coop, chickens: newChickens }
    });
    show("Collected 1 Normal Egg!", "success");
  };

  const handleCollectWool = (sheepId) => {
    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[9939] = (loot[9939] || 0) + 1; // Wool
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    if (refetch) refetch();

    const newSheep = farmData.sheepcage.sheep.map(s => {
      if (s.id === sheepId) return { ...s, lastWoolTime: Date.now() };
      return s;
    });

    saveFarmData({ ...farmData, sheepcage: { ...farmData.sheepcage, sheep: newSheep } });
    show("Collected 1 Wool!", "success");
  };

  const handleCollectMilk = (cowId) => {
    const loot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    loot[9938] = (loot[9938] || 0) + 1; // Milk
    localStorage.setItem('sandbox_loot', JSON.stringify(loot));
    if (refetch) refetch();

    const newCows = farmData.cowbarn.cows.map(c => {
      if (c.id === cowId) return { ...c, lastMilkTime: Date.now() };
      return c;
    });

    saveFarmData({ ...farmData, cowbarn: { ...farmData.cowbarn, cows: newCows } });
    show("Collected 1 Milk!", "success");
  };

  const activeChickens = farmData.coop.chickens.map(c => {
    if (c.status === 'incubating') {
      const elapsed = currentTime - c.buyTime;
      if (elapsed >= animalIncubateDuration) {
        return { ...c, status: 'active', lastEggTime: Date.now() }; // Start egg timer when active
      }
    }
    return c;
  });

  const activeSheep = farmData.sheepcage.sheep.map(s => {
    if (s.status === 'incubating') {
      const elapsed = currentTime - s.buyTime;
      if (elapsed >= animalIncubateDuration) {
        return { ...s, status: 'active', lastWoolTime: Date.now() };
      }
    }
    return s;
  });

  const activeCows = farmData.cowbarn.cows.map(c => {
    if (c.status === 'incubating') {
      const elapsed = currentTime - c.buyTime;
      if (elapsed >= animalIncubateDuration) {
        return { ...c, status: 'active', lastMilkTime: Date.now() };
      }
    }
    return c;
  });

  // Save if any chicken became active
  useEffect(() => {
    if (JSON.stringify(activeChickens) !== JSON.stringify(farmData.coop.chickens) ||
        JSON.stringify(activeSheep) !== JSON.stringify(farmData.sheepcage.sheep) ||
        JSON.stringify(activeCows) !== JSON.stringify(farmData.cowbarn.cows)) {
      saveFarmData({
        ...farmData,
        coop: { ...farmData.coop, chickens: activeChickens },
        sheepcage: { ...farmData.sheepcage, sheep: activeSheep },
        cowbarn: { ...farmData.cowbarn, cows: activeCows }
      });
    }
  }, [currentTime]);

  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/valley.webp"
        hotspots={[]}
        dialogs={[]}
        width={width}
        height={height}
        isBig
      >
        {/* Solid Dark Forest Green Background Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: width, height: height, backgroundColor: '#1e4d2b', zIndex: 1 }} />

        <div 
          onClick={() => window.location.href = '/farm'}
          style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10000, backgroundColor: 'rgba(31, 22, 16, 0.9)', padding: '10px 20px', borderRadius: '12px', border: '3px solid #5a402a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>⬅ RETURN TO FARM</span>
        </div>

        {coopStatus === 'unbuilt' && (
          <div 
            onClick={() => setShowBuildDialog(true)}
            style={{ position: 'absolute', top: '400px', left: '800px', cursor: 'pointer', zIndex: 100, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
          >
            <div style={{ backgroundColor: '#8b5a2b', border: '4px solid #5c3a21', padding: '15px 30px', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
              Build?
            </div>
            <div style={{ width: '10px', height: '60px', backgroundColor: '#5c3a21', margin: '0 auto' }}></div>
          </div>
        )}

        {(coopStatus === 'building' || coopStatus === 'built') && (
          <div 
            onClick={() => coopStatus === 'built' ? setShowCoopDialog(true) : show(`Coop is building... ${formatTime(coopTimeLeft)} left`, 'info')}
            style={{ position: 'absolute', top: '300px', left: '700px', cursor: 'pointer', zIndex: 100, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))', opacity: coopStatus === 'building' ? 0.6 : 1 }}
          >
            <img src="/images/barn/coop.png" alt="Coop" style={{ height: '300px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/items/chest.png'; }} />
            {coopStatus === 'building' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px', color: '#ffea00', fontFamily: 'monospace', fontSize: '18px', whiteSpace: 'nowrap' }}>
                Building: {formatTime(coopTimeLeft)}
              </div>
            )}
            {coopStatus === 'built' && activeChickens.some(c => c.status === 'active' && currentTime - c.lastEggTime >= productDuration) && (
              <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '40px', animation: 'bounce 1s infinite' }}>🥚</div>
            )}
          </div>
        )}

        {sheepcageStatus === 'unbuilt' && (
          <div 
            onClick={() => setShowSheepBuildDialog(true)}
            style={{ position: 'absolute', top: '250px', left: '1200px', cursor: 'pointer', zIndex: 100, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
          >
            <div style={{ backgroundColor: '#8b5a2b', border: '4px solid #5c3a21', padding: '15px 30px', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
              Build?
            </div>
            <div style={{ width: '10px', height: '60px', backgroundColor: '#5c3a21', margin: '0 auto' }}></div>
          </div>
        )}

        {(sheepcageStatus === 'building' || sheepcageStatus === 'built') && (
          <div 
            onClick={() => sheepcageStatus === 'built' ? setShowSheepcageDialog(true) : show(`Sheep Cage is building... ${formatTime(sheepcageTimeLeft)} left`, 'info')}
            style={{ position: 'absolute', top: '150px', left: '1100px', cursor: 'pointer', zIndex: 100, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))', opacity: sheepcageStatus === 'building' ? 0.6 : 1 }}
          >
            <img src="/images/barn/sheepcage.png" alt="Sheep Cage" style={{ height: '300px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/items/chest.png'; }} />
            {sheepcageStatus === 'building' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px', color: '#ffea00', fontFamily: 'monospace', fontSize: '18px', whiteSpace: 'nowrap' }}>
                Building: {formatTime(sheepcageTimeLeft)}
              </div>
            )}
            {sheepcageStatus === 'built' && activeSheep.some(s => s.status === 'active' && currentTime - s.lastWoolTime >= productDuration) && (
              <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '40px', animation: 'bounce 1s infinite' }}>🧶</div>
            )}
          </div>
        )}

        {cowbarnStatus === 'unbuilt' && (
          <div 
            onClick={() => setShowCowBuildDialog(true)}
            style={{ position: 'absolute', top: '250px', left: '200px', cursor: 'pointer', zIndex: 100, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
          >
            <div style={{ backgroundColor: '#8b5a2b', border: '4px solid #5c3a21', padding: '15px 30px', borderRadius: '8px', color: '#fff', fontFamily: 'monospace', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
              Build?
            </div>
            <div style={{ width: '10px', height: '60px', backgroundColor: '#5c3a21', margin: '0 auto' }}></div>
          </div>
        )}

        {(cowbarnStatus === 'building' || cowbarnStatus === 'built') && (
          <div 
            onClick={() => cowbarnStatus === 'built' ? setShowCowbarnDialog(true) : show(`Cow Barn is building... ${formatTime(cowbarnTimeLeft)} left`, 'info')}
            style={{ position: 'absolute', top: '150px', left: '100px', cursor: 'pointer', zIndex: 100, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))', opacity: cowbarnStatus === 'building' ? 0.6 : 1 }}
          >
            <img src="/images/barn/cowbarn.png" alt="Cow Barn" style={{ height: '300px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/items/chest.png'; }} />
            {cowbarnStatus === 'building' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px', color: '#ffea00', fontFamily: 'monospace', fontSize: '18px', whiteSpace: 'nowrap' }}>
                Building: {formatTime(cowbarnTimeLeft)}
              </div>
            )}
            {cowbarnStatus === 'built' && activeCows.some(c => c.status === 'active' && currentTime - c.lastMilkTime >= productDuration) && (
              <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '40px', animation: 'bounce 1s infinite' }}>🥛</div>
            )}
          </div>
        )}
      </PanZoomViewport>
      <AdminPanel />

      {showBuildDialog && (
        <BaseDialog onClose={() => setShowBuildDialog(false)} title="BUILD" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
          <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '400px' }}>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Build a Chicken Coop?</h2>
            <img src="/images/barn/coop.png" alt="Coop" style={{ height: '150px', objectFit: 'contain', marginBottom: '20px' }} onError={(e) => { e.target.src = '/images/items/chest.png'; }} />
            
            <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#00ff41' }}>Requirements:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
                <li style={{ color: (allItems.find(i => i.id === 9993)?.count || 0) >= 50 ? '#00ff41' : '#ff4444' }}>- Wood Logs: {allItems.find(i => i.id === 9993)?.count || 0} / 50</li>
                <li style={{ color: (allItems.find(i => i.id === 9994)?.count || 0) >= 30 ? '#00ff41' : '#ff4444' }}>- Stones: {allItems.find(i => i.id === 9994)?.count || 0} / 30</li>
                <li style={{ color: (allItems.find(i => i.id === 9996)?.count || 0) >= 10 ? '#00ff41' : '#ff4444' }}>- Iron Ore: {allItems.find(i => i.id === 9996)?.count || 0} / 10</li>
                <li style={{ color: parseInt(localStorage.getItem('sandbox_honey') || '0', 10) >= 500 ? '#00ff41' : '#ff4444' }}>- Honey: {parseInt(localStorage.getItem('sandbox_honey') || '0', 10)} / 500</li>
              </ul>
            </div>

            <p style={{ color: '#ccc', marginBottom: '20px' }}>Build Time: 3 Hours</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <BaseButton label="Build Coop" onClick={handleBuildCoop} />
              <BaseButton label="Cancel" onClick={() => setShowBuildDialog(false)} />
            </div>
          </div>
        </BaseDialog>
      )}

      {showSheepBuildDialog && (
        <BaseDialog onClose={() => setShowSheepBuildDialog(false)} title="BUILD" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
          <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '400px' }}>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Build a Sheep Cage?</h2>
            <img src="/images/barn/sheepcage.png" alt="Sheep Cage" style={{ height: '150px', objectFit: 'contain', marginBottom: '20px' }} onError={(e) => { e.target.src = '/images/items/chest.png'; }} />
            
            <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#00ff41' }}>Requirements:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
                <li style={{ color: (allItems.find(i => i.id === 9993)?.count || 0) >= 50 ? '#00ff41' : '#ff4444' }}>- Wood Logs: {allItems.find(i => i.id === 9993)?.count || 0} / 50</li>
                <li style={{ color: (allItems.find(i => i.id === 9994)?.count || 0) >= 30 ? '#00ff41' : '#ff4444' }}>- Stones: {allItems.find(i => i.id === 9994)?.count || 0} / 30</li>
                <li style={{ color: (allItems.find(i => i.id === 9996)?.count || 0) >= 10 ? '#00ff41' : '#ff4444' }}>- Iron Ore: {allItems.find(i => i.id === 9996)?.count || 0} / 10</li>
                <li style={{ color: parseInt(localStorage.getItem('sandbox_honey') || '0', 10) >= 500 ? '#00ff41' : '#ff4444' }}>- Honey: {parseInt(localStorage.getItem('sandbox_honey') || '0', 10)} / 500</li>
              </ul>
            </div>

            <p style={{ color: '#ccc', marginBottom: '20px' }}>Build Time: 3 Hours</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <BaseButton label="Build Cage" onClick={handleBuildSheepcage} />
              <BaseButton label="Cancel" onClick={() => setShowSheepBuildDialog(false)} />
            </div>
          </div>
        </BaseDialog>
      )}

      {showCowBuildDialog && (
        <BaseDialog onClose={() => setShowCowBuildDialog(false)} title="BUILD" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
          <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '400px' }}>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Build a Cow Barn?</h2>
            <img src="/images/barn/cowbarn.png" alt="Cow Barn" style={{ height: '150px', objectFit: 'contain', marginBottom: '20px' }} onError={(e) => { e.target.src = '/images/items/chest.png'; }} />
            
            <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#00ff41' }}>Requirements:</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
                <li style={{ color: (allItems.find(i => i.id === 9993)?.count || 0) >= 50 ? '#00ff41' : '#ff4444' }}>- Wood Logs: {allItems.find(i => i.id === 9993)?.count || 0} / 50</li>
                <li style={{ color: (allItems.find(i => i.id === 9994)?.count || 0) >= 30 ? '#00ff41' : '#ff4444' }}>- Stones: {allItems.find(i => i.id === 9994)?.count || 0} / 30</li>
                <li style={{ color: (allItems.find(i => i.id === 9996)?.count || 0) >= 10 ? '#00ff41' : '#ff4444' }}>- Iron Ore: {allItems.find(i => i.id === 9996)?.count || 0} / 10</li>
                <li style={{ color: parseInt(localStorage.getItem('sandbox_honey') || '0', 10) >= 500 ? '#00ff41' : '#ff4444' }}>- Honey: {parseInt(localStorage.getItem('sandbox_honey') || '0', 10)} / 500</li>
              </ul>
            </div>

            <p style={{ color: '#ccc', marginBottom: '20px' }}>Build Time: 3 Hours</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <BaseButton label="Build Barn" onClick={handleBuildCowbarn} />
              <BaseButton label="Cancel" onClick={() => setShowCowBuildDialog(false)} />
            </div>
          </div>
        </BaseDialog>
      )}

      {showCoopDialog && (
        <BaseDialog onClose={() => setShowCoopDialog(false)} title="CHICKEN COOP" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
          <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '600px' }}>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Manage Chickens</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
              {Array.from({ length: 10 }).map((_, i) => {
                const chicken = activeChickens[i];
                if (!chicken) {
                  return (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px dashed #5a402a', borderRadius: '8px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <BaseButton small label="+ Add" onClick={handleBuyChicken} />
                    </div>
                  );
                }

                if (chicken.status === 'incubating') {
                  const timeLeft = animalIncubateDuration - (currentTime - chicken.buyTime);
                  return (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ fontSize: '30px', filter: 'grayscale(1)' }}>🥚</span>
                      <span style={{ fontSize: '10px', color: '#ffea00', marginTop: '5px' }}>{formatTime(timeLeft)}</span>
                    </div>
                  );
                }

                const canLayEgg = currentTime - chicken.lastEggTime >= productDuration;
                const eggTimeLeft = productDuration - (currentTime - chicken.lastEggTime);

                return (
                  <div key={i} style={{ backgroundColor: 'rgba(0,255,65,0.1)', border: '2px solid #00ff41', borderRadius: '8px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <img src={chicken.image} alt="Chicken" style={{ height: '50px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/items/seeds.png'; }} />
                    {canLayEgg ? (
                      <button onClick={() => handleCollectEgg(chicken.id)} style={{ position: 'absolute', bottom: '5px', backgroundColor: '#ffea00', border: '1px solid #b8860b', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '2px 5px' }}>Collect 🥚</button>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#ccc', marginTop: '5px', position: 'absolute', bottom: '5px' }}>{formatTime(eggTimeLeft)}</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p style={{ color: '#aaa', fontSize: '12px' }}>Chickens cost 100 Honey and take 1 Hour to arrive. They lay 1 egg every 24 Hours.</p>
          </div>
        </BaseDialog>
      )}

      {showSheepcageDialog && (
        <BaseDialog onClose={() => setShowSheepcageDialog(false)} title="SHEEP CAGE" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
          <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '600px' }}>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Manage Sheep</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const sheep = activeSheep[i];
                if (!sheep) {
                  return (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px dashed #5a402a', borderRadius: '8px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <BaseButton small label="+ Add" onClick={handleBuySheep} />
                    </div>
                  );
                }

                if (sheep.status === 'incubating') {
                  const timeLeft = animalIncubateDuration - (currentTime - sheep.buyTime);
                  return (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ fontSize: '30px', filter: 'grayscale(1)' }}>📦</span>
                      <span style={{ fontSize: '10px', color: '#ffea00', marginTop: '5px' }}>{formatTime(timeLeft)}</span>
                    </div>
                  );
                }

                const canShear = currentTime - sheep.lastWoolTime >= productDuration;
                const woolTimeLeft = productDuration - (currentTime - sheep.lastWoolTime);

                return (
                  <div key={i} style={{ backgroundColor: 'rgba(0,255,65,0.1)', border: '2px solid #00ff41', borderRadius: '8px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <img src={sheep.image} alt="Sheep" style={{ height: '50px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/items/seeds.png'; }} />
                    {canShear ? (
                      <button onClick={() => handleCollectWool(sheep.id)} style={{ position: 'absolute', bottom: '5px', backgroundColor: '#ffea00', border: '1px solid #b8860b', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '2px 5px' }}>Shear 🧶</button>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#ccc', marginTop: '5px', position: 'absolute', bottom: '5px' }}>{formatTime(woolTimeLeft)}</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p style={{ color: '#aaa', fontSize: '12px' }}>Sheep cost 100 Honey and take 1 Hour to arrive. They produce 1 Wool every 24 Hours.</p>
          </div>
        </BaseDialog>
      )}

      {showCowbarnDialog && (
        <BaseDialog onClose={() => setShowCowbarnDialog(false)} title="COW BARN" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
          <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', textAlign: 'center', width: '600px' }}>
            <h2 style={{ color: '#ffea00', margin: '0 0 20px 0' }}>Manage Cows</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
              {Array.from({ length: 3 }).map((_, i) => {
                const cow = activeCows[i];
                if (!cow) {
                  return (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px dashed #5a402a', borderRadius: '8px', height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <BaseButton small label="+ Add" onClick={handleBuyCow} />
                    </div>
                  );
                }

                if (cow.status === 'incubating') {
                  const timeLeft = animalIncubateDuration - (currentTime - cow.buyTime);
                  return (
                    <div key={i} style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ fontSize: '30px', filter: 'grayscale(1)' }}>📦</span>
                      <span style={{ fontSize: '10px', color: '#ffea00', marginTop: '5px' }}>{formatTime(timeLeft)}</span>
                    </div>
                  );
                }

                const canMilk = currentTime - cow.lastMilkTime >= productDuration;
                const milkTimeLeft = productDuration - (currentTime - cow.lastMilkTime);

                return (
                  <div key={i} style={{ backgroundColor: 'rgba(0,255,65,0.1)', border: '2px solid #00ff41', borderRadius: '8px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                    <img src={cow.image} alt="Cow" style={{ height: '50px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/items/seeds.png'; }} />
                    {canMilk ? (
                      <button onClick={() => handleCollectMilk(cow.id)} style={{ position: 'absolute', bottom: '5px', backgroundColor: '#ffea00', border: '1px solid #b8860b', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '2px 5px' }}>Milk 🥛</button>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#ccc', marginTop: '5px', position: 'absolute', bottom: '5px' }}>{formatTime(milkTimeLeft)}</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <p style={{ color: '#aaa', fontSize: '12px' }}>Cows cost 100 Honey and take 1 Hour to arrive. They produce 1 Milk every 24 Hours.</p>
          </div>
        </BaseDialog>
      )}
    </>
  );
};

export default AnimalFarm;