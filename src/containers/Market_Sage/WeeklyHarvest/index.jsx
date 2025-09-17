import React, { useEffect, useState } from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import { formatDuration } from "../../../utils/basic";
import BaseButton from "../../../components/buttons/BaseButton";

const WeeklyHarvest = ({onBack}) => {
  const [remainedTime, setRemainedTime] = useState(183991000);
  const [isClaimed, setIsClaimed] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainedTime((prev) => prev - 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="weekly-harvest-wrapper">
      <CardView className="p-0">
        <div className="weekly-harvest-card">
          <LabelValueBox label="Unlock Rate" value="0.15%"></LabelValueBox>
          <LabelValueBox label="Pending Locked Ready" value="12.08"></LabelValueBox>
          <LabelValueBox
            label="Next Season in"
            value={formatDuration(remainedTime)}
          ></LabelValueBox>
          <div className="weekly-harvest-header">Weekly Harvest</div>
        </div>
      </CardView>
      {isClaimed ? (
        <CardView className="p-0">
            <br/>
            <div className="text-center">Already Claimed!</div>
        </CardView>
      ) : (
        <BaseButton className="h-3rem" label="Unlock Ready" onClick={() => setIsClaimed(true)}></BaseButton>
      )}
      <BaseButton className="h-3rem" label="Back" onClick={onBack}></BaseButton>
    </div>
  );
};

export default WeeklyHarvest;
