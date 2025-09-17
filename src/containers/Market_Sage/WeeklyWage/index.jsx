import React, { useEffect, useState } from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import LabelValueBox from "../../../components/boxes/LabelValueBox";
import { formatDuration } from "../../../utils/basic";
import BaseButton from "../../../components/buttons/BaseButton";

const WeeklyWage = ({onBack}) => {
  const [remainedTime, setRemainedTime] = useState(183991000);
  const [isClaimed, setIsClaimed] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainedTime((prev) => prev - 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="weekly-wage-wrapper">
      <CardView className="p-0">
        <div className="weekly-wage-card">
          <LabelValueBox label="Unlock Amount" value="40 (30)"></LabelValueBox>
          <LabelValueBox label="Bonus Per Level" value="2.5"></LabelValueBox>
          <LabelValueBox label="Maximum Rate" value="30"></LabelValueBox>
          <LabelValueBox
            label="Next Wage in"
            value={formatDuration(remainedTime)}
          ></LabelValueBox>
          <div className="weekly-wage-header">Weekly Wage</div>
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

export default WeeklyWage;
