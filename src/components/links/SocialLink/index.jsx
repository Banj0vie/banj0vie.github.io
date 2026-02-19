import React, { useRef } from "react";
import "./style.css";
import { ReactComponent as TwitterIcon } from "./../../../assets/social/twitter.svg";
import { ReactComponent as DiscordIcon } from "./../../../assets/social/discord.svg";
import { ReactComponent as TutorialIcon } from "./../../../assets/social/tutorial.svg";
import { ID_SOCIAL } from "../../../constants/app_ids";
import { useAppSelector } from "../../../solana/store";
import { selectSettings } from "../../../solana/store/slices/uiSlice";
import { defaultSettings } from "../../../utils/settings";
import { clampVolume } from "../../../utils/basic";

const socialIcons = {
  [ID_SOCIAL.TWITTER]: TwitterIcon,
  [ID_SOCIAL.DISCORD]: DiscordIcon,
  [ID_SOCIAL.TUTORIAL]: TutorialIcon
};

const SocialLink = ({data}) => {
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const clickAudioRef = useRef(null);
  const IconComponent = socialIcons[data.id];
  if (!IconComponent) return null; 
  const playClickSound = () => {
    if (!clickAudioRef.current) {
      clickAudioRef.current = new Audio("/sounds/XButtonClick.wav");
      clickAudioRef.current.preload = "auto";
    }
    const audio = clickAudioRef.current;
    const volumeSetting = parseFloat(settings?.soundVolume ?? 0) / 100;
    audio.volume = clampVolume(volumeSetting);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };
  return (
    <a
      data-v-391d10d9=""
      href={data.link}
      target="#blank"
      onClick={playClickSound}
    >
      <div
        data-v-5709816c=""
        data-v-391d10d9=""
        className="icon-base"
        title="Official Twitter"
      >
        <IconComponent/>
      </div>
    </a>
  );
};

export default SocialLink;
