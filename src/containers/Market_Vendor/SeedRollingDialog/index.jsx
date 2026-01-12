import React from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import BaseButton from "../../../components/buttons/BaseButton";
import SeedRollingBox from "../../../components/boxes/SeedRollingBox";

const SeedRollingDialog = ({ rollingInfo, onClose, onBack, onBuyAgain }) => {
  return (
    <BaseDialog title="SEED GACHA" onClose={onClose} header="/images/dialog/modal-header-gardner.png" headerOffset={10}>
      <div className="seed-gacha-wrapper">
        <div className="seed-rolling-box-wrapper">
          {(rollingInfo.revealedSeeds || []).map((seedId, idx) => (
            <SeedRollingBox key={idx} seedPackId={seedId} delay={idx * 2000} />
          ))}
        </div>
        <div className="seed-rolling-buttons-wrapper">
          <BaseButton
            className="h-4rem"
            label="Back"
            onClick={onBack}
            small
          ></BaseButton>
          <BaseButton
            className="h-4rem"
            label="Buy Again"
            onClick={onBuyAgain}
            small
          ></BaseButton>
        </div>
      </div>
    </BaseDialog>
  );
};

export default SeedRollingDialog;
