import React, { useEffect, useState, useRef } from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import TokenInputRow from "./TokenInputRow";
import ExchangeButton from "../../components/buttons/ExchangeButton";
import BaseButton from "../../components/buttons/BaseButton";
import LabelValueBox from "../../components/boxes/LabelValueBox";
import DividerLink from "../../components/links/DividerLink";
import { generateId } from "../../utils/basic";
import { useDex } from "../../hooks/useContracts";
import { useNotification } from "../../contexts/NotificationContext";
import { isTransactionRejection } from "../../utils/errorUtils";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { ethers } from 'ethers';
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
  const { isConnected } = useSolanaWallet();
  const { swapETHForYield, swapHoneyForETH, getYieldAmount, getETHAmount, ethBalance, honeyBalance, fetchBalances, loading, error } = useDex();
  
  const [isReversed, setIsReversed] = useState(false);
  const [swapInfo, setSwapInfo] = useState([]);
  const [ethAmount, setEthAmount] = useState('');
  const [honeyAmount, setHoneyAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const { show: showNotification } = useNotification();

  // Monitor errors and show notifications with duplicate prevention
  const lastNotificationTime = useRef(0);
  useEffect(() => {
    if (error) {
      const now = Date.now();
      // Only show notification if it's been more than 2 seconds since last notification
      if (now - lastNotificationTime.current > 2000) {
        lastNotificationTime.current = now;
        if (isTransactionRejection(error)) {
          showNotification('Transaction was rejected by user.', 'error');
        } else {
          showNotification(`DEX operation failed!`, 'error');
        }
      }
    }
  }, [error, showNotification]);

  // Calculate amounts when either input changes
  useEffect(() => {
    const calculateAmounts = async () => {
      if (!isConnected) {
        setHoneyAmount('0');
        setEthAmount('');
        return;
      }
      
      try {
        setIsCalculating(true);
        
        if (isReversed) {
          // Honey → ETH: Calculate ETH amount based on Honey input
          if (!honeyAmount || parseFloat(honeyAmount) <= 0) {
            setEthAmount('');
            return;
          }
          const honeyWei = (honeyAmount);
          const ethAmount = await getETHAmount(honeyWei);
          console.log("🚀 ~ calculateAmounts ~ ETH amount for", honeyAmount, "Honey:", ethAmount);
          setEthAmount(ethers.formatEther(ethAmount));
        } else {
          // ETH → Honey: Calculate Honey amount based on ETH input
          if (!ethAmount || parseFloat(ethAmount) <= 0) {
            setHoneyAmount('0');
            return;
          }
          const ethWei = (ethAmount);
          const honeyAmount = await getYieldAmount(ethWei);
          console.log("🚀 ~ calculateAmounts ~ Honey amount for", ethAmount, "ETH:", honeyAmount);
          setHoneyAmount(ethers.formatEther(honeyAmount));
        }
      } catch (err) {
        console.error('Failed to calculate amounts:', err);
        if (isReversed) {
          setEthAmount('');
        } else {
          setHoneyAmount('0');
        }
      } finally {
        setIsCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculateAmounts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [ethAmount, honeyAmount, isReversed, isConnected, getYieldAmount, getETHAmount]);

  const onSwap = async () => {
    if (!isConnected) {
      showNotification('Please connect your wallet first', 'warning');
      return;
    }

    if (isReversed) {
      // Honey → ETH swap
      if (!honeyAmount || parseFloat(honeyAmount) <= 0) {
        showNotification('Please enter a valid Honey amount', 'warning');
        return;
      }

      try {
        const honeyWei = ethers.parseEther(honeyAmount);
        const result = await swapHoneyForETH(honeyWei);
        
        if (result) {
          showNotification('Swap successful! Check your ETH balance.', 'success');
          setEthAmount('');
          setHoneyAmount('0');
          // Refresh balances after successful swap
          await Promise.all([
            fetchBalances(), // Refresh DEX component balances
          ]);
          // Close dialog after successful swap
          onClose();
        }
      } catch (err) {
        console.error('Failed to swap Honey for ETH:', err);
        showNotification(`Swap failed: ${err?.message || 'Unknown error'}`, 'error');
      }
    } else {
      // ETH → Honey swap
      if (!ethAmount || parseFloat(ethAmount) <= 0) {
        showNotification('Please enter a valid ETH amount', 'warning');
        return;
      }

      try {
        const ethWei = ethers.parseEther(ethAmount);
        const result = await swapETHForYield(ethWei);
        
        if (result) {
          showNotification('Swap successful! Check your Honey token balance.', 'success');
          setEthAmount('');
          setHoneyAmount('0');
          // Refresh balances after successful swap
          await Promise.all([
            fetchBalances(), // Refresh DEX component balances
          ]);
          // Close dialog after successful swap
          onClose();
        }
      } catch (err) {
        console.error('Failed to swap:', err);
        showNotification(`Swap failed: ${err?.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleEthBalanceClick = (balance) => {
    setEthAmount(balance);
  };

  const handleHoneyBalanceClick = (balance) => {
    setHoneyAmount(balance);
  };

  useEffect(() => {
    setSwapInfo([
      { label: "Slippage", value: "0.5%" },
      { label: "Price Impact", value: "0.39%" },
      { 
        label: "Minimum Received", 
        value: isCalculating ? "Calculating..." : (isReversed ? ethAmount : honeyAmount)
      },
    ]);
  }, [honeyAmount, ethAmount, isCalculating, isReversed]);

  return (
    <BaseDialog className="dex-wrapper" title={label} onClose={onClose} header={header}>
      <div className="dex-dialog">
  {/* Notifications rendered at app level */}
        <div className="swap-wrapper">
          <TokenInputRow 
            token={isReversed ? "Honey" : "ABS-ETH"} 
            balance={isReversed ? (isCalculating ? "Calculating..." : honeyBalance) : ethBalance} 
            value={isReversed ? honeyAmount : ethAmount}
            onChange={isReversed ? setHoneyAmount : setEthAmount}
            onBalanceClick={isReversed ? handleHoneyBalanceClick : handleEthBalanceClick}
            disabled={loading}
            readOnly={!isReversed}
          />
          <ExchangeButton
            onclick={() => {
              setIsReversed(!isReversed);
            }}
          ></ExchangeButton>
          <TokenInputRow 
            token={isReversed ? "ABS-ETH" : "Honey"} 
            balance={isReversed ? ethBalance : (isCalculating ? "Calculating..." : honeyBalance)}
            value={isReversed ? ethAmount : honeyAmount}
            onBalanceClick={isReversed ? handleEthBalanceClick : handleHoneyBalanceClick}
            readOnly={isReversed}
            disabled={true}
          />
        </div>
        <BaseButton 
          label={loading ? "Swapping..." : "Swap"} 
          onClick={onSwap}
          disabled={
            loading || 
            !isConnected ||
            (isReversed ? (!honeyAmount || parseFloat(honeyAmount) <= 0) : (!ethAmount || parseFloat(ethAmount) <= 0))
          }
        ></BaseButton>
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
