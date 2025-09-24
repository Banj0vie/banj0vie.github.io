import React from "react";
import "./style.css";

const ScrollButton = ({
  className = "",
  label = "Button",
  onClick,
  disabled = false,
}) => {
  return (
    <div className={`${className} scroll-button-wrapper`}>
      <div
        className={`scroll-button ${disabled && "scroll-button-disabled"}`}
        onClick={(e) => {
          if (!disabled && typeof onClick === 'function') {
            onClick();
          }
        }}
      >
        <p>{label}</p>
      </div>
    </div>
  );
};

export default ScrollButton;
