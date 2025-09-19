import React from "react";
import "./style.css";
import CardView from "../../CardView";

const ItemCombinationHeader = ({ image, label }) => {
  return (
    <CardView className="p-0 item-combination-header">
      <div className="header-wrapper">
        <div className="header-icon">
          <img src={image} alt="header"></img>
        </div>
        <div>{label}</div>
      </div>
    </CardView>
  );
};
export default ItemCombinationHeader;
