import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import CardView from "../../components/boxes/CardView";
import LabelValueBox from "../../components/boxes/LabelValueBox";

const GardnerDialog = ({ onClose, label = "GARDNER", header = "" }) => {
  return (
    <BaseDialog onClose={onClose} title={label}>
      <div className="gardner-dialog-content">
        <CardView className="p-0">
          <div className="gardner-card">
            <LabelValueBox label="Farm Plots" value="30"></LabelValueBox>
            <LabelValueBox label="Harvest Bonus" value="3.75%"></LabelValueBox>
            <LabelValueBox label="Fishing Rod Level" value="5"></LabelValueBox>
            <div className="gardner-header">Valley Lvl. {15}</div>
          </div>
        </CardView>
        <CardView className="p-0">
          <br />
          <div className="text-center font-bold">Max level reached</div>
        </CardView>
      </div>
    </BaseDialog>
  );
};

export default GardnerDialog;
