import React, { useState } from "react";
import BaseDialog from "../_BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { useItems } from "../../hooks/useItems";
import { ID_PRODUCE_ITEMS } from "../../constants/app_ids";

const MOCK_LEADERBOARD = [
  { rank: 1, name: "FarmerBob", weight: "2.85", type: "Onion" },
  { rank: 2, name: "AliceGrows", weight: "2.61", type: "Onion" },
  { rank: 3, name: "CryptoVeggies", weight: "2.40", type: "Onion" },
  { rank: 4, name: "OnionKing", weight: "2.15", type: "Onion" },
  { rank: 5, name: "You", weight: "---", type: "Onion" },
];

const WeightContestDialog = ({ onClose }) => {
  const { all: allItems } = useItems();
  const [entryWeight, setEntryWeight] = useState(null);

  // Find onions in inventory
  const onions = allItems.find((item) => item.id === ID_PRODUCE_ITEMS.ONION);

  const handleEnterContest = () => {
    if (!onions || onions.count <= 0) {
      alert("You don't have any onions to enter!");
      return;
    }
    
    // Simulate picking the heaviest onion from their current inventory stack
    // Using the same randomization curve from the inventory dialog
    let bestWeight = 0;
    for (let i = 0; i < onions.count; i++) {
      const randomFactor = Math.pow(Math.random(), 2.5);
      const weight = 0.5 + randomFactor * 1.5; // Produce range 0.5kg to 2.0kg
      if (weight > bestWeight) bestWeight = weight;
    }
    
    setEntryWeight(bestWeight.toFixed(2));
  };

  return (
    <BaseDialog onClose={onClose} title="WEIGHT CONTEST" header="/images/dialog/modal-header-inventory.png" headerOffset={10} className="custom-modal-background">
      <div style={{ padding: '20px', color: '#fff', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>🏆 Weekly Onion Weigh-In 🏆</h2>
          <p style={{ margin: 0, color: '#ccc' }}>Submit your heaviest onion to climb the leaderboard!</p>
        </div>

        {/* Leaderboard Section */}
        <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid #5a402a', borderRadius: '8px', padding: '15px' }}>
          <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #5a402a', paddingBottom: '10px' }}>Current Standings</h3>
          {MOCK_LEADERBOARD.map((entry) => (
            <div key={entry.rank} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(90, 64, 42, 0.5)' }}>
              <span style={{ width: '30px', color: entry.name === 'You' ? '#00ff41' : '#fff' }}>#{entry.rank}</span>
              <span style={{ flex: 1, color: entry.name === 'You' ? '#00ff41' : '#aaa' }}>{entry.name}</span>
              <span style={{ color: '#ffea00' }}>{entry.name === 'You' && entryWeight ? `${entryWeight}kg` : `${entry.weight}kg`}</span>
            </div>
          ))}
        </div>

        {/* Submission Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>
            You have {onions ? onions.count : 0} Onions available.
          </p>
          <BaseButton 
            label={entryWeight ? "Entered!" : "Enter Contest"} 
            onClick={handleEnterContest} 
            disabled={!!entryWeight || !onions || onions.count <= 0}
          />
          {entryWeight && (
            <p style={{ margin: '10px 0 0 0', color: '#00ff41', fontWeight: 'bold' }}>
              Your heaviest onion weighed {entryWeight}kg!
            </p>
          )}
        </div>
      </div>
    </BaseDialog>
  );
};

export default WeightContestDialog;