import React from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";

const FarmerDialog = ({
  onClose,
  label = "FARMER",
  header = "",
  actions = {},
}) => {
  return (
    <BaseDialog title={label} header={header} onClose={onClose}>
      <div className="farmer-dialog">
        <BaseButton
          label="Plant"
          onClick={() => {
            onClose();
            actions.plant();
          }}
        ></BaseButton>
        <BaseButton
          label="Plant All"
          onClick={() => {
            console.log('=== FARMER DIALOG PLANT ALL CLICKED ===');
            console.log('actions.plantAll:', actions.plantAll);
            onClose();
            if (actions.plantAll) {
              actions.plantAll();
            } else {
              console.error('actions.plantAll is not defined!');
            }
          }}
        ></BaseButton>
        <BaseButton
          label="Harvest"
          onClick={() => {
            onClose();
            actions.harvest();
          }}
        ></BaseButton>
        <BaseButton
          label="Harvest All"
          onClick={() => {
            onClose();
            actions.harvestAll();
          }}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default FarmerDialog;
