import React from "react";
import "./style.css";
import CropCircleIcon from "../../../CropCircleIcon";

const MultipleItems = ({ ids, cropCounts, onCountDown, onCountUp }) => {
  return (
    <div className="multi-combi-item-wrapper">
      {ids.map((id) => (
        <div key={id} className="crop-mini-selection">
          <div className="red-down" onClick={() => onCountDown(id)}></div>
          <div className="crop-icon">
            <CropCircleIcon seedId={id} size={104} scale={0.5}></CropCircleIcon>
            <div className="counter">
              x{cropCounts[id] ? cropCounts[id] : 0}
            </div>
          </div>
          <div className="green-up" onClick={() => onCountUp(id)}></div>
        </div>
      ))}
    </div>
  );
};

export default MultipleItems;
