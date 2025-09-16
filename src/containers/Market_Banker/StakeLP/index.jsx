import React, { useState } from "react";
import "./style.css";
import CardListView from "../../../components/boxes/CardListView";
import BaseButton from "../../../components/buttons/BaseButton";

const StakeLP = ({ onBack }) => {
  // eslint-disable-next-line no-unused-vars
  const [data, setData] = useState([
    { label: "Thruster LP TVL", value: "???" },
    { label: "Base APY", value: "???" },
    { label: "Bonus YIELD APY", value: "???" },
    { label: "Total APY", value: "???" },
  ]);

  const onThrusterV2Click = () => {
    window.open("https://app.thruster.finance/analytics", "_blank");
  };
  const onHyperlockClick = () => {
    window.open("https://app.hyperlock.finance/", "_blank");
  };
  return (
    <div className="stake-lp">
      <CardListView data={data}></CardListView>
      <BaseButton
        className="h-3rem"
        label="Provide Liquidity on Thruster V2"
        onClick={onThrusterV2Click}
      ></BaseButton>
      <BaseButton
        className="h-3rem"
        label="Boost LP on Hyperlock"
        onClick={onHyperlockClick}
      ></BaseButton>
      <BaseButton label="Back" onClick={onBack}></BaseButton>
    </div>
  );
};
export default StakeLP;
