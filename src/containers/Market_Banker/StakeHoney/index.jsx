import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from 'react-redux';
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import TokenInputRow from "../../Market_Dex/TokenInputRow";
import CardListView from "../../../components/boxes/CardListView";
import { useBanker } from "../../../hooks/useBanker";
import { useNotification } from "../../../contexts/NotificationContext";
import { isTransactionRejection } from "../../../utils/errorUtils";
import { useSolanaWallet } from "../../../hooks/useSolanaWallet";
import CardView from "../../../components/boxes/CardView";

// bankerSlice removed with the wallet code — these selectors return inert defaults.
const selectBankerTotalGameToken = () => 0;
const selectBankerTotalXGameToken = () => 0;
const selectBankerLoading = () => false;

const StakeHoney = ({ onBack }) => {
  const [isStaking, setIsStaking] = useState(true);
  const [amount, setAmount] = useState("0");
  const [data, setData] = useState([]);

  const { publicKey } = useSolanaWallet();
  const { stake, unstake, getBalance, getBankerData } = useBanker();
  const { show } = useNotification();

  // Redux selectors for balances and banker data
  const gameToken = useSelector(state => state.balance.gameToken);
  const xTokenShare = useSelector(state => state.balance.xTokenShare);
  const totalGameToken = useSelector(selectBankerTotalGameToken);
  const totalXGameToken = useSelector(selectBankerTotalXGameToken);
  const ratioRaw = parseFloat(totalGameToken) / parseFloat(totalXGameToken);
  const ratio = Number.isFinite(ratioRaw) && ratioRaw > 0 ? ratioRaw : 0;
  const loading = useSelector(selectBankerLoading);

  // Format balances for display
  const honeyBalance = parseFloat(gameToken).toFixed(3);
  const xHoneyBalance = parseFloat(xTokenShare).toFixed(3);
  const estRewards = Number.isFinite(ratio)
    ? (parseFloat(xHoneyBalance) * ratio).toFixed(3)
    : '0.000';


  // Load balances and banker data on mount and when publicKey changes
  const loadData = useCallback(async () => {
    if (!publicKey) return;
    try {
      await Promise.all([
        getBalance(),
        getBankerData(),
      ]);
    } catch (err) {
      console.error("Failed to load banker data:", err);
    }
  }, [publicKey, getBalance, getBankerData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle deposit (stake)
  const onDeposit = useCallback(async () => {
    if (!amount || amount === "0") {
      show("Please enter an amount to stake", "warning");
      return;
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      show("Please enter a valid amount", "warning");
      return;
    }

    // Check if user has enough balance
    const userHoneyBalance = parseFloat(honeyBalance);
    if (amountNum > userHoneyBalance) {
      show(
        `Insufficient Honey balance. You have ${honeyBalance} Honey`,
        "warning"
      );
      return;
    }

    try {
      const amountLamports = Math.floor(parseFloat(amount));

      show("Staking Honey tokens...", "info");

      const result = await stake(amountLamports);

      if (result) {
        show(`Successfully staked ${amount} Honey!`, "success");
        setAmount("0");
        await loadData(); // Refresh balances
      }
    } catch (err) {
      console.error("Stake error:", err);
      show(`Stake failed: ${err.message}`, "error");
    }
  }, [amount, honeyBalance, stake, show, loadData]);

  // Handle balance click to fill input
  const handleBalanceClick = useCallback((balance) => {
    setAmount(balance);
  }, []);

  // Handle withdraw (unstake)
  const onWithdraw = useCallback(async () => {
    if (!amount || amount === "0") {
      show("Please enter an amount to unstake", "warning");
      return;
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      show("Please enter a valid amount", "warning");
      return;
    }

    // Check if user has enough XHoney balance
    const userXHoneyBalance = parseFloat(xHoneyBalance);
    if (amountNum > userXHoneyBalance) {
      show(
        `Insufficient XHoney balance. You have ${xHoneyBalance} XHoney`,
        "warning"
      );
      return;
    }

    try {
      const amountLamports = Math.floor(parseFloat(amount));
      const result = await unstake(amountLamports);

      if (result) {
        show(`Successfully unstaked ${amount} XHoney!`, "success");
        setAmount("0");
        await loadData(); // Refresh balances
      }
    } catch (err) {
      console.error("Unstake error:", err);
      show(`Unstake failed: ${err.message}`, "error");
    }
  }, [amount, xHoneyBalance, unstake, show, loadData]);

  // Update display data based on mode and state
  useEffect(() => {
    setData(
      isStaking
        ? [
          { label: "Ratio", value: `1 XHONEY - ${Number.isFinite(ratio) ? ratio.toFixed(3) : '0.000'} HONEY` },
          {
            label: "XHoney Balance",
            value: `${xHoneyBalance} XHoney`,
          },
          { label: "Est. Honey Rewards", value: `${estRewards} Honey` },
        ]
        : [
          { label: "Ratio", value: `1 XHONEY - ${Number.isFinite(ratio) ? ratio.toFixed(3) : '0.000'} HONEY` },
          {
            label: "XHoney Balance",
            value: `${xHoneyBalance} XHoney`,
          },
          {
            label: "Honey Balance",
            value: `${honeyBalance} Honey`,
          },
          { label: "Est. Honey Rewards", value: `${estRewards} Honey` },
        ]
    );
  }, [isStaking, ratio, xHoneyBalance, honeyBalance, estRewards]);

  // Clear input when switching between stake/unstake
  useEffect(() => {
    setAmount("0");
  }, [isStaking]);

  return (
    <div className="stake-honey">
      <div className="stake-unstake-buttons">
        <BaseButton
          className="h-3rem"
          label="Stake"
          onClick={() => setIsStaking(true)}
          focused={isStaking}
        ></BaseButton>
        <BaseButton
          className="h-3rem"
          label="Unstake"
          onClick={() => setIsStaking(false)}
          focused={!isStaking}
        ></BaseButton>
      </div>
      <TokenInputRow
        balance={isStaking ? honeyBalance : xHoneyBalance}
        token={isStaking ? "Honey" : "XHoney"}
        value={amount}
        onChange={setAmount}
        onBalanceClick={handleBalanceClick}
      ></TokenInputRow>
      <CardListView data={data}></CardListView>
      <BaseButton
        className="h-3.5rem"
        label={loading ? "Processing..." : isStaking ? "Deposit" : "Withdraw"}
        onClick={isStaking ? onDeposit : onWithdraw}
        disabled={loading || !amount || amount === "0"}
        large={true}
      ></BaseButton>
      <BaseButton className="h-3.5rem" label="Back" onClick={onBack} disabled={loading} large={true} isError={true}></BaseButton>

      <CardView className="min-h-0">
        <div className="hint">
          <span className="highlight">0.5%</span> of each gacha roll is redirected to the Bank!
        </div>
      </CardView>
    </div>
  );
};
export default StakeHoney;
