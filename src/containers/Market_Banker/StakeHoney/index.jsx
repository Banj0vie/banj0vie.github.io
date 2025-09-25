import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import TokenInputRow from "../../Market_Dex/TokenInputRow";
import CardListView from "../../../components/boxes/CardListView";
import { useBanker } from "../../../hooks/useContracts";
import { useAgwEthersAndService } from "../../../hooks/useContractBase";
import { useNotification } from "../../../contexts/NotificationContext";
import { ethers } from "ethers";

const StakeHoney = ({ onBack }) => {
  const [isStaking, setIsStaking] = useState(true);
  const [amount, setAmount] = useState("0");
  const [data, setData] = useState([]);
  const [honeyBalance, setHoneyBalance] = useState("0");
  const [xHoneyBalance, setXHoneyBalance] = useState("0");
  const [ratio, setRatio] = useState(1.0); // Ratio as float
  const [estRewards, setEstRewards] = useState("0.000 Honey");
  
  const { account, contractService } = useAgwEthersAndService();
  const { stake, unstake, getBalance, getBankerData, loading, error } = useBanker();
  const { show } = useNotification();

  // Load balances
  const loadBalances = useCallback(async () => {
    if (!account) return;
    
    try {
      // Get XHoney balance (staked balance)
      const xHoneyBal = await getBalance(account);
      setXHoneyBalance(ethers.formatEther(xHoneyBal));
      
      // Get Honey balance from yield token contract
      if (contractService) {
        const honeyBal = await contractService.getYieldBalance(account);
        setHoneyBalance(ethers.formatEther(honeyBal));
      } else {
        setHoneyBalance("0.000");
      }
      
      // Calculate actual ratio from contract using the hook
      const bankerData = await getBankerData();
      if (bankerData) {
        setRatio(bankerData.ratio);
        
        // Calculate estimated rewards (XHoney balance * ratio)
        const xHoneyBalanceNum = parseFloat(ethers.formatEther(xHoneyBal));
        const estimatedRewards = xHoneyBalanceNum * bankerData.ratio;
        setEstRewards(`${estimatedRewards.toFixed(3)} Honey`);
      } else {
        setRatio(1.0); // Default ratio as float
        setEstRewards("0.000 Honey");
      }
    } catch (err) {
      console.error('Failed to load balances:', err);
    }
  }, [account, getBalance, getBankerData, contractService]);

  // Handle deposit (stake)
  const onDeposit = useCallback(async () => {
    if (!amount || amount === "0") {
      show('Please enter an amount to stake', 'warning');
      return;
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      show('Please enter a valid amount', 'warning');
      return;
    }

    // Check if user has enough balance
    const userhoneyBalance = parseFloat(honeyBalance);
    if (amountNum > userhoneyBalance) {
      show(`Insufficient Honey balance. You have ${honeyBalance} Honey`, 'warning');
      return;
    }

    try {
      const amountWei = ethers.parseEther(amount);
      
      show('Staking Honey tokens...', 'info');
      
      const result = await stake(amountWei);
      
      if (result) {
        show(`Successfully staked ${amount} Honey!`, 'success');
        setAmount("0");
        await loadBalances(); // Refresh balances
      } else {
        show('Failed to stake tokens', 'error');
      }
    } catch (err) {
      console.error('Stake error:', err);
      show(`Stake failed: ${err.message}`, 'error');
    }
  }, [amount, honeyBalance, stake, show, loadBalances]);

  // Handle balance click to fill input
  const handleBalanceClick = useCallback((balance) => {
    setAmount(balance);
  }, []);

  // Handle withdraw (unstake)
  const onWithdraw = useCallback(async () => {
    if (!amount || amount === "0") {
      show('Please enter an amount to unstake', 'warning');
      return;
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      show('Please enter a valid amount', 'warning');
      return;
    }

    // Check if user has enough XHoney balance
    const userxHoneyBalance = parseFloat(xHoneyBalance);
    if (amountNum > userxHoneyBalance) {
      show(`Insufficient XHoney balance. You have ${xHoneyBalance} XHoney`, 'warning');
      return;
    }

    try {
      const amountWei = ethers.parseEther(amount);
      const result = await unstake(amountWei);
      
      if (result) {
        show(`Successfully unstaked ${amount} XHoney!`, 'success');
        setAmount("0");
        await loadBalances(); // Refresh balances
      } else {
        show('Failed to unstake tokens', 'error');
      }
    } catch (err) {
      console.error('Unstake error:', err);
      show(`Unstake failed: ${err.message}`, 'error');
    }
  }, [amount, xHoneyBalance, unstake, show, loadBalances]);

  // Load balances on mount and when account changes
  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    setData(
      isStaking
        ? [
            { label: "Ratio", value: `1 XHONEY - ${ratio.toFixed(3)} HONEY` },
            { label: "XHoney Balance", value: `${parseFloat(xHoneyBalance).toFixed(3)} XHoney` },
            { label: "Est. Honey Rewards", value: estRewards },
          ]
        : [
            { label: "Ratio", value: `1 XHONEY - ${ratio.toFixed(3)} HONEY` },
            { label: "XHoney Balance", value: `${parseFloat(xHoneyBalance).toFixed(3)} XHoney` },
            { label: "Honey Balance", value: `${parseFloat(honeyBalance).toFixed(3)} Honey` },
            { label: "Est. Honey Rewards", value: estRewards },
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
        balance={isStaking ? honeyBalance : xHoneyBalance}
        token={isStaking ? "Honey" : "XHoney"}
        value={amount}
        onChange={setAmount}
        onBalanceClick={handleBalanceClick}
      ></TokenInputRow>
      <CardListView data={data}></CardListView>
      <BaseButton
        label={loading ? "Processing..." : (isStaking ? "Deposit" : "Withdraw")}
        onClick={isStaking ? onDeposit : onWithdraw}
        disabled={loading || !amount || amount === "0"}
      ></BaseButton>
      <BaseButton 
        label="Back" 
        onClick={onBack}
        disabled={loading}
      ></BaseButton>
      {/* {error && (
        <div className="error-message" style={{ 
          color: '#ff3b30', 
          marginTop: '10px', 
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )} */}
      <div className="hint">
        <span className="highlight">0.5%</span> of each gacha roll is
        <br /> redirected to the Bank!
      </div>
    </div>
  );
};
export default StakeHoney;
