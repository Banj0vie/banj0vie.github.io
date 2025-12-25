import React from "react";
import PanZoomViewport from "../layouts/PanZoomViewport";
import { MARKET_VIEWPORT, MARKET_HOTSPOTS, MARKET_BEES } from "../constants/scene_market";
import { dialogFrames } from "../constants/_baseimages";
import DexDialog from "../containers/Market_Dex";
import VendorDialog from "../containers/Market_Vendor";
import BankerDialog from "../containers/Market_Banker";
import { ID_MARKET_HOTSPOTS } from "../constants/app_ids";
import MarketPlaceDialog from "../containers/Market_Marketplace";
import LeaderboardDialog from "../containers/Market_Leaderboard";
import SageDialog from "../containers/Market_Sage";

const Market = () => {
  const { width, height } = MARKET_VIEWPORT;
  const hotspots = MARKET_HOTSPOTS;
  const dialogs = [
    {
      id: ID_MARKET_HOTSPOTS.DEX,
      component: DexDialog,
      label: "EXCHANGE TOKENS",
      header: "/images/dialog/modal-header-dex.png",
    },
    {
      id: ID_MARKET_HOTSPOTS.VENDOR,
      component: VendorDialog,
      label: "SEED SHOP",
      header: "/images/dialog/modal-header-dex.png",
    },
    {
      id: ID_MARKET_HOTSPOTS.BANKER,
      component: BankerDialog,
      label: "BANKER",
      header: dialogFrames.modalHeaderBanker,
    },
    {
      id: ID_MARKET_HOTSPOTS.MARKET,
      component: MarketPlaceDialog,
      label: "MARKETPLACE",
    },
    {
      id: ID_MARKET_HOTSPOTS.LEADERBOARD,
      component: LeaderboardDialog,
      label: "LEADERBOARD",
      header: dialogFrames.modalHeaderTrophy,
    },
    {
      id: ID_MARKET_HOTSPOTS.SAGE,
      component: SageDialog,
      label: "QUEEN",
      header: "/images/dialog/modal-header-queen.png",
      headerOffset: 10,
    },
  ];
  const bees = MARKET_BEES;
  return (
    <PanZoomViewport
      backgroundSrc="/images/backgrounds/market.webp"
      hotspots={hotspots}
      dialogs={dialogs}
      width={width}
      height={height}
      bees={bees}
    />
  );
};

export default Market;
