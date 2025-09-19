import React from "react";
import "./style.css";
import CardView from "../../CardView";
import { buttonFrames } from "../../../../constants/_baseimages";

const ItemCombinationController = ({
  limitedController,
  multiplier,
  onLeftToLimited,
  onLeftOne,
  onRightOne,
  onRightToLimited,
}) => {
  return (
    <CardView className="item-combination-controller">
      {limitedController && (
        <img
          src={buttonFrames.leftTriangleButton}
          alt="left limit"
          className="controller-button"
          onClick={() => onLeftToLimited()}
        />
      )}
      <img
        src={
          limitedController
            ? buttonFrames.leftTriangleButtonWithBg
            : buttonFrames.leftTriangleButton
        }
        alt="left"
        className="controller-button"
        onClick={() => onLeftOne()}
      />
      <div className="highlight">x{multiplier}</div>
      <img
        src={
          limitedController
            ? buttonFrames.rightTriangleButtonWithBg
            : buttonFrames.rightTriangleButton
        }
        alt="right"
        className="controller-button"
        onClick={() => onRightOne()}
      />
      {limitedController && (
        <img
          src={buttonFrames.rightTriangleButton}
          alt="right limit"
          className="controller-button"
          onClick={() => onRightToLimited()}
        />
      )}
    </CardView>
  );
};

export default ItemCombinationController;
