import React, { useEffect, useState, useRef } from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import TokenInputRow from "./TokenInputRow";
import ExchangeButton from "../../components/buttons/ExchangeButton";
import BaseButton from "../../components/buttons/BaseButton";
import LabelValueBox from "../../components/boxes/LabelValueBox";
import DividerLink from "../../components/links/DividerLink";
import { clampVolume, generateId } from "../../utils/basic";
import { useDex } from "../../hooks/useDex";
import { useNotification } from "../../contexts/NotificationContext";
import { isTransactionRejection } from "../../utils/errorUtils";
import { useSolanaWallet } from "../../hooks/useSolanaWallet";
import { useAppSelector } from "../../solana/store";
import { selectSolBalance, selectGameTokenBalance, selectDexLoading, selectDexError } from "../../solana/store/slices/balanceSlice";
import CardView from "../../components/boxes/CardView";
import { selectSettings } from "../../solana/store/slices/uiSlice";
import { defaultSettings } from "../../utils/settings";
const DexDialog = ({ onClose, label = "DEX", header = "" }) => {
  const { isConnected } = useSolanaWallet();
  const { buyTokens, sellTokens, getTokensOut, getSolOut, fetchBalances, error } = useDex();

  // Redux state
  const solBalance = useAppSelector(selectSolBalance);
  const gameTokenBalance = useAppSelector(selectGameTokenBalance);
  const dexLoading = useAppSelector(selectDexLoading);
  const dexError = useAppSelector(selectDexError);
  const settings = useAppSelector(selectSettings) || defaultSettings;

  const [isReversed, setIsReversed] = useState(false);
  const [swapInfo, setSwapInfo] = useState([]);
  const [solAmount, setSolAmount] = useState('');
  const [gameTokenAmount, setGameTokenAmount] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);
  const { show: showNotification } = useNotification();
  const swapAudioRef = useRef(null);

  // Monitor errors and show notifications with duplicate prevention
  const lastNotificationTime = useRef(0);
  useEffect(() => {
    if (error || dexError) {
      const now = Date.now();
      // Only show notification if it's been more than 2 seconds since last notification
      if (now - lastNotificationTime.current > 2000) {
        lastNotificationTime.current = now;
        const errorMessage = error || dexError;
        if (isTransactionRejection(errorMessage)) {
          showNotification('Transaction was rejected by user.', 'error');
        } else {
          showNotification(`DEX operation failed: ${errorMessage}`, 'error');
        }
      }
    }
  }, [error, dexError, showNotification]);

  // Calculate amounts when either input changes
  useEffect(() => {
    const calculateAmounts = async () => {
      if (!isConnected) {
        setGameTokenAmount('0');
        setSolAmount('');
        return;
      }

      try {
        setIsCalculating(true);

        if (isReversed) {
          // Game Token → SOL: Calculate SOL amount based on Game Token input
          if (!gameTokenAmount || parseFloat(gameTokenAmount) <= 0) {
            setSolAmount('');
            return;
          }
          const solOut = await getSolOut(gameTokenAmount);
          console.log("🚀 ~ calculateAmounts ~ SOL amount for", gameTokenAmount, "Game Tokens:", solOut);
          setSolAmount(solOut);
        } else {
          // SOL → Game Token: Calculate Game Token amount based on SOL input
          if (!solAmount || parseFloat(solAmount) <= 0) {
            setGameTokenAmount('0');
            return;
          }
          const tokensOut = await getTokensOut(solAmount);
          console.log("🚀 ~ calculateAmounts ~ Game Token amount for", solAmount, "SOL:", tokensOut);
          setGameTokenAmount(tokensOut);
        }
      } catch (err) {
        console.error('Failed to calculate amounts:', err);
        if (isReversed) {
          setSolAmount('');
        } else {
          setGameTokenAmount('0');
        }
      } finally {
        setIsCalculating(false);
      }
    };

    const timeoutId = setTimeout(calculateAmounts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [solAmount, gameTokenAmount, isReversed, isConnected, getTokensOut, getSolOut]);

  const onSwap = async () => {
    if (!isConnected) {
      showNotification('Please connect your wallet first', 'warning');
      return;
    }
    if (!swapAudioRef.current) {
      swapAudioRef.current = new Audio("/sounds/DEXSwapButtonClick.wav");
      swapAudioRef.current.preload = "auto";
    }
    const audio = swapAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});

    console.log("started dex;")

    if (isReversed) {
      // Game Token → SOL swap
      if (!gameTokenAmount || parseFloat(gameTokenAmount) <= 0) {
        showNotification('Please enter a valid Game Token amount', 'warning');
        return;
      }

      try {
        const result = await sellTokens(parseFloat(gameTokenAmount));

        if (result && result.success) {
          showNotification('Swap successful! Check your SOL balance.', 'success');
          setSolAmount('');
          setGameTokenAmount('0');
          // Refresh balances after successful swap
          await fetchBalances();
          // Close dialog after successful swap
          onClose();
        }
      } catch (err) {
        console.error('Failed to swap Game Tokens for SOL:', err);
        showNotification(`Swap failed: ${err?.message || 'Unknown error'}`, 'error');
      }
    } else {
      // SOL → Game Token swap
      if (!solAmount || parseFloat(solAmount) <= 0) {
        showNotification('Please enter a valid SOL amount', 'warning');
        return;
      }

      try {
        console.log('buy token')
        const result = await buyTokens(parseFloat(solAmount));

        if (result && result.success) {
          showNotification('Swap successful! Check your Game Token balance.', 'success');
          setSolAmount('');
          setGameTokenAmount('0');
          // Refresh balances after successful swap
          await fetchBalances();
          // Close dialog after successful swap
          onClose();
        }
      } catch (err) {
        console.error('Failed to swap SOL for Game Tokens:', err);
        showNotification(`Swap failed: ${err?.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleSolBalanceClick = (balance) => {
    setSolAmount(balance);
  };

  const handleGameTokenBalanceClick = (balance) => {
    setGameTokenAmount(balance);
  };

  useEffect(() => {
    setSwapInfo([
      { label: "Slippage", value: "0.5%" },
      { label: "Price Impact", value: "0.39%" },
      {
        label: "Minimum Received",
        value: isCalculating ? "Calculating..." : (isReversed ? solAmount : gameTokenAmount)
      },
    ]);
  }, [gameTokenAmount, solAmount, isCalculating, isReversed]);

  return (
    <BaseDialog className="dex-wrapper" title={label} onClose={onClose} header={header}>
      <div className="dex-dialog">
        {/* Notifications rendered at app level */}
        <div className="swap-wrapper">
          <TokenInputRow
            token={isReversed ? "GAME" : "SOL"}
            balance={isReversed ? (isCalculating ? "Calculating..." : gameTokenBalance) : solBalance}
            value={isReversed ? gameTokenAmount : solAmount}
            onChange={isReversed ? setGameTokenAmount : setSolAmount}
            onBalanceClick={isReversed ? handleGameTokenBalanceClick : handleSolBalanceClick}
            disabled={dexLoading}
            readOnly={!isReversed}
          />
          <ExchangeButton
            onclick={() => {
              setIsReversed(!isReversed);
            }}
          ></ExchangeButton>
          <TokenInputRow
            token={isReversed ? "SOL" : "GAME"}
            balance={isReversed ? solBalance : (isCalculating ? "Calculating..." : gameTokenBalance)}
            value={isReversed ? solAmount : gameTokenAmount}
            onBalanceClick={isReversed ? handleSolBalanceClick : handleGameTokenBalanceClick}
            readOnly={isReversed}
            disabled={true}
          />
        </div>
        <BaseButton
          label={dexLoading ? "Swapping..." : "Swap"}
          onClick={onSwap}
          disabled={
            dexLoading ||
            !isConnected ||
            (isReversed ? (!gameTokenAmount || parseFloat(gameTokenAmount) <= 0) : (!solAmount || parseFloat(solAmount) <= 0))
          }
          large={true}
        ></BaseButton>
        <CardView>
          {swapInfo.map((item) => (
            <LabelValueBox key={generateId()} label={item.label} value={item.value}></LabelValueBox>
          ))}
        </CardView>
        <DividerLink
          label=" Using Solana Valley DEX! "
          link="https://solana.com/"
        ></DividerLink>
      </div>
    </BaseDialog>
  );
};

export default DexDialog;
