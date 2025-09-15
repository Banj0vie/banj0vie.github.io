import React from "react";
import "./style.css";
import CropItem from "./CropItem";

const FarmInterface = ({cropArray, onClickCrop, isFarmMenu, isPlanting, maxPlots = 0, totalPlots = 30}) => {
  
  if (maxPlots === 0) {
    return (
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '18px',
        textAlign: 'center',
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '10px'
      }}>
        No farming plots available.<br/>
        You need to level up to unlock farming!
      </div>
    );
  }
  
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
          isDisabled={index >= maxPlots}
          maxPlots={maxPlots}
          totalPlots={totalPlots}
          onClick={(e) => onClickCrop(e, index)}
        ></CropItem>
      ))}
    </div>
  );
};

export default FarmInterface;
