import React, { useState, useEffect } from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import Slider from "../../components/inputs/Slider";
import BaseDivider from "../../components/dividers/BaseDivider";
import BaseCheckBox from "../../components/inputs/BaseCheckBox";
import BaseInput from "../../components/inputs/BaseInput";
import { loadSettings, saveSettings, defaultSettings } from "../../utils/settings";

const SettingsDialog = ({ onClose }) => {
  const [soundVolume, setSoundVolume] = useState(defaultSettings.soundVolume);
  const [musicVolume, setMusicVolume] = useState(defaultSettings.musicVolume);
  const [isShowGrowthStage, setIsShowGrowthStage] = useState(defaultSettings.isShowGrowthStage);
  const [isOverwritePlant, setIsOverwritePlant] = useState(defaultSettings.isOverwritePlant);
  const [dexSlippage, setDexSlippage] = useState(defaultSettings.dexSlippage);
  const [baseGwei, setBaseGwei] = useState(defaultSettings.baseGwei);

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSoundVolume(loadedSettings.soundVolume);
    setMusicVolume(loadedSettings.musicVolume);
    setIsShowGrowthStage(loadedSettings.isShowGrowthStage);
    setIsOverwritePlant(loadedSettings.isOverwritePlant);
    setDexSlippage(loadedSettings.dexSlippage);
    setBaseGwei(loadedSettings.baseGwei);
  }, []);

  // Save settings whenever any setting changes
  useEffect(() => {
    const currentSettings = {
      soundVolume,
      musicVolume,
      isShowGrowthStage,
      isOverwritePlant,
      dexSlippage,
      baseGwei
    };
    saveSettings(currentSettings);
  }, [soundVolume, musicVolume, isShowGrowthStage, isOverwritePlant, dexSlippage, baseGwei]);

  return (
    <BaseDialog onClose={onClose} title="SETTINGS" header="/images/dialog/modal-header-setting.png" headerWidth={120}>
      <div className="settings-dialog">
        <div className="settings-row">
          <div className="left"><img className="sound-icon" src="/images/settings/sound.png" alt="sound"/></div>
          <div className="right">
            <Slider
              min="0"
              max="100"
              value={soundVolume}
              setValue={(val) => setSoundVolume(val)}
            ></Slider>
          </div>
        </div>
        <div className="settings-row">
          <div className="left"><img src="/images/settings/music.png" alt="music"/></div>
          <div className="right">
            <Slider
              min="0"
              max="100"
              value={musicVolume}
              setValue={(val) => setMusicVolume(val)}
            ></Slider>
          </div>
        </div>
        <BaseDivider></BaseDivider>
        <div className="settings-row">
          <div>Show Growth Stages</div>
          <BaseCheckBox
            isChecked={isShowGrowthStage}
            onChange={(v) => setIsShowGrowthStage(v)}
          ></BaseCheckBox>
        </div>
        {/* <div className="settings-row">
          <div>Overwrite plant modifiers</div>
          <BaseCheckBox
            isChecked={isOverwritePlant}
            onChange={(v) => setIsOverwritePlant(v)}
          ></BaseCheckBox>
        </div> */}
        <BaseDivider></BaseDivider>
        <div className="settings-row">
          <div className="left">Dex Slippage %</div>
          <BaseInput
            className="right"
            value={dexSlippage}
            setValue={(val) => setDexSlippage(val)}
          ></BaseInput>
        </div>
        <div className="settings-row">
          <div className="left">Base Gwei</div>
          <BaseInput
            className="right"
            value={baseGwei}
            setValue={(val) => setBaseGwei(val)}
          ></BaseInput>
        </div>
      </div>
    </BaseDialog>
  );
};

export default SettingsDialog;
