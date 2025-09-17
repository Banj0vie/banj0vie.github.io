/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BaseDivider from "../../components/dividers/BaseDivider";
import CardView from "../../components/boxes/CardView";
import { formatDuration } from "../../utils/basic";
import { buttonFrames } from "../../constants/_baseimages";
import BaseButton from "../../components/buttons/BaseButton";
import RewardsDialog from "./RewardsDialog";
import { useLeaderboard } from "../../hooks/useContracts";

const LeaderboardDialog = ({ onClose, label = "LEADERBOARD", header = "" }) => {
  const {
    leaderboardData,
    userScore,
    epochStart,
    fetchLeaderboardData,
    loading,
    error
  } = useLeaderboard();
  const [isTimer, setIsTimer] = useState(true);
  const [remainedTime, setRemainedTime] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(77);
  const [isRewardDlg, setIsRewardDlg] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Update timer based on epochStart
  useEffect(() => {
    if (epochStart > 0) {
      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        const epochDuration = 7 * 24 * 60 * 60; // 7 days in seconds
        const epochEndTime = epochStart + epochDuration;
        const remaining = Math.max(0, (epochEndTime - now) * 1000); // Convert to milliseconds
        setRemainedTime(remaining);
      };

      // Update immediately
      updateTimer();

      // Update every second
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [epochStart]);
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div className="leaderboard-content">
        <div className="leaderboard-spliter">
          <div className="split">Name</div>
          <div className="split">Score</div>
        </div>
        <BaseDivider></BaseDivider>
        {leaderboardData.map((item, index) => (
          <CardView key={index} className="leaderboard-card p-0">
            <div className="leaderboard-spliter">
              <div className="split">
                {item.rank}. {item.name}
              </div>
              <div className="split highlight">{item.score.toFixed(2)}</div>
            </div>
          </CardView>
        ))}
        <br />
        <div className="text-center">
          Your score: <span className="highlight">{loading ? "Loading..." : userScore.toFixed(2)}</span>
        </div>
        <div className="text-center timer">
          Ends in:{" "}
          <span className="highlight">{formatDuration(remainedTime)}</span>
        </div>
        <BaseDivider />
        <div className="epoch-selector">
          <img
            src={buttonFrames.leftTriangleButton}
            alt="left"
            className="triangle-button"
            onClick={() => setCurrentEpoch((prev) => prev - 1)}
          ></img>
          <div>
            Epoch <span className="highlight">{currentEpoch}</span>
          </div>
          <img
            src={buttonFrames.rightTriangleButton}
            alt="right"
            className="triangle-button"
            onClick={() => setCurrentEpoch((prev) => prev + 1)}
          ></img>
        </div>
        <BaseDivider />
        <div className="button-row">
          <BaseButton
            label="Refresh"
            onClick={fetchLeaderboardData}
            className="h-4rem mt-1rem"
            disabled={loading}
          />
          <BaseButton
            label="See Rewards"
            onClick={() => setIsRewardDlg(true)}
            className="h-4rem mt-1rem"
          />
        </div>
        {isRewardDlg && (
          <RewardsDialog onClose={() => setIsRewardDlg(false)}></RewardsDialog>
        )}
      </div>
    </BaseDialog>
  );
};

export default LeaderboardDialog;
