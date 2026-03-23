import React from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import BaseButton from "../../components/buttons/BaseButton";
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
          onClick={async () => {
            onClose();
            actions.harvest();

            try {
              const playerName = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email) : "Anonymous";
              await addDoc(collection(db, "Harvests"), {
                player: playerName,
                type: "Crop", 
                amount: 1,
                time: serverTimestamp()
              });
              console.log("Harvest saved to the cloud!");
            } catch (e) {
              console.error("Error saving harvest: ", e);
            }
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
