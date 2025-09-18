import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import { formatDuration } from "../../../utils/basic";
import BaseButton from "../../../components/buttons/BaseButton";
import { useSage } from "../../../hooks/useContracts";

const WeeklyWage = ({onBack}) => {
  const {
    sageData,
    fetchSageData,
    unlockWeeklyWage,
    getTimeUntilNextWageUnlock,
    loading,
    error
  } = useSage();
    console.log(sageData);
  const [remainedTime, setRemainedTime] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Fetch Sage data on component mount
  useEffect(() => {
    fetchSageData();
  }, [fetchSageData]);

  // Update timer for next wage unlock
  useEffect(() => {
    const updateTimer = () => {
      // Only update timer if there are locked tokens and wage unlock is not ready
      if (sageData.lockedAmount > 0 && !sageData.canUnlockWage) {
        const remaining = getTimeUntilNextWageUnlock();
        setRemainedTime(remaining);
        
        // If timer reached zero, refresh Sage data to update canUnlockWage state
        if (remaining <= 0) {
          fetchSageData();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [getTimeUntilNextWageUnlock, fetchSageData, sageData.canUnlockWage, sageData.lockedAmount]);

  const handleUnlock = useCallback(async () => {
    setIsUnlocking(true);
    try {
      await unlockWeeklyWage();
    } catch (err) {
      console.error('Failed to unlock:', err);
    } finally {
      setIsUnlocking(false);
    }
  }, [unlockWeeklyWage]);
  return (
    <div className="weekly-wage-wrapper">
      <CardView className="p-0">
        <div className="weekly-wage-card">
          <LabelValueBox 
            label="Unlock Amount" 
            value={loading ? "Loading..." : `${sageData.weeklyWageAmount?.toFixed(0) || 0} (${sageData.weeklyWageAmount?.toFixed(0) || 0})`}
          />
          <LabelValueBox 
            label="Bonus Per Level" 
            value="2.5"
          />
          <LabelValueBox 
            label="Maximum Rate" 
            value="30"
          />
          <LabelValueBox
            label="Next Wage in"
            value={sageData.canUnlockWage ? "Ready!" : formatDuration(remainedTime)}
          />
          <div className="weekly-wage-header">Weekly Wage</div>
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
      ) : !sageData.canUnlockWage ? (
        <CardView className="p-0">
          <br/>
          <div className="text-center">Already Claimed!</div>
        </CardView>
      ) : (
        <BaseButton 
          className="h-3rem" 
          label={isUnlocking ? "Unlocking..." : "Unlock Ready"} 
          onClick={handleUnlock}
          disabled={isUnlocking}
        />
      )}
      <BaseButton className="h-3rem" label="Back" onClick={onBack}></BaseButton>
    </div>
  );
};

export default WeeklyWage;
