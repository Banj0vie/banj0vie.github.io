import React from 'react';
import "./style.css";

const CardImgView = ({ className, children, secondary = false, onClick }) => {
    return <div className={`card-img-view ${className} ${secondary ? "secondary" : ""}`} onClick={onClick}>
        <img src="/images/profile_bar/avatar_bg.png" alt="avatar-bg" className="card-bg" />
        <div className="card-content">{children}</div>
    </div>
}

export default CardImgView;