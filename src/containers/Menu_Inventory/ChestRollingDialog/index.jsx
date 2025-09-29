import React from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import BaseButton from "../../../components/buttons/BaseButton";
import ItemViewSmall from "../../../components/boxes/ItemViewSmall";

const ChestRollingDialog = ({ rollingInfo, onClose, onBack, onOpenAgain }) => {
  return (
    <BaseDialog title="CHEST OPENING" onClose={onClose}>
      <div className="chest-gacha-wrapper">
        <div className="chest-rolling-box-wrapper">
        <div className="chest-result">
          <ItemViewSmall
            itemId={rollingInfo.rewardId}
            count={1}
          />
        </div>
        </div>
        <div className="chest-rolling-buttons-wrapper">
          <BaseButton
            className="h-4rem"
            label="Back"
            onClick={onBack}
          ></BaseButton>
          {/* {onOpenAgain && (
            <BaseButton
              className="h-4rem"
              label="Open Again"
              onClick={onOpenAgain}
            ></BaseButton>
          )} */}
        </div>
      </div>
    </BaseDialog>
  );
};

export default ChestRollingDialog;
