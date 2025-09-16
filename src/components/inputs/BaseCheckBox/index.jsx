import React from "react";
import "./style.css";

const BaseCheckBox = ({ isChecked, onChange }) => {
  return (
    <div className="checkbox-wrapper">
      <div className="base-input-checkbox">
        <input
          type="checkbox"
          checked={isChecked}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    </div>
  );
};

export default BaseCheckBox;
