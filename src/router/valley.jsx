import React from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { VALLEY_HOTSPOTS, VALLEY_VIEWPORT } from "../constants/scene_valley";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";

const Valley = () => {
  const { width, height } = VALLEY_VIEWPORT;
  const hotspots = VALLEY_HOTSPOTS;

  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/valley.webp"
        hotspots={hotspots}
        dialogs={[]}
        width={width}
        height={height}
        isBig
      />
      <AdminPanel />
    </>
  );
};

export default Valley;
