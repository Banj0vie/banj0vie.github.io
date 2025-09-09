import React from 'react';
import PanZoomViewport from '../layouts/PanZoomViewport';
import { MARKET_VIEWPORT, MARKET_HOTSPOTS } from '../constants/market';
import { dialogFrames } from '../constants/baseimages';
import DexDialog from '../components/dialogs/Dex';
import VendorDialog from '../components/dialogs/Vendor';

const Market = () => {
  const { width, height } = MARKET_VIEWPORT;
  const hotspots = MARKET_HOTSPOTS;
  const dialogs = [
    { id: 'dex', component: DexDialog, label: 'EXCHANGE TOKENS' },
    { id: 'vendor', component: VendorDialog, label: 'SEED SHOP', header: dialogFrames.modalHeaderSeeds },
  ];

  return (
    <PanZoomViewport backgroundSrc="/images/backgrounds/market.gif" hotspots={hotspots} dialogs={dialogs}  width={width} height={height} />
  );
}

export default Market;


