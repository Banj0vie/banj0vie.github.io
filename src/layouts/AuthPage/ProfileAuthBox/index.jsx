import React, { useState } from "react";
import "./style.css";
import BaseDivider from "../../../components/dividers/BaseDivider";
import BaseInput from "../../../components/inputs/BaseInput";
import BaseButton from "../../../components/buttons/BaseButton";

const ProfileAuthBox = ({ onCreateProfile }) => {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
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
      <BaseButton
        className="h-3rem w-75"
        label="Create Profile"
        onClick={() => onCreateProfile(username, referralCode)}
      ></BaseButton>
    </div>
  );
};

export default ProfileAuthBox;
