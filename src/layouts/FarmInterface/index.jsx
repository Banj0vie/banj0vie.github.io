import React from "react";
import "./style.css";
import CropItem from "./CropItem";

const FarmInterface = ({cropArray, onClickCrop, isFarmMenu, isPlanting}) => {
  return (
    <div>
      {cropArray.arrays.map((crop, index) => (
        <CropItem
          key={index}
          data={crop}
          index={index}
          jiggling={isFarmMenu}
          isPlanting={isPlanting}
          onClick={(e) => onClickCrop(e, index)}
        ></CropItem>
      ))}
    </div>
  );
};

export default FarmInterface;
