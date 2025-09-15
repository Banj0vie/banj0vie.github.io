import React, { useState, useEffect, useCallback } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_HOTSPOTS, FARM_VIEWPORT } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farm_Farmer";
import { dialogFrames } from "../constants/_baseimages";
import FarmInterface from "../layouts/FarmInterface";
import FarmMenu from "../layouts/FarmInterface/FarmMenu";
import SelectSeedDialog from "../containers/SelectSeedDialog";
import { useSeeds } from "../hooks/useSeeds";
import { useContracts, useFarming } from "../hooks/useContracts";
import { CropItemArrayClass } from "../models/crop";
const Farm = () => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const { seeds: currentSeeds } = useSeeds(); // Get seeds from contract
  const { contracts, isReady } = useContracts();
  const { plant, plantBatch, harvest, harvestAll, getUserCrops, getMaxPlots, getGrowthTime } = useFarming(contracts);
  const [isFarmMenu, setIsFarmMenu] = useState(false);
  const [isPlanting, setIsPlanting] = useState(true);
  const [isSelectCropDialog, setIsSelectCropDialog] = useState(false);
  const [cropArray, setCropArray] = useState(() => new CropItemArrayClass(30));
  const [previewCropArray, setPreviewCropArray] = useState(() => new CropItemArrayClass(30));
  const [currentFieldIndex, setCurrentFieldIndex] = useState(-1);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [, setGrowthTimer] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [maxPlots, setMaxPlots] = useState(0);
  const [previewUpdateKey, setPreviewUpdateKey] = useState(0);

  // Arrays are always 30 plots (15 per side), but maxPlots determines which are enabled

  // Get growth time for different seed types
  const getGrowthTimeForSeed = useCallback(async (seedId) => {
    // Get growth time from contract instead of hardcoded values
    try {
      const growthTime = await getGrowthTime(seedId);
      return growthTime;
    } catch (error) {
      console.error('Failed to get growth time from contract:', error);
      return 60; // Default fallback
    }
  }, [getGrowthTime]);

  // Load crops from contract
  const loadCropsFromContract = useCallback(async (address) => {
    try {
      console.log('Loading crops for address:', address);
      const contractCrops = await getUserCrops(address);
      console.log('Contract crops received:', contractCrops);
      
      if (contractCrops) {
        // Use total plots (30) for array size
        const newCropArray = new CropItemArrayClass(30);
        
        // Process crops sequentially to handle async growth time fetching
        for (const crop of contractCrops) {
          // Only process crops that are within our array bounds
          if (crop.plotNumber < 30) {
            if(crop.seedId !== 0n) {
              const item = newCropArray.getItem(crop.plotNumber);
              if (item) {
                item.seedId = crop.seedId;
                // Convert BigInt to number and calculate when planted
                const endTime = Number(crop.endTime);
                const growthTime = await getGrowthTimeForSeed(crop.seedId);
                item.plantedAt = endTime - growthTime; // Calculate when planted
                item.growthTime = growthTime;
                item.growStatus = crop.isReady ? 2 : 1; // 2 = ready, 1 = growing
              }
            } else {
              newCropArray.removeCropAt(crop.plotNumber);
            }
          } else {
            console.warn(`Crop at plot ${crop.plotNumber} exceeds total plots 30, skipping`);
          }
        }
        
        setCropArray(newCropArray);
        setPreviewCropArray(newCropArray);
        console.log('Final crop array:', newCropArray);
      } else {
        console.log('No crops found, initializing empty array');
        const emptyArray = new CropItemArrayClass(30);
        setCropArray(emptyArray);
        setPreviewCropArray(emptyArray);
      }
    } catch (error) {
      console.error('Failed to load crops from contract:', error);
      // Initialize empty array on error
      const emptyArray = new CropItemArrayClass(30);
      setCropArray(emptyArray);
      setPreviewCropArray(emptyArray);
    }
  }, [getUserCrops, getGrowthTimeForSeed]);

  // Load user address and crops from contract
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user address from wallet
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            
            // Only proceed if contracts are ready
            if (!isReady) {
              console.log('Contracts not ready yet, skipping data load');
              return;
            }
            
            // Get max plots for this user
            try {
              const userMaxPlots = await getMaxPlots(accounts[0]);
              console.log('Max plots for user:', userMaxPlots);
              if (userMaxPlots && userMaxPlots > 0) {
                setMaxPlots(Number(userMaxPlots));
              } else {
                console.warn('No max plots returned, user has no plots available');
                setMaxPlots(0);
              }
            } catch (error) {
              console.error('Failed to get max plots:', error);
              setMaxPlots(0); // No plots available
            }
            
            await loadCropsFromContract(accounts[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [loadCropsFromContract, getMaxPlots, isReady]);

  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCropArray(prevCropArray => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        newCropArray.updateGrowth();
        return newCropArray;
      });
      
      setPreviewCropArray(prevPreviewCropArray => {
        const newPreviewCropArray = new CropItemArrayClass(30);
        newPreviewCropArray.copyFrom(prevPreviewCropArray);
        newPreviewCropArray.updateGrowth();
        return newPreviewCropArray;
      });
    }, 1000); // Update every second

    setGrowthTimer(interval);
    return () => clearInterval(interval);
  }, []);

  const startPlanting = () => {
    if (!isFarmMenu) {
      setPreviewCropArray(cropArray);
    }
    setIsFarmMenu(true);
    setIsPlanting(true);
  };

  // Batch plant function - plant best seeds in all empty slots automatically
  const plantAll = useCallback(async () => {
    console.log('=== PLANT ALL FUNCTION CALLED ===');
    console.log('plantAll called - auto-planting best seeds');
    console.log('Current seeds available:', currentSeeds);
    console.log('maxPlots:', maxPlots);
    console.log('previewCropArray:', previewCropArray);
    
    // Ensure farm menu is open to show preview
    if (!isFarmMenu) {
      console.log('Opening farm menu for Plant All');
      setIsFarmMenu(true);
      setIsPlanting(true);
    }
    
    if (maxPlots <= 0) {
      console.log('No plots available - cannot plant');
      alert('You need to level up to unlock farming plots!');
      return;
    }
    
    // Find all empty slots by checking the actual cropArray (not preview)
    const newPreviewCropArray = new CropItemArrayClass(30);
    newPreviewCropArray.copyFrom(cropArray); // Start with actual planted seeds
    
    // Check if there are any empty plots available
    let emptyPlots = 0;
    const occupiedPlots = [];
    const emptyPlotNumbers = [];
    
    for (let i = 0; i < maxPlots; i++) {
      const item = newPreviewCropArray.getItem(i);
      if (item && (item.seedId === null || item.seedId === undefined)) {
        emptyPlots++;
        emptyPlotNumbers.push(i);
      } else if (item && item.seedId) {
        occupiedPlots.push({ plot: i, seedId: item.seedId, status: item.growStatus });
      }
    }
    
    console.log(`Found ${emptyPlots} empty plots:`, emptyPlotNumbers);
    console.log(`Found ${occupiedPlots.length} occupied plots:`, occupiedPlots);
    
    if (emptyPlots === 0) {
      console.log('No empty plots available');
      alert('All your farming plots are already planted!');
      return;
    }
    
    // Sort seeds by quality (best first): LEGENDARY > EPIC > RARE > UNCOMMON > COMMON
    const qualityOrder = {
      'ID_SEED_TYPE_LEGENDARY': 5,
      'ID_SEED_TYPE_EPIC': 4,
      'ID_SEED_TYPE_RARE': 3,
      'ID_SEED_TYPE_UNCOMMON': 2,
      'ID_SEED_TYPE_COMMON': 1
    };
    
    const sortedSeeds = currentSeeds
      .filter(seed => seed.count > 0)
      .sort((a, b) => {
        const aQuality = qualityOrder[a.category] || 0;
        const bQuality = qualityOrder[b.category] || 0;
        if (aQuality !== bQuality) {
          return bQuality - aQuality; // Higher quality first
        }
        return b.yield - a.yield; // Higher yield first for same quality
      });
    
    console.log('Sorted seeds by quality:', sortedSeeds.map(s => ({ id: s.id, label: s.label, category: s.category, count: s.count })));
    
    if (sortedSeeds.length === 0) {
      alert('You don\'t have any seeds to plant!');
      return;
    }
    
    // Plant seeds starting with the best quality
    let totalPlanted = 0;
    let remainingEmptyPlots = emptyPlots;
    
    for (const seed of sortedSeeds) {
      if (remainingEmptyPlots <= 0) break;
      
      const seedsToPlant = Math.min(seed.count, remainingEmptyPlots);
      if (seedsToPlant <= 0) continue;
      
      // Get growth time for this seed type
      const growthTime = await getGrowthTimeForSeed(seed.id);      
      const planted = newPreviewCropArray.plantAll(seed.id, seedsToPlant, growthTime);
      totalPlanted += planted;
      remainingEmptyPlots -= planted;
    }

    // Create a new array and copy the data
    const updatedPreviewArray = new CropItemArrayClass(30);
    updatedPreviewArray.copyFrom(newPreviewCropArray);
    
    // Update both state variables
    setPreviewCropArray(updatedPreviewArray);
    setPreviewUpdateKey(prev => {
      const newKey = prev + 1;
      return newKey;
    });
    
    
    if (totalPlanted === 0) {
      alert('No seeds were planted. All plots may already be occupied.');
      return;
    }
  }, [currentSeeds, getGrowthTimeForSeed, maxPlots, cropArray, isFarmMenu, previewCropArray]);


  const startHarvesting = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const handleHarvestAll = async () => {
    if (!isReady) {
      alert('Contracts not ready yet. Please wait a moment and try again.');
      return;
    }
    
    try {
      console.log('Harvesting all ready crops...');
      
      // Check what crops are available and their status
      console.log('Current crop array status:');
      for (let i = 0; i < cropArray.getLength(); i++) {
        const item = cropArray.getItem(i);
        if (item && item.seedId) {
          console.log(`Plot ${i}:`, {
            seedId: item.seedId,
            growStatus: item.growStatus,
            plantedAt: item.plantedAt,
            growthTime: item.growthTime,
            isReady: item.growStatus === 2
          });
        }
      }
      
      alert('Harvesting all ready crops...');
      
      // Call the contract to harvest all ready crops
      const result = await harvestAll();
      if (result) {
        console.log('Successfully harvested all ready crops');
        alert('✅ Successfully harvested all ready crops!');
        
        // Reload crops from contract to sync state
        if (userAddress) {
          await loadCropsFromContract(userAddress);
        }
        
        setIsFarmMenu(false);
        setIsPlanting(true);
      } else {
        alert('❌ Failed to harvest crops. Please try again.');
      }
    } catch (error) {
      console.error('Failed to harvest all crops:', error);
      alert(`❌ Failed to harvest crops: ${error.message}`);
    }
  };



  const handlePlant = async () => {
    if (!isReady) {
      alert('Contracts not ready yet. Please wait a moment and try again.');
      return;
    }
    
    try {
      console.log('handlePlant called - checking preview array for crops to plant');
      console.log('Current maxPlots:', maxPlots);
      console.log('Current seeds:', currentSeeds);
      
      if (maxPlots <= 0) {
        console.log('No plots available - cannot plant');
        alert('You need to level up to unlock farming plots!');
        setIsFarmMenu(false);
        return;
      }
      
      // Find all newly planted crops in preview (growStatus === -1)
      const cropsToPlant = [];
      for (let i = 0; i < previewCropArray.getLength(); i++) {
        const item = previewCropArray.getItem(i);
        if (item && item.growStatus === -1 && item.seedId) {
          cropsToPlant.push({
            seedId: item.seedId,
            plotNumber: i
          });
          console.log(`Found crop to plant: seedId=${item.seedId}, plot=${i}, status=${item.growStatus}`);
        }
      }
      
      console.log(`Total crops to plant: ${cropsToPlant.length}`);
      
      if (cropsToPlant.length === 0) {
        console.log('No new crops to plant - closing farm menu');
        if (!selectedSeed) {
          alert('Please select a seed first!');
        } else {
          alert('No crops selected to plant. Please click on plots to plant seeds or use "Plant All".');
        }
        setIsFarmMenu(false);
        return;
      }
      
      // Show loading message
      const loadingMessage = cropsToPlant.length === 1 
        ? 'Planting seed...' 
        : `Planting ${cropsToPlant.length} seeds...`;
      alert(loadingMessage);
      
      // Call contract to plant all crops
      if (cropsToPlant.length === 1) {
        // Single plant
        console.log('Planting single crop:', cropsToPlant[0]);
        const result = await plant(cropsToPlant[0].seedId, cropsToPlant[0].plotNumber);
        if (result) {
          console.log('Successfully planted seed:', cropsToPlant[0].seedId, 'at plot:', cropsToPlant[0].plotNumber);
          alert(`✅ Successfully planted seed at plot ${cropsToPlant[0].plotNumber}!`);
        } else {
          alert('❌ Failed to plant seed. Please try again.');
          return;
        }
      } else {
        // Batch plant
        console.log('Planting batch of crops:', cropsToPlant);
        const seedIds = cropsToPlant.map(crop => crop.seedId);
        const plotNumbers = cropsToPlant.map(crop => crop.plotNumber);
        const result = await plantBatch(seedIds, plotNumbers);
        if (result) {
          console.log(`Successfully planted ${cropsToPlant.length} seeds`);
          alert(`✅ Successfully planted ${cropsToPlant.length} seeds!`);
        } else {
          alert('❌ Failed to plant seeds. Please try again.');
          return;
        }
      }
      
      // Reload crops from contract to sync state
      if (userAddress) {
        console.log('Reloading crops from contract...');
        await loadCropsFromContract(userAddress);
      }
      
      // Confirm planting in preview array (transition -1 to 1)
      setPreviewCropArray(prevPreviewCropArray => {
        const newPreviewCropArray = new CropItemArrayClass(30);
        newPreviewCropArray.copyFrom(prevPreviewCropArray);
        newPreviewCropArray.confirmPlanting();
        return newPreviewCropArray;
      });
      
      console.log('Planting complete - closing farm menu');
      setIsFarmMenu(false);
    } catch (error) {
      console.error('Failed to plant crops:', error);
      alert(`❌ Failed to plant crops: ${error.message}`);
    }
  };

  const handleHarvest = async () => {
    if (!isReady) {
      alert('Contracts not ready yet. Please wait a moment and try again.');
      return;
    }
    
    if (!selectedIndexes || selectedIndexes.length === 0) {
      alert('Please select crops to harvest first!');
      return;
    }
    
    try {
      console.log(`Harvesting ${selectedIndexes.length} selected crops...`);
      console.log('Selected indexes:', selectedIndexes);
      
      // Check which crops are actually ready to harvest
      const readyCrops = [];
      const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      console.log('Current timestamp:', currentTime);
      
      for (const idx of selectedIndexes) {
        if (idx >= 0 && idx < cropArray.getLength()) {
          const item = cropArray.getItem(idx);
          const endTime = item?.plantedAt + item?.growthTime;
          const isActuallyReady = currentTime >= endTime;
          
          console.log(`Plot ${idx}:`, {
            seedId: item?.seedId,
            growStatus: item?.growStatus,
            plantedAt: item?.plantedAt,
            growthTime: item?.growthTime,
            endTime: endTime,
            currentTime: currentTime,
            isActuallyReady: isActuallyReady,
            timeRemaining: endTime - currentTime
          });
          
          if (item && item.seedId && item.growStatus === 2 && isActuallyReady) {
            readyCrops.push(idx);
          } else {
            console.log(`Plot ${idx} is not ready to harvest (status: ${item?.growStatus}, actually ready: ${isActuallyReady})`);
          }
        }
      }
      
      if (readyCrops.length === 0) {
        alert('No selected crops are ready to harvest! Make sure crops are fully grown.');
        return;
      }
      
      console.log(`Found ${readyCrops.length} ready crops to harvest:`, readyCrops);
      alert(`Harvesting ${readyCrops.length} ready crops...`);
      
      let successCount = 0;
      // Call the contract to harvest each ready crop
      for (const idx of readyCrops) {
        const result = await harvest(idx);
        if (result) {
          console.log('Successfully harvested crop at plot:', idx);
          successCount++;
        }
      }
      
      // Reload crops from contract to sync state
      if (userAddress) {
        await loadCropsFromContract(userAddress);
      }
      
      if (successCount > 0) {
        alert(`✅ Successfully harvested ${successCount} crops!`);
      } else {
        alert('❌ Failed to harvest crops. Please try again.');
        return;
      }
      
      setSelectedIndexes([]);
      setIsFarmMenu(false);
      setIsPlanting(true);
    } catch (error) {
      console.error('Failed to harvest crops:', error);
      alert(`❌ Failed to harvest crops: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
  };

  const onClickCrop = (isShift, index) => {
    console.log('onClickCrop called:', { isShift, index, isPlanting, selectedSeed });
    
    if (isPlanting) {
      // Check if plot is empty (no seedId)
      const plotData = cropArray.getItem(index);
      if (plotData && plotData.seedId) {
        console.log('Plot already has a crop, ignoring click');
        return;
      }
      
      if (isShift && selectedSeed) {
        // Check if selected seed is still available
        const currentSeed = currentSeeds.find((s) => s.id === selectedSeed);
        if (!currentSeed || currentSeed.count <= 0) {
          // selected seed no longer available or exhausted
          console.log('Selected seed no longer available, opening seed dialog');
          setSelectedSeed(null);
          setCurrentFieldIndex(index);
          setIsSelectCropDialog(true);
          return;
        }
        
        // Plant the selected seed directly
        console.log('Planting selected seed:', selectedSeed, 'at plot:', index);
        setCurrentFieldIndex(index);
        handleClickSeedFromDialog(selectedSeed, index);
      } else {
        // Open seed selection dialog and show farm menu
        console.log('Opening seed selection dialog for plot:', index);
        setCurrentFieldIndex(index);
        setIsSelectCropDialog(true);
        // Show farm menu when selecting a seed
        if (!isFarmMenu) {
          setPreviewCropArray(cropArray);
          setIsFarmMenu(true);
        }
      }
    } else {
      // Harvesting mode - toggle selection
      console.log('Toggling harvest selection for plot:', index);
      setSelectedIndexes((prev) => {
        const exists = prev.includes(index);
        if (exists) return prev.filter((i) => i !== index);
        return [...prev, index];
      });
    }
  };
  const handleClickSeedFromDialog = async (id, fieldIndex) => {
    console.log('handleClickSeedFromDialog called:', { id, fieldIndex, currentFieldIndex });
    setIsSelectCropDialog(false);
    const idx = typeof fieldIndex === "number" ? fieldIndex : currentFieldIndex;
    if (idx < 0) {
      console.log('Invalid field index:', idx);
      return;
    }
    
    // Check if seed is available in current seeds from contract
    const seed = currentSeeds.find((s) => s.id === id);
    if (!seed || seed.count <= 0) {
      console.log('Seed not available or count is 0:', seed);
      alert('You don\'t have any seeds of this type!');
      return;
    }
    
    console.log('Planting seed:', id, 'at plot:', idx);
    
    // Just update the preview - don't call contract yet
    const newPreviewCropArray = new CropItemArrayClass(30);
    newPreviewCropArray.copyFrom(previewCropArray);
    
    // Get growth time for this seed type from contract
    const growthTime = await getGrowthTimeForSeed(id);
    console.log('Growth time for seed', id, ':', growthTime);
    
    newPreviewCropArray.plantCropAt(idx, id, growthTime);
    
    setPreviewCropArray(newPreviewCropArray);
    setSelectedSeed(id);
    
    console.log('Seed planted in preview, selectedSeed set to:', id);
  };

  const dialogs = [
    {
      id: ID_FARM_HOTSPOTS.DEX,
      component: FarmerDialog,
      label: "FARMER",
      header: dialogFrames.modalHeaderSeeds,
      actions: {
        plant: startPlanting,
        plantAll: plantAll,
        harvest: startHarvesting,
        harvestAll: handleHarvestAll,
      },
    },
  ];
  return (
    <div>
      
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/farm.gif"
        hotspots={hotspots}
        width={width}
        height={height}
        dialogs={dialogs}
        hideMenu={isFarmMenu}
      >
        <FarmInterface
          key={isFarmMenu ? `preview-${previewUpdateKey}` : 'main'}
          cropArray={isFarmMenu ? previewCropArray : cropArray}
          onClickCrop={onClickCrop}
          isFarmMenu={isFarmMenu}
          isPlanting={isPlanting}
          maxPlots={maxPlots}
          totalPlots={30}
        />
      </PanZoomViewport>
      {isFarmMenu && (
        <FarmMenu
          isPlant={isPlanting}
          onCancel={handleCancel}
          onPlant={handlePlant}
          onHarvest={handleHarvest}
          onPlantAll={plantAll}
          selectedSeed={selectedSeed}
        />
      )}
      {isSelectCropDialog && (
        <SelectSeedDialog
          onClose={() => setIsSelectCropDialog(false)}
          onClickSeed={handleClickSeedFromDialog}
        />
      )}
    </div>
  );
};

export default Farm;
