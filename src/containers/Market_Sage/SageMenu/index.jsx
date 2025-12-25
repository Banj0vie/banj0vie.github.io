import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const SageMenu = ({ onWeeklyWage, onWeeklyHarvest }) => {
  return (
    <div className="sage-menu-wrapper">
      <BaseButton
        className="h-4.5rem"
        label="Weekly Wage"
        onClick={onWeeklyWage}
        small={true}></BaseButton>
      <BaseButton
        className="h-4.5rem"
        label="Weekly Harvest"
        onClick={onWeeklyHarvest}
        small={true}
      ></BaseButton>
    </div>
  );
};

export default SageMenu;
