import React, { useState, useEffect } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import CardView from "../../components/boxes/CardView";
import LabelValueBox from "../../components/boxes/LabelValueBox";
import BaseButton from "../../components/buttons/BaseButton";
import { useGardener } from "../../hooks/useContracts";
import { useNotification } from "../../contexts/NotificationContext";

const GardnerDialog = ({ onClose, label = "GARDENER", header = "" }) => {
  const { 
    currentLevel, 
    maxLevel, 
    levelUpCost, 
    canLevelUp, 
    levelUp, 
    loading, 
    error,
    fetchGardenerData 
  } = useGardener();
  
  const { show } = useNotification();
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  // Calculate benefits for current and next level
  const getFarmPlots = (level) => level + 15;
  const getHarvestBonus = (level) => level * 0.25;
  const getFishingRodLevel = (level) => Math.floor(level / 3);

  const handleLevelUp = async () => {
    if (!canLevelUp || currentLevel >= maxLevel) {
      show('Cannot level up at this time', 'warning');
      return;
    }

    setIsLevelingUp(true);
    try {
      show('Leveling up...', 'info');
      const targetLevel = currentLevel + 1;
      const tx = await levelUp(targetLevel);
      
      if (tx) {
        show(`Successfully leveled up to Valley Level ${targetLevel}!`, 'success');
        // Refresh data after successful level up
        await fetchGardenerData();
      } else {
        show('Failed to level up', 'error');
      }
    } catch (err) {
      console.error('Level up error:', err);
      show(`Level up failed: ${err.message}`, 'error');
    } finally {
      setIsLevelingUp(false);
    }
  };

  // Refresh data when component mounts
  useEffect(() => {
    fetchGardenerData();
  }, [fetchGardenerData]);
  return (
    <BaseDialog onClose={onClose} title={label}>
      <div className="gardner-dialog-content">
        {/* Current Level Card */}
        <CardView className="p-0">
          <div className="gardner-card">
            <LabelValueBox
              label="Farm Plots"
              value={getFarmPlots(currentLevel)}
            ></LabelValueBox>
            <LabelValueBox
              label="Harvest Bonus"
              value={`${getHarvestBonus(currentLevel)}%`}
            ></LabelValueBox>
            <LabelValueBox
              label="Fishing Rod Level"
              value={getFishingRodLevel(currentLevel)}
            ></LabelValueBox>
            <div className="gardner-header">Valley Lvl. {currentLevel}</div>
          </div>
        </CardView>

        {/* Next Level Card - only show if not at max level */}
        {currentLevel < maxLevel && (
          <CardView className="p-0">
            <div className="gardner-card">
              <LabelValueBox
                label="Farm Plots"
                value={getFarmPlots(currentLevel + 1)}
              >
                <span className="font-strike opacity-7">{getFarmPlots(currentLevel)}<span className="blue-right-triangle"></span></span>
              </LabelValueBox>
              <LabelValueBox
                label="Harvest Bonus"
                value={`${getHarvestBonus(currentLevel + 1)}%`}
              >
                <span className="font-strike opacity-7">{`${getHarvestBonus(currentLevel)}%`}<span className="blue-right-triangle"></span></span>
              </LabelValueBox>
              <LabelValueBox
                label="Fishing Rod Level"
                value={getFishingRodLevel(currentLevel + 1)}
              >
                <span className="font-strike opacity-7">{getFishingRodLevel(currentLevel)}<span className="blue-right-triangle"></span></span>
              </LabelValueBox>
              <LabelValueBox
                label="Cost"
                value={`${levelUpCost.toFixed(2)} Honey`}
              ></LabelValueBox>
              <div className="gardner-header">Valley Lvl. {currentLevel + 1}</div>
            </div>
          </CardView>
        )}

        {/* Max Level Reached or Upgrade Button */}
        {currentLevel >= maxLevel ? (
          <CardView className="p-0">
            <br />
            <div className="text-center font-bold">Max level reached</div>
          </CardView>
        ) : (
          <BaseButton
            className="h-3rem upgrade-valley-button"
            label={isLevelingUp || loading ? "Processing..." : "Upgrade Valley"}
            onClick={handleLevelUp}
            disabled={!canLevelUp || isLevelingUp || loading}
          ></BaseButton>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message" style={{ 
            color: '#ff3b30', 
            marginTop: '10px', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

export default GardnerDialog;
