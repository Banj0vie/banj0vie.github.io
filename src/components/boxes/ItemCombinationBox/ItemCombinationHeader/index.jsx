import React from "react";
import "./style.css";
import CardView from "../../CardView";

const ItemCombinationHeader = ({ image, label, exp }) => {
  return (
    <CardView className="p-0 item-combination-header">
      <div className="header-wrapper">
        <div className="header-icon">
          <img src={image} alt="header"></img>
        </div>
        <div>{label}{exp && <span className="experience"><br/>Exp: {exp}</span>}</div>
      </div>
    </CardView>
  );
};
export default ItemCombinationHeader;
