import React from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import CardView from "../../components/boxes/CardView";
import BaseButton from "../../components/buttons/BaseButton";

const GoldDialog = ({ onClose, label = "BLAST GOLD III", header = "" }) => {
  const onShare = () => {
    window.open("https://x.com", "_blank");
  };
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      <div className="gold-dialog">
        <div className="text-center">You received</div>
        <CardView className="p-0">
          <br />
          <div className="text-center font-bold">0.0000 Gold</div>
        </CardView>
        <BaseButton className="h-4rem" label="Share" onClick={onShare}></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default GoldDialog;
