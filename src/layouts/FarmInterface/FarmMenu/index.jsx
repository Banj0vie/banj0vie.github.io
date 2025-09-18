import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const FarmMenu = ({ isPlant, onCancel, onPlant, onHarvest, loading = false }) => {
  return (
    <div className="farm-menu">
      <div className="info-text">
        <p className="ghost-text">
          {" "}
          ○ Hold <span className="highlight">`Shift`</span> to keep planting the
          same seed.{" "}
        </p>
      </div>
      {!loading && (
        <div className="buttons">
          <BaseButton label="Cancel" onClick={onCancel}></BaseButton>
          <BaseButton
            label={isPlant ? "Plant" : "Harvest"}
            onClick={isPlant ? onPlant : onHarvest}
          ></BaseButton>
        </div>
      )}
      {loading && (
        <div className="loading-message">
          <p className="ghost-text">
            {isPlant ? "Planting..." : "Harvesting..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default FarmMenu;
