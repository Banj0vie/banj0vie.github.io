import React, { useState } from "react";
import "./style.css";
import { SOCIAL_LINKS } from "../../constants/urls";
import SocialLink from "../../components/links/SocialLink";
import ConnectWalletAuthBox from "./ConnectWalletAuthBox";
import { ID_AUTH_PAGES } from "../../constants/id";
import ProfileAuthBox from "./ProfileAuthBox";

const AuthPage = () => {
  const [pageId, setPageId] = useState(ID_AUTH_PAGES.CONNECT_WALLET);
  const onWalletConnect = () => {
    setPageId(ID_AUTH_PAGES.PROFILE);
  };

  const onCreateProfile = (username, referralCode) => {
    console.log("Created Profile!", username, referralCode);
  };
  return (
    <div className="auth-page">
      <div className="auth-background"></div>
      <div className="auth-box">
        <br />
        <img
          src="/images/avatars/avatar-left-placeholder.png"
          alt="logo"
          className="auth-box-logo"
        ></img>
        {pageId === ID_AUTH_PAGES.CONNECT_WALLET && (
          <ConnectWalletAuthBox
            onWalletConnect={onWalletConnect}
          ></ConnectWalletAuthBox>
        )}
        {pageId === ID_AUTH_PAGES.PROFILE && (
          <ProfileAuthBox onCreateProfile={onCreateProfile}></ProfileAuthBox>
        )}
        <div className="auth-box-footer">
          <div className="divider"></div>
          {SOCIAL_LINKS.map((item, index) => (
            <SocialLink data={item} key={index}></SocialLink>
          ))}
          <div className="divider"></div>
        </div>
        <br />
      </div>
    </div>
  );
};

export default AuthPage;
