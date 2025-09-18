import React, { useState } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import CardView from "../../components/boxes/CardView";
import BaseInput from "../../components/inputs/BaseInput";
import BaseButton from "../../components/buttons/BaseButton";
import BaseDivider from "../../components/dividers/BaseDivider";
import { useNotification } from "../../contexts/NotificationContext";

const ReferralDialog = ({ onClose, label = "REFERRAL", header = "" }) => {
  const [code, setCode] = useState("");
  const [isClaimed, setIsClaimed] = useState(false);
  const { show } = useNotification();

  const onClaim = () => {
    setIsClaimed(true);
  };
  const onCopy = async () => {
    try{
        await navigator.clipboard.writeText("123456789");
        show("Copied code to clipboard!");
    } catch (e) {
        console.error("Failed to copy: ", e);
    }
  };
  return (
    <BaseDialog onClose={onClose} title={label}>
      <div className="referral-dialog">
        <div>Your Sponsor</div>
        <CardView className="p-0">
          {isClaimed ? (
            <div className="text-center">
              <br />
              0x54951CADcb...Aad43ECE7c17
            </div>
          ) : (
            <div className="sponsor-box">
              <BaseInput
                className="h-3rem"
                value={code}
                setValue={(v) => setCode(v)}
                placeholder="Code (Max: 32 Charactors)"
              ></BaseInput>
              <BaseButton
                className="h-3rem mt-1rem"
                label="Claim Code"
                onClick={onClaim}
              ></BaseButton>
            </div>
          )}
        </CardView>
        <BaseDivider></BaseDivider>
        <div>Your referral code</div>
        <CardView className="p-0">
          <div className="text-center your-referral-code">
            <div className="share-code">
              <div className="">Share your referral code:</div>
              <div className="highlight">123456789</div>
            </div>
            <div className="text-1.25">
              Earn up to <span className="highlight">1%</span> of your
              referrals' spendings!
            </div>
          </div>
        </CardView>
        <BaseButton
          className="h-4rem"
          label="Copy to clipboard"
          onClick={onCopy}
        ></BaseButton>
      </div>
    </BaseDialog>
  );
};

export default ReferralDialog;
