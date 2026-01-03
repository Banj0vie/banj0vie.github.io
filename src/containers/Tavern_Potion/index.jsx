import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import { ID_POTION_ITEMS } from "../../constants/app_ids";
import CardView from "../../components/boxes/CardView";
import ItemCardList from "../../components/boxes/ItemCardList";
import ItemCardView from "../../components/boxes/ItemCardView";
import ItemCombinationBox from "../../components/boxes/ItemCombinationBox";
import { ITEM_POTIONS } from "../../constants/item_potion";
import { usePotion } from "../../hooks/usePotion";
import { useNotification } from "../../contexts/NotificationContext";

const PotionDialog = ({ onClose, label = "POTION MASTER", header = "" }) => {
  const [selectedPotionId, setSelectedPotionId] = useState(
    ID_POTION_ITEMS.POTION_GROWTH_ELIXIR
  );
  const { potionData } = usePotion();
  const { show } = useNotification();
  
  const onItemClicked = (id) => {
    setSelectedPotionId(id);
  };
  return (
    <BaseDialog onClose={onClose} title={label} header={header} className="custom-modal-background">
      <div className="potion-dialog">
        <CardView className="left-panel">
          <ItemCardList>
            {ITEM_POTIONS.map((potionId, index) => (
              <ItemCardView
                key={index}
                itemId={potionId}
                selectable
                selected={selectedPotionId === potionId}
                onClick={() => onItemClicked(potionId)}
              ></ItemCardView>
            ))}
          </ItemCardList>
        </CardView>
        <CardView className="right-panel">
          {potionData.loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Crafting potion...</span>
            </div>
          )}
          {potionData.error && (
            <div className="error-message">
              <span>Error: {potionData.error}</span>
            </div>
          )}
          <ItemCombinationBox itemId={selectedPotionId} limitedController={false}></ItemCombinationBox>
        </CardView>
      </div>
    </BaseDialog>
  );
};

export default PotionDialog;
