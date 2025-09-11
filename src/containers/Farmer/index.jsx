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
    console.log(actions);
  return (
    <BaseDialog title={label} header={header} onClose={onClose}>
      <div className="farmer-dialog">
        <ScrollButton label="Plant" onClick={actions.plant}></ScrollButton>
        <ScrollButton label="Plant All" onClick={actions.plantAll}></ScrollButton>
        <ScrollButton label="Harvest" onClick={actions.harvest}></ScrollButton>
        <ScrollButton label="Harvest All" onClick={actions.harvestAll}></ScrollButton>
      </div>
    </BaseDialog>
  );
};

export default FarmerDialog;
