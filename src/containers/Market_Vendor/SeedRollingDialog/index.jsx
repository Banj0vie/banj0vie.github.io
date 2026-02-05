import React, { useEffect, useRef } from "react";
import "./style.css";
import BaseDialog from "../../_BaseDialog";
import BaseButton from "../../../components/buttons/BaseButton";
import SeedRollingBox from "../../../components/boxes/SeedRollingBox";
import { useAppSelector } from "../../../solana/store";
import { selectSettings } from "../../../solana/store/slices/uiSlice";
import { defaultSettings } from "../../../utils/settings";
import { clampVolume } from "../../../utils/basic";

const SeedRollingDialog = ({ rollingInfo, onClose, onBack, onBuyAgain }) => {
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const seedPurchaseAudioRef = useRef(null);

  useEffect(() => {
    if (!seedPurchaseAudioRef.current) {
      seedPurchaseAudioRef.current = new Audio("/sounds/SeedPurchaseGachaSFX.wav");
      seedPurchaseAudioRef.current.preload = "auto";
    }
    const audio = seedPurchaseAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings?.soundVolume]);

  return (
    <BaseDialog title="SEED GACHA" onClose={onClose} header="/images/dialog/modal-header-gardner.png" headerOffset={10}>
      <div className="seed-gacha-wrapper">
        <div className="seed-rolling-box-wrapper">
          {(rollingInfo.revealedSeeds || []).map((seedId, idx) => (
            <SeedRollingBox key={idx} seedPackId={seedId} delay={idx * 2000} />
          ))}
        </div>
        <div className="seed-rolling-buttons-wrapper">
          <BaseButton
            className="h-4rem"
            label="Back"
            onClick={onBack}
            small
            isError
          ></BaseButton>
          <BaseButton
            className="h-4rem"
            label="Buy Again"
            onClick={onBuyAgain}
            small
          ></BaseButton>
        </div>
      </div>
    </BaseDialog>
  );
};

export default SeedRollingDialog;
