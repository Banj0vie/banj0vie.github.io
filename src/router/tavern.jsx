import React from "react";
import { TAVERN_HOTSPOTS, TAVERN_VIEWPORT } from "../constants/scene_tavern";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { ID_TAVERN_HOTSPOTS } from "../constants/app_ids";
import PotionDialog from "../containers/Tavern_Potion";

const Tavern = () => {
  const { width, height } = TAVERN_VIEWPORT;
  const hotspots = TAVERN_HOTSPOTS;
  const dialogs = [
    {
        id: ID_TAVERN_HOTSPOTS.POTION,
        component: PotionDialog,
        label: "POTION MASTER",
    }
  ];
  return (
    <PanZoomViewport
      backgroundSrc="/images/backgrounds/tavern.gif"
      hotspots={hotspots}
      dialogs={dialogs}
      width={width}
      height={height}
    />
  );
};

export default Tavern;