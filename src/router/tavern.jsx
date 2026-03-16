import React from "react";
import { TAVERN_BEES, TAVERN_HOTSPOTS, TAVERN_STUFFS, TAVERN_VIEWPORT } from "../constants/scene_tavern";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { ID_TAVERN_HOTSPOTS } from "../constants/app_ids";
import PotionDialog from "../containers/Tavern_Potion";
import AdminPanel from "./index";
import WeatherOverlay from "../components/WeatherOverlay";

const Tavern = () => {
  const { width, height } = TAVERN_VIEWPORT;
  const hotspots = TAVERN_HOTSPOTS;
  const dialogs = [
    {
        id: ID_TAVERN_HOTSPOTS.POTION,
        component: PotionDialog,
        label: "POTION MASTER",
        header: "/images/dialog/modal-header-potion.png",
    }
  ];
  return (
    <>
      <WeatherOverlay />
      <PanZoomViewport
        backgroundSrc="/images/backgrounds/tavern.webp"
        hotspots={hotspots}
        dialogs={dialogs}
        width={width}
        height={height}
        stuffs={TAVERN_STUFFS}
        bees={TAVERN_BEES}
      />
      <AdminPanel />
    </>
  );
};

export default Tavern;