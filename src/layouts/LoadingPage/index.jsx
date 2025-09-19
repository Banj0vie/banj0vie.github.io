import React from "react";
import "./style.css";

const LoadingPage = () => {
  return (
    <div className="loading-page">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading Crypto Valley...</div>
      </div>
    </div>
  );
};

export default LoadingPage;
