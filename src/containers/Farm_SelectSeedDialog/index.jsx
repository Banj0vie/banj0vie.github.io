import React from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import PickSeedItemBox from "../../components/boxes/PickSeedItemBox";
import { useItems } from "../../hooks/useItems";

const SelectSeedDialog = ({ onClose, onClickSeed, availableSeeds = null }) => {
  const { seeds: originalSeeds, loading, error } = useItems();
  // Use availableSeeds if provided, otherwise fall back to original seeds
  const seeds = availableSeeds || originalSeeds;

  if (loading) {
    return (
      <BaseDialog title="PICK SEED" onClose={onClose}>
        <div className="select-seed-dialog">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading your seeds...</div>
          </div>
        </div>
      </BaseDialog>
    );
  }

  if (error) {
    return (
      <BaseDialog title="PICK SEED" onClose={onClose}>
        <div className="select-seed-dialog">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-title">Error Loading Seeds</div>
            <div className="error-message">{error}</div>
            <button 
              className="retry-button" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </BaseDialog>
    );
  }

  if (seeds.length === 0) {
    return (
      <BaseDialog title="PICK SEED" onClose={onClose}>
        <div className="select-seed-dialog">
          <div className="empty-seeds-container">
            <div className="empty-seeds-icon">🌱</div>
            <div className="empty-seeds-title">No Seeds Available</div>
            <div className="empty-seeds-message">
              You don't have any seeds yet! Visit the vendor to buy seed packs and start your farming journey.
            </div>
            <div className="empty-seeds-hint">
              💡 Tip: Different seed packs contain different types of seeds with varying rarities!
            </div>
          </div>
        </div>
      </BaseDialog>
    );
  }

  const totalSeedCount = seeds.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

  return (
    <BaseDialog title="PICK SEED" onClose={onClose}>
      <div className="select-seed-dialog">
        <div className="seeds-header">
          <span className="seeds-count">You have {totalSeedCount} seed{totalSeedCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="seeds-grid">
          {seeds.map((seed, index) => (
            <PickSeedItemBox
              key={index}
              seedId={seed.id}
              count={seed.count}
              onClick={() => onClickSeed(seed.id)}
            />
          ))}
        </div>
      </div>
    </BaseDialog>
  );
};
export default SelectSeedDialog;
