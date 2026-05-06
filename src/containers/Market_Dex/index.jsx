import React from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";

// DEX (token swap) was removed alongside the wallet/crypto integration.
// This placeholder keeps the existing hotspot functional without crashing.
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div style={{ padding: '24px', textAlign: 'center', color: '#5a402a', fontFamily: 'monospace', minWidth: 320 }}>
        The DEX is currently unavailable.
      </div>
    </BaseDialog>
  );
};

export default DexDialog;
