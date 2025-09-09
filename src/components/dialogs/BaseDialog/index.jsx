import React from 'react';
import './style.css';
import { dialogFrames } from '../../../constants/baseimages';

const BaseDialog = ({ title, onClose, children, header = null }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          "--dialog-edge-bg":`url(${dialogFrames.modalBgTopLeft}), url(${dialogFrames.modalBgTopRight}), url(${dialogFrames.modalBgBottomLeft}), url(${dialogFrames.modalBgBottomRight})`, 
          "--dialog-close": `url(${dialogFrames.modalClose})`,
          backgroundImage: `url(${dialogFrames.modalBgLeft}), url(${dialogFrames.modalBgRight}), url(${dialogFrames.modalBgTop}), url(${dialogFrames.modalBgBottom})`
        }}
      >
        <div className="modal-header">
          <img className="modal-header-image" src={dialogFrames.modalHeaderHat} alt="header" />
          {header && <img className="modal-header-additional-image" src={header} alt="header" />}
          <span className="modal-header-title">{title}</span>
        </div>
        <div className="modal-close" onClick={onClose}></div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default BaseDialog;


