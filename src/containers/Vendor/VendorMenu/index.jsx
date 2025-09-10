import React from "react";
import "./style.css";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseButton from "../../../components/buttons/BaseButton";
import ErrorLabel from "../../../components/labels/ErrorLabel";
import { ID_SEED_SHOP_ITEMS } from "../../../constants/id";
import { SEED_PACK_STATUS } from "../../../constants/seedPack";

const VendorMenu = ({ seedStatus, onSeedsClicked, onRollChancesClicked }) => {
  const availablePlots = 29;
  const seedOrder = [
    ID_SEED_SHOP_ITEMS.FEEBLE_SEED,
    ID_SEED_SHOP_ITEMS.PICO_SEED,
    ID_SEED_SHOP_ITEMS.BASIC_SEED,
    ID_SEED_SHOP_ITEMS.PREMIUM_SEED,
  ];
  return (
    <div className="vendor-menu">
      <div className="available-plots">Available Plots: {availablePlots}</div>
      <BaseDivider></BaseDivider>
      {seedOrder.map((id) => (
        <BaseButton
          className="vendor-button"
          label={
            seedStatus[id].status === SEED_PACK_STATUS.NORMAL
              ? seedStatus[id].label
              : seedStatus[id].status === SEED_PACK_STATUS.COMMITING
              ? "Committing..."
              : `Reveal ${seedStatus[id].count} ${seedStatus[id].label}`
          }
          key={id}
          onClick={() => {
            onSeedsClicked(id);
          }}
          disabled={seedStatus[id].status === SEED_PACK_STATUS.COMMITING}
        />
      ))}
      <BaseDivider></BaseDivider>
      <BaseButton
        className="vendor-button"
        label="Roll Chances"
        onClick={() => {
          onRollChancesClicked();
        }}
      ></BaseButton>
      <br />
      <ErrorLabel
        text={"Caution: Please reveal within ~8 minutes!"}
      ></ErrorLabel>
    </div>
  );
};

export default VendorMenu;
