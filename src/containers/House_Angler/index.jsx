import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import { ID_ANGLER_PAGES } from "../../constants/app_ids";
import AnglerMenu from "./AnglerMenu";
import CraftBait from "./CraftBait";
import StartFishing from "./StartFishing";
import Fishing from "./Fishing";

const AnglerDialog = ({ onClose, label = "QUIET POND", header = "" }) => {
  const [pageIndex, setPageIndex] = useState(ID_ANGLER_PAGES.ANGLER_MENU);
  const [selectedBaitId, setSelectedBaitId] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(0);

  const onStartFishing = (baitId, amount) => {
    setSelectedBaitId(baitId);
    setSelectedAmount(amount);
    setPageIndex(ID_ANGLER_PAGES.FISHING);
  };

  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      {pageIndex === ID_ANGLER_PAGES.ANGLER_MENU && (
        <AnglerMenu
          onStartFish={() => setPageIndex(ID_ANGLER_PAGES.START_FISHING)}
          onCraftBait={() => setPageIndex(ID_ANGLER_PAGES.CRAFT_BAIT)}
        ></AnglerMenu>
      )}
      {pageIndex === ID_ANGLER_PAGES.CRAFT_BAIT && (
        <CraftBait
          onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)}
        ></CraftBait>
      )}
      {pageIndex === ID_ANGLER_PAGES.START_FISHING && (
        <StartFishing
          onBack={() => setPageIndex(ID_ANGLER_PAGES.ANGLER_MENU)}
          onStart={onStartFishing}
        ></StartFishing>
      )}
      {pageIndex === ID_ANGLER_PAGES.FISHING && (
        <Fishing
          baitId={selectedBaitId}
          amount={selectedAmount}
          onBuyAgain={() => setPageIndex(ID_ANGLER_PAGES.START_FISHING)}
        ></Fishing>
      )}
    </BaseDialog>
  );
};

export default AnglerDialog;
