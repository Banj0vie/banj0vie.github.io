import React from "react";
import "./style.css";

const BaseButton = ({
  className = "",
  label = "Button",
  onClick,
  disabled = false,
  focused = false,
}) => {
  return (
    <div className={`${className} base-button-wrapper`}>
      <div
        className={`base-button ${disabled && "base-button-disabled"} ${focused && "base-button-focused"}`}
        onClick={(e) => {
          if (!disabled && typeof onClick === 'function') {
            onClick();
          }
        }}
      >
        <img className="base-button-bg" src="/images/button/base_button_bg.png" alt="base-button-image" />
        <p>{label}</p>
      </div>
    </div>
  );
};

export default BaseButton;
