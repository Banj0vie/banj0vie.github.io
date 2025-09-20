import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import { ID_POTION_ITEMS } from "../../constants/app_ids";
import CardView from "../../components/boxes/CardView";
import ItemCardList from "../../components/boxes/ItemCardList";
import ItemCardView from "../../components/boxes/ItemCardView";
import ItemCombinationBox from "../../components/boxes/ItemCombinationBox";
import { ITEM_POTIONS } from "../../constants/item_potion";

const PotionDialog = ({ onClose, label = "POTION MASTER", header = "" }) => {
  const [selectedPotionId, setSelectedPotionId] = useState(
    ID_POTION_ITEMS.POTION_GROWTH_ELIXIR
  );
  const onItemClicked = (id) => {
    setSelectedPotionId(id);
  };
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
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
          <ItemCombinationBox itemId={selectedPotionId} limitedController={false}></ItemCombinationBox>
        </CardView>
      </div>
    </BaseDialog>
  );
};

export default PotionDialog;
