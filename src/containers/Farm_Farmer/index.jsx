import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import ScrollButton from "../../components/buttons/ScrollButton";

const FarmerDialog = ({
  onClose,
  label = "FARMER",
  header = "",
  actions = {},
}) => {
  return (
    <BaseDialog title={label} header={header} onClose={onClose}>
      <div className="farmer-dialog">
        <ScrollButton
          label="Plant"
          onClick={() => {
            onClose();
            actions.plant();
          }}
        ></ScrollButton>
        <ScrollButton
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
        ></ScrollButton>
        <ScrollButton
          label="Harvest"
          onClick={() => {
            onClose();
            actions.harvest();
          }}
        ></ScrollButton>
        <ScrollButton
          label="Harvest All"
          onClick={() => {
            onClose();
            actions.harvestAll();
          }}
        ></ScrollButton>
      </div>
    </BaseDialog>
  );
};

export default FarmerDialog;
