import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const AnglerMenu = ({ onStartFish, onCraftBait }) => {
  return (
    <div className="angler-dialog">
      <BaseButton
        className=""
        label="Start Fishing"
        onClick={onStartFish}
      ></BaseButton>
      <BaseButton
        className=""
        label="Craft Bait"
        onClick={onCraftBait}
      ></BaseButton>
    </div>
  );
};

export default AnglerMenu;
