import React from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { HOUSE_HOTSPOTS, HOUSE_VIEWPORT } from "../constants/scene_house";
import { ID_HOUSE_HOTSPOTS } from "../constants/app_ids";
import GoldDialog from "../containers/House_Gold";
import GardnerDialog from "../containers/House_Gardner";
import ReferralDialog from "../containers/House_Referral";
const House = () => {
  const { width, height } = HOUSE_VIEWPORT;
  const hotspots = HOUSE_HOTSPOTS;
  const dialogs = [
    {
      id: ID_HOUSE_HOTSPOTS.GOLD,
      component: GoldDialog,
      label: "BLAST GOLD III",
    },
    {
      id: ID_HOUSE_HOTSPOTS.GARDNER,
      component: GardnerDialog,
      label: "GARDNER",
    },
    {
      id: ID_HOUSE_HOTSPOTS.REFERRALS,
      component: ReferralDialog,
      label: "REFERRAL",
    },
  ];
  return (
    <PanZoomViewport
      backgroundSrc="/images/backgrounds/house.png"
      hotspots={hotspots}
      dialogs={dialogs}
      width={width}
      height={height}
    />
  );
};

export default House;
