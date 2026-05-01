import React, { useState } from "react";
import "./style.css";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseInput from "../../../components/inputs/BaseInput";
import BaseButton from "../../../components/buttons/BaseButton";
import { useNotification } from "../../../contexts/NotificationContext";
import { useReferral } from "../../../hooks/useContracts";

const ProfileAuthBox = ({ onCreateProfile }) => {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const { fetchReferralData, createProfile } = useReferral();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [error, setError] = useState(null);

  const { show } = useNotification();

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      show("Please enter a username", 'info');
      return;
    }

    setIsCreatingProfile(true);
    setError(null);
    try {
      const txHash = await createProfile(username.trim(), referralCode.trim());

      // Add a delay to allow blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Refresh profile status after creation
      await fetchReferralData();
      
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
      <div className="profile-label">Create your Profile!</div>
      <img
        src="/images/tutorial/username.png"
        alt="Username"
        draggable={false}
        style={{
          display: 'block',
          width: '60%', maxWidth: '320px',
          height: 'auto', margin: '0 auto 8px',
          objectFit: 'contain', userSelect: 'none',
          imageRendering: 'pixelated',
        }}
      />
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
