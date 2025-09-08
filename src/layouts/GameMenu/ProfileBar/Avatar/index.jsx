import React from 'react';
import './style.css';

const Avatar = ({ src, alt = 'avatar' }) => {
  const fallbackSrc = '/images/avatars/avatar-left-placeholder.png';
  const resolvedSrc = src || fallbackSrc;
  return (
    <div className="avatar">
      <img src={resolvedSrc} alt={alt} className="avatar-img" />
    </div>
  );
};

export default Avatar;


