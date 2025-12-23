import React from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { VALLEY_HOTSPOTS, VALLEY_VIEWPORT } from "../constants/scene_valley";
const Valley = () => {
  const { width, height } = VALLEY_VIEWPORT;
  const hotspots = VALLEY_HOTSPOTS;

  return (
    <PanZoomViewport
      backgroundSrc="/images/backgrounds/valley.webp"
      hotspots={hotspots}
      dialogs={[]}
      width={width}
      height={height}
      isBig
    />
  );
};

export default Valley;
