import React from 'react';
import './style.css';
import { dialogFrames } from '../../constants/_baseimages';

const BaseDialog = ({ className = "", title, onClose, children, header = null }) => {
  return (
    <div className={`${className} modal-backdrop`} onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <img className="modal-header-image" src={dialogFrames.modalHeaderHat} alt="header" />
          {header && <img className="modal-header-additional-image" src={header} alt="header" />}
          <span className="modal-header-title">{title}</span>
        </div>
        <div className="modal-close" onClick={onClose}></div>
        <img className="modal-left-top-image" src="/images/dialog/left-top.png" alt="left-top-image" />
        <img className="modal-bottom-center-image" src="/images/dialog/bottom-center.png" alt="bottom-center-image" />
        <img className="modal-bottom-center-emerald" src="/images/dialog/bottom-center-emerald.png" alt="bottom-center-emerald-image" />
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default BaseDialog;


