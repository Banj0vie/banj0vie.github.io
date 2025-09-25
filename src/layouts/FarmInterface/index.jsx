import React from "react";
import "./style.css";
import CropItem from "./CropItem";

const FarmInterface = ({crops, cropArray, onClickCrop, isFarmMenu, isPlanting, maxPlots = 15, totalPlots = 30, selectedIndexes = []}) => {
  
  return (
    <div className="farm-interface">
      {/* Left plot background with fence */}
      <div className="farm-plot left-plot">
        <div className="plot-fence"></div>
        <div className="plot-soil"></div>
      </div>
      
      {/* Right plot background with fence */}
      <div className="farm-plot right-plot">
        <div className="plot-fence"></div>
        <div className="plot-soil"></div>
      </div>
      
      {/* Central path */}
      <div className="central-path"></div>
      
      {cropArray.arrays.map((crop, index) => (
        <CropItem
          key={index}
          data={crop}
          index={index}
          jiggling={isFarmMenu}
          isPlanting={isPlanting}
          cropArray={cropArray}
          crops={crops}
          isDisabled={index >= maxPlots}
          maxPlots={maxPlots}
          totalPlots={totalPlots}
          selectedIndexes={selectedIndexes}
          onClick={(e) => onClickCrop(e, index)}
        ></CropItem>
      ))}
    </div>
  );
};

export default FarmInterface;
