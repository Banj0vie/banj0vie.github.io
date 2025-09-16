import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const BankerMenu = ({ onStakeReadyClick, onStakeLPClick }) => {
  return (
    <div className="banker-dialog">
      <BaseButton label="Stake Ready" onClick={onStakeReadyClick}></BaseButton>
      <BaseButton label="Stake LP" onClick={onStakeLPClick}></BaseButton>
    </div>
  );
};

export default BankerMenu;
