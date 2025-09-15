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
import { useWeb3 } from "../../contexts/Web3Context";
import { useNotification } from "../../contexts/NotificationContext";
import { ethers } from "ethers";
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
  const { isConnected } = useWeb3();
  const { swapETHForYield, getYieldAmount, loading, error } = useDex();
  
  const [isReversed, setIsReversed] = useState(false);
  const [swapInfo, setSwapInfo] = useState([]);
  const [ethAmount, setEthAmount] = useState('');
  const [yieldAmount, setYieldAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const { show: showNotification } = useNotification();

  // Calculate yield amount when ETH amount changes
  useEffect(() => {
    const calculateYield = async () => {
      if (!ethAmount || !isConnected) {
        setYieldAmount('0');
        return;
      }

      try {
        setIsCalculating(true);
        const ethWei = ethers.parseEther(ethAmount);
        const yieldAmount = await getYieldAmount(ethWei);
        setYieldAmount(ethers.formatEther(yieldAmount));
      } catch (err) {
        console.error('Failed to calculate yield:', err);
        setYieldAmount('0');
      } finally {
        setIsCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculateYield, 500); // Debounce
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
        showNotification('Swap successful! Check your Yield token balance.', 'success');
        setEthAmount('');
        setYieldAmount('0');
      }
    } catch (err) {
      console.error('Failed to swap:', err);
      showNotification(`Swap failed: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  useEffect(() => {
    setSwapInfo([
      { label: "Slippage", value: "0.5%" },
      { label: "Price Impact", value: "0.39%" },
      { label: "Minimum Received", value: isCalculating ? "Calculating..." : yieldAmount },
    ]);
  }, [yieldAmount, isCalculating]);

  return (
    <BaseDialog className="dex-wrapper" title={label} onClose={onClose} header={header}>
      <div className="dex-dialog">
  {/* Notifications rendered at app level */}
        <div
          className="swap-wrapper"
          style={{ flexDirection: isReversed ? "column-reverse" : "column" }}
        >
          <TokenInputRow 
            token={"ETH"} 
            balance={"0.00"} 
            value={ethAmount}
            onChange={setEthAmount}
            disabled={loading}
          />
          <ExchangeButton
            onclick={() => {
              setIsReversed(!isReversed);
            }}
          ></ExchangeButton>
          <TokenInputRow 
            token={"Yield"} 
            balance={isCalculating ? "Calculating..." : yieldAmount}
            value={yieldAmount}
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
