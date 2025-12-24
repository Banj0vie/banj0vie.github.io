import React from 'react';
import "./style.css";

const CardView = ({ className, children, secondary = false, onClick }) => {
    return <div className={`card-view ${className} ${secondary ? "secondary" : ""}`} onClick={onClick}>
        {children}
    </div>
}

export default CardView;