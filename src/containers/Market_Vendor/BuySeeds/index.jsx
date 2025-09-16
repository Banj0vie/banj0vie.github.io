import React, { useEffect, useState } from "react";
import "./style.css";
import { SEED_PACKS } from "../../../constants/item_seed";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BuySeedBox from "../../../components/boxes/BuySeedBox";
import BaseButton from "../../../components/buttons/BaseButton";

const BuySeeds = ({ menuId, onBack, onBuy }) => {
  const [seedPack, setSeedPack] = useState({});

  useEffect(() => {
    setSeedPack(SEED_PACKS.find((sp) => sp.id === menuId));
  }, [menuId]);

  return (
    <div className="buy-seeds-wrapper">
      <BaseDivider />
      {seedPack &&
        seedPack.id &&
        seedPack.items &&
        seedPack.items.map((item, index) => (
          <BuySeedBox
            key={index}
            item={item}
            onBuy={() => {
              onBuy(item);
            }}
          ></BuySeedBox>
        ))}
      {seedPack && seedPack.tip && <BaseDivider></BaseDivider>}
      {seedPack && seedPack.tip && (
        <div className="buy-seed-tip highlight">{seedPack.tip}</div>
      )}
      <BaseButton 
        className="h-4rem"
        label="Back"
        onClick={onBack}
      ></BaseButton>
    </div>
  );
};

export default BuySeeds;
