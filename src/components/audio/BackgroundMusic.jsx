import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../solana/store";
import { selectSettings } from "../../solana/store/slices/uiSlice";
import { clampVolume } from "../../utils/basic";
import { defaultSettings } from "../../utils/settings";

const BackgroundMusic = () => {
  const settings = useAppSelector(selectSettings);
  const audioRef = useRef(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const audio = new Audio("/sounds/newthemesong.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unlock = () => {
      setIsUnlocked(true);
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);

    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const volumeSetting = parseFloat(settings?.musicVolume ?? defaultSettings.musicVolume) / 100;
    const volume = clampVolume(volumeSetting);
    audio.volume = volume;

    if (volume <= 0) {
      audio.pause();
      return;
    }

    if (isUnlocked) {
      audio.play().catch(() => {});
    }
  }, [isUnlocked, settings?.musicVolume]);

  return null;
};

export default BackgroundMusic;
