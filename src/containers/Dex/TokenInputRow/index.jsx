import React, { useState } from "react";
import "./style.css";
import TokenBox from '../../../components/boxes/TokenBox';
import BaseInput from '../../../components/inputs/BaseInput';
import BalanceBox from '../../../components/boxes/BalanceBox';
import { formatNumber } from "../../../utils/basic";

const TokenInputRow = ({ token, balance }) => {
  const [value, setValue] = useState(0);
  return (
    <div className="token-input-row">
      <TokenBox token={token}></TokenBox>
      <BaseInput
        className="w-50 h-3rem"
        type="number"
        value={value}
        setValue={setValue}
      ></BaseInput>
      <BalanceBox balance={formatNumber(balance)}></BalanceBox>
    </div>
  );
};

export default TokenInputRow;
