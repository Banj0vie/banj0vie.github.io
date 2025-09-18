import React, { useEffect, useState } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import CardView from "../../components/boxes/CardView";
import LabelValueBox from "../../components/boxes/LabelValueBox";
import BaseButton from "../../components/buttons/BaseButton";
import { formatDuration } from "../../utils/basic";

const GoldChestDialog = ({ onClose, label = "DAILY CHEST", header = "" }) => {
  const [remainedTime, setRemainedTime] = useState(183991000);
  const [isClaimed, setIsClaimed] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainedTime((prev) => prev - 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const onClaim = () => {
    setIsClaimed(true);
  };
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div className="gold-chest">
        <CardView className="p-0">
          <div className="gold-chest-card">
            <LabelValueBox label="Items Dropped" value="1"></LabelValueBox>
            <LabelValueBox
              label="Chest Status"
              value={isClaimed ? "Claimed" : "Unclaimed"}
            ></LabelValueBox>
            <LabelValueBox
              label="Next Chest In"
              value={formatDuration(remainedTime)}
            ></LabelValueBox>
          </div>
        </CardView>
        {!isClaimed && (
          <BaseButton
            className="h-3rem"
            label="Claim Chest"
            onClick={onClaim}
          ></BaseButton>
        )}
      </div>
    </BaseDialog>
  );
};

export default GoldChestDialog;
