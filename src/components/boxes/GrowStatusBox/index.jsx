import React, { useEffect } from "react";
import "./style.css";

const GrowStatusBox = ({ status }) => {
  const [progress, setProgress] = React.useState(0);
  useEffect(() => {
    switch (status) {
      case -1:
        setProgress(0);
        break;
      case 0:
        setProgress(1);
        break;
      case 1:
        setProgress(3);
        break;
      case 2:
        setProgress(4);
        break;
      default:
        setProgress(0);
        break;
    }
  }, [status]);
  return (
    <div className="grow-status-box">
      {[0, 1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={`step ${progress >= step ? "active" : "empty"}`}
        ></div>
      ))}
    </div>
  );
};

export default GrowStatusBox;
