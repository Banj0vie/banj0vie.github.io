import React from "react";
import "./style.css";
import { generateId } from "../../../utils/basic";

const BaseInput = ({
  id = generateId(),
  className = "",
  type = "text",
  value = "",
  setValue,
  placeholder = "",
  maxLength = 32,
}) => {
  return (
    <div className={`${className} base-input`}>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
    </div>
  );
};

export default BaseInput;
