import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BankerMenu from "./BankerMenu";
import { ID_BANKER_PAGES } from "../../constants/app_ids";
import StakeHoney from "./StakeHoney";
import StakeLP from "./StakeLP";

const BankerDialog = ({ onClose, label = "VENDOR", header = "" }) => {
  const [bankerPage, setBankerPage] = useState(ID_BANKER_PAGES.BANKER_MENU);
  return (
    <BaseDialog onClose={onClose} title={label} header={header}>
      {bankerPage === ID_BANKER_PAGES.BANKER_MENU && (
        <BankerMenu
          onStakeHoneyClick={() => setBankerPage(ID_BANKER_PAGES.STAKE_HONEY)}
          onStakeLPClick={() => setBankerPage(ID_BANKER_PAGES.STAKE_LP)}
        ></BankerMenu>
      )}
      {bankerPage === ID_BANKER_PAGES.STAKE_HONEY && (
        <StakeHoney onBack={() => setBankerPage(ID_BANKER_PAGES.BANKER_MENU)} />
      )}
      {bankerPage === ID_BANKER_PAGES.STAKE_LP && (
        <StakeLP onBack={() => setBankerPage(ID_BANKER_PAGES.BANKER_MENU)} />
      )}
    </BaseDialog>
  );
};

export default BankerDialog;
