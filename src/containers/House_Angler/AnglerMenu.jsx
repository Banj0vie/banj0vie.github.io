import React from "react";
import BaseButton from "../../components/buttons/BaseButton";

const AnglerMenu = ({ onStartFish, onCraftBait, onLeveling, hasPendingRequests, pendingRequests, onReelFish }) => {
  return (
    <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '350px' }}>
      <h2 style={{ color: '#00bfff', margin: '0 0 10px 0' }}>Quiet Pond</h2>
      <p style={{ margin: 0, color: '#ccc', textAlign: 'center', maxWidth: '300px' }}>
        A peaceful spot to fish, craft bait, and check your progress.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', width: '100%', marginTop: '10px' }}>
        <BaseButton label="Start Fishing" onClick={onStartFish} />
        <BaseButton label="Craft Bait" onClick={onCraftBait} />
        <BaseButton label="Leveling" onClick={onLeveling} />
      </div>

    </div>
  );
};

export default AnglerMenu;