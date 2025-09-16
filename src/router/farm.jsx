/* eslint-disable react-hooks/exhaustive-deps */
/* global BigInt */
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
import { useNotification } from "../contexts/NotificationContext";
import { CropItemArrayClass } from "../models/crop";
const Farm = () => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const { seeds: currentSeeds, refetch: refetchSeeds } = useSeeds(); // Get seeds and refetch from contract
  const { contracts, isReady } = useContracts();
  const {
    plant,
    plantBatch,
    harvest,
    harvestMany,
    harvestAll,
    getMaxPlots,
    getCrop,
    getGrowthTime,
  } = useFarming(contracts);
  const { show } = useNotification();
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

  // Arrays are always 30 plots (15 per side), but maxPlots determines which are enabled

  // Get growth time for different seed types
  const getGrowthTimeForSeed = useCallback(
    async (seedId) => {
      // Get growth time from contract instead of hardcoded values
      try {
        const growthTime = await getGrowthTime(seedId);
        return growthTime;
      } catch (error) {
        console.error("Failed to get growth time from contract:", error);
        return 60; // Default fallback
      }
    },
    [getGrowthTime]
  );

  // Calculate available seeds (original count minus used in preview)
  const getAvailableSeeds = useCallback(() => {
    const availableSeeds = currentSeeds
      .map((seed) => ({
        ...seed,
        count: Math.max(0, seed.count - (usedSeedsInPreview[seed.id] || 0)),
      }))
      .filter((seed) => seed.count > 0);

    console.log(
      "getAvailableSeeds - Original seeds:",
      currentSeeds.map((s) => ({ id: s.id, count: s.count }))
    );
    console.log(
      "getAvailableSeeds - Used seeds in preview:",
      usedSeedsInPreview
    );
    console.log(
      "getAvailableSeeds - Available seeds:",
      availableSeeds.map((s) => ({ id: s.id, count: s.count }))
    );

    return availableSeeds;
  }, [currentSeeds, usedSeedsInPreview]);

  // Load crops from contract
  const loadCropsFromContract = useCallback(
    async (address) => {
      try {
        console.log("Loading crops for address:", address);
        setUserCropsLoaded(false);

        // Read all plots directly to avoid gaps from contract count(), in parallel
        const totalPlotsToCheck = 30;
        const indices = Array.from({ length: totalPlotsToCheck }, (_, i) => i);
        const crops = await Promise.all(
          indices.map((i) =>
            getCrop(address, i)
              .then((c) => ({ index: i, crop: c }))
              .catch((e) => ({ index: i, error: e }))
          )
        );

        // Collect unique seedIds to fetch growth times once per seed type
        const uniqueSeedIds = Array.from(
          new Set(
            crops
              .map((r) => r.crop?.seedId)
              .filter((sid) => sid && sid !== "0")
          )
        ).map((sid) => BigInt(sid));

        const growthTimeCache = new Map();
        await Promise.all(
          uniqueSeedIds.map(async (sid) => {
            const gt = await getGrowthTimeForSeed(sid);
            growthTimeCache.set(sid.toString(), gt);
          })
        );

        const nowSec = Math.floor(Date.now() / 1000);
        const newCropArray = new CropItemArrayClass(totalPlotsToCheck);
        for (const r of crops) {
          if (r.crop && r.crop.seedId && r.crop.seedId !== "0") {
            const item = newCropArray.getItem(r.index);
            if (item) {
              const seedIdBig = BigInt(r.crop.seedId);
              item.seedId = seedIdBig;
              const endTime = Number(r.crop.endTime);
              const growthTime = growthTimeCache.get(seedIdBig.toString()) ?? 60;
              item.plantedAt = (endTime - growthTime) * 1000; // ms
              item.growthTime = growthTime;
              const isReady = endTime <= nowSec;
              item.growStatus = isReady ? 2 : 1;
            }
          } else {
            newCropArray.removeCropAt(r.index);
          }
        }

        setCropArray(newCropArray);
        setPreviewCropArray(newCropArray);
        setUserCropsLoaded(true);
        console.log("Final crop array (full scan):", newCropArray);
      } catch (error) {
        console.error("Failed to load crops from contract:", error);
        const emptyArray = new CropItemArrayClass(30);
        setCropArray(emptyArray);
        setPreviewCropArray(emptyArray);
        setUserCropsLoaded(true);
      }
    },
    [getCrop, getGrowthTimeForSeed]
  );

  // Load user address and crops from contract
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user address from wallet
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);

            // Only proceed if contracts are ready
            if (!isReady) {
              console.log("Contracts not ready yet, skipping data load");
              return;
            }

            // Get max plots for this user
            try {
              const userMaxPlots = await getMaxPlots(accounts[0]);
              console.log("Max plots for user:", userMaxPlots);
              if (userMaxPlots && userMaxPlots > 0) {
                setMaxPlots(Number(userMaxPlots));
              } else {
                console.warn(
                  "No max plots returned, user has no plots available"
                );
                setMaxPlots(0);
              }
            } catch (error) {
              console.error("Failed to get max plots:", error);
              setMaxPlots(0); // No plots available
            }

            await loadCropsFromContract(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };

    loadUserData();
  }, [loadCropsFromContract, getMaxPlots, isReady]);

  // Growth timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCropArray((prevCropArray) => {
        const newCropArray = new CropItemArrayClass(30);
        newCropArray.copyFrom(prevCropArray);
        newCropArray.updateGrowth();
        return newCropArray;
      });

      setPreviewCropArray((prevPreviewCropArray) => {
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
    // Check if userCrops are loaded before allowing planting mode
    if (!userCropsLoaded) {
      console.log("User crops not loaded yet - cannot start planting");
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      console.log("No farming plots available - cannot start planting");
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
    console.log("=== PLANT ALL FUNCTION CALLED ===");
    console.log("plantAll called - auto-planting best seeds");
    console.log("Current seeds available:", currentSeeds);
    console.log("maxPlots:", maxPlots);
    console.log("previewCropArray:", previewCropArray);
    console.log("userCropsLoaded:", userCropsLoaded);

    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      console.log("User crops not loaded yet - cannot plant");
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      console.log("No farming plots available - cannot plant");
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    // Ensure farm menu is open to show preview
    if (!isFarmMenu) {
      console.log("Opening farm menu for Plant All");
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

    console.log(`Found ${emptyPlots} empty plots:`, emptyPlotNumbers);
    console.log(`Found ${occupiedPlots.length} occupied plots:`, occupiedPlots);

    if (emptyPlots === 0) {
      console.log("No empty plots available");
      show("All your farming plots are already planted!", "info");
      return;
    }

    // Sort seeds by quality (best first): LEGENDARY > EPIC > RARE > UNCOMMON > COMMON
    const qualityOrder = {
      ID_SEED_TYPE_LEGENDARY: 5,
      ID_SEED_TYPE_EPIC: 4,
      ID_SEED_TYPE_RARE: 3,
      ID_SEED_TYPE_UNCOMMON: 2,
      ID_SEED_TYPE_COMMON: 1,
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

    console.log(
      "Sorted seeds by quality:",
      sortedSeeds.map((s) => ({
        id: s.id,
        label: s.label,
        category: s.category,
        count: s.count,
      }))
    );

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

    console.log("Plant All - Updated used seeds tracking:", newUsedSeeds);
    console.log(
      "Plant All - Available seeds after planting:",
      getAvailableSeeds()
    );

    if (totalPlanted === 0) {
      show("No seeds were planted. All plots may already be occupied.", "info");
      return;
    }
  }, [
    currentSeeds,
    maxPlots,
    previewCropArray,
    userCropsLoaded,
    isFarmMenu,
    cropArray,
    usedSeedsInPreview,
    getAvailableSeeds,
    getGrowthTimeForSeed,
  ]);

  const startHarvesting = () => {
    setPreviewCropArray(cropArray);
    setIsPlanting(false);
    setIsFarmMenu(true);
  };

  const handleHarvestAll = async () => {
    if (!isReady) {
      show(
        "Contracts not ready yet. Please wait a moment and try again.",
        "warning"
      );
      return;
    }

    try {
      console.log("Harvest All clicked - computing ready plots");

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
        await loadCropsFromContract(userAddress);
      }

      show(`✅ Successfully harvested ${readySlots.length} crops!`, "success");
      setIsFarmMenu(false);
      setIsPlanting(true);
    } catch (error) {
      console.error("Failed during Harvest All:", error);
      show(
        `❌ Failed to harvest crops: ${error?.message || "Unknown"}`,
        "error"
      );
    }
  };

  const handlePlant = async () => {
    if (!isReady) {
      show(
        "Contracts not ready yet. Please wait a moment and try again.",
        "warning"
      );
      return;
    }

    // Check if userCrops are loaded before allowing planting
    if (!userCropsLoaded) {
      console.log("User crops not loaded yet - cannot plant");
      show("Please wait for your farm data to load before planting seeds.", "info");
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      console.log("No farming plots available - cannot plant");
      show("You need to level up to unlock farming plots!", "info");
      setIsFarmMenu(false);
      return;
    }

    try {
      console.log(
        "handlePlant called - checking preview array for crops to plant"
      );
      console.log("Current maxPlots:", maxPlots);
      console.log("Current seeds:", currentSeeds);
      console.log("userCropsLoaded:", userCropsLoaded);

      // Find all newly planted crops in preview (growStatus === -1)
      const cropsToPlant = [];
      for (let i = 0; i < previewCropArray.getLength(); i++) {
        const item = previewCropArray.getItem(i);
        if (item && item.growStatus === -1 && item.seedId) {
          cropsToPlant.push({
            seedId: item.seedId,
            plotNumber: i,
          });
          console.log(
            `Found crop to plant: seedId=${item.seedId}, plot=${i}, status=${item.growStatus}`
          );
        }
      }

      console.log(`Total crops to plant: ${cropsToPlant.length}`);

      if (cropsToPlant.length === 0) {
        console.log("No new crops to plant - closing farm menu");
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

      // Show loading message
      const loadingMessage =
        cropsToPlant.length === 1
          ? "Planting seed..."
          : `Planting ${cropsToPlant.length} seeds...`;
      show(loadingMessage, "info");

      // Call contract to plant all crops
      if (cropsToPlant.length === 1) {
        // Single plant
        console.log("Planting single crop:", cropsToPlant[0]);
        const result = await plant(
          cropsToPlant[0].seedId,
          cropsToPlant[0].plotNumber
        );
        if (result) {
          console.log(
            "Successfully planted seed:",
            cropsToPlant[0].seedId,
            "at plot:",
            cropsToPlant[0].plotNumber
          );
          show(
            `✅ Successfully planted seed at plot ${cropsToPlant[0].plotNumber}!`,
            "success"
          );
        } else {
          show("❌ Failed to plant seed. Please try again.", "error");
          return;
        }
      } else {
        // Batch plant
        console.log("Planting batch of crops:", cropsToPlant);
        const seedIds = cropsToPlant.map((crop) => crop.seedId);
        const plotNumbers = cropsToPlant.map((crop) => crop.plotNumber);
        const result = await plantBatch(seedIds, plotNumbers);
        if (result) {
          console.log(`Successfully planted ${cropsToPlant.length} seeds`);
          show(
            `✅ Successfully planted ${cropsToPlant.length} seeds!`,
            "success"
          );
        } else {
          show("❌ Failed to plant seeds. Please try again.", "error");
          return;
        }
      }

      // Reload crops and seeds concurrently to reduce total wait time
      if (userAddress) {
        console.log("Reloading crops and seeds concurrently...");
        await Promise.all([
          loadCropsFromContract(userAddress),
          (async () => {
            try {
              if (typeof refetchSeeds === "function") {
                await refetchSeeds();
              }
            } catch (e) {
              console.warn("Failed to refetch seeds after planting:", e);
            }
          })(),
        ]);
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

      console.log("Planting complete - closing farm menu");
      setIsFarmMenu(false);
    } catch (error) {
      console.error("Failed to plant crops:", error);
      show(`❌ Failed to plant crops: ${error?.message || "Unknown"}`, "error");
    }
  };

  const handleHarvest = async () => {
    if (!isReady) {
      show(
        "Contracts not ready yet. Please wait a moment and try again.",
        "warning"
      );
      return;
    }

    if (!selectedIndexes || selectedIndexes.length === 0) {
      show("Please select crops to harvest first!", "info");
      return;
    }

    try {
      console.log(`Harvesting ${selectedIndexes.length} selected crops...`);
      console.log("Selected indexes:", selectedIndexes);

      // Check which crops are actually ready to harvest
      const readyCrops = [];
      const currentTime = Math.floor(Date.now()); // Current timestamp in seconds
      console.log("Current timestamp:", currentTime);

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
            timeRemaining: endTime - currentTime,
          });

          if (item && item.seedId && item.growStatus === 2 && isActuallyReady) {
            readyCrops.push(idx);
          } else {
            console.log(
              `Plot ${idx} is not ready to harvest (status: ${item?.growStatus}, actually ready: ${isActuallyReady})`
            );
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

      console.log(
        `Found ${readyCrops.length} ready crops to harvest:`,
        readyCrops
      );
      show(`Harvesting ${readyCrops.length} ready crops...`, "info");

      let successCount = 0;
      // Prefer batch harvest when multiple crops are ready
      if (readyCrops.length > 1 && typeof harvestMany === "function") {
        const result = await harvestMany(readyCrops);
        if (result) {
          successCount = readyCrops.length;
          console.log(`Successfully batch-harvested ${successCount} crops`);
        }
      } else {
        // Fallback to single harvest
        for (const idx of readyCrops) {
          const result = await harvest(idx);
          if (result) {
            console.log("Successfully harvested crop at plot:", idx);
            successCount++;
          }
        }
      }

      // Reload crops from contract to sync state
      if (userAddress) {
        await loadCropsFromContract(userAddress);
      }

      if (successCount > 0) {
        show(`✅ Successfully harvested ${successCount} crops!`, "success");
      } else {
        show("❌ Failed to harvest crops. Please try again.", "error");
        return;
      }

      setSelectedIndexes([]);
      setIsFarmMenu(false);
      setIsPlanting(true);
    } catch (error) {
      console.error("Failed to harvest crops:", error);
      show(
        `❌ Failed to harvest crops: ${error?.message || "Unknown"}`,
        "error"
      );
    }
  };

  const handleCancel = () => {
    setSelectedIndexes([]);
    setIsFarmMenu(false);
    setIsPlanting(true);
    // Reset used seeds tracking when canceling
    setUsedSeedsInPreview({});
  };

  const onClickCrop = (isShift, index) => {
    console.log("onClickCrop called:", {
      isShift,
      index,
      isPlanting,
      selectedSeed,
    });

    // Check if userCrops are loaded before allowing any plot interaction
    if (!userCropsLoaded) {
      console.log("User crops not loaded yet - cannot interact with plots");
      show(
        "Please wait for your farm data to load before interacting with plots.",
        "info"
      );
      return;
    }

    // Check if user has unlocked farming plots
    if (maxPlots <= 0) {
      console.log("No farming plots available - cannot interact with plots");
      show("You need to level up to unlock farming plots!", "info");
      return;
    }

    if (isPlanting) {
      // Check if plot is empty (no seedId)
      const plotData = cropArray.getItem(index);
      if (plotData && plotData.seedId) {
        console.log("Plot already has a crop, ignoring click");
        return;
      }

      // Require Shift for quick-plant; otherwise open the seed dialog
      if (selectedSeed && isShift) {
        // Use preview-adjusted availability
        const availableSeeds = getAvailableSeeds();
        const selectedAvailable = availableSeeds.find((s) => s.id === selectedSeed);
        if (!selectedAvailable || selectedAvailable.count <= 0) {
          console.log("Selected seed unavailable in preview (count 0), opening seed dialog");
          setSelectedSeed(null);
          setCurrentFieldIndex(index);
          setIsSelectCropDialog(true);
          return;
        }

        console.log("Quick-planting selected seed (with Shift):", selectedSeed, "at plot:", index);
        if (!isFarmMenu) {
          setPreviewCropArray(cropArray);
          setIsFarmMenu(true);
        }
        setCurrentFieldIndex(index);
        handleClickSeedFromDialog(selectedSeed, index);
        return;
      }

      // Open selection dialog when Shift not held or no seed selected
      console.log("Opening seed selection dialog for plot:", index, "(Shift held:", isShift, ")");
      setCurrentFieldIndex(index);
      setIsSelectCropDialog(true);
      if (!isFarmMenu) {
        setPreviewCropArray(cropArray);
        setIsFarmMenu(true);
      }
    } else {
      // Harvesting mode - toggle selection
      console.log("Toggling harvest selection for plot:", index);
      setSelectedIndexes((prev) => {
        const exists = prev.includes(index);
        if (exists) return prev.filter((i) => i !== index);
        return [...prev, index];
      });
    }
  };
  const handleClickSeedFromDialog = async (id, fieldIndex) => {
    console.log("handleClickSeedFromDialog called:", {
      id,
      fieldIndex,
      currentFieldIndex,
    });
    // Remember the selected seed so Shift+click can reuse it across plots
    setSelectedSeed(id);
    setIsSelectCropDialog(false);
    const idx = typeof fieldIndex === "number" ? fieldIndex : currentFieldIndex;
    if (idx < 0) {
      console.log("Invalid field index:", idx);
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
      console.log("Seed not available or count is 0:", seed);
      show("You don't have any more seeds of this type available!", "info");
      return;
    }

    console.log("Planting seed:", id, "at plot:", idx);

    // Just update the preview - don't call contract yet
    const newPreviewCropArray = new CropItemArrayClass(30);
    newPreviewCropArray.copyFrom(previewCropArray);

    // Get growth time for this seed type from contract
    const growthTime = await getGrowthTimeForSeed(id);
    console.log("Growth time for seed", id, ":", growthTime);

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
          maxPlots={maxPlots}
          totalPlots={30}
          userCropsLoaded={userCropsLoaded}
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
          availableSeeds={getAvailableSeeds()}
        />
      )}
    </div>
  );
};

export default Farm;
