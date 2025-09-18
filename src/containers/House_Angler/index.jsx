import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import { ID_ANGLER_PAGES } from "../../constants/app_ids";
import AnglerMenu from "./AnglerMenu";
import CraftBait from "./CraftBait";

const AnglerDialog = ({ onClose, label = "QUIET POND", header = "" }) => {
  const [pageIndex, setPageIndex] = useState(ID_ANGLER_PAGES.ANGLER_MENU);
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
    </BaseDialog>
  );
};

export default AnglerDialog;
