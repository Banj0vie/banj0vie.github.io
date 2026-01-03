import React from "react";
import "./style.css";
import LabelValueBox from "../LabelValueBox";

const CardListView = ({ data, className = "", children }) => {
  return (
    <div className={`card-list-view ${className}`}>
      {children}
      {data.map((item, index) => (
        <LabelValueBox
          key={index}
          label={item.label}
          value={item.value}
        ></LabelValueBox>
      ))}
    </div>
  );
};

export default CardListView;
