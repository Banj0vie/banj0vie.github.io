import React from 'react';
import PanZoomViewport from '../layouts/PanZoomViewport';
const House = () => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            <PanZoomViewport backgroundSrc="/images/backgrounds/house.png" />
        </div>
    );
}

export default House;
