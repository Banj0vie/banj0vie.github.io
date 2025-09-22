import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import { formatDuration } from "../../../utils/basic";
import BaseButton from "../../../components/buttons/BaseButton";
import { useSage } from "../../../hooks/useContracts";

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

  // Fetch Sage data on component mount
  useEffect(() => {
    fetchSageData();
  }, [fetchSageData]);

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
      console.error('Failed to unlock:', err);
    } finally {
      setIsUnlocking(false);
    }
  }, [unlockWeeklyHarvest]);
  return (
    <div className="weekly-harvest-wrapper">
      <CardView className="p-0">
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
          <div className="weekly-harvest-header">Weekly Harvest</div>
        </div>
      </CardView>
      
      {error && (
        <CardView className="p-0">
          <div className="text-center text-red-500">Error: {error}</div>
        </CardView>
      )}
      
      {sageData.lockedAmount === 0 ? (
        <CardView className="p-0">
          <br/>
          <div className="text-center">No locked tokens to unlock</div>
        </CardView>
      ) : !sageData.canUnlockHarvest ? (
        <CardView className="p-0">
          <br/>
          <div className="text-center">Already Claimed!</div>
        </CardView>
      ) : (
        <BaseButton 
          className="h-3rem" 
          label={isUnlocking ? "Unlocking..." : "Unlock Honey"} 
          onClick={handleUnlock}
          disabled={isUnlocking}
        />
      )}
      
      <BaseButton className="h-3rem" label="Back" onClick={onBack} />
    </div>
  );
};

export default WeeklyHarvest;
