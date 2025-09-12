import React from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import PickSeedItemBox from "../../components/boxes/PickSeedItemBox";

const SelectSeedDialog = ({ seeds, onClose, onClickSeed }) => {
  return (
    <BaseDialog title="PICK SEED" onClose={onClose}>
      <div className="select-seed-dialog">
        {seeds.map((seed, index) => (
          <PickSeedItemBox
            key={index}
            seedId={seed.id}
            count={seed.count}
            onClick={() => onClickSeed(seed.id)}
          />
        ))}
      </div>
    </BaseDialog>
  );
};
export default SelectSeedDialog;
