import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import BaseDivider from "../../components/dividers/BaseDivider";
import ItemSmallView from "../../components/boxes/ItemViewSmall";

const LootReceivedDialog = ({ onClose, items }) => {
  return (
    <BaseDialog onClose={onClose} title="LOOT RECEIVED">
      <div className="loot-received-dialog">
        <div className="text-center">Items Received ({items.length})</div>
        <BaseDivider></BaseDivider>
        <div className="items-grid">
          {items.map((item, index) => (
            <ItemSmallView
              key={index}
              itemId={item.id}
              count={item.count}
            ></ItemSmallView>
          ))}
        </div>
      </div>
    </BaseDialog>
  );
};

export default LootReceivedDialog;
