import React from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { FARM_HOTSPOTS, FARM_VIEWPORT } from "../constants/scene_farm";
import { ID_FARM_HOTSPOTS } from "../constants/app_ids";
import FarmerDialog from "../containers/Farmer";
import { dialogFrames } from "../constants/_baseimages";
const Farm = () => {
  const { width, height } = FARM_VIEWPORT;
  const hotspots = FARM_HOTSPOTS;
  const dialogs = [
    {
      id: ID_FARM_HOTSPOTS.DEX,
      component: FarmerDialog,
      label: "FARMER",
      header: dialogFrames.modalHeaderSeeds,
      actions: {
        plant: () => {
          console.log("plant");
        },
        plantAll: () => {},
        harvest: () => {},
        harvestAll: () => {},
      },
    },
  ];
  return (
    <PanZoomViewport
      backgroundSrc="/images/backgrounds/farm.gif"
      hotspots={hotspots}
      width={width}
      height={height}
      dialogs={dialogs}
    />
  );
};

export default Farm;
