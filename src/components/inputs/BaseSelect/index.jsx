import React from "react";
import "./style.css";

const BaseSelect = ({ className, options, value, setValue }) => {
  return (
    <div className={`${className} base-select`}>
      <select value={value} onChange={(e) => setValue(e.target.value)}>
        {options.map((option, index) => (
          <option key={index} value={option.value} selected={option.value === value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default BaseSelect;
