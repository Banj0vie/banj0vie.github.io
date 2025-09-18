import React from 'react';
import './style.css';
import { ALL_ITEMS } from '../../../constants/item_data';
import CardView from '../CardView';

const ItemCardView = ({itemId}) => {
    const itemData = ALL_ITEMS[itemId];
    return <CardView className="p-0 item-card-view-wrapper" secondary>
        <div className="icon"></div>
        <div className="">{itemData.label}</div>
    </CardView>
}

export default ItemCardView;