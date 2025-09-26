import React, { useEffect, useState } from "react";
import "./style.css";

const GrowStatusBox = ({ 
  seedId, 
  endTime, 
  isPlanted = false, 
  lockedAmount = 0, 
  unlockedAmount = 0 
}) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isPlanted || !endTime) {
      setProgress(0);
      setTimeLeft(0);
      setIsReady(false);
      return;
    }

    const updateProgress = () => {
      const now = Math.floor(Date.now() / 1000);
      const totalGrowthTime = endTime - (endTime - 120); // Assuming growth started 2 minutes ago for demo
      const elapsed = Math.max(0, now - (endTime - totalGrowthTime));
      const remaining = Math.max(0, endTime - now);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setProgress(4); // Fully grown
        setIsReady(true);
      } else {
        // Calculate progress from 1 to 4 based on elapsed time
        const progressPercent = elapsed / totalGrowthTime;
        const progressSteps = Math.min(3, Math.max(1, Math.floor(progressPercent * 4) + 1));
        setProgress(progressSteps);
        setIsReady(false);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    
    return () => clearInterval(interval);
  }, [endTime, isPlanted]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "Ready!";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return "0";
    return (Number(amount) / 1e18).toFixed(2);
  };

  return (
    <div className="grow-status-box">
      {/* Growth progress bar */}
      <div className="progress-bar">
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`step ${progress >= step ? "active" : "empty"}`}
          ></div>
        ))}
      </div>
      
      {/* Time left display */}
      {isPlanted && (
        <div className="time-display">
          <small>{formatTime(timeLeft)}</small>
        </div>
      )}
      
      {/* Token amounts display */}
      {/* {isReady && (lockedAmount > 0 || unlockedAmount > 0) && (
        <div className="reward-display">
          <div className="reward-item">
            <span className="reward-label">Unlocked:</span>
            <span className="reward-amount">{formatAmount(unlockedAmount)} $HNY</span>
          </div>
          <div className="reward-item">
            <span className="reward-label">Locked:</span>
            <span className="reward-amount">{formatAmount(lockedAmount)} $HNY</span>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default GrowStatusBox;
