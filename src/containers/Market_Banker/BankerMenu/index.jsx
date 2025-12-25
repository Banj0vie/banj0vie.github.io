import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const BankerMenu = ({ onStakeHoneyClick, onStakeLPClick }) => {
  return (
    <div className="banker-dialog">
      <BaseButton label="Stake Honey" className="h-4.5rem" small={true} onClick={onStakeHoneyClick}></BaseButton>
      <BaseButton label="Stake LP" className="h-4.5rem" small={true} onClick={onStakeLPClick}></BaseButton>
    </div>
  );
};

export default BankerMenu;
