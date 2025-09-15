import React from "react";
import "./style.css";

const ExchangeButton = ({ onclick }) => {
  return (
    <div className="exchange-button">
      <p onClick={(e) => {
        onclick();
      }}>⇅</p>
    </div>
  );
};

export default ExchangeButton;
