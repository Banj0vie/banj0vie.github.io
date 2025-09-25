import React from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";

const FarmMenu = ({ 
  isPlant, 
  isUsingPotion, 
  onCancel, 
  onPlant, 
  onHarvest, 
  onPotionUse, 
  selectedPotion,
  loading = false 
}) => {
  return (
    <div className="farm-menu">
      <div className="info-text">
        {isUsingPotion ? (
          <div>
            <p className="ghost-text">
              ○ {selectedPotion?.name || 'Potion'} will be used on the selected plants.
            </p>
          </div>
        ) : (
          <p className="ghost-text">
            ○ Hold <span className="highlight">`Shift`</span> to keep planting the
            same seed.{" "}
          </p>
        )}
      </div>
      <div className="buttons">
        <BaseButton 
          label="Cancel" 
          onClick={onCancel}
          disabled={loading}
        ></BaseButton>
        {isUsingPotion ? (
          <BaseButton
            label="Use Item"
            onClick={onPotionUse}
            disabled={loading}
          ></BaseButton>
        ) : (
          <BaseButton
            label={isPlant ? "Plant" : "Harvest"}
            onClick={isPlant ? onPlant : onHarvest}
            disabled={loading}
          ></BaseButton>
        )}
      </div>
    </div>
  );
};

export default FarmMenu;
