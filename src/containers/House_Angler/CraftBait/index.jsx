import React from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import BaseButton from "../../../components/buttons/BaseButton";
import { ITEM_BAITS } from "../../../constants/item_bait";
import ItemCardView from "../../../components/boxes/ItemCardView";
import ItemCardList from "../../../components/boxes/ItemCardList";

const CraftBait = ({ onBack }) => {
  return (
    <div className="craft-bait">
      <CardView className="left-panel">
        <ItemCardList>
          {ITEM_BAITS.map((baitId, index) => (
            <ItemCardView key={index} itemId={baitId}></ItemCardView>
          ))}
        </ItemCardList>
        <BaseButton label="Back" onClick={onBack}></BaseButton>
      </CardView>
      <CardView className="right-panel"></CardView>
    </div>
  );
};

export default CraftBait;
