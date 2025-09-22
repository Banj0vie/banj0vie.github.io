import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const BankerMenu = ({ onStakeHoneyClick, onStakeLPClick }) => {
  return (
    <div className="banker-dialog">
      <BaseButton label="Stake Honey" onClick={onStakeHoneyClick}></BaseButton>
      <BaseButton label="Stake LP" onClick={onStakeLPClick}></BaseButton>
    </div>
  );
};

export default BankerMenu;
