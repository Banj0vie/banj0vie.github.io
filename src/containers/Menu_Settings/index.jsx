import React from "react";
import "./style.css";
import BaseDialog from "../_BaseDialog";
import Slider from "../../components/inputs/Slider";
import BaseCheckBox from "../../components/inputs/BaseCheckBox";
import BaseInput from "../../components/inputs/BaseInput";
import { defaultSettings } from "../../utils/settings";
import { useAppDispatch, useAppSelector } from "../../solana/store";
import { selectSettings, updateSetting } from "../../solana/store/slices/uiSlice";

const SettingsDialog = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings) || defaultSettings;

  const setSetting = (key) => (value) => {
    dispatch(updateSetting({ key, value }));
  };

  return (
    <BaseDialog onClose={onClose} title="SETTINGS" header="/images/dialog/modal-header-setting.png" headerWidth={120} className="custom-modal-background">
      <div className="settings-dialog">
        <div className="settings-row-wrapper">
          <div className="settings-row">
            <div className="left"><img className="sound-icon" src="/images/settings/sound.png" alt="sound" /></div>
            <div className="right">
              <Slider
                min="0"
                max="100"
                value={settings.soundVolume ?? defaultSettings.soundVolume}
                setValue={setSetting("soundVolume")}
              ></Slider>
            </div>
          </div>
          <div className="settings-row">
            <div className="left"><img src="/images/settings/music.png" alt="music" /></div>
            <div className="right">
              <Slider
                min="0"
                max="100"
                value={settings.musicVolume ?? defaultSettings.musicVolume}
                setValue={setSetting("musicVolume")}
              ></Slider>
            </div>
          </div>
          <div className="settings-row">
            <div>Show Growth Stages</div>
            <BaseCheckBox
              isChecked={settings.isShowGrowthStage ?? defaultSettings.isShowGrowthStage}
              onChange={setSetting("isShowGrowthStage")}
            ></BaseCheckBox>
          </div>
        </div>
        {/* <div className="settings-row">
          <div>Overwrite plant modifiers</div>
          <BaseCheckBox
            isChecked={isOverwritePlant}
            onChange={(v) => setIsOverwritePlant(v)}
          ></BaseCheckBox>
        </div> */}
        <div className="settings-row-input">
          <div className="left">Dex Slippage %</div>
          <BaseInput
            className="right"
            value={settings.dexSlippage ?? defaultSettings.dexSlippage}
            setValue={setSetting("dexSlippage")}
            primary={true}
          ></BaseInput>
        </div>
        <div className="settings-row-input">
          <div className="left">Base Gwei</div>
          <BaseInput
            className="right"
            value={settings.baseGwei ?? defaultSettings.baseGwei}
            setValue={setSetting("baseGwei")}
            primary={true}
          ></BaseInput>
        </div>
      </div>
    </BaseDialog>
  );
};

export default SettingsDialog;
