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
          if (!disabled) {
            onClick();
          }
        }}
      >
        <p>{label}</p>
      </div>
    </div>
  );
};

export default BaseButton;
