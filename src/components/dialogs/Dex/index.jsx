import React from "react";
import BaseDialog from "../BaseDialog";
import "./style.css";
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
    return (
        <BaseDialog title={label} onClose={onClose} header={header}>
            <div>
                <h1>{label}</h1>
            </div>
        </BaseDialog>
    );
};

export default DexDialog;