import React, { useEffect, useState, useCallback } from "react";
import "./style.css";
import BaseButton from "../../../components/buttons/BaseButton";
import TokenInputRow from "../../Market_Dex/TokenInputRow";
import CardListView from "../../../components/boxes/CardListView";
import { useBanker, useContracts } from "../../../hooks/useContracts";
import { useWeb3 } from "../../../contexts/Web3Context";
import { useNotification } from "../../../contexts/NotificationContext";
import { ethers } from "ethers";

const StakeReady = ({ onBack }) => {
  const [isStaking, setIsStaking] = useState(true);
  const [amount, setAmount] = useState("0");
  const [data, setData] = useState([]);
  const [readyBalance, setReadyBalance] = useState("0");
  const [xReadyBalance, setXReadyBalance] = useState("0");
  const [ratio, setRatio] = useState(1.0); // Ratio as float
  const [estRewards, setEstRewards] = useState("0.000 Ready");
  
  const { account } = useWeb3();
  const { contracts } = useContracts();
  const { stake, unstake, getBalance, loading, error } = useBanker();
  const { show } = useNotification();

  // Load balances
  const loadBalances = useCallback(async () => {
    if (!account) return;
    
    try {
      // Get XReady balance (staked balance)
      const xReadyBal = await getBalance(account);
      setXReadyBalance(ethers.formatEther(xReadyBal));
      
      // Get Ready balance from yield token contract
      if (contracts.yield_token) {
        const readyBal = await contracts.yield_token.balanceOf(account);
        setReadyBalance(ethers.formatEther(readyBal));
      } else {
        setReadyBalance("0.000");
      }
      
      // Calculate actual ratio from contract
      if (contracts.banker) {
        const [totalSupply, tokenBalance] = await Promise.all([
          contracts.banker.totalSupply(),
          contracts.banker.totalGameToken()
        ]);
        
        const totalSupplyNum = parseFloat(ethers.formatEther(totalSupply));
        const tokenBalanceNum = parseFloat(ethers.formatEther(tokenBalance));
        console.log(totalSupplyNum, tokenBalanceNum);
        if (totalSupplyNum > 0 && tokenBalanceNum > 0) {
          const ratioValue = tokenBalanceNum / totalSupplyNum;
          setRatio(ratioValue); // Store as float
          
          // Calculate estimated rewards (XReady balance * ratio)
          const xReadyBalanceNum = parseFloat(ethers.formatEther(xReadyBal));
          const estimatedRewards = xReadyBalanceNum * ratioValue;
          setEstRewards(`${estimatedRewards.toFixed(3)} Ready`);
        } else {
          setRatio(1.0); // Default ratio as float
          setEstRewards("0.000 Ready");
        }
      } else {
        setRatio(1.0); // Default ratio as float
        setEstRewards("0.000 Ready");
      }
    } catch (err) {
    }
  }, [account, getBalance, contracts.yield_token, contracts.banker]);

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
    const userReadyBalance = parseFloat(readyBalance);
    if (amountNum > userReadyBalance) {
      show(`Insufficient Ready balance. You have ${readyBalance} Ready`, 'warning');
      return;
    }

    try {
      const amountWei = ethers.parseEther(amount);
      
      show('Staking Ready tokens...', 'info');
      
      const result = await stake(amountWei);
      
      if (result) {
        show(`Successfully staked ${amount} Ready!`, 'success');
        setAmount("0");
        await loadBalances(); // Refresh balances
      } else {
        show('Failed to stake tokens', 'error');
      }
    } catch (err) {
      console.error('Stake error:', err);
      show(`Stake failed: ${err.message}`, 'error');
    }
  }, [amount, readyBalance, stake, show, loadBalances]);

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

    // Check if user has enough XReady balance
    const userXReadyBalance = parseFloat(xReadyBalance);
    if (amountNum > userXReadyBalance) {
      show(`Insufficient XReady balance. You have ${xReadyBalance} XReady`, 'warning');
      return;
    }

    try {
      const amountWei = ethers.parseEther(amount);
      const result = await unstake(amountWei);
      
      if (result) {
        show(`Successfully unstaked ${amount} XReady!`, 'success');
        setAmount("0");
        await loadBalances(); // Refresh balances
      } else {
        show('Failed to unstake tokens', 'error');
      }
    } catch (err) {
      console.error('Unstake error:', err);
      show(`Unstake failed: ${err.message}`, 'error');
    }
  }, [amount, xReadyBalance, unstake, show, loadBalances]);

  // Load balances on mount and when account changes
  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    setData(
      isStaking
        ? [
            { label: "Ratio", value: `1 XREADY - ${ratio.toFixed(3)} READY` },
            { label: "XReady Balance", value: `${parseFloat(xReadyBalance).toFixed(3)} XReady` },
            { label: "Est. Ready Rewards", value: estRewards },
          ]
        : [
            { label: "Ratio", value: `1 XREADY - ${ratio.toFixed(3)} READY` },
            { label: "XReady Balance", value: `${parseFloat(xReadyBalance).toFixed(3)} XReady` },
            { label: "Ready Balance", value: `${parseFloat(readyBalance).toFixed(3)} Ready` },
            { label: "Est. Ready Rewards", value: estRewards },
          ]
    );
  }, [isStaking, ratio, xReadyBalance, readyBalance, estRewards]);
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
        balance={isStaking ? readyBalance : xReadyBalance}
        token={isStaking ? "Ready" : "XReady"}
        value={amount}
        onChange={setAmount}
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
      {error && (
        <div className="error-message" style={{ 
          color: '#ff3b30', 
          marginTop: '10px', 
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      <div className="hint">
        <span className="highlight">0.5%</span> of each gacha roll is
        <br /> redirected to the Bank!
      </div>
    </div>
  );
};
export default StakeReady;
