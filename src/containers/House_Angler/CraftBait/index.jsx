import React, { useState } from "react";
import "./style.css";
import CardView from "../../../components/boxes/CardView";
import BaseButton from "../../../components/buttons/BaseButton";
import { ITEM_BAITS } from "../../../constants/item_bait";
import ItemCardView from "../../../components/boxes/ItemCardView";
import ItemCardList from "../../../components/boxes/ItemCardList";
import ItemCombinationBox from "../../../components/boxes/ItemCombinationBox";
import { ID_BAIT_ITEMS } from "../../../constants/app_ids";

const CraftBait = ({ onBack }) => {
  const [selectedBaitId, setSelectedBaitId] = useState(ID_BAIT_ITEMS.BAIT_1);
  const onItemClicked = (id) => {
    setSelectedBaitId(id);
  };
  return (
    <div className="craft-bait">
      <CardView className="left-panel">
        <ItemCardList>
          {ITEM_BAITS.map((baitId, index) => (
            <ItemCardView
              key={index}
              itemId={baitId}
              selectable
              selected={selectedBaitId === baitId}
              onClick={() => onItemClicked(baitId)}
            ></ItemCardView>
          ))}
        </ItemCardList>
        <BaseButton label="Back" onClick={onBack}></BaseButton>
      </CardView>
      <CardView className="right-panel">
        <ItemCombinationBox itemId={selectedBaitId}></ItemCombinationBox>
      </CardView>
    </div>
  );
};

export default CraftBait;
