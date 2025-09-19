import React, { useState } from "react";
import "./style.css";
import { fishImages, fishingPanelImages } from "../../../constants/_baseimages";
import BaseButton from "../../../components/buttons/BaseButton";
import LootReceivedDialog from "../../LootReceivedDialog";
import { ID_LOOTS } from "../../../constants/app_ids";

const TESTING_ITEMS = [
  {
    id: ID_LOOTS.CATFISH,
    count: 1,
  },
  {
    id: ID_LOOTS.CATFISH,
    count: 1,
  },
  {
    id: ID_LOOTS.CATFISH,
    count: 1,
  },
  {
    id: ID_LOOTS.CATFISH,
    count: 1,
  },
  {
    id: ID_LOOTS.CATFISH,
    count: 1,
  },
];

const Fishing = ({ baitId, amount, onBuyAgain }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLootReceivedDialog, setIsLootReceivedDialog] = useState(false);
  const [isBuyAgain, setIsBuyAgain] = useState(false);
  const onReel = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLootReceivedDialog(true);
    }, 1000);
  };

  const onCloseLootReceiveDialog = () => {
    setIsLootReceivedDialog(false);
    setIsBuyAgain(true);
  };
  return (
    <div className="fishing-wrapper">
      <div className="loading">
        <img
          className="background"
          src={fishingPanelImages.background}
          alt="fishing panel"
        ></img>
        <img className="pin" src={fishImages.catfish} alt="fish"></img>
      </div>
      {isBuyAgain ? (
        <BaseButton
          className="button"
          label="Buy Again"
          onClick={onBuyAgain}
        ></BaseButton>
      ) : isLoading ? (
        <BaseButton className="button" label="Loading..." disabled></BaseButton>
      ) : (
        <BaseButton
          className="button"
          label="Reel in Fish"
          onClick={onReel}
        ></BaseButton>
      )}
      {isLootReceivedDialog && (
        <LootReceivedDialog
          onClose={onCloseLootReceiveDialog}
          items={TESTING_ITEMS}
        ></LootReceivedDialog>
      )}
    </div>
  );
};

export default Fishing;
