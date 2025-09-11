import React from "react";
import "./style.css";
import { ReactComponent as TwitterIcon } from "./../../../assets/social/twitter.svg";
import { ReactComponent as DiscordIcon } from "./../../../assets/social/discord.svg";
import { ReactComponent as TutorialIcon } from "./../../../assets/social/tutorial.svg";
import { ID_SOCIAL } from "../../../constants/id";

const socialIcons = {
  [ID_SOCIAL.TWITTER]: TwitterIcon,
  [ID_SOCIAL.DISCORD]: DiscordIcon,
  [ID_SOCIAL.TUTORIAL]: TutorialIcon
};

const SocialLink = ({data}) => {
  const IconComponent = socialIcons[data.id];
  if (!IconComponent) return null; 
  return (
    <a
      data-v-391d10d9=""
      href={data.link}
      target="#blank"
    >
      <div
        data-v-5709816c=""
        data-v-391d10d9=""
        className="icon-base"
        title="Official Twitter"
      >
        <IconComponent/>
      </div>
    </a>
  );
};

export default SocialLink;
