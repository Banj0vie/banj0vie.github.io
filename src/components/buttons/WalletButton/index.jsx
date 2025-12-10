import React from 'react';
import './style.css';

const WalletButton = ({onClick}) => {
    return <div className="wallet-icon" onClick={onClick}>
        <img src="/images/profile_bar/wallet.png" alt="Wallet" height={24} />
    </div>
}

export default WalletButton;