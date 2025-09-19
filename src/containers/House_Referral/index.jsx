import React, { useState, useEffect } from "react";
import "./style.css";
import BaseDialog from "../BaseDialog";
import CardView from "../../components/boxes/CardView";
import BaseInput from "../../components/inputs/BaseInput";
import BaseButton from "../../components/buttons/BaseButton";
import BaseDivider from "../../components/dividers/BaseDivider";
import { useNotification } from "../../contexts/NotificationContext";
import { useReferral } from "../../hooks/useContracts";
import { ethers } from "ethers";

const ReferralDialog = ({ onClose, label = "REFERRAL", header = "" }) => {
  const [code, setCode] = useState("");
  const { show } = useNotification();
  
  // Use referral hook
  const {
    myReferralCode,
    sponsor,
    referralBpsByLevel,
    currentLevel,
    registerReferralCode,
    loading
  } = useReferral();

  // Track state changes for debugging
  useEffect(() => {
    console.log('🔍 ReferralDialog: State changed:', { 
      myReferralCode, 
      sponsor, 
      currentLevel, 
      loading,
      canRegisterCode: currentLevel >= 6 && !myReferralCode
    });
  }, [myReferralCode, sponsor, currentLevel, loading]);

  const onRegister = async () => {
    if (!code.trim()) {
      show("Please enter a referral code", 'warning');
      return;
    }

    if (code.length > 32) {
      show("Referral code must be 32 characters or less", 'warning');
      return;
    }

    console.log('🚀 ReferralDialog: Starting registration for code:', code.trim());
    console.log('🔍 ReferralDialog: Current state before registration:', { 
      myReferralCode, 
      sponsor, 
      currentLevel, 
      loading 
    });

    try {
      await registerReferralCode(code.trim());
      console.log('✅ ReferralDialog: Registration successful, checking state after...');
      console.log('🔍 ReferralDialog: State after registration:', { 
        myReferralCode, 
        sponsor, 
        currentLevel, 
        loading 
      });
      show("Referral code registered successfully!", 'success');
    } catch (err) {
      console.error("Failed to register referral code:", err);
      show(err.message || "Failed to register referral code", 'error');
    }
  };


  const onCopy = async () => {
    try {
      if (myReferralCode) {
        // Convert bytes32 to string for display
        const codeString = ethers.decodeBytes32String(myReferralCode);
        await navigator.clipboard.writeText(codeString);
        show("Copied code to clipboard!");
      } else {
        show("No referral code to copy", 'warning');
      }
    } catch (e) {
      console.error("Failed to copy: ", e);
      show("Failed to copy code", 'error');
    }
  };
  return (
    <BaseDialog onClose={onClose} title={label}>
      <div className="referral-dialog">
        <div>Your Sponsor</div>
        <CardView className="p-0">
          {myReferralCode ? (
            // If user has registered their own referral code, show sponsor info or empty state
            sponsor ? (
              <div className="text-center">
                <br />
                {sponsor.slice(0, 6)}...{sponsor.slice(-6)}
              </div>
            ) : (
              <div className="text-center">
                <br />
                No sponsor
              </div>
            )
          ) : (
            // If user hasn't registered their own referral code yet, show registration form
            <div className="sponsor-box">
              <BaseInput
                className="h-3rem"
                value={code}
                setValue={(v) => setCode(v)}
                placeholder="Code (Max: 32 Characters)"
              ></BaseInput>
              <BaseButton
                className="h-3rem mt-1rem"
                label={loading ? "Registering..." : "Register Code"}
                onClick={onRegister}
                disabled={loading || currentLevel < 6 || !code.trim() || code.length > 32}
              ></BaseButton>
            </div>
          )}
        </CardView>
        <BaseDivider></BaseDivider>
        <div>Your referral code</div>
        {currentLevel < 6 ? (
          <CardView className="p-0">
            <div className="level-low-warning">
              To access the Referral system,
              <br /> your valley must achieve Level 6.
            </div>
          </CardView>
        ) : (
          <CardView className="p-0">
            {myReferralCode ? (
              <div className="text-center your-referral-code">
                <div className="share-code">
                  <div className="">Share your referral code:</div>
                  <div className="highlight">{ethers.decodeBytes32String(myReferralCode)}</div>
                </div>
                <div className="text-1.25">
                  Earn up to <span className="highlight">{Math.max(...Object.values(referralBpsByLevel)) / 100}%</span> of your
                  referrals' spendings!
                </div>
              </div>
            ) : (
              <div className="register-referral-wrapper">
                <div className="text-center">
                  <div className="">Enter your referral code above and click "Register Code" to register it.</div>
                </div>
              </div>
            )}
          </CardView>
        )}
        {currentLevel >= 6 && myReferralCode && (
          <BaseButton
            className="h-4rem"
            label="Copy to clipboard"
            onClick={onCopy}
            disabled={loading}
          ></BaseButton>
        )}
      </div>
    </BaseDialog>
  );
};

export default ReferralDialog;
