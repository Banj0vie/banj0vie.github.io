import React from "react";
import BaseDialog from "../BaseDialog";
import "./style.css";
const VendorDialog = ({ onClose, label = "VENDOR", header = "" }) => {
    return (
        <BaseDialog title={label} onClose={onClose} header={header}>
            <div>
                <h1>{label}</h1>
            </div>
        </BaseDialog>
    );
};

export default VendorDialog;