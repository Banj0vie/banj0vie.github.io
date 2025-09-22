import React from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import { PRIZES } from "../../../constants/scene_market";
import CardView from "../../../components/boxes/CardView";

const RewardsDialog = ({ onClose }) => {
  return (
    <BaseDialog onClose={onClose} title="PRIZES">
      <div className="rewards-dialog-content">
        {PRIZES.map((group, index) => (
          <CardView key={index} className="p-0 rewards-item-card">
            <div className="rewards-item-wrapper">
              <span className="font-bold">{index + 1}.&nbsp;</span>
              <span>
                {group.map((prize, i) => (
                  <span key={i}>
                    {prize.count} x{" "}
                    <span className={prize.highlighted ? "highlight" : ""}>
                      {prize.label}
                    </span>
                    {i < group.length - 1 ? ", " : ""}
                  </span>
                ))}
              </span>
            </div>
          </CardView>
        ))}
      </div>
    </BaseDialog>
  );
};

export default RewardsDialog;
