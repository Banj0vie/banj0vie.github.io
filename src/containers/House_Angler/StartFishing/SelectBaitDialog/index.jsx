import React from "react";
import "./style.css";
import BaseDialog from "../../../BaseDialog";
import { ID_BAIT_ITEMS } from "../../../../constants/app_ids";
import CardView from "../../../../components/boxes/CardView";
import { ALL_ITEMS } from "../../../../constants/item_data";
import { TYPE_LABEL_COLOR } from "../../../../constants/item_seed";
import BaseButton from "../../../../components/buttons/BaseButton";

const SelectBaitDialog = ({ onClose, onSelect }) => {
  const TEST_BAITS = [
    ID_BAIT_ITEMS.BAIT_1,
    ID_BAIT_ITEMS.BAIT_2,
    ID_BAIT_ITEMS.BAIT_3,
  ];
  return (
    <BaseDialog onClose={onClose} title="SELECT BAIT">
      <div className="select-bait-dialog">
        <CardView className="p-0">
          <div className="bait-list">
            {TEST_BAITS.map((baitId, index) => (
              <CardView key={index} className="p-0" secondary>
                <div className="bait-list-item">
                  <CardView className="p-0 icon">
                    <img src={ALL_ITEMS[baitId].image} alt="base-icon"></img>
                  </CardView>
                  <div className="label">
                    <div
                      style={{
                        color: TYPE_LABEL_COLOR[ALL_ITEMS[baitId].type].color,
                      }}
                    >
                      {ALL_ITEMS[baitId].label}
                    </div>
                    <div className="text-1.25">x1</div>
                  </div>
                  <BaseButton
                    className="button"
                    label="Use"
                    onClick={() => onSelect(baitId)}
                  ></BaseButton>
                </div>
              </CardView>
            ))}
          </div>
        </CardView>
      </div>
    </BaseDialog>
  );
};

export default SelectBaitDialog;
