import React from "react";
import "./style.css";

const ItemCardList = ({ className, children }) => {
  return <div className={`item-card-list ${className}`}>{children}</div>;
};

export default ItemCardList;
