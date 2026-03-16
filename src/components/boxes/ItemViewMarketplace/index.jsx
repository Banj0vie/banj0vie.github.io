import React, { useState, useMemo } from "react";
import BaseButton from "../../buttons/BaseButton";
import { ONE_SEED_HEIGHT } from "../../../constants/item_seed";

const ProduceListDialog = ({ item, onClose }) => {
  const [expandedId, setExpandedId] = useState(null);

  // Generate an array of individual items with unique weights.
  // useMemo will prevent re-randomizing on every render.
  const individualItems = useMemo(() => {
    if (!item) return [];
    const isFish = item.category === 'ID_ITEM_LOOT' && item.subCategory === 'ID_LOOT_CATEGORY_FISH';

    return Array.from({ length: item.count || 0 }).map((_, index) => {
      // Skew the random number towards lower values to make high weights rarer.
      const randomFactor = Math.pow(Math.random(), 2.5);
      // Fish are generally heavier and have a wider range than produce
      const weight = isFish 
        ? (1.0 + randomFactor * 14.0) // Fish Range: 1.0kg to 15.0kg
        : (0.5 + randomFactor * 1.5); // Produce Range: 0.5kg to 2.0kg

      return {
        id: `${item.id}-${index}`,
        name: `${item.label} ${index + 1}`,
        weight: weight.toFixed(2), // Format to 2 decimal places
      };
    });
  }, [item?.id, item?.label, item?.count, item?.category, item?.subCategory]);

  if (!item) return null;

  // Use the same image check logic as the marketplace cards
  const shouldUseImageTag = () => {
    const category = item.category;
    const subCategory = item.subCategory;
    if (subCategory === "ID_LOOT_CATEGORY_BAIT" || category === "ID_ITEM_POTION" || category === "ID_ITEM_LOOT") return true;
    return false;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        background: 'url(/images/dialog/modal-bg.png) center/cover',
        backgroundColor: '#2c221a', // Fallback color
        border: '4px solid #a67c52',
        borderRadius: '16px',
        padding: '24px',
        width: '400px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#fff', margin: 0, textShadow: '2px 2px 4px #000', fontFamily: 'monospace' }}>
            {item.label} Inventory
          </h2>
        </div>

        {/* List of individual produce */}
        <div style={{ overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {individualItems.map((prod) => {
            const isExpanded = expandedId === prod.id;
            return (
              <div key={prod.id} style={{
                backgroundColor: 'rgba(31, 22, 16, 0.8)', border: '2px solid #5a402a',
                borderRadius: '8px', padding: '10px 16px', transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                      {shouldUseImageTag() ? (
                        <img src={item.image || "/images/crops/seeds.png"} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div
                          className="item-icon item-icon-seeds"
                          style={{
                            transform: 'scale(0.8)',
                            backgroundPositionY: item.pos ? `-${item.pos * ONE_SEED_HEIGHT * 0.308}px` : 0,
                          }}
                        ></div>
                      )}
                    </div>
                    <span style={{ color: '#00ff41', fontWeight: 'bold', fontSize: '16px', fontFamily: 'monospace' }}>
                      {prod.name} - <span style={{ color: '#fff' }}>{prod.weight}kg</span>
                    </span>
                  </div>
                  
                  <BaseButton small label={isExpanded ? "Hide" : "Select"} onClick={() => setExpandedId(isExpanded ? null : prod.id)} />
                </div>

                {/* Expanded Details View */}
                {isExpanded && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #5a402a', paddingTop: '10px', color: '#ccc', fontSize: '14px', fontFamily: 'monospace' }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                      <strong style={{ color: '#fff' }}>Description:</strong> {item.description || (item.subCategory === 'ID_LOOT_CATEGORY_FISH' ? "A fresh catch, ready to be cooked or sold." : "A fresh piece of produce, ripe for cooking.")}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong style={{ color: '#fff' }}>Good for:</strong> {item.goodAt || (item.subCategory === 'ID_LOOT_CATEGORY_FISH' ? "Selling for tokens or feeding pets." : "General cooking and crafting.")}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <BaseButton label="Close" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default ProduceListDialog;