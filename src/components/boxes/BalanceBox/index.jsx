import React from "react";
import "./style.css";

const BalanceBox = ({ balance = "0.00", onClick, clickable = false }) => {
  return (
    <p 
      className={`balance-box ${clickable ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      {balance}
    </p>
  );
};

export default BalanceBox;
