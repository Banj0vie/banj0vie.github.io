import React from 'react';
import './style.css';

const BaseDialog = ({ className = "", title, onClose, children, header = null }) => {
  return (
    <div className={`${className} modal-backdrop`} onClick={onClose}>
      <div className="modal-wrapper">
        <img className="modal-header-bg" src="/images/dialog/top-back.png" alt="background" />
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
        >
          <img className="modal-left-top-image" src="/images/dialog/left-top.png" alt="left-top-image" />
          <img className="modal-bottom-center-image" src="/images/dialog/bottom-center.png" alt="bottom-center-image" />
          <img className="modal-bottom-center-emerald" src="/images/dialog/bottom-center-emerald.png" alt="bottom-center-emerald-image" />
          <div className="modal-body">
            {children}
            <div className="modal-header">
              <img className="modal-header-image" src="/images/dialog/top-baseheader.png" alt="header" />
              {header && <img className="modal-header-additional-image" src={header} alt="header" />}
              <img className="modal-header-label-scroll" src="/images/dialog/label-scroll.png" alt="header" />
              <span className="modal-header-title">{title}</span>
            </div>
            <div className="modal-close" onClick={onClose}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BaseDialog;


