import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import SeedRollingBox from "../../components/boxes/SeedRollingBox";

const SeedRollingDialog = ({ rollingInfo, onClose, onBack, onBuyAgain }) => {
  return (
    <BaseDialog title="SEED GACHA" onClose={onClose}>
      <div className="seed-gacha-wrapper">
        <div className="seed-rolling-box-wrapper">
          {Array.from({ length: rollingInfo.count }).map((_, idx) => (
            <SeedRollingBox key={idx} seedPackId={rollingInfo.id} delay={idx * 200} />
          ))}
        </div>
        <div className="seed-rolling-buttons-wrapper">
          <BaseButton
            className="h-4rem"
            label="Back"
            onClick={onBack}
          ></BaseButton>
          <BaseButton
            className="h-4rem"
            label="Buy Again"
            onClick={onBuyAgain}
          ></BaseButton>
        </div>
      </div>
    </BaseDialog>
  );
};

export default SeedRollingDialog;
