import React from "react";
import "./style.css";
import CardView from "../../CardView";
import { ITEM_COMBI } from "../../../../constants/item_combination";
import SingleItem from "./SingleItem";
import MultipleItems from "./MultipleItems";

const ItemCombinationTable = ({
  itemId,
  multiplier,
  cropCounts,
  onCountDown,
  onCountUp,
}) => {
  const data = ITEM_COMBI[itemId];
  return (
    <CardView className="item-combination-table">
      <div className="wrapper">
        {data.list.map((combi, index) => (
          <div key={index} className="combi-row">
            <div className="combi-row-left">
              {data.simple ? (
                <SingleItem itemId={combi.ids[0]}></SingleItem>
              ) : (
                <MultipleItems
                  ids={combi.ids}
                  cropCounts={cropCounts}
                  onCountDown={(cropId) => onCountDown(cropId, index)}
                  onCountUp={(cropId) => onCountUp(cropId, index)}
                ></MultipleItems>
              )}
            </div>
            <div
              className={`combi-row-right ${
                combi.count < 6 ? "success" : "error"
              }`}
            >
              {data.simple
                ? `x${combi.count * multiplier} (${6})`
                : `Any x${combi.count * multiplier}`}
            </div>
          </div>
        ))}
      </div>
    </CardView>
  );
};

export default ItemCombinationTable;
