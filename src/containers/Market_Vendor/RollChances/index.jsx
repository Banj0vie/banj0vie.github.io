import React, { useState } from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import { SEED_TREE, TYPE_LABEL_COLOR } from "../../../constants/item_seed";
import { ID_CROP_CATEGORIES, ID_RARE_TYPE } from "../../../constants/app_ids";
import { ALL_ITEMS } from "../../../constants/item_data";

const RARITY_CHANCES = {
  [ID_RARE_TYPE.COMMON]:    { pct: 60, label: "Common",    color: "#f7efec" },
  [ID_RARE_TYPE.UNCOMMON]:  { pct: 25, label: "Uncommon",  color: "#81c935" },
  [ID_RARE_TYPE.RARE]:      { pct: 10, label: "Rare",       color: "#29b2c2" },
  [ID_RARE_TYPE.EPIC]:      { pct:  4, label: "Epic",       color: "#db6595" },
  [ID_RARE_TYPE.LEGENDARY]: { pct:  1, label: "Legendary",  color: "#eedb33" },
};

const PACKS = [
  { id: ID_CROP_CATEGORIES.PICO_SEED,    label: "Pico",    price: "750 Gold",   color: "#4ecbf5" },
  { id: ID_CROP_CATEGORIES.BASIC_SEED,   label: "Basic",   price: "3,500 Gold", color: "#81c935" },
  { id: ID_CROP_CATEGORIES.PREMIUM_SEED, label: "Premium", price: "15,000 Gold",color: "#eedb33" },
];

const RARITY_ORDER = [
  ID_RARE_TYPE.LEGENDARY,
  ID_RARE_TYPE.EPIC,
  ID_RARE_TYPE.RARE,
  ID_RARE_TYPE.UNCOMMON,
  ID_RARE_TYPE.COMMON,
];

const RollChances = ({ onBack }) => {
  const [activePack, setActivePack] = useState(ID_CROP_CATEGORIES.PICO_SEED);

  const packData = SEED_TREE[activePack];

  return (
    <div className="roll-chances-wrapper">
      {/* Pack tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {PACKS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePack(p.id)}
            style={{
              flex: 1,
              padding: "8px 4px",
              borderRadius: "8px",
              border: `2px solid ${activePack === p.id ? p.color : "rgba(255,255,255,0.15)"}`,
              background: activePack === p.id ? `${p.color}22` : "rgba(0,0,0,0.3)",
              color: activePack === p.id ? p.color : "#aaa",
              cursor: "pointer",
              fontWeight: activePack === p.id ? "bold" : "normal",
              fontSize: "13px",
              transition: "all 0.15s",
            }}
          >
            {p.label}
            <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{p.price}</div>
          </button>
        ))}
      </div>

      {/* Drop table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto" }}>
        {RARITY_ORDER.map(rarityType => {
          const tier = packData?.[rarityType];
          if (!tier) return null;
          const { pct, label, color } = RARITY_CHANCES[rarityType];
          const perCrop = tier.list.length > 1 ? `(${(pct / tier.list.length).toFixed(1)}% each)` : "";

          return (
            <div
              key={rarityType}
              style={{
                background: "rgba(0,0,0,0.35)",
                border: `1px solid ${color}55`,
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            >
              {/* Rarity header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: color, flexShrink: 0 }} />
                <span style={{ color, fontWeight: "bold", fontSize: "13px", letterSpacing: "1px" }}>{label}</span>
                <div style={{ flex: 1 }} />
                <span style={{ color, fontWeight: "bold", fontSize: "18px" }}>{pct}%</span>
              </div>

              {/* Progress bar */}
              <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", marginBottom: "10px" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", maxWidth: "100%" }} />
              </div>

              {/* Crop list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {tier.list.map(seedId => {
                  const item = ALL_ITEMS[seedId];
                  if (!item) return null;
                  return (
                    <div
                      key={seedId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        background: `${color}18`,
                        border: `1px solid ${color}44`,
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "12px",
                        color: "#ddd",
                      }}
                    >
                      <span style={{ color }}>{item.label}</span>
                      {perCrop && <span style={{ color: "#888", fontSize: "10px" }}>{(pct / tier.list.length).toFixed(1)}%</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "8px", fontSize: "11px", color: "#888", textAlign: "center" }}>
        Each pack gives 5 seeds. Rarity is rolled independently per seed.
      </div>

      <BaseButton className="h-4rem" label="Back" onClick={onBack} isError />
    </div>
  );
};

export default RollChances;
