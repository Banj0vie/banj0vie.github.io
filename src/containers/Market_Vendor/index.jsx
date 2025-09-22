import React, { useState, useEffect, useCallback, useMemo } from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import VendorMenu from "./VendorMenu";
import BuySeeds from "./BuySeeds";
import RollChances from "./RollChances";
import { ID_CROP_CATEGORIES, ID_SEED_SHOP_PAGES } from "../../constants/app_ids";
import { SEED_PACK_STATUS } from "../../constants/item_seed";
import { useVendor, useFarming } from "../../hooks/useContracts";
import { useAgwEthersAndService } from "../../hooks/useAgwEthersAndService";
import { useNotification } from "../../contexts/NotificationContext";
import CustomSeedsDialog from "./CustomSeedsDialog";
import SeedRollingDialog from "./SeedRollingDialog";
const VendorDialog = ({ onClose, label = "VENDOR", header = "" }) => {
  const { isConnected, account, contractService } = useAgwEthersAndService();
  const { buySeedPack, getPackPrice, checkPendingRequests, getAllPendingRequests, fulfillPendingRequest, listenForSeedsRevealed } = useVendor();
  const { getMaxPlots } = useFarming();
  const { show } = useNotification();
  
  const [pageIndex, setPageIndex] = useState(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
  const [availablePlots, setAvailablePlots] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState(0);
  const [selectedSeedPack, setSelectedSeedPack] = useState({});
  const [isCustomDlg, setIsCustomDlg] = useState(false);
  const [isRollingDlg, setIsRollingDlg] = useState(false);
  const [rollingInfo, setRollingInfo] = useState({});
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealCleanup, setRevealCleanup] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [buyingSeedId, setBuyingSeedId] = useState(null); // Track which seed is being bought
  
  // Memoized initial seed status to prevent unnecessary re-renders
  const initialSeedStatus = useMemo(() => ({
    [ID_CROP_CATEGORIES.FEEBLE_SEED]: {
      label: "Feeble Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
    [ID_CROP_CATEGORIES.PICO_SEED]: {
      label: "Pico Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
    [ID_CROP_CATEGORIES.BASIC_SEED]: {
      label: "Basic Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
    [ID_CROP_CATEGORIES.PREMIUM_SEED]: {
      label: "Premium Seeds",
      status: SEED_PACK_STATUS.NORMAL,
      count: 0,
    },
  }), []);
  
  const [seedStatus, setSeedStatus] = useState(initialSeedStatus);

  // Memoized tier mapping to prevent recreation on every render
  const tierMap = useMemo(() => ({
    [ID_CROP_CATEGORIES.FEEBLE_SEED]: 1,
    [ID_CROP_CATEGORIES.PICO_SEED]: 2,
    [ID_CROP_CATEGORIES.BASIC_SEED]: 3,
    [ID_CROP_CATEGORIES.PREMIUM_SEED]: 4,
  }), []);

  // Load available plots - only when needed
  const loadAvailablePlots = useCallback(async () => {
    if (!isConnected || !account || !contractService || !getMaxPlots) return;
    
    try {
      const maxPlots = await getMaxPlots(account);
      if (maxPlots !== null) {
        setAvailablePlots(Number(maxPlots));
        console.log('Available plots:', maxPlots);
      }
    } catch (err) {
      console.error('Failed to load available plots:', err);
    }
  }, [isConnected, account, contractService, getMaxPlots]);

  // Load pending requests - only when needed
  const loadPendingRequests = useCallback(async () => {
    if (!isConnected || !account || !checkPendingRequests || !getAllPendingRequests) return;
    
    try {
      const hasPending = await checkPendingRequests();
      setHasPendingRequests(hasPending);
      
      if (hasPending) {
        const allPendingReqs = await getAllPendingRequests();
        setPendingRequests(allPendingReqs);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    }
  }, [isConnected, account, checkPendingRequests, getAllPendingRequests]);

  // Refresh function to reload pending requests and available plots
  const refreshVendorData = useCallback(async () => {
    if (!isConnected || !account) return;
    
    try {
      await Promise.all([
        loadAvailablePlots(),
        loadPendingRequests(),
      ]);
    } catch (err) {
      console.error('Failed to refresh vendor data:', err);
    }
  }, [isConnected, account, loadAvailablePlots, loadPendingRequests]);

  // Load pack prices - only when needed (lazy loading)
  const loadPackPrices = useCallback(async () => {
    if (!getPackPrice) return;
    
    try {
      // Load prices in parallel instead of sequentially
      const pricePromises = Array.from({ length: 4 }, (_, i) => 
        getPackPrice(i + 1).catch(err => {
          console.error(`Failed to load tier ${i + 1} price:`, err);
          return null;
        })
      );
      
      const prices = await Promise.all(pricePromises);
      console.log('Pack prices:', prices);
    } catch (err) {
      console.error('Failed to load pack prices:', err);
    }
  }, [getPackPrice]);

  // Main data loading effect - only runs when dialog opens or account changes
  useEffect(() => {
    if (!isConnected || !account || !contractService || dataLoaded) return;
    
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Load essential data in parallel
        await Promise.all([
          loadAvailablePlots(),
          loadPendingRequests(),
          // Don't load pack prices immediately - load them when needed
        ]);
        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load vendor data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isConnected, account, contractService, dataLoaded, loadAvailablePlots, loadPendingRequests]);

  // Refresh data on every render to ensure it's up to date
  useEffect(() => {
    if (dataLoaded && isConnected && account) {
      refreshVendorData();
    }
  }, [dataLoaded, isConnected, account, refreshVendorData]);

  // Load pack prices when user navigates to seed pack detail
  useEffect(() => {
    if (pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_DETAIL) {
      loadPackPrices();
    }
  }, [pageIndex, loadPackPrices]);

  const onSeedsClicked = useCallback((id) => {
    setSelectedSeed(id);
    if (seedStatus[id].status === SEED_PACK_STATUS.COMMITED) {
      setSeedStatus((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: SEED_PACK_STATUS.NORMAL,
        },
      }));
      setRollingInfo({
        revealedSeeds: Array(seedStatus[id].count).fill(0),
        count: seedStatus[id].count,
      });
      setIsRollingDlg(true);
    } else {
      setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_DETAIL);
    }
  }, [seedStatus]);


  const onRollChancesClicked = useCallback(() => {
    setPageIndex(ID_SEED_SHOP_PAGES.ROLL_CHANCES);
  }, []);

  const handleReveal = useCallback(async (requestId, tier, count) => {
    if (!requestId) return;
    
    // Clean up any existing reveal process
    if (revealCleanup) {
      revealCleanup();
      setRevealCleanup(null);
    }
    
    setIsRevealing(true);
    try {
      // Event listener will be set up after fulfill call with the correct block number
      
      // Fulfill the pending request via VRNG system
      const result = await fulfillPendingRequest(requestId);
      if (result) {
        // Get the block number from the fulfill transaction
        const fulfillBlockNumber = result.blockNumber;
        
        // Immediately update UI state since fulfill was successful
        // This will update the UI buttons to remove the reveal status
        setIsRevealing(false); // Reset revealing state immediately
        
        // Also refresh pending requests to ensure consistency
        setTimeout(async () => {
          await loadPendingRequests();
        }, 500); // Short delay to ensure transaction is processed
        
        // Show rolling dialog immediately as fallback
        const rollingInfo = {
          id: tier,
          count: parseInt(count),
          isReveal: true,
          isComplete: false, // Will be updated when event is received
          isFallback: true, // Indicates this is a fallback dialog
          revealedSeeds: Array(parseInt(count)).fill(0) // Initialize with 0s for animation
        };
        setRollingInfo(rollingInfo);
        setIsRollingDlg(true);
        
        // Set up event listener with the fulfill transaction block number
        const eventCleanup = await listenForSeedsRevealed(requestId, (revealedSeeds) => {
          
          // Update the rolling dialog with the actual revealed seeds
          setRollingInfo(prev => ({
            ...prev,
            revealedSeeds: revealedSeeds.seedIds,
            isComplete: true,
            isFallback: false // This is real data, not fallback
          }));
          
          // Keep the dialog open to show results - don't hide it immediately
          // User will close it manually via onClose/onBack buttons
          setIsRevealing(false);
          setRevealCleanup(null);
          
          // Reset seed status to NORMAL after successful reveal
          setSeedStatus((prev) => ({
            ...prev,
            [tier]: {
              ...prev[tier],
              status: SEED_PACK_STATUS.NORMAL,
              count: 0
            }
          }));
          
          // Refresh pending requests after reveal
          setTimeout(async () => {
            await loadPendingRequests();
          }, 1000); // Wait 1 second for the transaction to be mined
        }, fulfillBlockNumber);
        
        if (eventCleanup) {
          setRevealCleanup(eventCleanup);
        }
      } else {
        // If fulfillment failed, reset the revealing state
        setIsRevealing(false);
        setRevealCleanup(null);
      }
      
      // Clean up event listener after 30 seconds (timeout)
      setTimeout(() => {
        if (revealCleanup) revealCleanup();
        setIsRevealing(false); // Reset revealing state on timeout
        setRevealCleanup(null);
      }, 30000);
      
    } catch (err) {
      console.error('Failed to reveal:', err);
      setIsRevealing(false);
      setRevealCleanup(null);
    }
  }, [listenForSeedsRevealed, fulfillPendingRequest, loadPendingRequests, revealCleanup]);

  // Cancel reveal process
  const cancelReveal = useCallback(async () => {
    if (revealCleanup) {
      revealCleanup();
      setRevealCleanup(null);
    }
    setIsRevealing(false);
    setIsRollingDlg(false);
    
    // Reset all seed statuses to NORMAL when dialog is closed
    setSeedStatus((prev) => {
      const newStatus = { ...prev };
      Object.keys(newStatus).forEach(key => {
        if (newStatus[key].status === SEED_PACK_STATUS.COMMITED) {
          newStatus[key] = {
            ...newStatus[key],
            status: SEED_PACK_STATUS.NORMAL,
            count: 0
          };
        }
      });
      return newStatus;
    });
    
    // Refresh pending requests when dialog is closed
    await loadPendingRequests();
  }, [revealCleanup, loadPendingRequests]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (revealCleanup) {
        revealCleanup();
      }
    };
  }, [revealCleanup]);

  const handleBuy = useCallback(async (item) => {
    if (!isConnected) {
      show('Please connect your wallet first', 'warning');
      return;
    }

    // Set buying state for this specific seed
    setBuyingSeedId(selectedSeed);
    setIsRollingDlg(false);
    setSeedStatus((prev) => ({
      ...prev,
      [selectedSeed]: {
        ...prev[selectedSeed],
        status: SEED_PACK_STATUS.COMMITING,
        count: item.count,
      },
    }));

    try {
      const tier = tierMap[selectedSeed];
      const result = await buySeedPack(tier, item.count);
      console.log('Seed pack purchase result:', result);
      if (result) {
        setSeedStatus((prev) => ({
          ...prev,
          [selectedSeed]: {
            ...prev[selectedSeed],
            status: SEED_PACK_STATUS.COMMITED,
          },
        }));
        console.log('Seed pack purchase successful:', result);
        
        // Refresh pending requests after successful purchase
        await loadPendingRequests();
      } else {
        throw new Error('Purchase failed');
      }
      } catch (err) {
      console.error('Failed to buy seed pack:', err);
      setSeedStatus((prev) => ({
        ...prev,
        [selectedSeed]: {
          ...prev[selectedSeed],
          status: SEED_PACK_STATUS.NORMAL,
        },
      }));
      show(`Failed to buy seed pack: ${err.message}`, 'error');
    } finally {
      // Reset buying state
      setBuyingSeedId(null);
    }

    setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
  }, [isConnected, selectedSeed, tierMap, buySeedPack, loadPendingRequests, show]);

  const onBuy = useCallback((item) => {
    setSelectedSeedPack(item);
    if (item.count === 0) {
      setIsCustomDlg(true);
    } else {
      handleBuy(item);
    }
  }, [handleBuy]);

  const onConfirm = useCallback((count) => {
    handleBuy({
      ...selectedSeedPack,
      count,
    });
    setIsCustomDlg(false);
  }, [selectedSeedPack, handleBuy]);


  return !isRollingDlg ? (
    <BaseDialog title={label} onClose={onClose} header={header}>
      {pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_LIST && (
        <VendorMenu
          seedStatus={seedStatus}
          onSeedsClicked={onSeedsClicked}
          onRollChancesClicked={onRollChancesClicked}
          availablePlots={availablePlots}
          hasPendingRequests={hasPendingRequests}
          pendingRequests={pendingRequests}
          onRevealClicked={handleReveal}
          isRevealing={isRevealing}
          isLoading={isLoadingData}
          buyingSeedId={buyingSeedId}
        ></VendorMenu>
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_DETAIL && (
        <BuySeeds
          menuId={selectedSeed}
          onBack={() => {
            setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
          }}
          onBuy={onBuy}
          buyingSeedId={buyingSeedId}
          isAnyBuying={buyingSeedId !== null}
        ></BuySeeds>
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.ROLL_CHANCES && (
        <RollChances
          onBack={() => {
            setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
          }}
        ></RollChances>
      )}
      {isCustomDlg && (
        <CustomSeedsDialog
          price={selectedSeedPack.price}
          onConfirm={onConfirm}
          onClose={() => {
            setIsCustomDlg(false);
          }}
        ></CustomSeedsDialog>
      )}
    </BaseDialog>
  ) : (
    <SeedRollingDialog
      rollingInfo={rollingInfo}
      onClose={cancelReveal}
      onBack={cancelReveal}
      onBuyAgain={() => {
        cancelReveal();
        handleBuy(rollingInfo);
      }}
    ></SeedRollingDialog>
  );
};

export default VendorDialog;
