import React from 'react';
import './style.css';
import WalletButton from '../../../../components/buttons/WalletButton';

const ProfileView = () => {
    return (
        <div className="name-pill">
            <div>kcat</div>
            <WalletButton/>
        </div>
    );
}

export default ProfileView;