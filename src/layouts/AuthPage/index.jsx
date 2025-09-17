import React, { useEffect, useState } from "react";
import "./style.css";
import { SOCIAL_LINKS } from "../../constants/app_url";
import SocialLink from "../../components/links/SocialLink";
import ConnectWalletAuthBox from "./ConnectWalletAuthBox";
import { ID_AUTH_PAGES } from "../../constants/app_ids";
import ProfileAuthBox from "./ProfileAuthBox";
import { useWeb3 } from "../../contexts/Web3Context";

const AuthPage = () => {
  const { isConnected, hasProfile } = useWeb3();
  console.log(isConnected);
  const [pageId, setPageId] = useState(ID_AUTH_PAGES.CONNECT_WALLET);

  useEffect(() => {
    if(!isConnected) {
      if (pageId !== ID_AUTH_PAGES.CONNECT_WALLET) {
        setPageId(ID_AUTH_PAGES.CONNECT_WALLET);
      }
    } else if (isConnected && !hasProfile) {
      if (pageId !== ID_AUTH_PAGES.PROFILE) {
        setPageId(ID_AUTH_PAGES.PROFILE);
      }
    }
  }, [isConnected, pageId, hasProfile]);

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
        {(pageId === ID_AUTH_PAGES.CONNECT_WALLET && !isConnected) && (
          <ConnectWalletAuthBox></ConnectWalletAuthBox>
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
