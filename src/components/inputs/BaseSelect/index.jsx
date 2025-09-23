import React from "react";
import "./style.css";

const BaseSelect = ({ className, options, value, onChange }) => {
  return (
    <div className={`${className} base-select`}>
      <select>
        {options.map((option, index) => (
          <option key={index} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};

export default BaseSelect;
