import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const StakeYield = () => {
  const onStake = () => {

  }

  const onUnstake = () => {

  }
  
  return (
    <div className="stake-yield">
      <div className="stake-unstake-buttons">
        <BaseButton label="Stake" onClick={onStake}></BaseButton>
        <BaseButton></BaseButton>
      </div>
    </div>
  );
};
export default StakeYield;
