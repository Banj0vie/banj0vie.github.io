import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const SageMenu = ({ onWeeklyWage, onWeeklyHarvest }) => {
  return (
    <div className="sage-menu-wrapper">
      <BaseButton
        className="h-4rem"
        label="Weekly Wage"
        onClick={onWeeklyWage}
      ></BaseButton>
      <BaseButton
        className="h-4rem"
        label="Weekly Harvest"
        onClick={onWeeklyHarvest}
      ></BaseButton>
    </div>
  );
};

export default SageMenu;
