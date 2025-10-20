import React, { useState, useEffect } from "react";
import "./style.css";
import CardListView from "../../../components/boxes/CardListView";
import BaseDivider from "../../../components/dividers/BaseDivider";
import Slider from "../../../components/inputs/Slider";
import BaseButton from "../../../components/buttons/BaseButton";
import { useROIData } from "../../../hooks/useContracts";
import { useSelector } from "react-redux";

const RollChances = ({ onBack }) => {
  const { roiData, getROIData, loading } = useROIData();
  const [currentFarmLevel, setCurrentFarmLevel] = useState(0);
  
  const level = useSelector(state => state.user?.userData?.level || 0);

  // Load initial data
  useEffect(() => {
    getROIData(level);
  }, [level]);

  // Update ROI data when farm level changes
  const handleFarmLevelChange = async (newLevel) => {
    setCurrentFarmLevel(newLevel);
    getROIData(newLevel);
  };

  const primaryData = [
    { label: "Commons", value: `${roiData.commons.toFixed(2)}%` },
    { label: "Uncommons", value: `${roiData.uncommons.toFixed(2)}%` },
    { label: "Rares", value: `${roiData.rares.toFixed(2)}%` },
    { label: "Epics", value: `${roiData.epics.toFixed(2)}%` },
    { label: "Legendaries", value: `${roiData.legendaries.toFixed(2)}%` },
  ];

  return (
    <div className="roll-chances-wrapper">
      <div className="unlocked-roi">
        <p>Unlocked ROI</p>
      </div>
      <CardListView data={primaryData}></CardListView>
      <BaseDivider />
      <div className="slider-wrapper">
        <div className="w-full text-center">
          Farm Level: {loading ? "Loading..." : currentFarmLevel}
        </div>
        <Slider
          min="0"
          max="15"
          step="1"
          value={currentFarmLevel}
          setValue={handleFarmLevelChange}
          disabled={loading}
        ></Slider>
      </div>
      <BaseButton className="h-4rem" label="Back" onClick={onBack}></BaseButton>
    </div>
  );
};

export default RollChances;