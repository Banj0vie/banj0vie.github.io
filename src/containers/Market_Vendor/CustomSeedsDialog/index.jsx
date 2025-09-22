import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import Slider from "../../../components/inputs/Slider";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseButton from "../../../components/buttons/BaseButton";

const CustomSeedsDialog = ({ price = 1, onConfirm, onClose }) => {
  const [seedCount, setSeedCount] = useState("1");
  return (
    <BaseDialog title={"AMOUNT"} onClose={onClose}>
      <div className="custom-seed-wrapper">
        <Slider
          min="1"
          max="9"
          value={seedCount}
          setValue={(val) => setSeedCount(val)}
        ></Slider>
        <div className="custom-seed-text">
          Buy {seedCount} seeds for {seedCount * price} HNY
        </div>
        <BaseDivider></BaseDivider>
        <BaseButton className="h-4rem" label="Confirm" onClick={() => onConfirm(parseInt(seedCount))}></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default CustomSeedsDialog;
