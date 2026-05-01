import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import VendorMenu from "./VendorMenu";
import BuySeeds from "./BuySeeds";
import RollChances from "./RollChances";
import {
  ID_CROP_CATEGORIES,
  ID_SEED_SHOP_PAGES,
  ID_SEEDS,
  getRaritySeedId,
} from "../../constants/app_ids";
import { SEED_PACK_STATUS } from "../../constants/item_seed";
import { useVendor, useFarming } from "../../hooks/useContracts";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useNotification } from "../../contexts/NotificationContext";
import { isTransactionRejection } from "../../utils/errorUtils";
import CustomSeedsDialog from "./CustomSeedsDialog";
import PokemonPackRipDialog from "./PokemonPackRipDialog";
import ScratchOff from "./ScratchOff";
const VendorDialog = ({ onClose, label = "VENDOR", header = "", headerOffset = 0 }) => {
  const { isConnected, account } = useSolanaWallet();
  const {
    buySeedPack,
    revealSeeds,
    getAllPendingRequests,
    listenForSeedsRevealed,
    error: vendorError,
  } = useVendor();
  const { getMaxPlots, getUserCrops } = useFarming();
  const { show } = useNotification();

  // Monitor vendor errors and show notifications with duplicate prevention
  const lastNotificationTime = useRef(0);
  useEffect(() => {
    if (vendorError) {
      const now = Date.now();
      // Only show notification if it's been more than 2 seconds since last notification
      if (now - lastNotificationTime.current > 2000) {
        lastNotificationTime.current = now;
        if (isTransactionRejection(vendorError)) {
          show("Transaction was rejected by user.", "error");
        } else {
          show(vendorError || "Vendor operation failed.", "error");
        }
      }
    }
  }, [vendorError, show]);

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
  const [buyingItem, setBuyingItem] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(() => parseInt(localStorage.getItem('sandbox_tutorial_step') || '0', 10));

  useEffect(() => {
    window.isVendorOpen = true;
    window.dispatchEvent(new Event('vendorDialogToggled'));
    return () => {
      window.isVendorOpen = false;
      window.dispatchEvent(new Event('vendorDialogToggled'));
    };
  }, []);

  useEffect(() => {
    const triggerOnionPack = () => {
      const onionSeeds = [
        getRaritySeedId(ID_SEEDS.ONION, 1),
        getRaritySeedId(ID_SEEDS.ONION, 2),
        getRaritySeedId(ID_SEEDS.ONION, 3),
        getRaritySeedId(ID_SEEDS.ONION, 4),
        getRaritySeedId(ID_SEEDS.ONION, 5),
      ];
      localStorage.removeItem('admin_onion_pack_pending');
      setRollingInfo({
        id: 2,
        count: onionSeeds.length,
        isReveal: true,
        isComplete: true,
        isFallback: false,
        revealedSeeds: onionSeeds,
      });
      setIsRollingDlg(true);
    };

    // Fire immediately if the flag was set before this dialog mounted
    if (localStorage.getItem('admin_onion_pack_pending') === '1') {
      triggerOnionPack();
    }

    window.addEventListener('adminOnionPack', triggerOnionPack);
    return () => window.removeEventListener('adminOnionPack', triggerOnionPack);
  }, []);

  // Memoized initial seed status to prevent unnecessary re-renders
  const initialSeedStatus = useMemo(
    () => ({
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
    }),
    []
  );

  const [seedStatus, setSeedStatus] = useState(initialSeedStatus);

  // Memoized tier mapping to prevent recreation on every render
  const tierMap = useMemo(
    () => ({
      [ID_CROP_CATEGORIES.PICO_SEED]: 2,
      [ID_CROP_CATEGORIES.BASIC_SEED]: 3,
      [ID_CROP_CATEGORIES.PREMIUM_SEED]: 4,
    }),
    []
  );

  const tierToCategory = useMemo(
    () => ({
      2: ID_CROP_CATEGORIES.PICO_SEED,
      3: ID_CROP_CATEGORIES.BASIC_SEED,
      4: ID_CROP_CATEGORIES.PREMIUM_SEED,
    }),
    []
  );

  // Load available plots - only when needed
  const loadAvailablePlots = useCallback(async () => {
    if (!isConnected || !account || !getMaxPlots || !getUserCrops) return;
    
    try {
      const maxPlots = await getMaxPlots(account);
      const userCrops = await getUserCrops(account);
      
      // Count only crops that actually have seeds planted (seedId !== 0n)
      const plantedCount = userCrops.filter(crop => crop.seedId && crop.seedId !== 0n).length;
      
      const availablePlotsCount = maxPlots - plantedCount;
      setAvailablePlots(Math.max(0, availablePlotsCount));
    } catch (err) {
      console.error("Failed to load available plots:", err);
    }
  }, [isConnected, account, getMaxPlots, getUserCrops]);

  // Load pending requests - only when needed
  const loadPendingRequests = useCallback(async () => {
    if (
      !isConnected ||
      !getAllPendingRequests
    )
      return;

    try {
      const requests = await getAllPendingRequests();
      setHasPendingRequests(requests.length > 0);
      setPendingRequests(requests);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    }
  }, [isConnected, account, getAllPendingRequests]);

  // Refresh function to reload pending requests and available plots
  const refreshVendorData = useCallback(async () => {
    if (!isConnected || !account) return;

    try {
      await Promise.all([loadAvailablePlots(), loadPendingRequests()]);
    } catch (err) {
      console.error("Failed to refresh vendor data:", err);
    }
  }, [isConnected, account, loadAvailablePlots, loadPendingRequests]);

  // Main data loading effect - only runs when dialog opens or account changes
  useEffect(() => {
    if (!isConnected || !account || dataLoaded) return;

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
        console.error("Failed to load vendor data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [
    isConnected,
    account,
    dataLoaded,
    loadAvailablePlots,
    loadPendingRequests,
  ]);

  // Refresh data on every render to ensure it's up to date
  useEffect(() => {
    if (dataLoaded && isConnected && account) {
      refreshVendorData();
    }
  }, [dataLoaded, isConnected, account, refreshVendorData]);

  const onSeedsClicked = useCallback(
    (id) => {
      if (seedStatus[id]?.status !== SEED_PACK_STATUS.COMMITED) {
        const tier = tierMap[id];
        const farmingLevel = Math.floor(Math.sqrt((parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10) || 0) / 150)) + 1;

      }

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
    },
    [seedStatus, tierMap, show]
  );

  const onRollChancesClicked = useCallback(() => {
    setPageIndex(ID_SEED_SHOP_PAGES.ROLL_CHANCES);
  }, []);

  const onScratchOffClicked = useCallback(() => {
    setPageIndex(ID_SEED_SHOP_PAGES.SCRATCH_OFF);
  }, []);

  const handleReveal = useCallback(
    
    async (requestId, tier, count) => {
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
        const result = await revealSeeds();
        if (result) {
          // Get the block number from the fulfill transaction
          const txSig = result;

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
            revealedSeeds: Array(parseInt(count)).fill(0), // Initialize with 0s for animation
          };
          setRollingInfo(rollingInfo);
          setIsRollingDlg(true);
          // Set up event listener with the fulfill transaction block number
          const eventCleanup = await listenForSeedsRevealed(
            txSig,
            (revealedSeeds) => {
              // Update the rolling dialog with the actual revealed seeds
              setRollingInfo((prev) => ({
                ...prev,
                revealedSeeds: revealedSeeds.seedIds,
                isComplete: true,
                isFallback: false, // This is real data, not fallback
              }));

              // Keep the dialog open to show results - don't hide it immediately
              // User will close it manually via onClose/onBack buttons
              setIsRevealing(false);
              setRevealCleanup(null);

              // Reset seed status to NORMAL after successful reveal (tier 1-4 -> category id)
              const categoryId = tierToCategory[tier];
              if (categoryId) {
                setSeedStatus((prev) => ({
                  ...prev,
                  [categoryId]: {
                    ...prev[categoryId],
                    status: SEED_PACK_STATUS.NORMAL,
                    count: 0,
                  },
                }));
              }

              // Refresh pending requests after reveal
              setTimeout(async () => {
                await loadPendingRequests();
              }, 1000); // Wait 1 second for the transaction to be mined
            }
          );

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
        console.error("Failed to reveal:", err);
        setIsRevealing(false);
        setRevealCleanup(null);
      }
    },
    [listenForSeedsRevealed, revealSeeds, loadPendingRequests, revealCleanup, tierToCategory]
  );

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
      Object.keys(newStatus).forEach((key) => {
        if (newStatus[key].status === SEED_PACK_STATUS.COMMITED) {
          newStatus[key] = {
            ...newStatus[key],
            status: SEED_PACK_STATUS.NORMAL,
            count: 0,
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

  const handleBuy = useCallback(
    async (item) => {
      if (!isConnected) {
        show("Please connect your wallet first", "warning");
        return;
      }
      
      const tier = tierMap[selectedSeed];
      const farmingLevel = Math.floor(Math.sqrt((parseInt(localStorage.getItem('sandbox_farming_xp') || '0', 10) || 0) / 150)) + 1;


      // Set buying state for this specific item
      setBuyingItem({
        ...item,
        packId: selectedSeed,
      });
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
         
         const result = await buySeedPack(tier, item.count);
         
         // Show success message (loading notification will auto-dismiss after 5 minutes)
         
         if (result) {
           setSeedStatus((prev) => ({
             ...prev,
             [selectedSeed]: {
               ...prev[selectedSeed],
               status: SEED_PACK_STATUS.COMMITED,
             },
           }));
           // Show success message
           const successMessage = item.count === 1 
             ? "✅ Successfully bought seed pack!" 
             : `✅ Successfully bought ${item.count} seed packs!`;
           show(successMessage, "success");

           // Refresh pending requests after successful purchase
           const currentRequests = await getAllPendingRequests();
           setHasPendingRequests(currentRequests.length > 0);
           setPendingRequests(currentRequests);

           // Auto-Reveal: Skip the extra button click!
           const reqToReveal = currentRequests.find(r => Number(r.tier) === tier);
           if (reqToReveal) {
             handleReveal(reqToReveal.requestId, tier, item.count);
           }

           if (tutorialStep === 11) {
             setTutorialStep(12);
             localStorage.setItem('sandbox_tutorial_step', '12');
             window.dispatchEvent(new Event('tutorialStepChanged'));
           }
        } else {
          throw new Error("Purchase failed");
        }
      } catch (err) {
        console.error("Failed to buy seed pack:", err);
         // Show error message (loading notification will auto-dismiss after 5 minutes)
        setSeedStatus((prev) => ({
          ...prev,
          [selectedSeed]: {
            ...prev[selectedSeed],
            status: SEED_PACK_STATUS.NORMAL,
          },
        }));
      } finally {
        // Reset buying state
        setBuyingItem(null);
      }

      setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
    },
    [isConnected, selectedSeed, tierMap, buySeedPack, loadPendingRequests, show, getAllPendingRequests, handleReveal]
  );

  const onBuy = useCallback(
    (item) => {
      setSelectedSeedPack(item);
      if (item.count === 0) {
        // Don't set buyingItem for custom - wait until confirmation
        setIsCustomDlg(true);
      } else {
        handleBuy(item);
      }
    },
    [handleBuy]
  );

  const onConfirm = useCallback(
    (count) => {
      const customItem = {
        ...selectedSeedPack,
        count,
        isCustom: true, // Add unique identifier for custom items
      };
      handleBuy(customItem);
      setIsCustomDlg(false);
    },
    [selectedSeedPack, handleBuy]
  );

  return !isRollingDlg ? (
    <BaseDialog title={label} onClose={onClose} header={header} headerOffset={headerOffset} className="custom-modal-background">
      {pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_LIST && (
        <VendorMenu
          seedStatus={seedStatus}
          onSeedsClicked={onSeedsClicked}
          onRollChancesClicked={onRollChancesClicked}
          onScratchOffClicked={onScratchOffClicked}
          availablePlots={availablePlots}
          hasPendingRequests={hasPendingRequests}
          pendingRequests={pendingRequests}
          onRevealClicked={handleReveal}
          isRevealing={isRevealing}
          isLoading={isLoadingData}
          buyingItem={buyingItem}
          tutorialStep={tutorialStep}
        ></VendorMenu>
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.SEED_PACK_DETAIL && (
        <BuySeeds
          menuId={selectedSeed}
          onBack={() => {
            setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST);
          }}
          onBuy={onBuy}
          buyingItem={buyingItem}
          isAnyBuying={buyingItem !== null}
        ></BuySeeds>
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.ROLL_CHANCES && (
        <RollChances
          onBack={() => setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST)}
        />
      )}
      {pageIndex === ID_SEED_SHOP_PAGES.SCRATCH_OFF && (
        <ScratchOff
          onBack={() => setPageIndex(ID_SEED_SHOP_PAGES.SEED_PACK_LIST)}
        />
      )}
      {isCustomDlg && (
        <CustomSeedsDialog
          price={selectedSeedPack.price}
          onConfirm={onConfirm}
          onClose={() => {
            setIsCustomDlg(false);
            // Clear any buying state if dialog is closed without confirming
            setBuyingItem(null);
          }}
        ></CustomSeedsDialog>
      )}
      
      {tutorialStep === 11 && (
        <div style={{ position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: '320px', backgroundColor: 'rgba(0,0,0,0.9)', border: '4px solid #ffea00', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '25px', gap: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', pointerEvents: 'auto' }}>
             <img src="/images/bees/sir.png" alt="Sir" style={{ height: '100px', objectFit: 'contain' }} />
             <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '14px', textAlign: 'center' }}>
               <h3 style={{ color: '#ffea00', margin: '0 0 10px 0', fontSize: '20px' }}>Great Uncle Sir Bee</h3>
               <p style={{ margin: 0, lineHeight: '1.5' }}>Here you can buy seed packs! Each pack gives you a random crop seed.</p>
               <br/>
               <p style={{ margin: 0, lineHeight: '1.5', color: '#00ff41' }}>Buy a Seed Pack to get started, and don't forget to rip it open!</p>
             </div>
          </div>
        </div>
      )}

    </BaseDialog>
  ) : (
    <PokemonPackRipDialog
      rollingInfo={rollingInfo}
      onClose={cancelReveal}
      onBack={cancelReveal}
      onBuyAgain={
        // Hide "Buy Again" during the mayor cutscene's pico-only beat — the user is meant to
        // open exactly one pack, then the cutscene resumes.
        localStorage.getItem('sandbox_cutscene_pico_only') === 'true'
          ? null
          : () => {
              cancelReveal();
              handleBuy(rollingInfo);
            }
      }
    ></PokemonPackRipDialog>
  );
};

export default VendorDialog;
