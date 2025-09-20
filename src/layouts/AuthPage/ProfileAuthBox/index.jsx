import React, { useState } from "react";
import "./style.css";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseInput from "../../../components/inputs/BaseInput";
import BaseButton from "../../../components/buttons/BaseButton";
import { useAgwEthersAndService } from "../../../hooks/useAgwEthersAndService";
import { useNotification } from "../../../contexts/NotificationContext";

const ProfileAuthBox = ({ onCreateProfile }) => {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { contractService, refreshProfileStatus } = useAgwEthersAndService();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [error, setError] = useState(null);

  const { show } = useNotification();

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      show("Please enter a username", 'info');
      return;
    }

    console.log('🚀 Creating profile:', { username: username.trim(), referralCode: referralCode.trim() });
    setIsCreatingProfile(true);
    setError(null);
    try {
      const txHash = await contractService.createProfile(username.trim(), referralCode.trim());
      console.log('✅ Profile creation transaction:', txHash);
      
      // Add a delay to allow blockchain state to update
      console.log('⏳ Waiting for blockchain state to update...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh profile status after creation
      console.log('🔄 Refreshing profile status...');
      const hasProfile = await refreshProfileStatus();
      console.log('🔍 Profile status after refresh:', hasProfile);
      
      onCreateProfile(username.trim(), referralCode.trim());
      show("Profile created successfully!", 'success');
      
      // Refresh the current page after successful profile creation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Failed to create profile:", err);
      setError(err.message);
      show(`Failed to create profile: ${err.message}`, 'error');
    } finally {
      setIsCreatingProfile(false);
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
