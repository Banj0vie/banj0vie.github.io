import React from "react";
import ReactDOM from "react-dom";
import "./style.css";
import { ONE_SEED_HEIGHT, SEEDS, SEED_CATEGORIES, SEED_PACK_LIST, GROW_STATUS } from "../../../../constants/item_seed";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import GrowStatusBox from "../../../../components/boxes/GrowStatusBox";

const CropTooltip = ({ container, pos = { x: 0, y: 0 }, data = {}, growthProgress = 0 }) => {
  if (!container) return null;

  const style = {
    position: container === document.body ? "fixed" : "absolute",
    left: typeof pos.x === "number" ? `${pos.x}px` : pos.x,
    top: typeof pos.y === "number" ? `${pos.y}px` : pos.y,
    transform: "translate(0,0)",
  };

  const content = (
    <div className="crop-tooltip" style={style}>
      <div className="content-info">
        <div className="crop-icon-bg">
          <div
            className="crop-icon"
            style={{ backgroundPositionY: -SEEDS[data.seedId]?.pos * ONE_SEED_HEIGHT }}
          ></div>
        </div>
        <div className="crop-info-name">
          <div className="">{SEEDS[data.seedId]?.label || `Seed ${data.seedId}`}</div>
          <div style={{ color: SEED_CATEGORIES[SEEDS[data.seedId]?.category]?.color }}>
            {SEED_CATEGORIES[SEEDS[data.seedId]?.category]?.label}&nbsp;
            {SEED_PACK_LIST[SEEDS[data.seedId]?.pack]?.label}
          </div>
        </div>
      </div>
      <BaseDivider />
      <div className="flex-text">
        <div>Growth Stage</div>
        <div className="highlight">{GROW_STATUS[data.growStatus]}</div>
      </div>
      <GrowStatusBox status={data.growStatus} progress={growthProgress} />
      <BaseDivider />
      <div className="flex-text">
        <div>Time Left:</div>
        <div>1h 23m 30s</div>
      </div>
      <div className="flex-text">
        <div>Total Harvest</div>
        <div>62.25 $Yield</div>
      </div>
      <div className="flex-text">
        <div className="error text-1.25">locked</div>
        <div className="error text-1.25">10.38 $Yield</div>
      </div>
      <div className="flex-text">
        <div className="highlight text-1.25">unlocked</div>
        <div className="highlight text-1.25">10.38 $Yield</div>
      </div>
      <BaseDivider/>
      <div className="active-effect">No Active Effect</div>
    </div>
  );

  return ReactDOM.createPortal(content, container);
};

export default CropTooltip;
