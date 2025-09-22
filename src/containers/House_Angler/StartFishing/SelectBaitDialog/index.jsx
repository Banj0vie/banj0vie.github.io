import React from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import { ID_BAIT_ITEMS } from "../../../../constants/app_ids";
import CardView from "../../../../components/boxes/CardView";
import { TYPE_LABEL_COLOR } from "../../../../constants/item_seed";
import BaseButton from "../../../../components/buttons/BaseButton";
import { useItems } from "../../../../hooks/useItems";

const SelectBaitDialog = ({ onClose, onSelect }) => {
  const { all: userItems } = useItems();
  
  // Filter for owned baits only
  const ownedBaits = userItems.filter(item => 
    Object.values(ID_BAIT_ITEMS).includes(item.id) && item.count > 0
  );
  
  return (
    <BaseDialog onClose={onClose} title="SELECT BAIT">
      <div className="select-bait-dialog">
        <CardView className="p-0">
          <div className="bait-list">
            {ownedBaits.length === 0 ? (
              <div className="no-baits">No baits available</div>
            ) : (
              ownedBaits.map((baitItem, index) => (
                <CardView key={index} className="p-0" secondary>
                  <div className="bait-list-item">
                    <CardView className="p-0 icon">
                      <img src={baitItem.image} alt="base-icon"></img>
                    </CardView>
                    <div className="label">
                      <div
                        style={{
                          color: TYPE_LABEL_COLOR[baitItem.type].color,
                        }}
                      >
                        {baitItem.label}
                      </div>
                      <div className="text-1.25">x{baitItem.count}</div>
                    </div>
                    <BaseButton
                      className="button"
                      label="Use"
                      onClick={() => onSelect(baitItem.id)}
                    ></BaseButton>
                  </div>
                </CardView>
              ))
            )}
          </div>
        </CardView>
      </div>
    </BaseDialog>
  );
};

export default SelectBaitDialog;
