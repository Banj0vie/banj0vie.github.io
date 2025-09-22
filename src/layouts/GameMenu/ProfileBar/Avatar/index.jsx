import React, { useState } from "react";
import "./style.css";
import AvatarDialog from "../../../../containers/Menu_Avatar";

const Avatar = ({ src, alt = "avatar" }) => {
  const [isAvatarDialog, setIsAvatarDialog] = useState(false);
  const fallbackSrc = "/images/avatars/avatar-left-placeholder.png";
  const resolvedSrc = src || fallbackSrc;
  return (
    <div className="avatar">
      <img
        src={resolvedSrc}
        alt={alt}
        className="avatar-img"
        onClick={() => setIsAvatarDialog(true)}
      />
      {isAvatarDialog && <AvatarDialog onClose={()=>setIsAvatarDialog(false)}></AvatarDialog>}
    </div>
  );
};

export default Avatar;
