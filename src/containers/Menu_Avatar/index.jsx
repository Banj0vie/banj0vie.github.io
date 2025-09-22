import React from "react";
import BaseDialog from "../_BaseDialog";
import "./style.css";
import NFTBox from "./NFTBox";
import BaseDivider from "../../components/dividers/BaseDivider";

const AvatarDialog = ({ onClose }) => {
  return <BaseDialog onClose={onClose} title="WORKERS">
    <div className="avatar-dialog">
        <div className="nft-list">
            <NFTBox></NFTBox>
            <NFTBox></NFTBox>
        </div>
        <BaseDivider></BaseDivider>
        <div className="text-center">You don't have any character NFTs</div>
        <BaseDivider></BaseDivider>
        <div className="text-center">Total Harvest Bonus: <span className="highlight">0%</span></div>
    </div>
  </BaseDialog>;
};

export default AvatarDialog;
