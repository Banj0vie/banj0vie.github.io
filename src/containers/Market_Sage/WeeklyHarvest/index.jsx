import React, { useEffect, useState, useCallback, useRef } from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import { formatDuration } from "../../../utils/basic";
import BaseButton from "../../../components/buttons/BaseButton";
import { useSage } from "../../../hooks/useContracts";
import { handleContractError } from "../../../utils/errorHandler";
import { useNotification } from "../../../contexts/NotificationContext";
import { isTransactionRejection } from "../../../utils/errorUtils";
  
const WeeklyHarvest = ({onBack}) => {
  const {
    sageData,
    fetchSageData,
    unlockWeeklyHarvest,
    getTimeUntilNextHarvestUnlock,
    loading,
    error
  } = useSage();
  
  const [remainedTime, setRemainedTime] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { show } = useNotification();

  // Fetch Sage data on component mount
  useEffect(() => {
    fetchSageData();
  }, [fetchSageData]);

  const lastNotificationTime = useRef(0);
  useEffect(() => {
    if (error) {
      const now = Date.now();
      // Only show notification if it's been more than 2 seconds since last notification
      if (now - lastNotificationTime.current > 2000) {
        lastNotificationTime.current = now;
        if (isTransactionRejection(error)) {
          show('Transaction was rejected by user.', 'error');
        }
      }
    }
  }, [error, show]);
  // Update timer for next harvest unlock
  useEffect(() => {
    const updateTimer = () => {
      // Only update timer if there are locked tokens and harvest unlock is not ready
      if (sageData.lockedAmount > 0 && !sageData.canUnlockHarvest) {
        const remaining = getTimeUntilNextHarvestUnlock();
        setRemainedTime(remaining);
        
        // If timer reached zero, refresh Sage data to update canUnlockHarvest state
        if (remaining <= 0) {
          fetchSageData();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [getTimeUntilNextHarvestUnlock, fetchSageData, sageData.canUnlockHarvest, sageData.lockedAmount]);

  const handleUnlock = useCallback(async () => {
    setIsUnlocking(true);
    try {
      await unlockWeeklyHarvest();
    } catch (err) {
      const { message } = handleContractError(err, 'unlocking weekly harvest');
      console.error('Failed to unlock:', message);
      // show(`❌ ${message}`, "error");
    } finally {
      setIsUnlocking(false);
    }
  }, [unlockWeeklyHarvest]);
  return (
    <div className="weekly-harvest-wrapper">
      <CardView className="mt-1.5rem">
        <div className="weekly-harvest-card">
          <LabelValueBox 
            label="Unlock Rate" 
            value={loading ? "Loading..." : `${sageData.harvestUnlockPercent?.toFixed(2) || 0}%`}
          />
          <LabelValueBox 
            label="Pending Locked Honey" 
            value={loading ? "Loading..." : sageData.harvestUnlockAmount?.toFixed(2) || 0}
          />
          <LabelValueBox
            label="Next Harvest in"
            value={sageData.canUnlockHarvest ? "Honey!" : formatDuration(remainedTime)}
          />
        </div>
      </CardView>
      <div className="weekly-harvest-header">
        <img src="/images/label/grey-bg.png" alt="grey-bg" className="weekly-harvest-header-bg" />
        <span>Weekly Harvest</span>
      </div>
      {sageData.lockedAmount === 0 ? (
        <CardView className="p-0">
          <div className="text-center">{loading ? "Loading ..." : "No locked tokens to unlock"}</div>
        </CardView>
      ) : !sageData.canUnlockHarvest ? (
        <CardView className="p-0">
          <div className="text-center">Already Claimed!</div>
        </CardView>
      ) : (
        <BaseButton 
          className="h-3rem" 
          label={isUnlocking ? "Unlocking..." : "Unlock Honey"} 
          onClick={handleUnlock}
          disabled={isUnlocking}
          large={true}
        />
      )}
      
      <BaseButton className="h-3rem" label="Back" onClick={onBack} large={true} isError={true}></BaseButton>
    </div>
  );
};

export default WeeklyHarvest;
