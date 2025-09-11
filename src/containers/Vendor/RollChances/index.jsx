import React, { useState } from "react";
import "./style.css";
import CardListView from "../../../components/boxes/CardListView";
import BaseDivider from "../../../components/dividers/BaseDivider";
import Slider from "../../../components/inputs/Slider";
import BaseButton from "../../../components/buttons/BaseButton";

const RollChances = ({ onBack }) => {
  const primaryData = [
    { label: "Commons", value: "27.34% (0.50%)" },
    { label: "Uncommons", value: "27.34% (0.50%)" },
    { label: "Rares", value: "27.34% (0.50%)" },
    { label: "Epics", value: "27.34% (0.50%)" },
    { label: "Legendaries", value: "27.34% (0.50%)" },
  ];

  const [farmLevel, setFarmLevel] = useState(0);

  return (
    <div className="roll-chances-wrapper">
      <div className="unlocked-roi">
        <p>Unlocked ROI</p>
      </div>
      <CardListView data={primaryData}></CardListView>
      <BaseDivider />
      <div className="slider-wrapper">
        <div className="w-full text-center">Farm Level: {farmLevel}</div>
        <Slider
          min="0"
          max="15"
          step="1"
          value={farmLevel}
          setValue={(value) => setFarmLevel(value)}
        ></Slider>
      </div>
      <BaseButton className="h-4rem" label="Back" onClick={onBack}></BaseButton>
    </div>
  );
};

export default RollChances;
