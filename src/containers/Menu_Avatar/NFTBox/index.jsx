import React from 'react';
import './style.css';
import CardView from '../../../components/boxes/CardView';

const NFTBox = () => {
    return <div className="nft-box">
        <CardView className="nft-card">
            <img src="/images/avatars/avatar-left-placeholder.png" alt="avatar"></img>
        </CardView>
        <div className="name">
            Empty
        </div>
    </div>
}

export default NFTBox;