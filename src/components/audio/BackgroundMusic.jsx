import React, { useEffect, useRef } from "react";
import { useAppSelector } from "../../store";
import { selectSettings } from "../../store/slices/uiSlice";
import { clampVolume } from "../../utils/basic";
import { defaultSettings } from "../../utils/settings";

const BackgroundMusic = () => {
  const settings = useAppSelector(selectSettings) || defaultSettings;
  const audioRef = useRef(null);
  const jukeboxActiveRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/sounds/theme.wav");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    const tryPlay = () => {
      if (jukeboxActiveRef.current) return;
      audio.play().catch(() => {});
    };

    tryPlay();

    const unlock = () => {
      tryPlay();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };

    const onJukeboxReady = () => { jukeboxActiveRef.current = true; audio.pause(); };
    const onJukeboxDestroyed = () => { jukeboxActiveRef.current = false; tryPlay(); };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);
    window.addEventListener("jukeboxReady", onJukeboxReady);
    window.addEventListener("jukeboxDestroyed", onJukeboxDestroyed);

    return () => {
      audio.pause();
      audioRef.current = null;
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
      window.removeEventListener("jukeboxReady", onJukeboxReady);
      window.removeEventListener("jukeboxDestroyed", onJukeboxDestroyed);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const volumeSetting = parseFloat(settings?.musicVolume ?? defaultSettings.musicVolume) / 100;
    const volume = clampVolume(volumeSetting);
    audio.volume = volume;

    if (volume <= 0) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [settings?.musicVolume]);

  return null;
};

export default BackgroundMusic;
