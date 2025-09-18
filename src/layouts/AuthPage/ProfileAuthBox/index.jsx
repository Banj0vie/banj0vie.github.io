import React, { useState } from "react";
import "./style.css";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseInput from "../../../components/inputs/BaseInput";
import BaseButton from "../../../components/buttons/BaseButton";
import { useWeb3 } from "../../../contexts/Web3Context";
import { useNotification } from "../../../contexts/NotificationContext";

const ProfileAuthBox = ({ onCreateProfile }) => {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { createProfile, isCreatingProfile, error } = useWeb3();

  const { show } = useNotification();

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      show("Please enter a username", 'info');
      return;
    }

    try {
      await createProfile(username.trim(), referralCode.trim());
      onCreateProfile(username.trim(), referralCode.trim());
    } catch (err) {
      console.error("Failed to create profile:", err);
      // Error is already handled by Web3Context
    }
  };

  return (
    <div className="profile-auth-box">
      <div>Create your Profile!</div>
      <BaseDivider></BaseDivider>
      <BaseInput
        className="h-2.5rem w-75"
        type="text"
        placeholder="Username (Max 32)"
        setValue={(un) => setUsername(un)}
        value={username}
      ></BaseInput>
      <BaseInput
        className="h-2.5rem w-75"
        type="text"
        placeholder="Referral Code (Optional)"
        setValue={(rc) => setReferralCode(rc)}
        value={referralCode}
      ></BaseInput>
      {error && (
        <div style={{color: 'red', margin: '10px 0', fontSize: '14px'}}>
          {error}
        </div>
      )}
      <BaseButton
        className="h-3rem w-75"
        label={isCreatingProfile ? "Creating Profile..." : "Create Profile"}
        onClick={handleCreateProfile}
        disabled={isCreatingProfile}
      ></BaseButton>
    </div>
  );
};

export default ProfileAuthBox;
