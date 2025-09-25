import React, { useState, useEffect, useCallback } from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_HOTSPOTS, FARM_VIEWPORT } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farm_Farmer";
import { dialogFrames } from "../constants/_baseimages";
import FarmInterface from "../layouts/FarmInterface";
import FarmMenu from "../layouts/FarmInterface/FarmMenu";
import SelectSeedDialog from "../containers/Farm_SelectSeedDialog";
import { useItems } from "../hooks/useItems";
import { useFarming } from "../hooks/useContracts";
import { useAgwEthersAndService } from "../hooks/useContractBase";
import { useNotification } from "../contexts/NotificationContext";
import { useGameState } from "../contexts/GameStateContext";
import { CropItemArrayClass } from "../models/crop";
import { handleContractError } from "../utils/errorHandler";
import { ID_POTION_ITEMS } from "../constants/app_ids";
const Farm = () => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const { seeds: currentSeeds, refetch: refetchSeeds } = useItems();
  const { account, contractService } = useAgwEthersAndService();
  const {
    plant,
    plantBatch,
    harvest,
    harvestMany,
    harvestAll,
    getMaxPlots,
    getUserCrops,
    getGrowthTime,
    applyGrowthElixir,
    applyPesticide,
    applyFertilizer,
    loading: farmingLoading,
  } = useFarming();
  const { show } = useNotification();
  const { potionUsageState, clearPotionUsage } = useGameState();
  const [isFarmMenu, setIsFarmMenu] = useState(false);
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
  const [userAddress, setUserAddress] = useState(null);
  const [maxPlots, setMaxPlots] = useState(0);
  const [previewUpdateKey, setPreviewUpdateKey] = useState(0);
  const [userCropsLoaded, setUserCropsLoaded] = useState(false);
  const [usedSeedsInPreview, setUsedSeedsInPreview] = useState({}); // Track seeds used in preview
  
  // Potion usage state
  const [isUsingPotion, setIsUsingPotion] = useState(false);
  const [selectedPotion, setSelectedPotion] = useState(null);

  // Force re-render when crop array changes
  useEffect(() => {
    setPreviewUpdateKey(prev => prev + 1);
  }, [cropArray]);

  // Listen for potion usage state from context
  useEffect(() => {
    if (potionUsageState.isActive) {
      // Trigger potion usage mode
      setIsUsingPotion(true);
      setSelectedPotion({
        id: potionUsageState.potionId,
        name: potionUsageState.potionName
      });
      setIsPlanting(false); // Switch to potion mode
      setIsFarmMenu(true); // Show farm menu
      setSelectedIndexes([]); // Clear any existing selections
      
      // Clear the context state
      clearPotionUsage();
    }
  }, [potionUsageState.isActive, potionUsageState.potionId, potionUsageState.potionName, clearPotionUsage]);

  // Get growth time for different seed types
  const getGrowthTimeForSeed = useCallback(
    async (seedId) => {
      // Get growth time from contract instead of hardcoded values
      try {
        const growthTime = await getGrowthTime(seedId);
        return growthTime;
      } catch (error) {
        const { message } = handleContractError(error, 'getting growth time');
        console.error("Failed to get growth time from contract:", message);
        return 60; // Default fallback
      }
    },
    [getGrowthTime]
  );

  // Calculate available seeds (original count minus used in preview)
  const getAvailableSeeds = useCallback(() => {
    return currentSeeds
      .map((seed) => ({
        ...seed,
        count: Math.max(0, seed.count - (usedSeedsInPreview[seed.id] || 0)),
      }))
      .filter((seed) => seed.count > 0);
  }, [currentSeeds, usedSeedsInPreview]);


  // Load crops from contract
  const loadCropsFromContract = useCallback(
    async (address) => {
      try {
        setUserCropsLoaded(false);

        // Get all user crops in a single call
        const crops = await getUserCrops(address);

        // Collect unique seedIds to fetch growth times once per seed type
        const uniqueSeedIds = Array.from(
          new Set(
            crops
              .map((crop) => crop.seedId)
              .filter((sid) => sid && sid !== 0n)
          )
        );

        const growthTimeCache = new Map();
        await Promise.all(
          uniqueSeedIds.map(async (sid) => {
            const gt = await getGrowthTimeForSeed(sid);
            growthTimeCache.set(sid.toString(), gt);
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
              const endTime = crop.endTime;
              const growthTime = growthTimeCache.get(seedIdBig.toString()) ?? 60;
              
              // Calculate plantedAt based on original growth time and current endTime
              // The endTime might be modified by Growth Elixir, so we need to account for that
              const originalEndTime = Math.floor((item.plantedAt || 0) / 1000) + growthTime;
              const timeDifference = originalEndTime - endTime;
              
              // If endTime is less than expected, it means Growth Elixir was applied
              if (timeDifference > 0) {
                // Growth Elixir was applied - adjust plantedAt to reflect the speed boost
                item.plantedAt = (endTime - growthTime) * 1000;
              } else {
                // Normal growth - use standard calculation
                item.plantedAt = (endTime - growthTime) * 1000;
              }
              
              item.growthTime = growthTime;
              const isReady = endTime <= nowSec;
              item.growStatus = isReady ? 2 : 1;
              
              // Store potion effect multipliers for display
              item.produceMultiplierX1000 = crop.produceMultiplierX1000 || 1000;
              item.tokenMultiplierX1000 = crop.tokenMultiplierX1000 || 1000;
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
    [getGrowthTimeForSeed, getUserCrops]
  );

  // Load user address and crops from contract
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Use account from AGW service
        if (!account) {
          return;
        }
        
        setUserAddress(account);

        // Only proceed if contract service is ready
        if (!contractService) {
          return;
        }

        // Get max plots for this user
        try {
          // First check if user has a profile
          const profile = await contractService.getProfile(account);
          
          if (!profile || !profile.exists) {
            // User doesn't have a profile, set default max plots for level 0
            setMaxPlots(15);
          } else {
            // User has a profile, get actual max plots
            const userMaxPlots = await getMaxPlots(account);
            
            if (userMaxPlots && userMaxPlots > 0) {
              setMaxPlots(Number(userMaxPlots));
            } else {
              setMaxPlots(15); // Default for level 0
            }
          }
        } catch (error) {
          const { message } = handleContractError(error, 'getting max plots');
          console.error("Failed to get max plots:", message);
          setMaxPlots(15); // Default fallback for level 0
        }

        await loadCropsFromContract(account);
      } catch (error) {
        const { message } = handleContractError(error, 'loading user data');
        console.error("Failed to load user data:", message);
      }
    };

    loadUserData();
  }, [account, contractService, loadCropsFromContract, getMaxPlots]);

  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update growth when not in farm menu to prevent flickering during harvest selection
      if (!isFarmMenu) {
        setCropArray((prevCropArray) => {
          const newCropArray = new CropItemArrayClass(30);
          newCropArray.copyFrom(prevCropArray);
          newCropArray.updateGrowth();
          return newCropArray;
        });
      }

      // Always update preview array growth, but only if we're in farm menu
      if (isFarmMenu) {
        setPreviewCropArray((prevPreviewCropArray) => {
          const newPreviewCropArray = new CropItemArrayClass(30);
          newPreviewCropArray.copyFrom(prevPreviewCropArray);
          newPreviewCropArray.updateGrowth();
          return newPreviewCropArray;
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
        occupiedPlots.push({
          plot: i,
          seedId: item.seedId,
          status: item.growStatus,
        });
      }
    }

    if (emptyPlots === 0) {
      show("All your farming plots are already planted!", "info");
      return;
    }

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
        return b.yield - a.yield; // Higher yield first for same quality
      });


    if (sortedSeeds.length === 0) {
      show("You don't have any seeds to plant!", "info");
      return;
    }

    // Plant seeds starting with the best quality
    let totalPlanted = 0;
    let remainingEmptyPlots = emptyPlots;
    const newUsedSeeds = { ...usedSeedsInPreview }; // Track seeds used in this plantAll operation

    for (const seed of sortedSeeds) {
      if (remainingEmptyPlots <= 0) break;

      const seedsToPlant = Math.min(seed.count, remainingEmptyPlots);
      if (seedsToPlant <= 0) continue;

      // Get growth time for this seed type
      const growthTime = await getGrowthTimeForSeed(seed.id);
      const planted = newPreviewCropArray.plantAll(
        seed.id,
        seedsToPlant,
        growthTime
      );
      totalPlanted += planted;
      remainingEmptyPlots -= planted;

      // Track the seeds used in this operation
      newUsedSeeds[seed.id] = (newUsedSeeds[seed.id] || 0) + planted;
    }

    // Create a new array and copy the data
    const updatedPreviewArray = new CropItemArrayClass(30);
    updatedPreviewArray.copyFrom(newPreviewCropArray);

    // Update both state variables
    setPreviewCropArray(updatedPreviewArray);
    setUsedSeedsInPreview(newUsedSeeds); // Update used seeds tracking
    setPreviewUpdateKey((prev) => {
      const newKey = prev + 1;
      return newKey;
    });


    if (totalPlanted === 0) {
      show("No seeds were planted. All plots may already be occupied.", "info");
      return;
    }
  }, [userCropsLoaded, maxPlots, isFarmMenu, cropArray, currentSeeds, usedSeedsInPreview, show, getGrowthTimeForSeed]);

  const startHarvesting = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  // Start potion usage mode
  const startPotionUsage = (potionId, potionName) => {
    setSelectedPotion({ id: potionId, name: potionName });
    setIsUsingPotion(true);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const handleHarvestAll = async () => {
    if (!contractService) {
      show(
        "Contract service not ready yet. Please wait a moment and try again.",
        "warning"
      );
      return;
    }

    try {

      // Build list of all ready plots
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

      show(`Harvesting ${readySlots.length} ready crops...`, "info");

      let ok = false;
      if (readySlots.length > 1 && typeof harvestMany === "function") {
        const res = await harvestMany(readySlots);
        ok = !!res;
      } else if (readySlots.length === 1) {
        const res = await harvest(readySlots[0]);
        ok = !!res;
      } else {
        // Fallback if batch method is unavailable
        const res = await harvestAll();
        ok = !!res;
      }

      if (!ok) {
        show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }

      // Reload crops from contract to sync state
      if (userAddress) {
        // Small delay to ensure blockchain state is updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadCropsFromContract(userAddress);
        
        // Force a re-render by updating the preview update key
        setPreviewUpdateKey(prev => prev + 1);
      }

      show(`✅ Successfully harvested ${readySlots.length} crops!`, "success");
      // Clear any selection state after harvest all
      setSelectedIndexes([]);
      setIsFarmMenu(false);
      setIsPlanting(true);
      
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
    if (!contractService) {
      show(
        "Contract service not ready yet. Please wait a moment and try again.",
        "warning"
      );
      return;
    }

    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      show("You need to level up to unlock farming plots!", "info");
      setIsFarmMenu(false);
      return;
    }

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
      const loadingNotification = show(loadingMessage, "info", 300000); // 5 minutes timeout

      // Call contract to plant all crops
      if (cropsToPlant.length === 1) {
        // Single plant
        const result = await plant(
          cropsToPlant[0].seedId,
          cropsToPlant[0].plotNumber
        );
        if (result) {
          // Dismiss loading notification
          loadingNotification.dismiss();
          show(
            `✅ Successfully planted seed at plot ${cropsToPlant[0].plotNumber}!`,
            "success",
            3000 // 3 seconds timeout
          );
        } else {
          // Dismiss loading notification
          loadingNotification.dismiss();
          show("❌ Failed to plant seed. Please try again.", "error", 3000);
          return;
        }
      } else {
        // Batch plant
        const seedIds = cropsToPlant.map((crop) => crop.seedId);
        const plotNumbers = cropsToPlant.map((crop) => crop.plotNumber);
        const result = await plantBatch(seedIds, plotNumbers);
        if (result) {
          // Dismiss loading notification
          loadingNotification.dismiss();
          show(
            `✅ Successfully planted ${cropsToPlant.length} seeds!`,
            "success",
            3000 // 3 seconds timeout
          );
        } else {
          // Dismiss loading notification
          loadingNotification.dismiss();
          show("❌ Failed to plant seeds. Please try again.", "error", 3000);
          return;
        }
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
      if (userAddress) {
        await Promise.all([
          loadCropsFromContract(userAddress),
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
      }

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
      console.error("Failed to plant crops:", message);
      show(`❌ ${message}`, "error");
    }
  };

  const handleHarvest = async () => {
    if (!contractService) {
      show(
        "Contract service not ready yet. Please wait a moment and try again.",
        "warning"
      );
      return;
    }

    if (!selectedIndexes || selectedIndexes.length === 0) {
      show("Please select crops to harvest first!", "info");
      return;
    }

    try {

      // Check which crops are actually ready to harvest
      const readyCrops = [];
      const currentTime = Math.floor(Date.now());

      for (const idx of selectedIndexes) {
        if (idx >= 0 && idx < cropArray.getLength()) {
          const item = cropArray.getItem(idx);
          const endTime = item?.plantedAt + item?.growthTime;
          const isActuallyReady = currentTime >= endTime;
          

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
      show(`Harvesting ${readyCrops.length} ready crops...`, "info");

      let successCount = 0;
      // Prefer batch harvest when multiple crops are ready
      if (readyCrops.length > 1 && typeof harvestMany === "function") {
        const result = await harvestMany(readyCrops);
        if (result) {
          successCount = readyCrops.length;
        }
      } else {
        // Fallback to single harvest
        for (const idx of readyCrops) {
          const result = await harvest(idx);
          if (result) {
            successCount++;
          }
        }
      }

      // Reload crops from contract to sync state
      if (userAddress) {
        // Small delay to ensure blockchain state is updated
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadCropsFromContract(userAddress);
        
        // Force a re-render by updating the preview update key
        setPreviewUpdateKey(prev => prev + 1);
      }

      if (successCount > 0) {
        show(`✅ Successfully harvested ${successCount} crops!`, "success");
        // Clear selection state after successful harvest
        setSelectedIndexes([]);
        setIsFarmMenu(false);
        setIsPlanting(true);
        
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

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
    setIsUsingPotion(false);
    setSelectedPotion(null);
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

  // Handle potion application
  const handlePotionUse = async () => {
    if (!selectedIndexes || selectedIndexes.length === 0) {
      show("Please select plots to apply the potion to!", "info");
      return;
    }

    if (!selectedPotion) {
      show("No potion selected!", "error");
      return;
    }

    try {
      let successCount = 0;
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

      show(`Applying ${selectedPotion.name} to ${selectedIndexes.length} plots...`, "info");

      // Apply potion to each selected plot
      for (const plotIndex of selectedIndexes) {
        const result = await potionFunction(plotIndex);
        if (result) {
          successCount++;
        }
      }

      if (successCount > 0) {
        show(`✅ Successfully applied ${selectedPotion.name} to ${successCount} plots!`, "success");
        
        // Reload crops from contract to show updated potion effects
        if (userAddress) {
          // Small delay to ensure blockchain state is updated
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadCropsFromContract(userAddress);
          
          // Force a re-render by updating the preview update key
          setPreviewUpdateKey(prev => prev + 1);
        }
        
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

    if (isUsingPotion) {
      // Potion usage mode - only allow selection of plots that are growing (not ready to harvest)
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

      // Toggle selection for potion usage
      setSelectedIndexes((prev) => {
        const exists = prev.includes(index);
        if (exists) return prev.filter((i) => i !== index);
        return [...prev, index];
      });
      return;
    }

    if (isPlanting) {
      // Check if plot is empty (no seedId)
      const plotData = cropArray.getItem(index);
      if (plotData && plotData.seedId) {
        return;
      }

      // Require Shift for quick-plant; otherwise open the seed dialog
      if (selectedSeed && isShift) {
        // Use preview-adjusted availability
        const availableSeeds = getAvailableSeeds();
        const selectedAvailable = availableSeeds.find((s) => s.id === selectedSeed);
        if (!selectedAvailable || selectedAvailable.count <= 0) {
          setSelectedSeed(null);
          setCurrentFieldIndex(index);
          setIsSelectCropDialog(true);
          return;
        }
        if (!isFarmMenu) {
          setPreviewCropArray(cropArray);
          setIsFarmMenu(true);
        }
        
        // Plant the selected seed directly
        setCurrentFieldIndex(index);
        handleClickSeedFromDialog(selectedSeed, index);
        return;
      }

      // Open selection dialog when Shift not held or no seed selected
      setCurrentFieldIndex(index);
      setIsSelectCropDialog(true);
      if (!isFarmMenu) {
        setPreviewCropArray(cropArray);
        setIsFarmMenu(true);
      }
    } else {
      // Harvesting mode - toggle selection
      setSelectedIndexes((prev) => {
        const exists = prev.includes(index);
        if (exists) return prev.filter((i) => i !== index);
        return [...prev, index];
      });
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
    const seed = availableSeeds.find((s) => s.id === id);
    if (!seed || seed.count <= 0) {
      show("You don't have any more seeds of this type available!", "info");
      return;
    }

    // Just update the preview - don't call contract yet
    const newPreviewCropArray = new CropItemArrayClass(30);
    newPreviewCropArray.copyFrom(previewCropArray);

    // Get growth time for this seed type from contract
    const growthTime = await getGrowthTimeForSeed(id);

    newPreviewCropArray.plantCropAt(idx, id, growthTime);

    // Update used seeds tracking
    setUsedSeedsInPreview((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));

    setPreviewCropArray(newPreviewCropArray);
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
        usePotion: startPotionUsage,
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
    </div>
  );
};

export default Farm;
