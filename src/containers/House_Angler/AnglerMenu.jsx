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

      {hasPendingRequests && pendingRequests.length > 0 && (
        <div style={{ marginTop: '20px', width: '100%', borderTop: '2px solid #5a402a', paddingTop: '20px' }}>
          <h3 style={{ color: '#ffea00', margin: '0 0 15px 0' }}>Pending Catches</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '150px', overflowY: 'auto', paddingRight: '10px' }}>
            {pendingRequests.map((req, index) => (
              <div 
                key={index}
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.5)', 
                  border: '2px solid #5a402a', 
                  borderRadius: '8px', 
                  padding: '10px 15px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <span style={{ color: '#ccc' }}>Catch from request #{req.requestId.toString()}</span>
                <BaseButton small label="Reel In" onClick={() => onReelFish(req.requestId, req.baitId, req.level, req.amount)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnglerMenu;