import React, { useEffect, useState } from "react";
import BaseDialog from "../BaseDialog";
import "./style.css";
import TokenInputRow from "./TokenInputRow";
import ExchangeButton from "../../components/buttons/ExchangeButton";
import BaseButton from "../../components/buttons/BaseButton";
import LabelValueBox from "../../components/boxes/LabelValueBox";
import DividerLink from "../../components/links/DividerLink";
import { generateId } from "../../utils/basic";
import { useDex } from "../../hooks/useContracts";
import { useAgwEthersAndService } from "../../hooks/useAgwEthersAndService";
import { useNotification } from "../../contexts/NotificationContext";
import { ethers } from "ethers";
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
  const { isConnected } = useAgwEthersAndService();
  const { swapETHForYield, getYieldAmount, ethBalance, honeyBalance, fetchBalances, loading, error } = useDex();
  
  const [isReversed, setIsReversed] = useState(false);
  const [swapInfo, setSwapInfo] = useState([]);
  const [ethAmount, setEthAmount] = useState('');
  const [honeyAmount, setHoneyAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const { show: showNotification } = useNotification();

  // Calculate yield amount when ETH amount changes
  useEffect(() => {
    const calculateHoney = async () => {
      if (!ethAmount || !isConnected) {
        setHoneyAmount('0');
        return;
      }
      
      try {
        setIsCalculating(true);
        const ethWei = ethers.parseEther(ethAmount);
        const honeyAmount = await getYieldAmount(ethWei);
        console.log("🚀 ~ calculateHoney ~ ethAmount:", honeyAmount)
        setHoneyAmount(ethers.formatEther(honeyAmount));
      } catch (err) {
        console.error('Failed to calculate honey:', err);
        setHoneyAmount('0');
      } finally {
        setIsCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculateHoney, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [ethAmount, isConnected, getYieldAmount]);

  const onSwap = async () => {
    if (!isConnected) {
      showNotification('Please connect your wallet first', 'warning');
      return;
    }

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
        await fetchBalances();
      }
    } catch (err) {
      console.error('Failed to swap:', err);
      showNotification(`Swap failed: ${err?.message || 'Unknown error'}`, 'error');
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
      { label: "Minimum Received", value: isCalculating ? "Calculating..." : honeyAmount },
    ]);
  }, [honeyAmount, isCalculating]);

  return (
    <BaseDialog className="dex-wrapper" title={label} onClose={onClose} header={header}>
      <div className="dex-dialog">
  {/* Notifications rendered at app level */}
        <div
          className="swap-wrapper"
          style={{ flexDirection: isReversed ? "column-reverse" : "column" }}
        >
          <TokenInputRow 
            token={"ABS-ETH"} 
            balance={ethBalance} 
            value={ethAmount}
            onChange={setEthAmount}
            onBalanceClick={handleEthBalanceClick}
            disabled={loading}
          />
          <ExchangeButton
            onclick={() => {
              setIsReversed(!isReversed);
            }}
          ></ExchangeButton>
          <TokenInputRow 
            token={"Honey"} 
            balance={isCalculating ? "Calculating..." : honeyBalance}
            value={honeyAmount}
            onBalanceClick={handleHoneyBalanceClick}
            readOnly={true}
            disabled={true}
          />
        </div>
        <BaseButton 
          label={loading ? "Swapping..." : "Swap"} 
          onClick={onSwap}
          disabled={loading || !ethAmount || parseFloat(ethAmount) <= 0 || !isConnected}
        ></BaseButton>
        {error && (
          <div style={{ color: '#ff3b30', fontSize: '14px', marginTop: '8px' }}>
            {error}
          </div>
        )}
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
