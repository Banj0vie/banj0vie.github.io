import React from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { HOUSE_BEES, HOUSE_HOTSPOTS, HOUSE_VIEWPORT } from "../constants/scene_house";
import { ID_HOUSE_HOTSPOTS } from "../constants/app_ids";
import GoldDialog from "../containers/House_Gold";
import GardnerDialog from "../containers/House_Gardner";
import ReferralDialog from "../containers/House_Referral";
import GoldChestDialog from "../containers/House_Gold_Chest";
import { dialogFrames } from "../constants/_baseimages";
import AnglerDialog from "../containers/House_Angler";
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
      header: "/images/dialog/modal-header-gardner.png"
    },
    {
      id: ID_HOUSE_HOTSPOTS.REFERRALS,
      component: ReferralDialog,
      label: "REFERRAL",
    },
    {
      id: ID_HOUSE_HOTSPOTS.GOLD_CHEST,
      component: GoldChestDialog,
      label: "DAILY CHEST",
      header: "/images/dialog/modal-header-chest.png"
    },
    {
      id: ID_HOUSE_HOTSPOTS.ANGLER,
      component: AnglerDialog,
      label: "QUIET POND",
    },
  ];
  const bees = HOUSE_BEES;
  return (
    <PanZoomViewport
      backgroundSrc="/images/backgrounds/house.webp"
      hotspots={hotspots}
      dialogs={dialogs}
      width={width}
      height={height}
      bees={bees}
    />
  );
};

export default House;
