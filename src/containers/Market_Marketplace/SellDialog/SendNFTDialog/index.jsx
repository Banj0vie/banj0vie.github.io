import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../../../_BaseDialog";
import BaseInput from "../../../../components/inputs/BaseInput";
import Slider from "../../../../components/inputs/Slider";
import BaseButton from "../../../../components/buttons/BaseButton";

const SendNFTDialog = ({ onClose, item }) => {
  const [count, setCount] = useState(1);
  const [address, setAddress] = useState("");

  const handleSend = () => {
    onClose();
  };
  return (
    <BaseDialog onClose={onClose} title="SEND NFT">
      <div className="send-nft-dialog">
        <div className="text-center">
          Send {count} x {item.label}
        </div>
        <div className="row">
          <div>To</div>
          <BaseInput
            className="input"
            value={address}
            setValue={(val) => setAddress(val)}
          ></BaseInput>
        </div>
        <div className="row">
          <div>Amount</div>
          <div className="slider">
            <Slider
              min="1"
              max={item.count}
              value={count}
              setValue={(val) => setCount(val)}
            ></Slider>
          </div>
        </div>
        <BaseButton label="Send" onClick={handleSend}></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default SendNFTDialog;
