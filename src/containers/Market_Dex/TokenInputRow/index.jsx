import React, { useState } from "react";
import "./style.css";
import TokenBox from '../../../components/boxes/TokenBox';
import BaseInput from '../../../components/inputs/BaseInput';
import BalanceBox from '../../../components/boxes/BalanceBox';
import { formatNumber } from "../../../utils/basic";

const TokenInputRow = ({ 
  token, 
  balance, 
  value = '', 
  onChange, 
  onBalanceClick,
  readOnly = false, 
  disabled = false 
}) => {
  const [internalValue, setInternalValue] = useState(value || '');
  
  // Update internal value when prop changes
  React.useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleValueChange = (newValue) => {
    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleBalanceClick = () => {
    if (onBalanceClick && balance && !disabled) {
      onBalanceClick(balance);
    }
  };

  const handleTokenClick = () => {
    if (onBalanceClick && balance && !disabled) {
      onBalanceClick(balance);
    }
  };

  return (
    <div className="token-input-row">
      <TokenBox 
        token={token} 
        onClick={handleTokenClick}
        clickable={!disabled && onBalanceClick}
      />
      <BaseInput
        className={`${balance == null ? "w-70" : "w-50"} h-3rem`}
        type="number"
        value={internalValue}
        setValue={handleValueChange}
        readOnly={readOnly}
        disabled={disabled}
      ></BaseInput>
      {balance !== null && (
        <BalanceBox 
          balance={formatNumber(balance)} 
          onClick={handleBalanceClick}
          clickable={!disabled && onBalanceClick}
        />
      )}
    </div>
  );
};

export default TokenInputRow;
