/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BaseDivider from "../../components/dividers/BaseDivider";
import CardView from "../../components/boxes/CardView";
import { formatDuration } from "../../utils/basic";
import { buttonFrames } from "../../constants/_baseimages";
import BaseButton from "../../components/buttons/BaseButton";
import RewardsDialog from "./RewardsDialog";

const LeaderboardDialog = ({ onClose, label = "VENDOR", header = "" }) => {
  const [data, setData] = useState([
    { name: "valleyman13", score: 30199.38 },
    { name: "CeeCee", score: 21501.88 },
    { name: "UUJJ", score: 145.77 },
    { name: "Empty", score: 0.0 },
    { name: "Empty", score: 0.0 },
  ]);
  const [isTimer, setIsTimer] = useState(true);
  const [remainedTime, setRemainedTime] = useState(183991000);
  const [currentEpoch, setCurrentEpoch] = useState(77);
  const [isRewardDlg, setIsRewardDlg] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTimer) {
        setRemainedTime((prev) => prev - 1000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimer]);
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div className="leaderboard-content">
        <div className="leaderboard-spliter">
          <div className="split">Name</div>
          <div className="split">Score</div>
        </div>
        <BaseDivider></BaseDivider>
        {data.map((item, index) => (
          <CardView key={index} className="leaderboard-card p-0 h-fit">
            <div className="leaderboard-spliter">
              <div className="split">
                {index + 1}. {item.name}
              </div>
              <div className="split highlight">{item.score}</div>
            </div>
          </CardView>
        ))}
        <br />
        <div className="text-center">
          Your score: <span className="highlight">0.00</span>
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
        <BaseButton
          label="See Rewards"
          onClick={() => setIsRewardDlg(true)}
          className="h-4rem mt-1rem"
        ></BaseButton>
        {isRewardDlg && (
          <RewardsDialog onClose={() => setIsRewardDlg(false)}></RewardsDialog>
        )}
      </div>
    </BaseDialog>
  );
};

export default LeaderboardDialog;
