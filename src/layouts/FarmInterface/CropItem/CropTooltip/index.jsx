import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import "./style.css";
import { ONE_SEED_HEIGHT, SEEDS, SEED_CATEGORIES, SEED_PACK_LIST, GROW_STATUS } from "../../../../constants/item_seed";
import BaseDivider from "../../../../components/dividers/BaseDivider";
import GrowStatusBox from "../../../../components/boxes/GrowStatusBox";
import { useWeb3 } from "../../../../contexts/Web3Context";

const CropTooltip = ({ container, pos = { x: 0, y: 0 }, data = {}, growthProgress = 0 }) => {
  const { account, contractService } = useWeb3();
  const [timeLeft, setTimeLeft] = useState(0);
  const [locked, setLocked] = useState("0");
  const [unlocked, setUnlocked] = useState("0");

  const style = {
    position: container === document.body ? "fixed" : "absolute",
    left: typeof pos.x === "number" ? `${pos.x}px` : pos.x,
    top: typeof pos.y === "number" ? `${pos.y}px` : pos.y,
    transform: "translate(0,0)",
  };

  const endTime = useMemo(() => {
    if (!data?.plantedAt || !data?.growthTime) return 0;
    // plantedAt in ms, growthTime in seconds
    return Math.floor(data.plantedAt / 1000) + Number(data.growthTime);
  }, [data?.plantedAt, data?.growthTime]);

  // Poll time left every second
  useEffect(() => {
    const update = () => {
      if (!endTime) {
        setTimeLeft(0);
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      setTimeLeft(Math.max(0, endTime - now));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [endTime]);

  // Fetch reward preview (locked/unlocked) matching contract logic
  useEffect(() => {
    let cancelled = false;
    const loadRewards = async () => {
      try {
        if (!contractService || !account || !data?.seedId) return;
        const res = await contractService.calculateHarvestRewards(data.seedId, account);
        if (!cancelled && res) {
          setLocked(res.lockedAmount || "0");
          setUnlocked(res.unlockedAmount || "0");
        }
      } catch (e) {
        // keep zeros on error
      }
    };
    loadRewards();
    return () => {
      cancelled = true;
    };
  }, [contractService, account, data?.seedId]);

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "Ready";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const hh = h > 0 ? `${h}h ` : "";
    const mm = m > 0 ? `${m}m ` : "";
    const ss = `${s}s`;
    return `${hh}${mm}${ss}`.trim();
  };

  const total = useMemo(() => {
    try {
      return (Number(locked) + Number(unlocked)) / 1e18;
    } catch {
      return 0;
    }
  }, [locked, unlocked]);

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
      <GrowStatusBox 
        seedId={data.seedId}
        endTime={endTime}
        isPlanted={!!data.seedId}
        lockedAmount={locked}
        unlockedAmount={unlocked}
      />
      <BaseDivider />
      <div className="flex-text">
        <div>Time Left:</div>
        <div>{formatTime(timeLeft)}</div>
      </div>
      <div className="flex-text">
        <div>Total Harvest</div>
        <div>{((Number(locked) + Number(unlocked)) / 1e18).toFixed(2)} $RDY</div>
      </div>
      <div className="flex-text">
        <div className="error text-1.25">locked</div>
        <div className="error text-1.25">{(Number(locked) / 1e18).toFixed(2)} $RDY</div>
      </div>
      <div className="flex-text">
        <div className="highlight text-1.25">unlocked</div>
        <div className="highlight text-1.25">{(Number(unlocked) / 1e18).toFixed(2)} $RDY</div>
      </div>
      <BaseDivider/>
      <div className="active-effect">No Active Effect</div>
    </div>
  );

  return container ? ReactDOM.createPortal(content, container) : null;
};

export default CropTooltip;
