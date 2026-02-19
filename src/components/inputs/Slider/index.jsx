import React, { useRef } from "react";
import "./style.css";
import { sliderImages } from "../../../constants/_baseimages";
import { useAppSelector } from "../../../solana/store";
import { selectSettings } from "../../../solana/store/slices/uiSlice";
import { defaultSettings } from "../../../utils/settings";
import { clampVolume } from "../../../utils/basic";

const Slider = ({ min = "0", max = "15", step = "1", value, setValue }) => {
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const sliderAudioRef = useRef(null);

  const handleChange = (e) => {
    if (setValue && typeof setValue === 'function') {
      if (!sliderAudioRef.current) {
        sliderAudioRef.current = new Audio("/sounds/CustomSliderSFX.wav");
        sliderAudioRef.current.preload = "auto";
      }
      const audio = sliderAudioRef.current;
      const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
      audio.volume = clampVolume(volumeSetting);
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setValue(e.target.value);
    }
  };

  // Calculate percentage for the green fill
  const minNum = parseFloat(min);
  const maxNum = parseFloat(max);
  const valueNum = parseFloat(value || min);
  const percentage = (valueNum - minNum) === 0 ? 0 : ((valueNum - minNum) / (maxNum - minNum)) * 100;

  return (
    <div className="slider-background" style={{ '--slider-progress': `${percentage}%` }}>
      <img className="slider-bg" src={sliderImages.sliderBg} alt="slider-bg" />
      <div className="slider-fill-wrapper">
        <div className="slider-fill-start"></div>
        <div className="slider-fill"></div>
      </div>
      <input
        className="slider-input"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value || min}
        onChange={handleChange}
        onInput={handleChange}
      ></input>
    </div>
  );
};

export default Slider;
