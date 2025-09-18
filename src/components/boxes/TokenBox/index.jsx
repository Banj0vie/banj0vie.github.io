import React from "react";
import "./style.css";

const TokenBox = ({ token = "", onClick, clickable = false }) => {
  return (
    <div 
      className={`token-box highlight ${clickable ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      {token}
    </div>
  );
};

export default TokenBox;
