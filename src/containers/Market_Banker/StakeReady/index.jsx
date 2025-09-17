import React, { useEffect, useState } from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import TokenInputRow from "../../Market_Dex/TokenInputRow";
import CardListView from "../../../components/boxes/CardListView";

const StakeReady = ({ onBack }) => {
  const [isStaking, setIsStaking] = useState(true);
  const [amount, setAmount] = useState("0");
  const [data, setData] = useState([]);
  const onDeposit = () => {};
  const onWithdraw = () => {};

  useEffect(() => {
    setData(
      isStaking
        ? [
            { label: "Ratio", value: "1 XREADY - 5.1894 READY" },
            { label: "XReady Balance", value: "481.899 XReady" },
            { label: "Est. Ready Rewards", value: "2500.787 Ready" },
          ]
        : [
            { label: "Ratio", value: "1 XREADY - 5.1894 READY" },
            { label: "XReady Balance", value: "481.899 XReady" },
            { label: "Ready Balance", value: "0.000 Ready" },
            { label: "Est. Ready Rewards", value: "2500.787 Ready" },
          ]
    );
  }, [isStaking]);
  return (
    <div className="stake-ready">
      <div className="stake-unstake-buttons">
        <BaseButton
          className="h-4rem"
          label="Stake"
          onClick={() => setIsStaking(true)}
          focused={isStaking}
        ></BaseButton>
        <BaseButton
          className="h-4rem"
          label="Unstake"
          onClick={() => setIsStaking(false)}
          focused={!isStaking}
        ></BaseButton>
      </div>
      <TokenInputRow
        balance={null}
        token={isStaking ? "Ready" : "XReady"}
        value={amount}
        onChange={setAmount}
      ></TokenInputRow>
      <CardListView data={data}></CardListView>
      <BaseButton
        label={isStaking ? "Deposit" : "Withdraw"}
        onClick={isStaking ? onDeposit : onWithdraw}
      ></BaseButton>
      <BaseButton label="Back" onClick={onBack}></BaseButton>
      <div className="hint">
        <span className="highlight">0.5%</span> of each gacha roll is
        <br /> redirected to the Bank!
      </div>
    </div>
  );
};
export default StakeReady;
