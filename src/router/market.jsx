import React from 'react';
import PanZoomViewport from '../layouts/PanZoomViewport';
import { MARKET_VIEWPORT, MARKET_HOTSPOTS } from '../constants/scene_market';
import { dialogFrames } from '../constants/_baseimages';
import DexDialog from '../containers/Market_Dex';
import VendorDialog from '../containers/Market_Vendor';
import BankerDialog from '../containers/Market_Banker';
import { ID_MARKET_HOTSPOTS } from '../constants/app_ids';

const Market = () => {
  const { width, height } = MARKET_VIEWPORT;
  const hotspots = MARKET_HOTSPOTS;
  const dialogs = [
    { id: ID_MARKET_HOTSPOTS.DEX, component: DexDialog, label: 'EXCHANGE TOKENS' },
    { id: ID_MARKET_HOTSPOTS.VENDOR, component: VendorDialog, label: 'SEED SHOP', header: dialogFrames.modalHeaderSeeds },
    { id: ID_MARKET_HOTSPOTS.BANKER, component: BankerDialog, label: 'BANKER', header: dialogFrames.modalHeaderBanker },
  ];

  return (
    <PanZoomViewport backgroundSrc="/images/backgrounds/market.gif" hotspots={hotspots} dialogs={dialogs}  width={width} height={height} />
  );
}

export default Market;


