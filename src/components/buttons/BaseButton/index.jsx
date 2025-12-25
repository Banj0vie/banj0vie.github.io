import React from "react";
import "./style.css";

const BaseButton = ({
  className = "",
  label = "Button",
  onClick,
  disabled = false,
  focused = false,
  isError = false,
  large = false,
  small = false,
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
        <img 
          className="base-button-bg" 
          src={
            isError 
              ? (large ? "/images/button/base_button_error_large_bg.png" : (small ? "/images/button/base_button_error_small_bg.png" : "/images/button/base_button_error_bg.png"))
              : (large ? "/images/button/base_button_large_bg.png" : (small ? "/images/button/base_button_small_bg.png" : "/images/button/base_button_bg.png"))
          } 
          alt="base-button-image" 
        />
        <p>{label}</p>
      </div>
    </div>
  );
};

export default BaseButton;
