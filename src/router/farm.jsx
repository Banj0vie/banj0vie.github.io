import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_BEES, FARM_HOTSPOTS, FARM_VIEWPORT, FARM_POSITIONS } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farm_Farmer";
import FarmInterface from "../layouts/FarmInterface";
import FarmMenu from "../layouts/FarmInterface/FarmMenu";
import SelectSeedDialog from "../containers/Farm_SelectSeedDialog";
import { useItems } from "../hooks/useItems";
import { useFarming } from "../hooks/useContracts";
import { useNotification } from "../contexts/NotificationContext";
import { CropItemArrayClass } from "../models/crop";
import { handleContractError } from "../utils/errorHandler";
import { ID_POTION_ITEMS, ID_PRODUCE_ITEMS, ID_CHEST_ITEMS, ID_FISH_ITEMS } from "../constants/app_ids";
import { ALL_ITEMS } from "../constants/item_data";
import { clampVolume, getGrowthTime, getSubtype } from "../utils/basic";
import { ONE_SEED_HEIGHT, ONE_SEED_WIDTH } from "../constants/item_seed";
import { useAppSelector } from "../solana/store";
import { selectSettings } from "../solana/store/slices/uiSlice";
import { defaultSettings } from "../utils/settings";
import BaseDialog from "../containers/_BaseDialog";
import BaseButton from "../components/buttons/BaseButton";
import ChestRollingDialog from "../containers/Menu_Inventory/ChestRollingDialog";
import Forest from "./forest";
import AdminPanel from "./index";

// Shared Protection Logic Map
const protectedPlotsBySpot = {
  1: [8, 9], // Spot 1 protects 8 and 9
  2: [0, 1], // Spot 2 protects these plots
  3: [7, 8], 
  10: [5, 6],
  11: [2, 3],
  4: [], // Spot 4
  5: [6, 7], // Spot 5
  6: [10, 11], // Spot 6
  7: [11, 12], // Spot 7
  8: [13, 14]  // Spot 8
};

const MOCK_LEADERBOARD = [
  { name: "FarmerBob", weight: "2.85" },
  { name: "AliceGrows", weight: "2.61" },
  { name: "CryptoVeggies", weight: "2.40" },
  { name: "OnionKing", weight: "2.15" },
];

// Dialog to prepare a plot for planting
const PlotPrepDialog = ({ onClose, onPlaceDirt, onAddFish, availableFish }) => {
  const [showFish, setShowFish] = useState(false);

  return (
    <BaseDialog onClose={onClose} title="HOLE" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#00ff41', margin: '0' }}>Inspect Hole</h2>
        <p style={{ margin: 0, color: '#ccc', textAlign: 'center' }}>Do you want to add a fish to fertilize the hole, or place dirt directly?</p>
        
        {!showFish ? (
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <BaseButton label="Add Fish" onClick={() => setShowFish(true)} />
            <BaseButton label="Place Dirt" onClick={onPlaceDirt} />
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <h3 style={{ margin: '0', color: '#ffea00' }}>Select a Fish</h3>
            {availableFish.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '200px', overflowY: 'auto', width: '100%' }}>
                {availableFish.map(fish => (
                  <div 
                    key={fish.id} 
                    onClick={() => onAddFish(fish.id)}
                    style={{ border: '2px solid #5a402a', borderRadius: '8px', padding: '10px', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', minWidth: '80px' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00ff41'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#5a402a'}
                  >
                    <img src={fish.image} alt={fish.label} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '12px', color: '#fff', textAlign: 'center' }}>{fish.label}</span>
                    <span style={{ fontSize: '10px', color: '#aaa' }}>x{fish.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#ff4444' }}>You have no fish!</p>
            )}
            <BaseButton small label="Back" onClick={() => setShowFish(false)} />
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

// Inline the dialog to avoid any import/module resolution errors!
const WeightContestDialog = ({ onClose, simulatedDay, targetProduceId, targetFishId, onProduceChange, onFishChange, targetProduceData, targetFishData, refetchItems }) => {
  const { show } = useNotification();
  
  const [chestResult, setChestResult] = useState(null);
  const [showChestDialog, setShowChestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('produce'); // 'produce' or 'fish'
  
  const targetCropId = activeTab === 'produce' ? targetProduceId : targetFishId;
  const targetCropData = activeTab === 'produce' ? targetProduceData : targetFishData;
  const onCropChange = activeTab === 'produce' ? onProduceChange : onFishChange;
  const submissionKey = `weight_contest_submission_${activeTab}`;

  const [submission, setSubmission] = useState(() => {
    const saved = localStorage.getItem(submissionKey);
    if (!saved && activeTab === 'produce') {
      const legacy = localStorage.getItem('weight_contest_submission');
      if (legacy) return JSON.parse(legacy);
    }
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    let saved = localStorage.getItem(submissionKey);
    if (!saved && activeTab === 'produce') {
      const legacy = localStorage.getItem('weight_contest_submission');
      if (legacy) saved = legacy;
    }
    setSubmission(saved ? JSON.parse(saved) : null);
  }, [activeTab, submissionKey]);

  const targetCropName = targetCropData ? targetCropData.label : "Crop";

  const individualCrops = useMemo(() => {
    if (!targetCropData) return [];
    return Array.from({ length: targetCropData.count || 0 }).map((_, index) => {
      const randomFactor = Math.pow(Math.random(), 2.5);
      const weight = (0.5 + randomFactor * 1.5).toFixed(2);
      return {
        id: `crop-${index}`,
        name: `${targetCropName} ${index + 1}`,
        weight: weight,
      };
    });
  }, [targetCropData?.count, targetCropName]);

  const handleSelect = (crop) => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');
    let deducted = false;
    
    let produceCount = 0;
    if (Array.isArray(sandboxProduce[targetCropId])) {
      produceCount = sandboxProduce[targetCropId].length;
    } else {
      produceCount = Number(sandboxProduce[targetCropId]) || 0;
    }

    if (produceCount > 0) {
      if (Array.isArray(sandboxProduce[targetCropId])) {
        sandboxProduce[targetCropId].pop();
      } else {
        sandboxProduce[targetCropId] -= 1;
      }
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
      deducted = true;
    } else if (sandboxLoot[targetCropId] > 0) {
      sandboxLoot[targetCropId] -= 1;
      localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
      deducted = true;
    }

    if (!deducted) {
      show(`You don't have any ${targetCropName}s to submit!`, "error");
      return;
    }

    if (refetchItems) refetchItems();

    const newSubmission = { weight: crop.weight, name: "You" };
    setSubmission(newSubmission);
    localStorage.setItem(submissionKey, JSON.stringify(newSubmission));
  };

  const isSunday = simulatedDay === 0;
  const daysUntilSunday = isSunday ? 0 : 7 - simulatedDay;

  const handleClaimPrize = () => {
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const chestId = ID_CHEST_ITEMS.CHEST_BRONZE || ID_CHEST_ITEMS.BRONZE_CHEST;
    
    const mockRewards = [ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.POTATO, ID_PRODUCE_ITEMS.CORN];
    const mockRewardId = mockRewards[Math.floor(Math.random() * mockRewards.length)];
    
    sandboxLoot[mockRewardId] = (sandboxLoot[mockRewardId] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    setChestResult({
      rewardId: mockRewardId,
      chestType: chestId
    });
    setShowChestDialog(true);

    setSubmission(null);
    localStorage.removeItem(submissionKey);
    if (activeTab === 'produce') localStorage.removeItem('weight_contest_submission');

    const isFish = activeTab === 'fish';
    let eligible;
    if (isFish) {
      eligible = Object.values(ID_FISH_ITEMS).filter(id => typeof id === 'number');
      if (eligible.length === 0) eligible = [ID_PRODUCE_ITEMS.ONION]; 
    } else {
      eligible = [ID_PRODUCE_ITEMS.ONION, ID_PRODUCE_ITEMS.CARROT, ID_PRODUCE_ITEMS.POTATO, ID_PRODUCE_ITEMS.TOMATO, ID_PRODUCE_ITEMS.CORN];
    }

    const nextCrops = eligible.filter(id => id !== targetCropId);
    const newCrop = nextCrops.length > 0 ? nextCrops[Math.floor(Math.random() * nextCrops.length)] : eligible[0];
    onCropChange(newCrop);
    localStorage.setItem(isFish ? 'weight_contest_fish' : 'weight_contest_produce', newCrop.toString());

    show("Prize claimed! Opening chest...", "success");
  };

  const currentLeaderboard = useMemo(() => {
    let board = [...MOCK_LEADERBOARD];
    if (submission) board.push(submission);
    board.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
    return board;
  }, [submission]);

  return (
    <>
      <BaseDialog onClose={onClose} title="WEIGHT CONTEST" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
        <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => setActiveTab('produce')} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: activeTab === 'produce' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
                color: activeTab === 'produce' ? '#00ff41' : '#ccc', 
                border: `2px solid ${activeTab === 'produce' ? '#00ff41' : '#5a402a'}`, 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Produce Event
            </button>
            <button 
              onClick={() => setActiveTab('fish')} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: activeTab === 'fish' ? 'rgba(0, 191, 255, 0.2)' : 'rgba(0, 0, 0, 0.5)', 
                color: activeTab === 'fish' ? '#00bfff' : '#ccc', 
                border: `2px solid ${activeTab === 'fish' ? '#00bfff' : '#5a402a'}`, 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontFamily: 'monospace', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Fish Event
            </button>
          </div>

          {isSunday ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly {targetCropName} Weigh-In Results 🏆</h2>
                <p style={{ margin: 0, color: '#ccc' }}>The competition has ended! Here are the winners:</p>
              </div>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', padding: '15px' }}>
                <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>Final Standings</h3>
                {currentLeaderboard.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(90, 64, 42, 0.5)' }}>
                    <span style={{ width: '30px', color: entry.name === 'You' ? '#00ff41' : '#fff' }}>#{index + 1}</span>
                    <span style={{ flex: 1, color: entry.name === 'You' ? '#00ff41' : '#aaa' }}>{entry.name}</span>
                    <span style={{ color: '#ffea00' }}>{entry.weight}kg</span>
                  </div>
                ))}
              </div>
              {submission && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <BaseButton label="Claim Prize" onClick={handleClaimPrize} />
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly {targetCropName} Weigh-In 🏆</h2>
                {submission ? (
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid #5a402a', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                    <p style={{ color: '#00ff41', fontSize: '18px', margin: '0 0 10px 0', fontWeight: 'bold' }}>Ticket Submitted!</p>
                    <p style={{ margin: '0 0 10px 0' }}>Your Entry: <span style={{ color: '#ffea00' }}>{submission.weight}kg {targetCropName}</span></p>
                    <p style={{ color: '#ccc', margin: 0 }}>The competition ends in <strong style={{ color: '#fff' }}>{daysUntilSunday} {daysUntilSunday === 1 ? 'day' : 'days'}</strong> (on Sunday).</p>
                    <p style={{ color: '#aaa', fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>* Leaderboard is hidden until the competition ends.</p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#ccc' }}>This week's weight competition is for {targetCropName}. Please submit your ticket and choose which {targetCropName.toLowerCase()} you want to enter.</p>
                )}
              </div>

              {!submission && (
                <div style={{ overflowY: 'auto', maxHeight: '300px', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {individualCrops.length > 0 ? individualCrops.map((crop) => (
                    <div key={crop.id} style={{ backgroundColor: 'rgba(31, 22, 16, 0.8)', border: '2px solid #5a402a', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {targetCropData?.image && targetCropData.image.includes('crop') ? (
                             <div style={{ 
                                 width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, 
                                 backgroundImage: `url(${targetCropData.image})`, 
                                 backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(targetCropData.pos || 0) * ONE_SEED_HEIGHT}px`,
                                 transform: 'scale(0.6)', backgroundRepeat: 'no-repeat'
                             }} />
                          ) : targetCropData?.image && targetCropData.image.includes('seeds') ? (
                             <div className="item-icon item-icon-seeds" style={{ transform: 'scale(0.8)', backgroundPositionY: targetCropData.pos ? `-${targetCropData.pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div>
                          ) : (
                             <img src={targetCropData?.image} alt={targetCropName} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                          )}
                        </div>
                        <span style={{ color: '#00ff41', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace' }}>{crop.name} - <span style={{ color: '#fff' }}>{crop.weight}kg</span></span>
                      </div>
                      <BaseButton small label="Submit" onClick={() => handleSelect(crop)} />
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#ff4444', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid #ff4444' }}>You don't have any {targetCropName}s to submit! Go farm some.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </BaseDialog>
      
      {showChestDialog && chestResult && (
        <ChestRollingDialog rollingInfo={chestResult} onClose={() => { setShowChestDialog(false); setChestResult(null); }} onBack={() => { setShowChestDialog(false); setChestResult(null); }} />
      )}
    </>
  );
};

// Global weather helper
const getWeatherForDay = (day) => {
  if (day === 15) return '⚡'; // 1 day of lightning
  if (day % 4 === 0) return '🌧️'; // Standard rainy days
  if (day % 3 === 0 || day % 5 === 0) return '☁️'; // Mix of cloudy
  return '☀️'; // Sunny by default
};

// Highly optimized rain rendering component
const RainOverlay = React.memo(({ isLightning }) => {
  const drops = useMemo(() => Array.from({ length: 150 }).map((_, i) => ({
    left: `${Math.random() * 120 - 10}%`, 
    animationDuration: `${0.3 + Math.random() * 0.4}s`, 
    animationDelay: `${Math.random() * 2}s`,
    opacity: 0.3 + Math.random() * 0.5
  })), []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9990, overflow: 'hidden' }}>
      <style>{`
        .rain-drop {
          position: absolute;
          bottom: 100%;
          width: 2px;
          height: 100px;
          background: linear-gradient(to bottom, rgba(200,230,255,0), rgba(200,230,255,0.6));
          animation: rain-fall linear infinite;
        }
        @keyframes rain-fall {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(120vh) translateX(-10vh); }
        }
        .lightning-flash {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: white; pointer-events: none; z-index: 9989;
          animation: flash 8s infinite; opacity: 0;
        }
        @keyframes flash { 0%, 95%, 98%, 100% { opacity: 0; } 96%, 99% { opacity: 0.6; } }
        .rain-darken { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 20, 50, 0.25); pointer-events: none; z-index: 9988; }
      `}</style>
      <div className="rain-darken" />
      {isLightning && <div className="lightning-flash" />}
      {drops.map((style, i) => <div key={i} className="rain-drop" style={style} />)}
    </div>
  );
});

const CalendarDialog = ({ onClose, simulatedDay, simulatedDate }) => {
  const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[estDate.getMonth()];
  const year = estDate.getFullYear();
  const month = estDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7; 
  
  const blanks = Array.from({ length: startOffset }, (_, i) => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <BaseDialog onClose={onClose} title="CALENDAR" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', width: '500px', maxWidth: '90vw' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>{monthName} Calendar</h2>
          <p style={{ margin: 0, color: '#ccc' }}>Track upcoming events and festivals!</p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          border: '2px solid #5a402a',
          borderRadius: '8px',
          padding: '15px'
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} style={{ textAlign: 'center', color: '#ccc', fontWeight: 'bold', paddingBottom: '10px', borderBottom: '1px solid #5a402a', marginBottom: '5px' }}>
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} style={{ height: '60px' }} />
          ))}
          {days.map(day => {
            const currentDayOfWeek = (startOffset + day - 1) % 7; // 0=Mon, ..., 6=Sun
            const isSunday = currentDayOfWeek === 6;
            
            // Highlight the specific simulated date
            const isToday = day === simulatedDate;

            const weatherEmoji = getWeatherForDay(day);
            const weatherTitle = weatherEmoji === '⚡' ? 'Lightning Storm' : weatherEmoji === '🌧️' ? 'Rainy' : weatherEmoji === '☁️' ? 'Cloudy' : 'Sunny';

            return (
              <div key={day} style={{
                height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '5px',
                border: isToday ? '2px solid #00ff41' : '1px solid #5a402a',
                backgroundColor: isToday ? 'rgba(0, 255, 65, 0.1)' : 'rgba(31, 22, 16, 0.8)',
                color: isToday ? '#00ff41' : '#fff', borderRadius: '4px', position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', zIndex: 10 }}>
                  <span style={{ fontSize: '14px', filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.8))' }} title={weatherTitle}>{weatherEmoji}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{day}</span>
                </div>
                {isSunday && (
                  <img src="/images/weight/weightcontest.png" alt="Weigh-in" style={{ width: '80px', height: '80px', position: 'absolute', bottom: '2px', opacity: 0.9, filter: 'drop-shadow(0px 2px 2px black)', zIndex: 5 }} title="Weekly Weigh-In!" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </BaseDialog>
  );
};

const CraftingDialog = ({ onClose, refetchSeeds }) => {
  const { all: allItems, refetch } = useItems();
  const { show } = useNotification();
  
  const woodCount = allItems.find(i => i.id === 9993)?.count || 0;
  const stoneCount = allItems.find(i => i.id === 9994)?.count || 0;
  const sticksCount = allItems.find(i => i.id === 9995)?.count || 0;
  const stonePipeCount = allItems.find(i => i.id === 9990)?.count || 0;
  const ironCount = allItems.find(i => i.id === 9996)?.count || 0;
  const pumpkinCount = allItems.find(i => i.id === ID_PRODUCE_ITEMS.PUMPKIN)?.count || 0;
  const cornCount = allItems.find(i => i.id === ID_PRODUCE_ITEMS.CORN)?.count || 0;
  
  const handleCraftSticks = () => {
    if (woodCount < 2) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9993] = Math.max(0, (sandboxLoot[9993] || 0) - 2);
    sandboxLoot[9995] = (sandboxLoot[9995] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    show("Crafted 1 Stick!", "success");
  };

  const handleCraftStonePipe = () => {
    if (stoneCount < 2) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9994] = Math.max(0, (sandboxLoot[9994] || 0) - 2);
    sandboxLoot[9990] = (sandboxLoot[9990] || 0) + 2;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    show("Crafted 2 Stone Pipes!", "success");
  };

  const handleCraftScarecrow = () => {
    if (sticksCount < 3 || pumpkinCount < 1) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 3);
    
    let remainingPumpkinToDeduct = 1;
    if (sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN] > 0) {
      const deduct = Math.min(sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN], remainingPumpkinToDeduct);
      sandboxProduce[ID_PRODUCE_ITEMS.PUMPKIN] -= deduct;
      remainingPumpkinToDeduct -= deduct;
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    }
    if (remainingPumpkinToDeduct > 0) {
      sandboxLoot[ID_PRODUCE_ITEMS.PUMPKIN] = Math.max(0, (sandboxLoot[ID_PRODUCE_ITEMS.PUMPKIN] || 0) - remainingPumpkinToDeduct);
    }
    
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    show("Crafted 1 Scarecrow!", "success");
  };

  const handleCraftUmbrella = () => {
    if (sticksCount < 2 || cornCount < 5) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    const sandboxProduce = JSON.parse(localStorage.getItem('sandbox_produce') || '{}');

    sandboxLoot[9995] = Math.max(0, (sandboxLoot[9995] || 0) - 2);
    
    let remainingCornToDeduct = 5;
    if (sandboxProduce[ID_PRODUCE_ITEMS.CORN] > 0) {
      const deduct = Math.min(sandboxProduce[ID_PRODUCE_ITEMS.CORN], remainingCornToDeduct);
      sandboxProduce[ID_PRODUCE_ITEMS.CORN] -= deduct;
      remainingCornToDeduct -= deduct;
      localStorage.setItem('sandbox_produce', JSON.stringify(sandboxProduce));
    }
    if (remainingCornToDeduct > 0) {
      sandboxLoot[ID_PRODUCE_ITEMS.CORN] = Math.max(0, (sandboxLoot[ID_PRODUCE_ITEMS.CORN] || 0) - remainingCornToDeduct);
    }
    
    sandboxLoot[9999] = (sandboxLoot[9999] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    show("Crafted 1 Umbrella!", "success");
  };

  const handleCraftSprinkler = () => {
    if (stonePipeCount < 2 || ironCount < 1) return;
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');

    sandboxLoot[9990] = Math.max(0, (sandboxLoot[9990] || 0) - 2);
    sandboxLoot[9996] = Math.max(0, (sandboxLoot[9996] || 0) - 1);
    
    sandboxLoot[9998] = (sandboxLoot[9998] || 0) + 1;
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    
    if (refetch) refetch();
    if (refetchSeeds) refetchSeeds();
    show("Crafted 1 Water Sprinkler!", "success");
  };

  return (
    <BaseDialog onClose={onClose} title="CRAFTING" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', width: '400px', maxWidth: '90vw' }}>
        <h2 style={{ color: '#00ff41', margin: '0 0 10px 0', textAlign: 'center' }}>Crafting Workbench</h2>
        
        <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #5a402a', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffea00' }}>Sticks</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>Cost: 2 Wood Log (You have {woodCount})</p>
            </div>
            <BaseButton small label="Craft" onClick={handleCraftSticks} disabled={woodCount < 2} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #5a402a', paddingBottom: '10px', paddingTop: '5px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffea00' }}>Stone Pipe (x2)</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>Cost: 2 Stone (You have {stoneCount})</p>
            </div>
            <BaseButton small label="Craft" onClick={handleCraftStonePipe} disabled={stoneCount < 2} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #5a402a', paddingBottom: '10px', paddingTop: '5px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffea00' }}>Scarecrow</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>Cost: 3 Sticks, 1 Pumpkin</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ccc' }}>You have: {sticksCount} Sticks, {pumpkinCount} Pumpkins</p>
            </div>
            <BaseButton small label="Craft" onClick={handleCraftScarecrow} disabled={sticksCount < 3 || pumpkinCount < 1} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #5a402a', paddingBottom: '10px', paddingTop: '5px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffea00' }}>Umbrella</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>Cost: 2 Sticks, 5 Corn</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ccc' }}>You have: {sticksCount} Sticks, {cornCount} Corn</p>
            </div>
            <BaseButton small label="Craft" onClick={handleCraftUmbrella} disabled={sticksCount < 2 || cornCount < 5} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '5px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#ffea00' }}>Water Sprinkler</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#aaa' }}>Cost: 2 Stone Pipes, 1 Iron</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#ccc' }}>You have: {stonePipeCount} Pipes, {ironCount} Iron</p>
            </div>
            <BaseButton small label="Craft" onClick={handleCraftSprinkler} disabled={stonePipeCount < 2 || ironCount < 1} />
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

const SmithingDialog = ({ onClose }) => {
  const { all: allItems } = useItems();
  const { show } = useNotification();

  const woodCount = allItems.find(i => i.id === 9993)?.count || 0;
  const ironOreCount = allItems.find(i => i.id === 9996)?.count || 0;
  const goldOreCount = allItems.find(i => i.id === 9997)?.count || 0;

  const [selectedOre, setSelectedOre] = useState(null); // 'iron' or 'gold'
  const [woodAmount, setWoodAmount] = useState(0);

  return (
    <BaseDialog onClose={onClose} title="SMITHING" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px', width: '450px', maxWidth: '90vw', alignItems: 'center' }}>
        <h2 style={{ color: '#ffea00', margin: '0 0 5px 0', textAlign: 'center' }}>Furnace</h2>
        
        {/* Minecraft Furnace UI Box */}
        <div style={{ 
          backgroundColor: '#8b8b8b', 
          border: '4px solid #3c3c3c', 
          borderRadius: '4px', 
          padding: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '30px',
          width: '100%',
          boxShadow: 'inset -4px -4px 0px rgba(0,0,0,0.3), inset 4px 4px 0px rgba(255,255,255,0.3)',
          boxSizing: 'border-box'
        }}>
          
          {/* Inputs Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            {/* Ore Slot */}
            <div 
              style={{ 
                width: '64px', height: '64px', backgroundColor: '#5c5c5c', 
                border: '4px solid #3c3c3c', boxShadow: 'inset 4px 4px 0px rgba(0,0,0,0.5)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                borderRightColor: '#fff', borderBottomColor: '#fff'
              }}
            >
              {selectedOre === 'iron' && <div style={{ color: '#ccc', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>IRON<br/>ORE</div>}
              {selectedOre === 'gold' && <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>GOLD<br/>ORE</div>}
              {!selectedOre && <span style={{ color: '#aaa', fontSize: '10px' }}>Ore</span>}
            </div>

            {/* Flame Icon */}
            <div style={{ color: woodAmount > 0 ? '#ff8800' : '#444', fontSize: '28px', textShadow: woodAmount > 0 ? '0 0 10px #ff4400' : 'none' }}>🔥</div>

            {/* Fuel Slot */}
            <div style={{ 
              width: '64px', height: '64px', backgroundColor: '#5c5c5c', 
              border: '4px solid #3c3c3c', boxShadow: 'inset 4px 4px 0px rgba(0,0,0,0.5)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              borderRightColor: '#fff', borderBottomColor: '#fff'
            }}>
              {woodAmount > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src="/images/forest/wood.png" alt="Wood" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold', textShadow: '1px 1px 0 #000' }}>{woodAmount}</span>
                </div>
              ) : (
                <span style={{ color: '#aaa', fontSize: '10px' }}>Fuel</span>
              )}
            </div>
          </div>

          {/* Progress Arrow */}
          <div style={{ position: 'relative', width: '50px', height: '35px', backgroundColor: '#5c5c5c', clipPath: 'polygon(0 20%, 60% 20%, 60% 0, 100% 50%, 60% 100%, 60% 80%, 0 80%)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: woodAmount > 0 && selectedOre ? '100%' : '0%', backgroundColor: '#fff', transition: 'width 2s linear' }}></div>
          </div>

          {/* Output Slot */}
          <div style={{ 
            width: '84px', height: '84px', backgroundColor: '#5c5c5c', 
            border: '4px solid #3c3c3c', boxShadow: 'inset 4px 4px 0px rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            borderRightColor: '#fff', borderBottomColor: '#fff'
          }}>
            {/* Result item will go here */}
          </div>

        </div>

        {/* Controls Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '8px', border: '1px solid #5a402a', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ccc', fontSize: '14px' }}>Select Ore:</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setSelectedOre(selectedOre === 'iron' ? null : 'iron')}
                style={{ padding: '6px 12px', backgroundColor: selectedOre === 'iron' ? '#00ff41' : '#222', color: selectedOre === 'iron' ? '#000' : '#fff', border: '1px solid #00ff41', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                Iron ({ironOreCount})
              </button>
              <button 
                onClick={() => setSelectedOre(selectedOre === 'gold' ? null : 'gold')}
                style={{ padding: '6px 12px', backgroundColor: selectedOre === 'gold' ? '#ffea00' : '#222', color: selectedOre === 'gold' ? '#000' : '#fff', border: '1px solid #ffea00', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                Gold ({goldOreCount})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#ccc', fontSize: '14px' }}>Wood Fuel:</span>
              <span style={{ color: '#ffea00' }}>{woodAmount} / {woodCount}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={woodCount} 
              value={woodAmount} 
              onChange={(e) => setWoodAmount(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <BaseButton 
              label={woodAmount > 0 && selectedOre ? "SMELT (Coming Soon)" : "Select Ore & Fuel"} 
              disabled={!selectedOre || woodAmount <= 0} 
              onClick={() => show("Smelting feature is under construction!", "info")} 
            />
          </div>
        </div>

      </div>
    </BaseDialog>
  );
};

const ScarecrowSpot = ({ spotId, pos, offsetX, offsetY, isPlacing, isPlaced, expiryTime, onPlace, onExpire, onRemove }) => {
  const [frame, setFrame] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showDebug, setShowDebug] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');

  useEffect(() => {
    const handler = (e) => setShowDebug(e.detail);
    window.addEventListener('toggleDebugLabels', handler);
    return () => window.removeEventListener('toggleDebugLabels', handler);
  }, []);
  
  useEffect(() => {
    if (!isPlaced) return;
    const timer = setInterval(() => {
      setFrame(f => (f % 5) + 1);
    }, 200); // 5 frames, 200ms each
    return () => clearInterval(timer);
  }, [isPlaced]);

  useEffect(() => {
    if (!isPlaced || !expiryTime) return;
    
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      // Automatically clear old non-timer scarecrows for backward compatibility
      const exp = typeof expiryTime === 'number' ? expiryTime : now - 1; 
      const remaining = exp - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire(spotId);
      } else {
        setTimeLeft(remaining);
      }
    };
    
    tick(); // Initial call
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isPlaced, expiryTime, onExpire, spotId]);

  if (!isPlacing && !isPlaced) return null;

  // Fix CSS calc() bug by properly adding 'px' to raw numbers 
  // and adjust the offset to sit nicely between the dirt piles
  const leftVal = pos.left !== undefined ? (typeof pos.left === 'number' ? `${pos.left + offsetX}px` : `calc(${pos.left} + ${offsetX}px)`) : '0px';
  const topVal = pos.top !== undefined ? (typeof pos.top === 'number' ? `${pos.top + offsetY}px` : `calc(${pos.top} + ${offsetY}px)`) : '0px';

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    if (m > 0) return `${m}:${pad(s)}`;
    return `${s}s`;
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isPlacing && !isPlaced) {
          onPlace();
        } else if (isPlaced && onRemove) {
          onRemove();
        }
      }}
      style={{
        position: 'absolute',
        left: leftVal,
        top: topVal,
        width: '50px',
        height: '50px',
        zIndex: 9999, 
        cursor: 'pointer',
        border: isPlacing && !isPlaced ? '3px dashed white' : 'none',
        backgroundColor: isPlacing && !isPlaced ? 'rgba(255,255,255,0.4)' : 'transparent',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: isPlacing || isPlaced ? 'auto' : 'none',
      }}
    >
      {/* --- DEBUG: SPOT INDEX LABEL --- */}
      {showDebug && (isPlacing || isPlaced) && (
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '0px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: '#00ffff',
          border: '1px solid #00ffff',
          padding: '2px 6px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10001,
          pointerEvents: 'none'
        }}>
          Spot: {spotId}
        </div>
      )}
      {isPlaced && (
        <>
          <div style={{
            position: 'absolute',
            top: '-25px',
            color: '#00ff41',
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
            whiteSpace: 'nowrap',
            zIndex: 10000
          }}>
            {formatTime(timeLeft)}
          </div>
          <img 
            src={`/images/scarecrow/Scarecrow${frame}.png`} 
            alt="Scarecrow" 
            onError={(e) => { e.target.src = `/images/scarecrow/Scarecrow${frame}.jpg`; }}
            style={{ width: '200%', height: '200%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.8))' }}
          />
        </>
      )}
    </div>
  );
};

const LadybugSpot = ({ spotId, pos, offsetX, offsetY, isPlacing, isPlaced, expiryTime, onPlace, onExpire, onRemove }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [showDebug, setShowDebug] = useState(() => localStorage.getItem('show_debug_labels') !== 'false');

  useEffect(() => {
    const handler = (e) => setShowDebug(e.detail);
    window.addEventListener('toggleDebugLabels', handler);
    return () => window.removeEventListener('toggleDebugLabels', handler);
  }, []);

  useEffect(() => {
    if (!isPlaced || !expiryTime) return;
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof expiryTime === 'number' ? expiryTime : now - 1; 
      const remaining = exp - now;
      if (remaining <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire(spotId);
      } else {
        setTimeLeft(remaining);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isPlaced, expiryTime, onExpire, spotId]);

  if (!isPlacing && !isPlaced) return null;

  const leftVal = pos.left !== undefined ? (typeof pos.left === 'number' ? `${pos.left + offsetX}px` : `calc(${pos.left} + ${offsetX}px)`) : '0px';
  const topVal = pos.top !== undefined ? (typeof pos.top === 'number' ? `${pos.top + offsetY}px` : `calc(${pos.top} + ${offsetY}px)`) : '0px';

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    if (m > 0) return `${m}:${pad(s)}`;
    return `${s}s`;
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isPlacing && !isPlaced) {
          onPlace();
        } else if (isPlaced && onRemove) {
          onRemove();
        }
      }}
      style={{
        position: 'absolute',
        left: leftVal,
        top: topVal,
        width: '50px',
        height: '50px',
        zIndex: 9998, 
        cursor: 'pointer',
        border: isPlacing && !isPlaced ? '3px dashed #ff4444' : 'none',
        backgroundColor: isPlacing && !isPlaced ? 'rgba(255,68,68,0.3)' : 'transparent',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: isPlacing || isPlaced ? 'auto' : 'none',
      }}
    >
      {/* --- DEBUG: SPOT INDEX LABEL --- */}
      {showDebug && (isPlacing || isPlaced) && (
        <div style={{ position: 'absolute', top: '-25px', left: '0px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff4444', border: '1px solid #ff4444', padding: '2px 6px', fontSize: '14px', fontWeight: 'bold', zIndex: 10001, pointerEvents: 'none' }}>
          LSpot: {spotId}
        </div>
      )}
      {isPlaced && (
        <>
          <div style={{ position: 'absolute', top: '-25px', color: '#ff4444', fontWeight: 'bold', fontSize: '14px', textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black', whiteSpace: 'nowrap', zIndex: 10000 }}>
            {formatTime(timeLeft)}
          </div>
        </>
      )}
    </div>
  );
};

const SprinklerSpot = ({ spotId, pos, offsetX, offsetY, isPlacing, isPlaced, expiryTime, onPlace, onExpire, onRemove }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!isPlaced || !expiryTime) return;
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof expiryTime === 'number' ? expiryTime : now - 1; 
      const remaining = exp - now;
      if (remaining <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire(spotId);
      } else {
        setTimeLeft(remaining);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isPlaced, expiryTime, onExpire, spotId]);

  if (!isPlacing && !isPlaced) return null;

  const leftVal = pos.left !== undefined ? (typeof pos.left === 'number' ? `${pos.left + offsetX}px` : `calc(${pos.left} + ${offsetX}px)`) : '0px';
  const topVal = pos.top !== undefined ? (typeof pos.top === 'number' ? `${pos.top + offsetY}px` : `calc(${pos.top} + ${offsetY}px)`) : '0px';

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    if (m > 0) return `${m}:${pad(s)}`;
    return `${s}s`;
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isPlacing && !isPlaced) onPlace();
        else if (isPlaced && onRemove) onRemove();
      }}
      style={{
        position: 'absolute', left: leftVal, top: topVal, width: '50px', height: '50px',
        zIndex: 9997, cursor: 'pointer',
        border: isPlacing && !isPlaced ? '3px dashed #00bfff' : 'none',
        backgroundColor: isPlacing && !isPlaced ? 'rgba(0,191,255,0.3)' : 'transparent',
        borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        pointerEvents: isPlacing || isPlaced ? 'auto' : 'none',
      }}
    >
      {isPlaced && (
        <>
          <div style={{ position: 'absolute', top: '-40px', color: '#00bfff', fontWeight: 'bold', fontSize: '14px', textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black', whiteSpace: 'nowrap', zIndex: 10000 }}>
            {formatTime(timeLeft)}
          </div>
          <img src="/images/items/watersprinkler.png" alt="Sprinkler" style={{ width: '120%', height: '120%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.8))' }} />
        </>
      )}
    </div>
  );
};

const UmbrellaSpot = ({ spotId, pos, offsetX, offsetY, isPlacing, isPlaced, expiryTime, onPlace, onExpire, onRemove }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!isPlaced || !expiryTime) return;
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof expiryTime === 'number' ? expiryTime : now - 1; 
      const remaining = exp - now;
      if (remaining <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire(spotId);
      } else {
        setTimeLeft(remaining);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isPlaced, expiryTime, onExpire, spotId]);

  if (!isPlacing && !isPlaced) return null;

  const leftVal = pos.left !== undefined ? (typeof pos.left === 'number' ? `${pos.left + offsetX}px` : `calc(${pos.left} + ${offsetX}px)`) : '0px';
  const topVal = pos.top !== undefined ? (typeof pos.top === 'number' ? `${pos.top + offsetY}px` : `calc(${pos.top} + ${offsetY}px)`) : '0px';

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    if (m > 0) return `${m}:${pad(s)}`;
    return `${s}s`;
  };

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isPlacing && !isPlaced) onPlace();
        else if (isPlaced && onRemove) onRemove();
      }}
      style={{
        position: 'absolute', left: leftVal, top: topVal, width: '50px', height: '50px',
        zIndex: 9996, cursor: 'pointer',
        border: isPlacing && !isPlaced ? '3px dashed #ff00ff' : 'none',
        backgroundColor: isPlacing && !isPlaced ? 'rgba(255,0,255,0.3)' : 'transparent',
        borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        pointerEvents: isPlacing || isPlaced ? 'auto' : 'none',
      }}
    >
      {isPlaced && (
        <>
          <div style={{ position: 'absolute', top: '-40px', color: '#ff00ff', fontWeight: 'bold', fontSize: '14px', textShadow: '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black', whiteSpace: 'nowrap', zIndex: 10000 }}>
            {formatTime(timeLeft)}
          </div>
          <img src="/images/items/umbrella.png" alt="Umbrella" style={{ width: '120%', height: '120%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.8))' }} />
        </>
      )}
    </div>
  );
};

const Farm = ({ isFarmMenu, setIsFarmMenu }) => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const { seeds: currentSeeds, refetch: refetchSeeds, all: allItems, refetch } = useItems();
  const {
    plantBatch,
    harvestMany,
    getMaxPlots,
    getUserCrops,
    applyGrowthElixir,
    applyPesticide,
    applyFertilizer,
    destroyCrop,
    loading: farmingLoading,
  } = useFarming();
  const { show } = useNotification();
  const [isPlanting, setIsPlanting] = useState(true);
  const [isSelectCropDialog, setIsSelectCropDialog] = useState(false);
  const [cropArray, setCropArray] = useState(() => new CropItemArrayClass(30));
  const [previewCropArray, setPreviewCropArray] = useState(
    () => new CropItemArrayClass(30)
  );
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [, setGrowthTimer] = useState(null);
  const [maxPlots, setMaxPlots] = useState(0);
  const [previewUpdateKey, setPreviewUpdateKey] = useState(0);
  const [userCropsLoaded, setUserCropsLoaded] = useState(false);
  const [usedSeedsInPreview, setUsedSeedsInPreview] = useState({});
  const plantConfirmAudioRef = useRef(null);
  const harvestConfirmAudioRef = useRef(null);
  const bugsRef = useRef({}); // Tracks bugs currently on the farm
  const crowsRef = useRef({}); // Tracks crows currently on the farm
  const scarecrowsRef = useRef(JSON.parse(localStorage.getItem('sandbox_scarecrows') || '{}'));
  const ladybugsRef = useRef(JSON.parse(localStorage.getItem('sandbox_ladybugs') || '{}'));
  const sprinklersRef = useRef(JSON.parse(localStorage.getItem('sandbox_sprinklers') || '{}'));
  const umbrellasRef = useRef(JSON.parse(localStorage.getItem('sandbox_umbrellas') || '{}'));
  const ratsRef = useRef({});
  
  const [isUsingPotion, setIsUsingPotion] = useState(false);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [isPlacingScarecrow, setIsPlacingScarecrow] = useState(false);
  const [isPlacingLadybug, setIsPlacingLadybug] = useState(false);
  const [isPlacingSprinkler, setIsPlacingSprinkler] = useState(false);
  const [isPlacingUmbrella, setIsPlacingUmbrella] = useState(false);
  const [scarecrows, setScarecrows] = useState(scarecrowsRef.current);
  const [ladybugs, setLadybugs] = useState(ladybugsRef.current);
  const [sprinklers, setSprinklers] = useState(sprinklersRef.current);
  const [umbrellas, setUmbrellas] = useState(umbrellasRef.current);
  
  const autoSpawnRef = useRef(localStorage.getItem('auto_spawn_enabled') !== 'false');
  const [showWeightContest, setShowWeightContest] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCraftingDialog, setShowCraftingDialog] = useState(false);
  const [showSmithingDialog, setShowSmithingDialog] = useState(false);
  const [simulatedDay, setSimulatedDay] = useState(() => {
    const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    return estDate.getDay();
  });
  const [simulatedDate, setSimulatedDate] = useState(() => {
    const estDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    return estDate.getDate();
  });
  const simulatedDateRef = useRef(simulatedDate);
  useEffect(() => {
    simulatedDateRef.current = simulatedDate;
  }, [simulatedDate]);
  
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
    let targetData = allItems.find((item) => item.id === id);
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
  
  const currentWeather = getWeatherForDay(simulatedDate);
  const isRaining = currentWeather === '⚡' || currentWeather === '🌧️';
  const isLightning = currentWeather === '⚡';
  
  const isForest = new URLSearchParams(window.location.search).get('scene') === 'forest';

  // Plot Preparation State (0: Red X, 1: Hole, 2: Hole+Fish, 3: Dirt Pile)
  const [plotPrep, setPlotPrep] = useState(() => JSON.parse(localStorage.getItem('sandbox_plot_prep') || '{}'));
  const [prepDialogTarget, setPrepDialogTarget] = useState(null);

  // Watering State
  const waterStateRef = useRef(JSON.parse(localStorage.getItem('sandbox_water_state') || '{}'));
  const [isWatering, setIsWatering] = useState(false);
  const [isDigging, setIsDigging] = useState(false);
  const [isHoeing, setIsHoeing] = useState(false);
  const [waterEffects, setWaterEffects] = useState([]);

  // Forest Lock Timer
  const [forestLockTime, setForestLockTime] = useState(0);
  useEffect(() => {
    const checkLock = () => {
      const lv = localStorage.getItem('forest_last_visited');
      if (lv) {
        const el = Date.now() - parseInt(lv, 10);
        const th = 2 * 60 * 60 * 1000; // 2 hours
        if (el < th) setForestLockTime(th - el);
        else setForestLockTime(0);
      } else setForestLockTime(0);
    };
    
    checkLock();
    const timer = setInterval(checkLock, 1000);

    window.cml = (cmd) => {
      if (cmd === 'forest' || cmd === 'forset') {
        localStorage.removeItem('forest_last_visited');
        setForestLockTime(0);
      }
    };

    return () => {
      clearInterval(timer);
      delete window.cml;
    };
  }, []);

  const updatePlotPrep = useCallback((index, prepData) => {
    setPlotPrep(prev => {
      const next = { ...prev, [index]: prepData };
      localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
      return next;
    });
  }, [setPlotPrep]);

  const handleRemoveScarecrow = useCallback((spotId) => {
    setScarecrows((prev) => {
      const newScarecrows = { ...prev };
      delete newScarecrows[spotId];
      scarecrowsRef.current = newScarecrows;
      localStorage.setItem('sandbox_scarecrows', JSON.stringify(newScarecrows));
      return newScarecrows;
    });
  }, []);

  const handleRemoveLadybug = useCallback((spotId) => {
    setLadybugs((prev) => {
      const newLadybugs = { ...prev };
      delete newLadybugs[spotId];
      ladybugsRef.current = newLadybugs;
      localStorage.setItem('sandbox_ladybugs', JSON.stringify(newLadybugs));
      return newLadybugs;
    });
  }, []);

  const handleRemoveSprinkler = useCallback((spotId) => {
    setSprinklers((prev) => {
      const next = { ...prev };
      delete next[spotId];
      sprinklersRef.current = next;
      localStorage.setItem('sandbox_sprinklers', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleRemoveUmbrella = useCallback((spotId) => {
    setUmbrellas((prev) => {
      const next = { ...prev };
      delete next[spotId];
      umbrellasRef.current = next;
      localStorage.setItem('sandbox_umbrellas', JSON.stringify(next));
      return next;
    });
  }, []);

  const loadCropsFromContract = useCallback(
    async () => {
      try {
        setUserCropsLoaded(false);
        // Get all user crops in a single call
        const crops = await getUserCrops();

        // Collect unique seedIds to fetch growth times once per seed type
        const uniqueSeedIds = Array.from(
          new Set(
            crops
              .map((crop) => crop.seedId)
              .filter((sid) => sid && sid !== 0n)
          )
        );

        const growthTimeCache = new Map();
        
        // WEATHER BUFFS/NERFS
        const weatherEmoji = getWeatherForDay(simulatedDate);
        let weatherMultiplier = 1;
        if (weatherEmoji === '☀️') weatherMultiplier = 1.10; // 10% faster
        else if (weatherEmoji === '🌧️' || weatherEmoji === '⚡') weatherMultiplier = 0.95; // 5% slower

        let baseSpeedMultiplier = Number(localStorage.getItem('sandbox_crop_speed') || 100) / 100;
        if (isNaN(baseSpeedMultiplier) || baseSpeedMultiplier <= 0) baseSpeedMultiplier = 1;
        const currentSpeedMultiplier = baseSpeedMultiplier * weatherMultiplier;

        await Promise.all(
          uniqueSeedIds.map(async (sid) => {
            const baseGt = getGrowthTime(sid);
            const gt = Math.max(1, Math.floor(baseGt / currentSpeedMultiplier));
            const normalGt = Math.max(1, Math.floor(baseGt / baseSpeedMultiplier));
            growthTimeCache.set(sid.toString(), { gt, normalGt });
          })
        );

        const nowSec = Math.floor(Date.now() / 1000);
        const newCropArray = new CropItemArrayClass(30);
        for (const crop of crops) {
          if (crop.seedId && crop.seedId !== 0n) {
            const item = newCropArray.getItem(crop.plotNumber);
            if (item) {
              const seedIdBig = crop.seedId;
              item.seedId = seedIdBig;
              const endTime = Number(crop.endTime?.toString?.() || crop.endTime || 0);
              const growthTimeObj = growthTimeCache.get(seedIdBig.toString());
              const growthTime = growthTimeObj ? growthTimeObj.gt : 60;
              
              // Calculate plantedAt based on original growth time and current endTime
              // The endTime might be modified by Growth Elixir, so we need to account for that
              const originalEndTime = Math.floor((item.plantedAt || 0) / 1000) + growthTime;
              const timeDifference = originalEndTime - endTime;
              
              // Adjust plantedAt and record Growth Elixir application if any
              const originalPlantedAt = (endTime - growthTime) * 1000;
              item.contractPlantedAt = isNaN(originalPlantedAt) ? Date.now() : originalPlantedAt;
              let wState = waterStateRef.current[crop.plotNumber];
              let pausedMs = (wState && !isNaN(wState.pausedMs)) ? wState.pausedMs : 0;
              item.plantedAt = item.contractPlantedAt + pausedMs;
              item.growthElixirApplied = timeDifference > 0;
              
              item.growthTime = growthTime;
              const adjustedEndTime = Math.floor(item.plantedAt / 1000) + growthTime;
              const isReady = adjustedEndTime <= nowSec;
              item.growStatus = isReady ? 2 : 1;
              
              // Store potion effect multipliers and growth elixir status for display
              item.produceMultiplierX1000 = crop.produceMultiplierX1000 || 1000;
              item.tokenMultiplierX1000 = crop.tokenMultiplierX1000 || 1000;
              item.growthElixirApplied = !!crop.growthElixirApplied;

              // Re-inject bugs/crows so they don't blink or reset animations on reload
              item.bugCountdown = bugsRef.current[crop.plotNumber];
              item.crowCountdown = crowsRef.current[crop.plotNumber];
            }
          } else {
            newCropArray.removeCropAt(crop.plotNumber);
          }
        }

        // Force state updates to trigger re-renders
        setCropArray(newCropArray);
        setPreviewCropArray(newCropArray);
        setUserCropsLoaded(true);
        
        // Force a re-render by updating the preview key
        setPreviewUpdateKey(prev => prev + 1);
        
        // Clear any stale selection state when loading crops
        setSelectedIndexes([]);
        
      } catch (error) {
        const { message } = handleContractError(error, 'loading crops');
        console.error("Failed to load crops from contract:", message);
        const emptyArray = new CropItemArrayClass(30);
        setCropArray(emptyArray);
        setPreviewCropArray(emptyArray);
        setUserCropsLoaded(true);
      }
    },
    [getUserCrops, simulatedDate]
  );

  const handleForceSpawnBug = () => {
    const validPlots = [];
    const nowSec = Math.floor(Date.now() / 1000);

    for (let i = 0; i < 30; i++) {
      const item = cropArray.getItem(i);
      if (item && item.seedId && item.seedId !== 0n && bugsRef.current[i] === undefined) {
        let isProtected = false;
        for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
          if (ladybugsRef.current[spotId] > nowSec && protectedPlots.includes(i)) {
            isProtected = true;
            break;
          }
        }
        if (!isProtected) validPlots.push(i);
      }
    }
    if (validPlots.length > 0) {
      const target = validPlots[Math.floor(Math.random() * validPlots.length)];
      bugsRef.current[target] = 60; // 60s timer
      show(`Bug spawned on plot ${target}!`, "warning");
    } else {
      show("No available crops for a bug!", "info");
    }
  };

  const handleForceSpawnCrow = () => {
    const validPlots = [];
    const nowSec = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < 30; i++) {
      const item = cropArray.getItem(i);
      if (item && item.seedId && item.seedId !== 0n && crowsRef.current[i] === undefined) {
        let isProtected = false;
        for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
          if (scarecrowsRef.current[spotId] > nowSec && protectedPlots.includes(i)) {
            isProtected = true;
            break;
          }
        }
        if (!isProtected) validPlots.push(i);
      }
    }

    if (validPlots.length > 0) {
      const target = validPlots[Math.floor(Math.random() * validPlots.length)];
      crowsRef.current[target] = 30; // 30s timer
      show(`Crow spawned on plot ${target}!`, "warning");
    } else {
      show("No unprotected crops available for a crow!", "info");
    }
  };

  useEffect(() => {
    const onAdminDeleteSpot = (e) => {
      if (e.detail.id !== null) handleRemoveScarecrow(e.detail.id);
      else { setScarecrows({}); scarecrowsRef.current = {}; localStorage.setItem('sandbox_scarecrows', JSON.stringify({})); }
    };
    const onAdminDeleteLadybug = (e) => {
      if (e.detail.id !== null) handleRemoveLadybug(e.detail.id);
      else { setLadybugs({}); ladybugsRef.current = {}; localStorage.setItem('sandbox_ladybugs', JSON.stringify({})); }
    };
    const onAdminDeleteSprinkler = (e) => {
      if (e.detail.id !== null) handleRemoveSprinkler(e.detail.id);
      else { setSprinklers({}); sprinklersRef.current = {}; localStorage.setItem('sandbox_sprinklers', JSON.stringify({})); }
    };
    const onAdminDeleteUmbrella = (e) => {
      if (e.detail.id !== null) handleRemoveUmbrella(e.detail.id);
      else { setUmbrellas({}); umbrellasRef.current = {}; localStorage.setItem('sandbox_umbrellas', JSON.stringify({})); }
    };
    const onAdminClearCrops = () => {
      const emptyCrops = new Array(30).fill(null).map(() => ({ id: 0, endTime: 0, prodMultiplier: 1000, tokenMultiplier: 1000, growthElixir: 0 }));
      localStorage.setItem('sandbox_crops', JSON.stringify(emptyCrops));
      const emptyArray = new CropItemArrayClass(30);
      setCropArray(emptyArray);
      setPreviewCropArray(emptyArray);
      
      setPlotPrep({});
      localStorage.removeItem('sandbox_plot_prep');
      window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: {} }));
      
      waterStateRef.current = {};
      localStorage.setItem('sandbox_water_state', JSON.stringify({}));

      setPreviewUpdateKey(prev => prev + 1);
    };
    const onAdminClearPests = () => {
      bugsRef.current = {};
      crowsRef.current = {};
      ratsRef.current = {};
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        for(let i = 0; i < 30; i++) {
           const item = newArr.getItem(i);
           if(item) { 
             item.bugCountdown = undefined; 
             item.crowCountdown = undefined; 
             item.ratCountdown = undefined; 
           }
        }
        return newArr;
      });
    };
    const onChangeSimulatedDate = (e) => {
      setSimulatedDay(e.detail.day);
      setSimulatedDate(e.detail.date);
    };
    const onToggleAutoSpawn = (e) => autoSpawnRef.current = e.detail;
    const onResetPlotPrep = (e) => updatePlotPrep(e.detail.plotIndex, { status: 0 });

    window.addEventListener('forceSpawnBug', handleForceSpawnBug);
    window.addEventListener('forceSpawnCrow', handleForceSpawnCrow);
    window.addEventListener('adminDeleteSpot', onAdminDeleteSpot);
    window.addEventListener('adminDeleteLadybug', onAdminDeleteLadybug);
    window.addEventListener('adminDeleteSprinkler', onAdminDeleteSprinkler);
    window.addEventListener('adminDeleteUmbrella', onAdminDeleteUmbrella);
    window.addEventListener('adminClearCrops', onAdminClearCrops);
    window.addEventListener('adminClearPests', onAdminClearPests);
    window.addEventListener('changeSimulatedDate', onChangeSimulatedDate);
    window.addEventListener('toggleAutoSpawn', onToggleAutoSpawn);
    window.addEventListener('resetPlotPrep', onResetPlotPrep);

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

    window.addEventListener('changeWeightContest', onChangeContest);

    return () => {
      window.removeEventListener('forceSpawnBug', handleForceSpawnBug);
      window.removeEventListener('forceSpawnCrow', handleForceSpawnCrow);
      window.removeEventListener('adminDeleteSpot', onAdminDeleteSpot);
      window.removeEventListener('adminDeleteLadybug', onAdminDeleteLadybug);
      window.removeEventListener('adminDeleteSprinkler', onAdminDeleteSprinkler);
      window.removeEventListener('adminDeleteUmbrella', onAdminDeleteUmbrella);
      window.removeEventListener('adminClearCrops', onAdminClearCrops);
      window.removeEventListener('adminClearPests', onAdminClearPests);
      window.removeEventListener('changeSimulatedDate', onChangeSimulatedDate);
      window.removeEventListener('toggleAutoSpawn', onToggleAutoSpawn);
      window.removeEventListener('changeWeightContest', onChangeContest);
      window.removeEventListener('resetPlotPrep', onResetPlotPrep);
    };
  }, [handleRemoveScarecrow, handleRemoveLadybug, handleRemoveSprinkler, handleRemoveUmbrella, loadCropsFromContract, cropArray, updatePlotPrep]);

  useEffect(() => {
    if (localStorage.getItem("pendingScarecrowPlacement") === "true") {
      localStorage.removeItem("pendingScarecrowPlacement");
      setIsPlacingScarecrow(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active so animations don't restart
      setTimeout(() => show("Select a white border to place your scarecrow!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingLadybugPlacement") === "true") {
      localStorage.removeItem("pendingLadybugPlacement");
      setIsPlacingLadybug(true);
      setIsPlacingScarecrow(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active
      setTimeout(() => show("Select a red border to place your ladybug!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingSprinklerPlacement") === "true") {
      localStorage.removeItem("pendingSprinklerPlacement");
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      setTimeout(() => show("Select a blue border to place your sprinkler!", "info"), 500);
    }
    
    if (localStorage.getItem("pendingUmbrellaPlacement") === "true") {
      localStorage.removeItem("pendingUmbrellaPlacement");
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      setTimeout(() => show("Select a purple border to place your umbrella!", "info"), 500);
    }
  }, [show]);

  useEffect(() => {
    setPreviewUpdateKey(prev => prev + 1);
  }, [cropArray]);

  // Listen for potion usage events from inventory
  useEffect(() => {
    const handleStartPotionUsage = (event) => {
      const { id, name } = event.detail;
      if (id === ID_POTION_ITEMS.SCARECROW) {
        setIsPlacingScarecrow(true);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false); // Keep farm active so animations don't restart
        return;
      }
      if (id === ID_POTION_ITEMS.LADYBUG) {
        setIsPlacingLadybug(true);
        setIsPlacingScarecrow(false);
        setIsPlacingSprinkler(false);
        setIsPlacingUmbrella(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false); // Keep farm active
        return;
      }
      if (id === 9998) {
        setIsPlacingSprinkler(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingUmbrella(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      if (id === 9999) {
        setIsPlacingUmbrella(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      
      setSelectedPotion({ id, name });
      setIsUsingPotion(true);
      setIsPlanting(false);
      setIsFarmMenu(true);
    };

    window.addEventListener('startPotionUsage', handleStartPotionUsage);
    
    return () => {
      window.removeEventListener('startPotionUsage', handleStartPotionUsage);
    };
  }, []);

  const getAvailableSeeds = useCallback(() => {
    return currentSeeds
      .map((seed) => ({
        ...seed,
        count: Math.max(0, seed.count - (usedSeedsInPreview[seed.id] || 0)),
      }))
      .filter((seed) => seed.count > 0);
  }, [currentSeeds, usedSeedsInPreview]);

  const playPlantConfirmSound = useCallback(() => {
    if (!plantConfirmAudioRef.current) {
      plantConfirmAudioRef.current = new Audio("/sounds/FinalPlantConfirmButton.wav");
      plantConfirmAudioRef.current.preload = "auto";
    }
    const audio = plantConfirmAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  const playHarvestConfirmSound = useCallback(() => {
    if (!harvestConfirmAudioRef.current) {
      harvestConfirmAudioRef.current = new Audio("/sounds/FinalHarvestConfirmButton.wav");
      harvestConfirmAudioRef.current.preload = "auto";
    }
    const audio = harvestConfirmAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  useEffect(() => {
    if (waterEffects.length > 0) {
      const timer = setTimeout(() => {
        setWaterEffects(prev => prev.filter(e => Date.now() - e.time < 1000));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [waterEffects]);

  const playWaterSound = useCallback(() => {
    const audio = new Audio("/sounds/water.mp3");
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setMaxPlots(await getMaxPlots());
        await loadCropsFromContract();
      } catch (error) {
        const { message } = handleContractError(error, 'loading user data');
        console.error("Failed to load user data:", message);
      }
    };

    loadUserData();
  }, [loadCropsFromContract, getMaxPlots]);

  // Listen for crop refresh events (after planting)
  useEffect(() => {
    const handleCropsRefresh = async (event) => {
      console.log('Crops refresh event received:', event.detail);
      await loadCropsFromContract();
    };

    window.addEventListener('cropsRefreshed', handleCropsRefresh);
    
    return () => {
      window.removeEventListener('cropsRefreshed', handleCropsRefresh);
    };
  }, [loadCropsFromContract]);

  // Listen for bug interactions and destructions
  useEffect(() => {
    const handleTriggerDestroy = async (event) => {
      const { plotIndex } = event.detail;
      if (destroyCrop) {
        await destroyCrop(plotIndex);
        show(`Oh no! A bug ate your crop at plot ${plotIndex + 1}!`, "error");
        await loadCropsFromContract();
        setPreviewUpdateKey(prev => prev + 1);
      }
    };

    const handleSquashBug = (event) => {
      const { plotIndex } = event.detail;
      delete bugsRef.current[plotIndex];
      
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) item.bugCountdown = undefined;
        return newArr;
      });
      show("Bug squashed!", "success");
    };

    const handleScareCrow = (event) => {
      const { plotIndex } = event.detail;
      delete crowsRef.current[plotIndex];
      
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) item.crowCountdown = undefined;
        return newArr;
      });
      show("Crow scared away!", "success");
    };

    const handleScareRat = (event) => {
      const { plotIndex } = event.detail;
      delete ratsRef.current[plotIndex];
      
      setCropArray(prev => {
        const newArr = new CropItemArrayClass(30);
        newArr.copyFrom(prev);
        const item = newArr.getItem(plotIndex);
        if (item) item.ratCountdown = undefined;
        return newArr;
      });
      show("Rat scared away!", "success");
    };

    window.addEventListener('triggerDestroyCrop', handleTriggerDestroy);
    window.addEventListener('squashBug', handleSquashBug);
    window.addEventListener('scareCrow', handleScareCrow);
    window.addEventListener('scareRat', handleScareRat);
    
    return () => {
      window.removeEventListener('triggerDestroyCrop', handleTriggerDestroy);
      window.removeEventListener('squashBug', handleSquashBug);
      window.removeEventListener('scareCrow', handleScareCrow);
      window.removeEventListener('scareRat', handleScareRat);
    };
  }, [destroyCrop, loadCropsFromContract, show]);

  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update growth when not in farm menu to prevent flickering during harvest selection
      if (!isFarmMenu) {
        // Lightning mechanic
        const currentWeather = getWeatherForDay(simulatedDateRef.current);
        const isRainingNow = currentWeather === '⚡' || currentWeather === '🌧️';
        if (currentWeather === '⚡') {
          // ~5% chance every 1.5 hours (5400 seconds)
          if (Math.random() < 0.00001) {
            const sKeys = Object.keys(scarecrowsRef.current);
            const lKeys = Object.keys(ladybugsRef.current);
            const total = sKeys.length + lKeys.length;
            if (total > 0) {
              const idx = Math.floor(Math.random() * total);
              if (idx < sKeys.length) {
                handleRemoveScarecrow(sKeys[idx]);
                show(`⚡ Lightning struck and destroyed a scarecrow!`, "error");
              } else {
                handleRemoveLadybug(lKeys[idx - sKeys.length]);
                show(`⚡ Lightning struck and destroyed a ladybug!`, "error");
              }
            }
          }
        }

        // Process bugs safely
        const currentBugs = { ...bugsRef.current };
        const currentCrows = { ...crowsRef.current };
        const currentRats = { ...ratsRef.current };
        let cropsToDestroy = [];
        let pestsChanged = false;
        
        for (const idx in currentBugs) {
          currentBugs[idx] -= 1;
          pestsChanged = true;
          if (currentBugs[idx] <= 0) {
            cropsToDestroy.push(Number(idx));
            delete currentBugs[idx];
          }
        }
        for (const idx in currentCrows) {
          currentCrows[idx] -= 1;
          pestsChanged = true;
          if (currentCrows[idx] <= 0) {
            if (!cropsToDestroy.includes(Number(idx))) {
              cropsToDestroy.push(Number(idx));
            }
            delete currentCrows[idx];
          }
        }
        for (const idx in currentRats) {
          currentRats[idx] -= 1;
          pestsChanged = true;
          if (currentRats[idx] <= 0) {
            if (!cropsToDestroy.includes(Number(idx))) {
              cropsToDestroy.push(Number(idx));
            }
            delete currentRats[idx];
          }
        }
        bugsRef.current = currentBugs;
        crowsRef.current = currentCrows;
        ratsRef.current = currentRats;

        const currentWaterState = waterStateRef.current;
        const now = Date.now();

        setCropArray((prevCropArray) => {
          let hasChanges = cropsToDestroy.length > 0 || pestsChanged;
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          
          const oldStatuses = [];
          for (let i = 0; i < 30; i++) {
             const item = prevCropArray.getItem(i);
             oldStatuses.push(item ? item.growStatus : null);
          }
          newCropArray.updateGrowth();
          for (let i = 0; i < 30; i++) {
             const newItem = newCropArray.getItem(i);
             if (newItem && newItem.growStatus !== oldStatuses[i]) {
                hasChanges = true;
             }
          }

          if (cropsToDestroy.length > 0) {
            cropsToDestroy.forEach(idx => {
              window.dispatchEvent(new CustomEvent('triggerDestroyCrop', { detail: { plotIndex: idx } }));
              // Instantly clear the crop on UI before the backend syncs
              const item = newCropArray.getItem(idx);
              if (item) {
                  item.seedId = 0n;
                  item.bugCountdown = undefined;
                  item.crowCountdown = undefined;
                  item.ratCountdown = undefined;
              }
              delete currentWaterState[idx];
            });
            localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
          }
          
          // Randomly spawn pests
          for (let i = 0; i < 30; i++) {
            const item = newCropArray.getItem(i);
            if (item && item.seedId && item.seedId !== 0n && !cropsToDestroy.includes(i)) {
              let wState = currentWaterState[i];
              if (!wState) {
                wState = { needsInitial: true, needsMid: true, pausedMs: 0, contractPlantedAt: item.contractPlantedAt || item.plantedAt };
                currentWaterState[i] = wState;
                localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
                hasChanges = true;
              }
              
              if (item.contractPlantedAt !== undefined && !isNaN(item.contractPlantedAt)) {
                wState.contractPlantedAt = item.contractPlantedAt;
                delete item.contractPlantedAt;
                hasChanges = true;
              } else if (wState.contractPlantedAt === undefined || isNaN(wState.contractPlantedAt)) {
                wState.contractPlantedAt = item.plantedAt || now;
                hasChanges = true;
              }
              if (isNaN(wState.pausedMs)) {
                 wState.pausedMs = 0;
                 hasChanges = true;
              }

              let basePlantedAt = wState.contractPlantedAt;
              let isPaused = false;

              if (wState.needsInitial) {
                isPaused = true;
                wState.pausedMs = now - basePlantedAt;
                hasChanges = true;
              } else if (wState.needsMid) {
                const elapsed = now - (basePlantedAt + wState.pausedMs);
                const halfTime = (item.growthTime * 1000) / 2;
                if (elapsed >= halfTime) {
                  isPaused = true;
                  wState.pausedMs = now - halfTime - basePlantedAt;
                  hasChanges = true;
                }
              }

              if (item.needsWater !== isPaused) {
                 item.needsWater = isPaused;
                 hasChanges = true;
              }
              const newPlantedAt = basePlantedAt + wState.pausedMs;
              if (item.plantedAt !== newPlantedAt) {
                 item.plantedAt = newPlantedAt;
                 hasChanges = true;
              }

              // Pest spawning logic
              const nowSec = Math.floor(Date.now() / 1000);
              
              let isProtectedFromCrows = false;
              let isProtectedFromBugs = false;
              let hasSprinkler = false;
              let hasUmbrella = false;
              for (const [spotId, protectedPlots] of Object.entries(protectedPlotsBySpot)) {
                if (protectedPlots.includes(i)) {
                  if (scarecrowsRef.current[spotId] > nowSec) isProtectedFromCrows = true;
                  if (ladybugsRef.current[spotId] > nowSec) isProtectedFromBugs = true;
                  if (sprinklersRef.current[spotId] > nowSec) hasSprinkler = true;
                  if (umbrellasRef.current[spotId] > nowSec) hasUmbrella = true;
                }
              }

              if (hasSprinkler || isRainingNow) {
                if (wState.needsInitial || wState.needsMid) {
                   wState.needsInitial = false;
                   wState.needsMid = false;
                   hasChanges = true;
                   localStorage.setItem('sandbox_water_state', JSON.stringify(currentWaterState));
                }
              }

              // Instantly clear existing crows if a scarecrow was just placed to protect this plot
              if (isProtectedFromCrows && crowsRef.current[i] !== undefined) {
                delete crowsRef.current[i];
                item.crowCountdown = undefined;
                hasChanges = true;
              }

              // Instantly clear existing bugs if a ladybug was just placed
              if (isProtectedFromBugs && bugsRef.current[i] !== undefined) {
                delete bugsRef.current[i];
                item.bugCountdown = undefined;
                hasChanges = true;
              }

              if (autoSpawnRef.current && bugsRef.current[i] === undefined && crowsRef.current[i] === undefined) {
                const roll = Math.random();
                if (roll < 0.005) { // 0.5% chance per second for a crow
                  if (!isProtectedFromCrows) {
                    crowsRef.current[i] = 30; // 30 seconds to click
                    item.crowCountdown = 30;
                    hasChanges = true;
                  }
                } else if (roll < 0.015) { // 1% chance per second for a bug
                  bugsRef.current[i] = 60; // 60 seconds to click
                  item.bugCountdown = 60;
                  hasChanges = true;
                }
              }
              if (autoSpawnRef.current && Object.keys(ratsRef.current).length === 0 && Math.random() < 0.001) {
                 ratsRef.current[i] = 15;
                 item.ratCountdown = 15;
                 hasChanges = true;
              }
              
              if (item.bugCountdown !== bugsRef.current[i] || item.crowCountdown !== crowsRef.current[i] || item.ratCountdown !== ratsRef.current[i]) {
                 item.bugCountdown = bugsRef.current[i];
                 item.crowCountdown = crowsRef.current[i];
                 item.ratCountdown = ratsRef.current[i];
                 hasChanges = true;
              }
            } else {
              // Clean up if a crop was harvested legitimately
              if (bugsRef.current[i] !== undefined) {
                delete bugsRef.current[i];
                hasChanges = true;
              }
              if (crowsRef.current[i] !== undefined) {
                delete crowsRef.current[i];
                hasChanges = true;
              }
              if (ratsRef.current[i] !== undefined) {
                delete ratsRef.current[i];
                hasChanges = true;
              }
            }
          }
          return hasChanges ? newCropArray : prevCropArray;
        });
      }

      // Always update preview array growth, but only if we're in farm menu
      if (isFarmMenu) {
        setPreviewCropArray((prevPreviewCropArray) => {
          let hasChanges = false;
          const newPreviewCropArray = new CropItemArrayClass(30);
          newPreviewCropArray.copyFrom(prevPreviewCropArray);

          const oldStatuses = [];
          for (let i = 0; i < 30; i++) {
             const item = prevPreviewCropArray.getItem(i);
             oldStatuses.push(item ? item.growStatus : null);
          }
          newPreviewCropArray.updateGrowth();
          for (let i = 0; i < 30; i++) {
             const newItem = newPreviewCropArray.getItem(i);
             if (newItem && newItem.growStatus !== oldStatuses[i]) {
                hasChanges = true;
             }
          }

          // Sync preview array plantedAt with water state to pause preview correctly
          const currentWaterState = waterStateRef.current;
          for (let i = 0; i < 30; i++) {
            const item = newPreviewCropArray.getItem(i);
            if (item && item.seedId && item.seedId !== 0n) {
              const wState = currentWaterState[i];
              if (wState && wState.contractPlantedAt !== undefined && !isNaN(wState.contractPlantedAt)) {
                let pausedMs = isNaN(wState.pausedMs) ? 0 : wState.pausedMs;
                const newPlantedAt = wState.contractPlantedAt + pausedMs;
                if (item.plantedAt !== newPlantedAt) {
                   item.plantedAt = newPlantedAt;
                   hasChanges = true;
                }
                const isPaused = wState.needsInitial || (wState.needsMid && (Date.now() - item.plantedAt) >= (item.growthTime * 1000) / 2);
                if (item.needsWater !== isPaused) {
                   item.needsWater = isPaused;
                   hasChanges = true;
                }
              }
              
              if (item.bugCountdown !== bugsRef.current[i]) { item.bugCountdown = bugsRef.current[i]; hasChanges = true; }
              if (item.crowCountdown !== crowsRef.current[i]) { item.crowCountdown = crowsRef.current[i]; hasChanges = true; }
              if (item.ratCountdown !== ratsRef.current[i]) { item.ratCountdown = ratsRef.current[i]; hasChanges = true; }
            }
          }

          return hasChanges ? newPreviewCropArray : prevPreviewCropArray;
        });
      }
    }, 1000); // Update every second

    setGrowthTimer(interval);
    return () => clearInterval(interval);
  }, [isFarmMenu]); // Add isFarmMenu as dependency

  const startPlanting = () => {
    // Check if userCrops are loaded before allowing planting mode
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (!isFarmMenu) {
      setPreviewCropArray(cropArray);
      // Reset used seeds tracking when starting planting
      setUsedSeedsInPreview({});
    }
    setIsFarmMenu(true);
    setIsPlanting(true);
  };

  // Batch plant function - plant best seeds in all empty slots automatically
  const plantAll = useCallback(async () => {

    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    // Ensure farm menu is open to show preview
    if (!isFarmMenu) {
      setIsFarmMenu(true);
      setIsPlanting(true);
      // Reset used seeds tracking when opening farm menu
      setUsedSeedsInPreview({});
    }

    // Check if there are any empty plots available
    const occupiedPlots = [];
    const emptyPlotNumbers = [];
    for (let i = 0; i < maxPlots; i++) {
      const item = cropArray.getItem(i);
      if (item && (item.seedId === null || item.seedId === undefined || item.seedId === 0n)) {
        if (plotPrep[i]?.status === 3) {
          emptyPlotNumbers.push(i);
        }
      } else if (item && item.seedId) {
        occupiedPlots.push({
          plot: i,
          seedId: item.seedId,
          status: item.growStatus,
        });
      }
    }

    if (emptyPlotNumbers.length === 0) {
      show("No prepared dirt plots available! Click the red X to dig and place dirt.", "info");
      return;
    }

    const newWaterState = { ...waterStateRef.current };

    // Sort seeds by quality (best first): LEGENDARY > EPIC > RARE > UNCOMMON > COMMON
    const qualityOrder = {
      ID_RARE_TYPE_LEGENDARY: 5,
      ID_RARE_TYPE_EPIC: 4,
      ID_RARE_TYPE_RARE: 3,
      ID_RARE_TYPE_UNCOMMON: 2,
      ID_RARE_TYPE_COMMON: 1,
    };

    const sortedSeeds = currentSeeds
      .filter((seed) => seed.count > 0)
      .sort((a, b) => {
        const aQuality = qualityOrder[a.category] || 0;
        const bQuality = qualityOrder[b.category] || 0;
        if (aQuality !== bQuality) {
          return bQuality - aQuality; // Higher quality first
        }
        return (b.yield || 0) - (a.yield || 0); // Higher yield first for same quality
      });


    if (sortedSeeds.length === 0) {
      show("You don't have any seeds to plant!", "info");
      return;
    }

    // Plant seeds starting with the best quality
    const encodedIdsToPlant = [];
    for (const seed of sortedSeeds) {
      if (emptyPlotNumbers.length === 0) break;
      let countToPlant = Math.min(seed.count, emptyPlotNumbers.length);
      for (let i = 0; i < countToPlant; i++) {
          const plotIdx = emptyPlotNumbers.shift();
          const category = seed.id >> 8;
          const localId = seed.id & 0xFF;
          const subtype = getSubtype(seed.id);
          encodedIdsToPlant.push((plotIdx << 24) | (category << 16) | (subtype << 8) | localId);
          newWaterState[plotIdx] = { needsInitial: true, needsMid: true, pausedMs: 0, contractPlantedAt: Date.now() };
      }
    }

    if (encodedIdsToPlant.length === 0) {
      show("No seeds were planted. All plots may already be occupied.", "info");
      return;
    }

    waterStateRef.current = newWaterState;
    localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

    playPlantConfirmSound();
    show(`Planting ${encodedIdsToPlant.length} seeds...`, "info");
    const result = await plantBatch(encodedIdsToPlant);
    if (result) {
        show(`✅ Successfully planted ${encodedIdsToPlant.length} seeds!`, "success");
        await loadCropsFromContract();
        if (typeof refetchSeeds === "function") refetchSeeds();
        setPreviewUpdateKey(prev => prev + 1);
        setIsFarmMenu(false);
    } else {
        show("❌ Failed to plant seeds.", "error");
    }
  }, [userCropsLoaded, maxPlots, isFarmMenu, cropArray, currentSeeds, show, plantBatch, loadCropsFromContract, refetchSeeds, playPlantConfirmSound]);

  const startHarvesting = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const startPotionUsage = (potionId, potionName) => {
    if (potionId === ID_POTION_ITEMS.SCARECROW) {
      setIsPlacingScarecrow(true);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false); // Keep farm active so animations don't restart
      show("Select a white border to place your scarecrow!", "info");
      return;
    }
    if (potionId === ID_POTION_ITEMS.LADYBUG) {
      setIsPlacingLadybug(true);
      setIsPlacingScarecrow(false);
      setIsPlacingSprinkler(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a red border to place your ladybug!", "info");
      return;
    }
    if (potionId === 9998) {
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a blue border to place your sprinkler!", "info");
      return;
    }
    if (potionId === 9999) {
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a purple border to place your umbrella!", "info");
      return;
    }
    setSelectedPotion({ id: potionId, name: potionName });
    setIsUsingPotion(true);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const handlePlaceScarecrow = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 3 * 60 * 60; // 3 hours
    const newScarecrows = { ...scarecrows, [spotId]: expiryTime };
    setScarecrows(newScarecrows);
    scarecrowsRef.current = newScarecrows;
    localStorage.setItem('sandbox_scarecrows', JSON.stringify(newScarecrows));
    show("Scarecrow placed to protect your crops!", "success");
    setIsPlacingScarecrow(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.SCARECROW] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.SCARECROW] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceLadybug = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 3 * 60 * 60; // 3 hours
    const newLadybugs = { ...ladybugs, [spotId]: expiryTime };
    setLadybugs(newLadybugs);
    ladybugsRef.current = newLadybugs;
    localStorage.setItem('sandbox_ladybugs', JSON.stringify(newLadybugs));
    show("Ladybug placed to protect your crops!", "success");
    setIsPlacingLadybug(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[ID_POTION_ITEMS.LADYBUG] = Math.max(0, (sandboxLoot[ID_POTION_ITEMS.LADYBUG] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceSprinkler = (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const newSprinklers = { ...sprinklers, [spotId]: expiryTime };
    setSprinklers(newSprinklers);
    sprinklersRef.current = newSprinklers;
    localStorage.setItem('sandbox_sprinklers', JSON.stringify(newSprinklers));
    show("Water Sprinkler placed to auto-water crops!", "success");
    setIsPlacingSprinkler(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9998] = Math.max(0, (sandboxLoot[9998] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();
  };

  const handlePlaceUmbrella = async (spotId) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const newUmbrellas = { ...umbrellas, [spotId]: expiryTime };
    setUmbrellas(newUmbrellas);
    umbrellasRef.current = newUmbrellas;
    localStorage.setItem('sandbox_umbrellas', JSON.stringify(newUmbrellas));
    show("Umbrella placed to protect crops from rain!", "success");
    setIsPlacingUmbrella(false);
    setIsFarmMenu(false);
    setIsPlanting(true);
    
    const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
    sandboxLoot[9999] = Math.max(0, (sandboxLoot[9999] || 0) - 1);
    localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
    if (typeof refetchSeeds === "function") refetchSeeds();

    await loadCropsFromContract();
  };

  const handleHarvestAll = async () => {
    try {
      const readySlots = [];
      const currentTimeSeconds = Math.floor(Date.now() / 1000);

      for (let i = 0; i < cropArray.getLength(); i++) {
        const item = cropArray.getItem(i);
        if (item && item.seedId) {
          const endTime = Math.floor((item.plantedAt || 0) / 1000) + (item.growthTime || 0);
          const isReady = (item.growStatus === 2) || (currentTimeSeconds >= endTime);
          if (isReady) {
            readySlots.push(i);
          }
        }
      }

      if (readySlots.length === 0) {
        show("No crops are ready to harvest!", "info");
        return;
      }
      playHarvestConfirmSound();

      show(`Harvesting ${readySlots.length} ready crops...`, "info");

      let ok = false;
      try {
        if (readySlots.length > 1 && typeof harvestMany === "function") {
          const res = await harvestMany(readySlots);
          ok = !!res;
        } else if (readySlots.length === 1) {
          const res = await harvestMany(readySlots[0]);
          ok = !!res;
        } else {
          // Fallback if batch method is unavailable
          const res = await harvestMany(readySlots);
          ok = !!res;
        }
      } catch (error) {
        const { message } = handleContractError(error, 'harvesting crops');
        console.error("Failed to harvest crops:", message);
        show(`❌ ${message}`, "error");
      }

      if (!ok) {
        // show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }

      // Reload crops from contract to sync state
      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();
      
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      show(`✅ Successfully harvested ${readySlots.length} crops!`, "success");
      // Clear any selection state after harvest all
      setSelectedIndexes([]);
      setIsFarmMenu(false);
      setIsPlanting(true);
      
      // Reset water state for harvested crops
      const newWaterState = { ...waterStateRef.current };
      readySlots.forEach(idx => { delete newWaterState[idx]; });
      waterStateRef.current = newWaterState;
      localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

      // Reset plot prep to 0 (Red X) for harvested plots
      setPlotPrep(prev => {
        const next = { ...prev };
        readySlots.forEach(idx => { next[idx] = { status: 0 }; });
        localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
        return next;
      });
      
      // Sync main crop array with latest growth data
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        newCropArray.updateGrowth();
        return newCropArray;
      });
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting all crops');
      console.error("Failed during Harvest All:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handlePlant = async () => {
    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }
    let loadingNotification = null;
    try {
      // Find all newly planted crops in preview (growStatus === -1)
      const cropsToPlant = [];
      for (let i = 0; i < previewCropArray.getLength(); i++) {
        const item = previewCropArray.getItem(i);
        if (item && item.growStatus === -1 && item.seedId) {
          cropsToPlant.push({
            seedId: item.seedId,
            plotNumber: i,
          });
        }
      }

      if (cropsToPlant.length === 0) {
        console.log("🚀 ~ handlePlant ~ selectedSeed:", selectedSeed)
        if (!selectedSeed) {
          show("Please select a seed first!", "info");
        } else {
          show(
            'No crops selected to plant. Please click on plots to plant seeds or use "Plant All".',
            "info"
          );
        }
        setIsFarmMenu(false);
        return;
      }
      // Show loading message that persists until transaction completes
      const loadingMessage =
        cropsToPlant.length === 1
          ? "Planting seed..."
          : `Planting ${cropsToPlant.length} seeds...`;
      playPlantConfirmSound();
      loadingNotification = show(loadingMessage, "info", 300000); // 5 minutes timeout

      // Batch plant
      const seedIds = cropsToPlant.map((crop) => {
        const numericSeedId = Number(crop.seedId);
        const category = numericSeedId >> 8;
        const id = numericSeedId & 0xFF;
        const subtype = getSubtype(numericSeedId);
        const plotId = crop.plotNumber;
        console.log("🚀 ~ handlePlant ~ plotId:", plotId, category, subtype, id)
        return (plotId << 24) | (category << 16) | (subtype << 8) | id
      });
      const result = await plantBatch(seedIds);
      if (result) {
        const newWaterState = { ...waterStateRef.current };
        for (let i = 0; i < cropsToPlant.length; i++) {
          newWaterState[cropsToPlant[i].plotNumber] = { needsInitial: true, needsMid: true, pausedMs: 0, contractPlantedAt: Date.now() };
        }
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        loadingNotification.dismiss();
        show(
          `✅ Successfully planted ${cropsToPlant.length} seeds!`,
          "success",
          3000 // 3 seconds timeout
        );
      } else {
        loadingNotification.dismiss();
        show("❌ Failed to plant seeds. Please try again.", "error", 3000);
        return;
      }

      // Update the main crop array immediately with planted crops before closing menu
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        
        // Copy newly planted crops from preview to main array
        for (let i = 0; i < cropsToPlant.length; i++) {
          const cropToPlant = cropsToPlant[i];
          const previewItem = previewCropArray.getItem(cropToPlant.plotNumber);
          if (previewItem && previewItem.seedId) {
            const mainItem = newCropArray.getItem(cropToPlant.plotNumber);
            if (mainItem) {
              mainItem.seedId = previewItem.seedId;
              mainItem.plantedAt = previewItem.plantedAt;
              mainItem.growthTime = previewItem.growthTime;
              mainItem.growStatus = 1; // Mark as growing
            }
          }
        }
        
        return newCropArray;
      });

      // Reset any selection state after successful planting
      setSelectedIndexes([]);

      // Reload crops and seeds concurrently to reduce total wait time
      await Promise.all([
        loadCropsFromContract(),
          (async () => {
            try {
              if (typeof refetchSeeds === "function") {
                await refetchSeeds();
              }
            } catch (e) {
              // Failed to refetch seeds after planting
            }
          })(),
        ]);
        
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      // Confirm planting in preview array (transition -1 to 1)
      setPreviewCropArray((prevPreviewCropArray) => {
        const newPreviewCropArray = new CropItemArrayClass(30);
        newPreviewCropArray.copyFrom(prevPreviewCropArray);
        newPreviewCropArray.confirmPlanting();
        return newPreviewCropArray;
      });

      // Reset used seeds tracking after successful planting
      setUsedSeedsInPreview({});

      // Reset planting state and close farm menu
      setIsPlanting(true); // Keep in planting mode for next time
      setIsFarmMenu(false); // Close the farm menu to show planted items
      
    } catch (error) {
      const { message } = handleContractError(error, 'planting crops');
      loadingNotification.dismiss();
      console.error("Failed to plant crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleHarvest = async () => {
    if (!selectedIndexes || selectedIndexes.length === 0) {
      show("Please select crops to harvest first!", "info");
      return;
    }
    try {
      // Check which crops are actually ready to harvest
      const readyCrops = [];
      const currentTimeSec = Math.floor(Date.now() / 1000);

      for (const idx of selectedIndexes) {
        if (idx >= 0 && idx < cropArray.getLength()) {
          const item = cropArray.getItem(idx);
          const endTimeSec = Math.floor((item?.plantedAt || 0) / 1000) + (item?.growthTime || 0);
          const isActuallyReady = currentTimeSec >= endTimeSec;
          

          if (item && item.seedId && item.growStatus === 2 && isActuallyReady) {
            readyCrops.push(idx);
          }
        }
      }

      if (readyCrops.length === 0) {
        show(
          "No selected crops are ready to harvest! Make sure crops are fully grown.",
          "info"
        );
        return;
      }
      playHarvestConfirmSound();
      show(`Harvesting ${readyCrops.length} ready crops...`, "info");

      let successCount = 0;
      // Prefer batch harvest when multiple crops are ready
      const result = await harvestMany(readyCrops);
      if (result) {
        successCount = readyCrops.length;
      }
    
      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();
      
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      if (successCount > 0) {
        show(`✅ Successfully harvested ${successCount} crops!`, "success");
        // Clear selection state after successful harvest
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
        // Reset water state for harvested crops
        const newWaterState = { ...waterStateRef.current };
        readyCrops.forEach(idx => { delete newWaterState[idx]; });
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        // Reset plot prep to 0 (Red X) for harvested crops
        setPlotPrep(prev => {
          const next = { ...prev };
          readyCrops.forEach(idx => { next[idx] = { status: 0 }; });
          localStorage.setItem('sandbox_plot_prep', JSON.stringify(next));
          window.dispatchEvent(new CustomEvent('plotPrepUpdated', { detail: next }));
          return next;
        });
        
        // Sync main crop array with latest growth data
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      } else {
        show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting crops');
      console.error("Failed to harvest crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleInstantHarvest = async (index) => {
    try {
      playHarvestConfirmSound();
      show(`Harvesting crop...`, "info");

      const result = await harvestMany([index]);

      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadCropsFromContract();
      if (typeof refetchSeeds === "function") refetchSeeds();
      
      // Force a re-render by updating the preview update key
      setPreviewUpdateKey(prev => prev + 1);

      if (result) {
        show(`✅ Successfully harvested crop!`, "success");
        updatePlotPrep(index, { status: 0 });
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
        // Reset water state
        const newWaterState = { ...waterStateRef.current };
        delete newWaterState[index];
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        // Sync main crop array with latest growth data
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      } else {
        show("❌ Failed to harvest crop. Please try again.", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'harvesting crop');
      console.error("Failed to harvest crop:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
    setIsUsingPotion(false);
    setSelectedPotion(null);
    setIsPlacingScarecrow(false);
    setIsPlacingLadybug(false);
    setIsPlacingSprinkler(false);
    setIsPlacingUmbrella(false);
    setIsWatering(false);
    setIsDigging(false);
    setIsHoeing(false);
    // Reset used seeds tracking when canceling
    setUsedSeedsInPreview({});
    
    // Sync main crop array with latest growth data from preview
    setCropArray((prevCropArray) => {
      const newCropArray = new CropItemArrayClass(30);
      newCropArray.copyFrom(prevCropArray);
      newCropArray.updateGrowth();
      return newCropArray;
    });
  };

  const handlePotionUse = async () => {
    if (!selectedPotion) {
      show("No potion selected!", "error");
      return;
    }

    if (!selectedIndexes || selectedIndexes.length !== 1) {
      show("Please select exactly one crop to apply the potion!", "info");
      return;
    }

    try {
      let potionFunction = null;

      // Determine which potion function to use based on the BigInt ID
      const potionId = selectedPotion.id;
      if (potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR || 
          potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_II || 
          potionId === ID_POTION_ITEMS.POTION_GROWTH_ELIXIR_III) {
        potionFunction = applyGrowthElixir;
      } else if (potionId === ID_POTION_ITEMS.POTION_PESTICIDE || 
                 potionId === ID_POTION_ITEMS.POTION_PESTICIDE_II || 
                 potionId === ID_POTION_ITEMS.POTION_PESTICIDE_III) {
        potionFunction = applyPesticide;
      } else if (potionId === ID_POTION_ITEMS.POTION_FERTILIZER || 
                 potionId === ID_POTION_ITEMS.POTION_FERTILIZER_II || 
                 potionId === ID_POTION_ITEMS.POTION_FERTILIZER_III) {
        potionFunction = applyFertilizer;
      }
      if (!potionFunction) {
        show("Invalid potion type!", "error");
        return;
      }

      const targetIndex = selectedIndexes[0];
      show(`Applying ${selectedPotion.name} to crop #${targetIndex + 1}...`, "info");

      const result = await potionFunction(targetIndex);

      if (result) {
        show(`✅ Successfully applied ${selectedPotion.name} to 1 crop!`, "success");
        
        // Reload crops from contract to show updated potion effects
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadCropsFromContract();
        
        // Force a re-render by updating the preview update key
        setPreviewUpdateKey(prev => prev + 1);
        
        // Clear any selection state after successful potion application
        setSelectedIndexes([]);
        setIsUsingPotion(false);
        setSelectedPotion(null);
        setIsFarmMenu(false);
        setIsPlanting(true);
      } else {
        show("❌ Failed to apply potion. Please try again.", "error");
      }
    } catch (error) {
      const { message } = handleContractError(error, 'applying potion');
      show(`❌ ${message}`, "error");
    }
  };

  const onClickCrop = (isShift, index) => {

    // Check if userCrops are loaded before allowing any plot interaction
    if (!userCropsLoaded) {
      show(
        "Please wait for your farm data to load before interacting with plots.",
        "info"
      );
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (isPlacingScarecrow || isPlacingLadybug || isPlacingSprinkler || isPlacingUmbrella) {
      return; // Clicks handled by scarecrow spots overlay
    }

    if (isDigging) {
      const pStatus = plotPrep[index]?.status || 0;
      const fishId = plotPrep[index]?.fishId;
      const item = cropArray.getItem(index);

      const returnFishAndSeed = (seedIdToReturn) => {
        const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
        let returnedSomething = false;
        if (fishId) {
          sandboxLoot[fishId] = (sandboxLoot[fishId] || 0) + 1;
          returnedSomething = true;
        }
        if (seedIdToReturn) {
          sandboxLoot[seedIdToReturn.toString()] = (sandboxLoot[seedIdToReturn.toString()] || 0) + 1;
          returnedSomething = true;
        }
        if (returnedSomething) {
          localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
          if (typeof refetchSeeds === "function") refetchSeeds();
        }
      };

      if (item && item.seedId && item.seedId !== 0n) {
        returnFishAndSeed(item.seedId);
        show("Crop removed. Seed and fish returned!", "success");
        updatePlotPrep(index, { status: 1 });
        
        if (destroyCrop) {
          destroyCrop(index).then(() => {
            loadCropsFromContract();
          });
        }
        setCropArray(prev => {
          const newArr = new CropItemArrayClass(30);
          newArr.copyFrom(prev);
          const target = newArr.getItem(index);
          if (target) {
            target.seedId = 0n;
            target.bugCountdown = undefined;
            target.crowCountdown = undefined;
          }
          return newArr;
        });
        playPlantConfirmSound();
      } else if (pStatus === 3) {
        returnFishAndSeed(null);
        updatePlotPrep(index, { status: 1 });
        if (fishId) show("Dirt removed. Fish returned!", "success");
        playPlantConfirmSound();
      } else if (pStatus === 0) {
        playPlantConfirmSound();
        updatePlotPrep(index, { status: 1 });
      } else {
        show("It's already a hole!", "info");
      }
      return;
    }

    if (isHoeing) {
      show("Click directly on a Scarecrow, Ladybug, Sprinkler, or Umbrella to remove it!", "info");
      return;
    }



    if (isWatering) {
      const item = cropArray.getItem(index);
      if (item && item.needsWater) {
        const wState = waterStateRef.current[index];
        if (wState) {
          if (wState.needsInitial) wState.needsInitial = false;
          else if (wState.needsMid) wState.needsMid = false;
          waterStateRef.current = { ...waterStateRef.current };
          localStorage.setItem('sandbox_water_state', JSON.stringify(waterStateRef.current));
          setWaterEffects(prev => [...prev, { id: Date.now() + Math.random(), index, time: Date.now() }]);
        }
        playWaterSound();
      } else {
        show("This plot doesn't need water right now.", "info");
      }
      return;
    }

    if (isUsingPotion) {
      // Potion usage mode - allow selection of exactly one growing crop
      const plotData = cropArray.getItem(index);
      if (!plotData || !plotData.seedId) {
        show("This plot is empty. Potions can only be used on growing crops.", "info");
        return;
      }

      // Check if the crop is still growing (growStatus === 1) or ready to harvest (growStatus === 2)
      if (plotData.growStatus === 2) {
        show("This crop is ready to harvest. Potions can only be used on growing crops.", "info");
        return;
      }

      if (plotData.growStatus !== 1) {
        show("This crop is not growing. Potions can only be used on actively growing crops.", "info");
        return;
      }

      // Single-select behavior: selecting a new crop replaces previous selection
      setSelectedIndexes((prev) => (prev.length === 1 && prev[0] === index ? [] : [index]));
      return;
    }

    // --- INSTANT HARVEST CHECK ---
    const plotData = cropArray.getItem(index);
    if (plotData && plotData.seedId && plotData.seedId !== 0n) {
      const nowSec = Math.floor(Date.now() / 1000);
      const endTime = Math.floor((plotData.plantedAt || 0) / 1000) + (plotData.growthTime || 0);
      const isReady = (plotData.growStatus === 2) || (nowSec >= endTime);
      
      if (isReady) {
        if (farmingLoading) return; // Prevent spam clicking
        handleInstantHarvest(index);
        return;
      } else {
        const remaining = Math.max(0, endTime - nowSec);
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
        show(`Crop is still growing! Ready in ${timeStr}`, "info");
        return;
      }
    }

    // EMPTY PLOT PREP LOGIC
    const pStatus = plotPrep[index]?.status || 0;
    if (pStatus === 0) {
      show("Equip your shovel to dig a hole!", "info");
      return;
    } else if (pStatus === 1 || pStatus === 2) {
      setPrepDialogTarget(index);
      return;
    } else if (pStatus === 3) {
      // Ready to plant! Require Shift for quick-plant; otherwise open the seed dialog
      if (selectedSeed && isShift) {
        const availableSeeds = getAvailableSeeds();
        const selectedAvailable = availableSeeds.find((s) => s.id === selectedSeed);
        if (!selectedAvailable || selectedAvailable.count <= 0) {
          setSelectedSeed(null);
          setCurrentFieldIndex(index);
          setIsSelectCropDialog(true);
          return;
        }
        handleClickSeedFromDialog(selectedSeed, index);
        return;
      }
      if (selectedSeed === 9998) {
        setIsPlacingSprinkler(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingUmbrella(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
      if (selectedSeed === 9999) {
        setIsPlacingUmbrella(true);
        setIsPlacingScarecrow(false);
        setIsPlacingLadybug(false);
        setIsPlacingSprinkler(false);
        setIsUsingPotion(false);
        setIsPlanting(false);
        setIsFarmMenu(false);
        return;
      }
  
      // Open selection dialog when Shift not held or no seed selected
      setCurrentFieldIndex(index);
      setIsSelectCropDialog(true);
      return;
    }
  };

  const handleClickSeedFromDialog = async (id, fieldIndex) => {
    // Remember the selected seed so Shift+click can reuse it across plots
    setSelectedSeed(id);
    setIsSelectCropDialog(false);
    const idx = typeof fieldIndex === "number" ? fieldIndex : currentFieldIndex;
    if (idx < 0) {
      return;
    }

    // Ensure plot is empty before proceeding (UI guard)
    const existing = cropArray.getItem(idx);
    if (existing && existing.seedId && existing.seedId !== 0n) {
      show(`Plot ${idx} is already occupied.`, "error");
      return;
    }

    // Check if seed is available considering used seeds in preview
    const availableSeeds = getAvailableSeeds();
    let seed = availableSeeds.find((s) => s.id === id);
    if (!seed && (id === 9998 || id === 9999)) {
      seed = allItems.find((s) => s.id === id);
    }
    if (!seed || seed.count <= 0) {
      show("You don't have any more items of this type available!", "info");
      return;
    }
    if (id === 9998) {
      setIsPlacingSprinkler(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingUmbrella(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your sprinkler!", "info");
      return;
    }
    if (id === 9999) {
      setIsPlacingUmbrella(true);
      setIsPlacingScarecrow(false);
      setIsPlacingLadybug(false);
      setIsPlacingSprinkler(false);
      setIsUsingPotion(false);
      setIsPlanting(false);
      setIsFarmMenu(false);
      show("Select a spot to place your umbrella!", "info");
      return;
    }

    // --- INSTANT PLANT HACK ---
    const category = id >> 8;
    const localId = id & 0xFF;
    const subtype = getSubtype(id);
    const encodedId = (idx << 24) | (category << 16) | (subtype << 8) | localId;
    
    playPlantConfirmSound();
    const result = await plantBatch([encodedId]);
    if (result) {
        const newWaterState = { ...waterStateRef.current };
        newWaterState[idx] = { needsInitial: true, needsMid: true, pausedMs: 0, contractPlantedAt: Date.now() };
        waterStateRef.current = newWaterState;
        localStorage.setItem('sandbox_water_state', JSON.stringify(newWaterState));

        show("✅ Seed planted!", "success");
        await loadCropsFromContract();
        if (typeof refetchSeeds === "function") refetchSeeds();
        setPreviewUpdateKey(prev => prev + 1);
        setIsFarmMenu(false);
    } else {
        show("❌ Failed to plant seed.", "error");
    }
  };

  const SHARED_SPOTS_CONFIG = [
    { index: 1, offsetX: 0, offsetY: 196 },     // New Spot 1
    { index: 2, offsetX: -30, offsetY: 40 },  // Spot 2
    { index: 3, offsetX: 16, offsetY: 143 },  // Spot 3
    { index: 10, offsetX: 60, offsetY: 40 },  // Spot 10
    { index: 11, offsetX: 80, offsetY: -10 }, // Between plot 12 and 13
    { index: 4, offsetX: 83, offsetY: 94 },     // New Spot 4
    { index: 5, offsetX: -40, offsetY: 92 },    // New Spot 5
    { index: 6, offsetX: 25, offsetY: 145 },       // New Spot 6
    { index: 7, offsetX: 10, offsetY: 145 },       // New Spot 7
    { index: 8, offsetX: 105, offsetY: 197 }        // New Spot 8
  ];

  const dialogs = [
    {
      id: ID_FARM_HOTSPOTS.DEX,
      component: FarmerDialog,
      label: "FARMER",
      header: "/images/dialog/modal-header-gardner.png",
      actions: {
        plant: startPlanting,
        plantAll: plantAll,
        harvest: startHarvesting,
        harvestAll: handleHarvestAll,
        usePotion: startPotionUsage,
      },
    },
  ];

  const bees = FARM_BEES;
  return isForest ? (
    <>
      <Forest />
    </>
  ) : (
    <div>
      {isRaining && <RainOverlay isLightning={isLightning} />}
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/farm.webp"
        hotspots={hotspots}
        width={width}
        height={height}
        dialogs={dialogs}
        hideMenu={isFarmMenu}
        bees={bees}
      >
        <FarmInterface
          key={isFarmMenu ? `preview-${previewUpdateKey}` : "main"}
          cropArray={isFarmMenu ? previewCropArray : cropArray}
          onClickCrop={onClickCrop}
          isFarmMenu={isFarmMenu}
          isPlanting={isPlanting}
          isUsingPotion={isUsingPotion}
          maxPlots={maxPlots}
          totalPlots={30}
          selectedIndexes={selectedIndexes}
          crops={cropArray}
        />
        {/* Cat Pet Overlay next to Plant Label/Bee */}
        <img 
          src="/images/pet/cat.png" 
          alt="Cat Pet" 
          style={{ 
            position: 'absolute', 
            left: '860px', // Adjust X to align perfectly next to the bee
            top: '430px',  // Adjust Y to sit nicely on the terrain
            width: '60px', 
            height: 'auto', 
            zIndex: 10,
            pointerEvents: 'none',
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))'
          }} 
        />
        {/* Protector Spots Overlay (Scarecrows & Ladybugs) */}
        {FARM_POSITIONS && SHARED_SPOTS_CONFIG.map((spot) => {
          const nowSec = Math.floor(Date.now() / 1000);
          const hasLadybug = ladybugs[spot.index] && ladybugs[spot.index] > nowSec;
          const hasScarecrow = scarecrows[spot.index] && scarecrows[spot.index] > nowSec;
          const hasSprinkler = sprinklers[spot.index] && sprinklers[spot.index] > nowSec;
          const hasUmbrella = umbrellas[spot.index] && umbrellas[spot.index] > nowSec;
          
          const isOccupied = hasLadybug || hasScarecrow || hasSprinkler || hasUmbrella;

          return (
            <React.Fragment key={`protector-spot-${spot.index}`}>
              <ScarecrowSpot 
                spotId={spot.index}
                pos={FARM_POSITIONS[spot.index]}
                offsetX={spot.offsetX}
                offsetY={spot.offsetY}
                isPlacing={isPlacingScarecrow && !isOccupied}
                isPlaced={!!scarecrows[spot.index]}
                expiryTime={scarecrows[spot.index]}
                onPlace={() => handlePlaceScarecrow(spot.index)}
                onExpire={handleRemoveScarecrow}
                onRemove={() => {
                  if (isHoeing) {
                    handleRemoveScarecrow(spot.index);
                    show("Scarecrow removed!", "success");
                  } else {
                    show("Equip the Hoe to remove placed items!", "warning");
                  }
                }}
              />
              <LadybugSpot 
                spotId={spot.index}
                pos={FARM_POSITIONS[spot.index]}
                offsetX={spot.offsetX} // Uses identical coordinates now!
                offsetY={spot.offsetY}
                isPlacing={isPlacingLadybug && !isOccupied}
                isPlaced={!!ladybugs[spot.index]}
                expiryTime={ladybugs[spot.index]}
                onPlace={() => handlePlaceLadybug(spot.index)}
                onExpire={handleRemoveLadybug}
                onRemove={() => {
                  if (isHoeing) {
                    handleRemoveLadybug(spot.index);
                    show("Ladybug removed!", "success");
                  } else {
                    show("Equip the Hoe to remove placed items!", "warning");
                  }
                }}
              />
              <SprinklerSpot 
                spotId={spot.index}
                pos={FARM_POSITIONS[spot.index]}
                offsetX={spot.offsetX}
                offsetY={spot.offsetY}
                isPlacing={isPlacingSprinkler && !isOccupied}
                isPlaced={!!sprinklers[spot.index]}
                expiryTime={sprinklers[spot.index]}
                onPlace={() => handlePlaceSprinkler(spot.index)}
                onExpire={handleRemoveSprinkler}
                onRemove={() => {
                  if (isHoeing) {
                    handleRemoveSprinkler(spot.index);
                    show("Water Sprinkler removed!", "success");
                  } else {
                    show("Equip the Hoe to remove placed items!", "warning");
                  }
                }}
              />
              <UmbrellaSpot 
                spotId={spot.index}
                pos={FARM_POSITIONS[spot.index]}
                offsetX={spot.offsetX}
                offsetY={spot.offsetY}
                isPlacing={isPlacingUmbrella && !isOccupied}
                isPlaced={!!umbrellas[spot.index]}
                expiryTime={umbrellas[spot.index]}
                onPlace={() => handlePlaceUmbrella(spot.index)}
                onExpire={async () => {
                  handleRemoveUmbrella(spot.index);
                  await loadCropsFromContract();
                }}
                onRemove={async () => {
                  if (isHoeing) {
                    handleRemoveUmbrella(spot.index);
                    show("Umbrella removed!", "success");
                    await loadCropsFromContract();
                  } else {
                    show("Equip the Hoe to remove placed items!", "warning");
                  }
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Forest Label Overlay - Now inside PanZoomViewport */}
        <div 
          onMouseEnter={(e) => {
            if (forestLockTime <= 0) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
            }
          }}
          onMouseLeave={(e) => {
            if (forestLockTime <= 0) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
            }
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (forestLockTime > 0) {
              const h = Math.floor(forestLockTime / 3600000);
              const m = Math.floor((forestLockTime % 3600000) / 60000);
              const s = Math.floor((forestLockTime % 60000) / 1000);
              show(`The forest is resting! Come back in ${h}h ${m}m ${s}s.`, "error");
              return;
            }
            window.location.href = '/farm?scene=forest';
          }}
          style={{ position: 'absolute', bottom: 'calc(100% - 110px)', right: 'calc(15% - 900px)', zIndex: 9998, cursor: forestLockTime > 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))', opacity: forestLockTime > 0 ? 0.6 : 1 }}
        >
          <img src="/images/forest/forestlabel.png" alt="Forest" style={{ height: '80px', objectFit: 'contain' }} />
          {forestLockTime > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff4444', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', marginTop: '5px', border: '1px solid #ff4444', fontFamily: 'monospace' }}>
              {Math.floor(forestLockTime / 3600000)}h {Math.floor((forestLockTime % 3600000) / 60000)}m
            </div>
          )}
        </div>

        {/* Hoe Icon Overlay - Static inside PanZoomViewport */}
        <div 
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsHoeing(!isHoeing);
            setIsWatering(false);
            setIsDigging(false);
            setIsPlanting(false);
            setIsUsingPotion(false);
            setIsPlacingScarecrow(false);
            setIsPlacingLadybug(false);
            setIsPlacingSprinkler(false);
            setIsPlacingUmbrella(false);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = isHoeing ? 'drop-shadow(0px 0px 12px yellow)' : 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = isHoeing ? 'drop-shadow(0px 0px 8px yellow)' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
          }}
          style={{ position: 'absolute', top: '50px', left: '30px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: isHoeing ? 'drop-shadow(0px 0px 8px yellow)' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
        >
          <img src="/images/items/hoe.png" alt="Hoe" style={{ height: '80px', objectFit: 'contain' }} />
        </div>

        {/* Watering Can Icon Overlay - Static inside PanZoomViewport */}
        <div 
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsWatering(!isWatering);
            setIsHoeing(false);
            setIsDigging(false);
            setIsPlanting(false);
            setIsUsingPotion(false);
            setIsPlacingScarecrow(false);
            setIsPlacingLadybug(false);
            setIsPlacingSprinkler(false);
            setIsPlacingUmbrella(false);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = isWatering ? 'drop-shadow(0px 0px 12px yellow)' : 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = isWatering ? 'drop-shadow(0px 0px 8px yellow)' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
          }}
          style={{ position: 'absolute', top: '50px', left: '120px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: isWatering ? 'drop-shadow(0px 0px 8px yellow)' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
        >
          <img src="/images/forest/watercan.png" alt="Watering Can" style={{ height: '80px', objectFit: 'contain' }} />
        </div>

        {/* Shovel Icon Overlay - Static inside PanZoomViewport */}
        <div 
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsDigging(!isDigging);
            setIsHoeing(false);
            setIsWatering(false);
            setIsPlanting(false);
            setIsUsingPotion(false);
            setIsPlacingScarecrow(false);
            setIsPlacingLadybug(false);
            setIsPlacingSprinkler(false);
            setIsPlacingUmbrella(false);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = isDigging ? 'drop-shadow(0px 0px 12px yellow)' : 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = isDigging ? 'drop-shadow(0px 0px 8px yellow)' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
          }}
          style={{ position: 'absolute', top: '50px', left: '210px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: isDigging ? 'drop-shadow(0px 0px 8px yellow)' : 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
        >
          <img src="/images/farm/shovel.png" alt="Shovel" style={{ height: '80px', objectFit: 'contain' }} />
        </div>
      </PanZoomViewport>
      {isFarmMenu && (
        <FarmMenu
          isPlant={isPlanting}
          isUsingPotion={isUsingPotion}
          onCancel={handleCancel}
          onPlant={handlePlant}
          onHarvest={handleHarvest}
          onPlantAll={plantAll}
          onPotionUse={handlePotionUse}
          selectedSeed={selectedSeed}
          selectedPotion={selectedPotion}
          loading={farmingLoading}
        />
      )}
      {isSelectCropDialog && (
        <SelectSeedDialog
          onClose={() => setIsSelectCropDialog(false)}
          onClickSeed={handleClickSeedFromDialog}
          availableSeeds={getAvailableSeeds()}
        />
      )}

      {prepDialogTarget !== null && (
        <PlotPrepDialog
          onClose={() => setPrepDialogTarget(null)}
          onPlaceDirt={() => {
            updatePlotPrep(prepDialogTarget, { ...plotPrep[prepDialogTarget], status: 3 });
            setPrepDialogTarget(null);
            playPlantConfirmSound();
          }}
          onAddFish={(fishId) => {
            const existingPrep = plotPrep[prepDialogTarget];
            const sandboxLoot = JSON.parse(localStorage.getItem('sandbox_loot') || '{}');
            
            if (existingPrep?.status === 2 && existingPrep?.fishId) {
              sandboxLoot[existingPrep.fishId] = (sandboxLoot[existingPrep.fishId] || 0) + 1;
            }

            sandboxLoot[fishId] = Math.max(0, (sandboxLoot[fishId] || 0) - 1);
            localStorage.setItem('sandbox_loot', JSON.stringify(sandboxLoot));
            
            updatePlotPrep(prepDialogTarget, { status: 2, fishId });
            setPrepDialogTarget(null);
            show("Fish placed in the hole!", "success");
            if (refetchSeeds) refetchSeeds();
          }}
          availableFish={allItems.filter(item => Object.values(ID_FISH_ITEMS || {}).includes(item.id) && item.count > 0)}
        />
      )}

      {/* Weight Contest Icon Overlay */}
      <div 
        onClick={() => setShowWeightContest(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 234, 0, 0.8))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
        }}
        style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
      >
        <img src="/images/weight/weightcontest.png" alt="Weight Contest" style={{ height: '210px', objectFit: 'contain' }} />
        {targetProduceData && (
          <div style={{
            position: 'absolute', top: '75px', left: '35%', transform: 'translateX(-50%)',
            width: '32px', height: '32px', background: 'rgba(0,0,0,0.6)', 
            border: '2px solid #5a402a', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
          }}>
            {targetProduceData.image && targetProduceData.image.includes('crop') ? (
               <div style={{ 
                   width: `${ONE_SEED_WIDTH}px`, height: `${ONE_SEED_HEIGHT}px`, 
                   backgroundImage: `url(${targetProduceData.image})`, 
                   backgroundPosition: `-${5 * ONE_SEED_WIDTH}px -${(targetProduceData.pos || 0) * ONE_SEED_HEIGHT}px`,
                   transform: 'scale(0.5)', backgroundRepeat: 'no-repeat'
               }} />
            ) : targetProduceData.image && targetProduceData.image.includes('seeds') ? (
               <div className="item-icon item-icon-seeds" style={{ transform: 'scale(0.6)', backgroundPositionY: targetProduceData.pos ? `-${targetProduceData.pos * ONE_SEED_HEIGHT * 0.308}px` : 0 }}></div>
            ) : (
               <img src={targetProduceData.image} alt={targetProduceData.label} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            )}
          </div>
        )}
        {targetFishData && (
          <div style={{
            position: 'absolute', top: '75px', left: '65%', transform: 'translateX(-50%)',
            width: '32px', height: '32px', background: 'rgba(0,0,0,0.6)', 
            border: '2px solid #5a402a', borderRadius: '50%', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden'
          }}>
            <img src={targetFishData.image} alt={targetFishData.label} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
        )}
      </div>

      {/* Weight Contest Dialog */}
      {showWeightContest && (
        <WeightContestDialog 
          onClose={() => setShowWeightContest(false)} 
          simulatedDay={simulatedDay}
          targetProduceId={targetProduceId}
          targetFishId={targetFishId}
          onProduceChange={setTargetProduceId}
          onFishChange={setTargetFishId}
          targetProduceData={targetProduceData}
          targetFishData={targetFishData}
          refetchItems={refetch}
        />
      )}

      {/* Calendar Icon Overlay */}
      <div 
        onClick={() => setShowCalendar(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
        }}
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
      >
        <img src="/images/calendar/calendar.png" alt="Calendar" style={{ height: '200px', objectFit: 'contain' }} />
      </div>

      {/* Calendar Dialog */}
      {showCalendar && (
        <CalendarDialog onClose={() => setShowCalendar(false)} simulatedDay={simulatedDay} simulatedDate={simulatedDate} />
      )}

      {/* Crafting Icon Overlay */}
      <div 
        onClick={() => setShowCraftingDialog(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
        }}
        style={{ position: 'fixed', top: '240px', right: '20px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
      >
        <img src="/images/Crafting/Crafting.png" alt="Crafting" style={{ height: '200px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/crafting/crafting.png'; }} />
      </div>

      {/* Crafting Dialog */}
      {showCraftingDialog && (
        <CraftingDialog onClose={() => setShowCraftingDialog(false)} refetchSeeds={refetchSeeds} />
      )}

      {/* Smithing Icon Overlay */}
      <div 
        onClick={() => setShowSmithingDialog(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.8))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.filter = 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))';
        }}
        style={{ position: 'fixed', top: '460px', right: '20px', zIndex: 9998, cursor: 'pointer', transition: 'all 0.2s ease', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
      >
        <img src="/images/smithing/smithing.png" alt="Smithing" style={{ height: '200px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/images/Smithing/Smithing.png'; }} />
      </div>

      {/* Smithing Dialog */}
      {showSmithingDialog && (
        <SmithingDialog onClose={() => setShowSmithingDialog(false)} />
      )}

      {/* Cancel Placement Button */}
      {(isPlacingScarecrow || isPlacingLadybug || isPlacingSprinkler || isPlacingUmbrella) && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}>
          <button 
            onClick={() => {
              setIsPlacingScarecrow(false);
              setIsPlacingLadybug(false);
              setIsPlacingSprinkler(false);
              setIsPlacingUmbrella(false);
              setIsPlanting(true);
            }}
            style={{ backgroundColor: 'rgba(0,0,0,0.8)', color: '#ff4444', border: '2px solid #ff4444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(255,68,68,0.5)' }}
          >
            [CANCEL PLACEMENT]
          </button>
        </div>
      )}
      <AdminPanel />
    </div>
  );
};

export default Farm;
