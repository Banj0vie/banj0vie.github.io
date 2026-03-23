import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../solana/store";
import { selectSettings } from "../../solana/store/slices/uiSlice";
import { clampVolume } from "../../utils/basic";

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
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const volumeSetting = parseFloat(settings?.musicVolume ?? 0) / 100;
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

