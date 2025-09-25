import React, { useEffect, useState } from "react";
import "./style.css";
import { SOCIAL_LINKS } from "../../constants/app_url";
import SocialLink from "../../components/links/SocialLink";
import ConnectWalletAuthBox from "./ConnectWalletAuthBox";
import { ID_AUTH_PAGES } from "../../constants/app_ids";
import ProfileAuthBox from "./ProfileAuthBox";
import { useAgwEthersAndService } from "../../hooks/useContractBase";

const AuthPage = () => {
  const { isConnected, hasProfile, account } = useAgwEthersAndService();
  const [pageId, setPageId] = useState(ID_AUTH_PAGES.CONNECT_WALLET);

  useEffect(() => {
    console.log('🔍 AuthPage state:', { isConnected, hasProfile, pageId, account });
    
    if(!isConnected) {
      if (pageId !== ID_AUTH_PAGES.CONNECT_WALLET) {
        console.log('🔄 Switching to CONNECT_WALLET page');
        setPageId(ID_AUTH_PAGES.CONNECT_WALLET);
      }
    } else if (isConnected && !hasProfile) {
      if (pageId !== ID_AUTH_PAGES.PROFILE) {
        console.log('🔄 Switching to PROFILE page');
        setPageId(ID_AUTH_PAGES.PROFILE);
      }
    } else if (isConnected && hasProfile) {
      console.log('✅ User is connected and has profile - should proceed to game', account);
    }
  }, [isConnected, pageId, hasProfile, account]);

  // Track hasProfile changes specifically
  useEffect(() => {
    console.log('🔍 AuthPage: hasProfile changed to:', hasProfile);
  }, [hasProfile]);

  const onCreateProfile = (username, referralCode) => {
    console.log("Created Profile!", username, referralCode);
    // Force a small delay to ensure state has updated
    setTimeout(() => {
      console.log('🔄 AuthPage: Checking state after profile creation...');
    }, 1000);
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
