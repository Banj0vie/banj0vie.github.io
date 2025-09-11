import React, { useEffect, useState } from "react";
import BaseDialog from "../BaseDialog";
import "./style.css";
import TokenInputRow from "./TokenInputRow";
import ExchangeButton from "../../components/buttons/ExchangeButton";
import BaseButton from "../../components/buttons/BaseButton";
import LabelValueBox from "../../components/boxes/LabelValueBox";
import DividerLink from "../../components/links/DividerLink";
import { generateId } from "../../utils/basic";
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
  const [isReversed, setIsReversed] = useState(false);
  const [swapInfo, setSwapInfo] = useState([]);

  const onSwap = () => {
    console.log("Swap Pressed!");
  };

  useEffect(() => {
    setSwapInfo([
      { label: "Slippage", value: "0.5%" },
      { label: "Price Impact", value: "0.39%" },
      { label: "Minimum Received", value: "23908.50" },
    ]);
  }, []);

  return (
    <BaseDialog className="dex-wrapper" title={label} onClose={onClose} header={header}>
      <div className="dex-dialog">
        <div
          className="swap-wrapper"
          style={{ flexDirection: isReversed ? "column-reverse" : "column" }}
        >
          <TokenInputRow token={"ETH"} balance={"0.00"} />
          <ExchangeButton
            onclick={() => {
              setIsReversed(!isReversed);
            }}
          ></ExchangeButton>
          <TokenInputRow token={"Yield"} balance={"12769.999912314"} />
        </div>
        <BaseButton label="Swap" onClick={onSwap}></BaseButton>
        {swapInfo.map((item) => (
          <LabelValueBox key={generateId()} label={item.label} value={item.value}></LabelValueBox>
        ))}
        <br/>
        <DividerLink
          label=" Using Thruster's Uniswap V2 Router! "
          link="https://app.thruster.finance/"
        ></DividerLink>
      </div>
    </BaseDialog>
  );
};

export default DexDialog;
