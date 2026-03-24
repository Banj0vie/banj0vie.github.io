  import React, { useRef, useEffect } from "react";
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
  const backClickAudioRef = useRef(null);
  const clickAudioRef = useRef(null);

  useEffect(() => {
    if (!backClickAudioRef.current) {
      backClickAudioRef.current = new Audio("/sounds/BackButtonClick.wav");
      backClickAudioRef.current.preload = "auto";
    }
  }, [backClickAudioRef.current]);

  useEffect(() => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/ButtonHover.wav");
      clickAudioRef.current.preload = "auto";
    }
  }, [clickAudioRef.current]);
 
  return (
    <div className={`${className} base-button-wrapper`}>
      <div
        className={`base-button ${disabled && "base-button-disabled"} ${focused && "base-button-focused"}`}
        onClick={(e) => {
          if (!disabled && typeof onClick === 'function') {
            if (String(label).toLowerCase() === "back") {
              const audio = backClickAudioRef.current;
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }else{
              const audio = clickAudioRef.current;
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }
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
