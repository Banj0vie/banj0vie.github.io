import React from 'react';
import PanZoomViewport from '../layouts/PanZoomViewport';

const Market = () => {
  const width = 960, height = 480;
  const hotspots = [
    { id: 'vendor', label: 'VENDOR', x: 564, y: 290, delay: 0 },
    { id: 'sage', label: 'SAGE', x: 444, y: -10, delay: 0.2 },
    { id: 'dex', label: 'DEX', x: 110, y: 230, delay: 0.4 },
    { id: 'banker', label: 'BANKER', x: 780, y: 120, delay: 0.6 },
    { id: 'helper', label: 'HELPER', x: 360, y: 330, delay: 0.8 },
    { id: 'market', label: 'MARKET', x: 280, y: 270, delay: 0.2 },
    { id: 'leaderboard', label: 'LEADERBOARD', x: 630, y: 120, delay: 0.4 },
  ];

  return (
    <PanZoomViewport backgroundSrc="/images/backgrounds/market.gif" hotspots={hotspots} width={width} height={height} />
  );
}

export default Market;


