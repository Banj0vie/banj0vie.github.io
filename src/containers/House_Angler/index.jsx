import React, { useState, useCallback, useEffect } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import { ID_ANGLER_PAGES } from "../../constants/app_ids";
import AnglerMenu from "./AnglerMenu";
import CraftBait from "./CraftBait";
import StartFishing from "./StartFishing";
import Fishing from "./Fishing";
import { useFishing } from "../../hooks/useContracts";
import { useAgwEthersAndService } from "../../hooks/useContractBase";

const AnglerDialog = ({ onClose, label = "QUIET POND", header = "" }) => {
  const [pageIndex, setPageIndex] = useState(ID_ANGLER_PAGES.ANGLER_MENU);
  const [selectedBaitId, setSelectedBaitId] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const { isConnected, account } = useAgwEthersAndService();
  const { checkPendingRequests, getAllPendingRequests } = useFishing();

  // Load pending requests when dialog opens
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
      console.error('Failed to load fishing pending requests:', err);
    }
  }, [isConnected, account, checkPendingRequests, getAllPendingRequests]);

  // Load pending requests when component mounts or when user connects
  useEffect(() => {
    if (isConnected && account) {
      loadPendingRequests();
    }
  }, [isConnected, account, loadPendingRequests]);

  const onStartFishing = useCallback(async (baitId, amount) => {
    setSelectedBaitId(baitId);
    setSelectedAmount(amount);
    
    // Refresh pending requests to get the real request ID from the fish() call
    await loadPendingRequests();
    
    // Get the updated pending requests after refresh
    const updatedPendingRequests = await getAllPendingRequests();
    
    // Find the matching pending request for this bait and amount
    const matchingRequest = updatedPendingRequests.find(req => 
      parseInt(req.baitId) === parseInt(baitId) && parseInt(req.amount) === parseInt(amount)
    );
    
    if (matchingRequest) {
      setSelectedRequestId(matchingRequest.requestId);
    } else {
      // Fallback - this shouldn't happen but just in case
      setSelectedRequestId(null);
    }
    
    setPageIndex(ID_ANGLER_PAGES.FISHING);
  }, [loadPendingRequests, getAllPendingRequests]);

  const onReelFish = (requestId, baitId, level, amount) => {
    // Navigate to fishing page with pending request info
    setSelectedBaitId(parseInt(baitId)); // Use the real baitId from pending request
    setSelectedAmount(parseInt(amount));
    setSelectedRequestId(requestId); // Set the real request ID
    setPageIndex(ID_ANGLER_PAGES.FISHING);
  };

  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      {pageIndex === ID_ANGLER_PAGES.ANGLER_MENU && (
        <AnglerMenu
          onStartFish={() => setPageIndex(ID_ANGLER_PAGES.START_FISHING)}
          onCraftBait={() => setPageIndex(ID_ANGLER_PAGES.CRAFT_BAIT)}
          hasPendingRequests={hasPendingRequests}
          pendingRequests={pendingRequests}
          onReelFish={onReelFish}
        ></AnglerMenu>
      )}
      {pageIndex === ID_ANGLER_PAGES.CRAFT_BAIT && (
        <CraftBait
          onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)}
        ></CraftBait>
      )}
      {pageIndex === ID_ANGLER_PAGES.START_FISHING && (
        <StartFishing
          onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)}
          onStart={onStartFishing}
        ></StartFishing>
      )}
      {pageIndex === ID_ANGLER_PAGES.FISHING && (
        <Fishing
          baitId={selectedBaitId}
          amount={selectedAmount}
          requestId={selectedRequestId}
          onBuyAgain={() => setPageIndex(ID_ANGLER_PAGES.START_FISHING)}
          onBackToMenu={() => {
            setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU);
            loadPendingRequests(); // Refresh pending requests
          }}
        ></Fishing>
      )}
    </BaseDialog>
  );
};

export default AnglerDialog;
