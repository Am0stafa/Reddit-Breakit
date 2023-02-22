/* eslint-disable react-hooks/exhaustive-deps */
//! hook to manage global community state
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { CommunityState } from "../atoms/CommunitiesAtom";
import {
  DirectoryMenuItem,
  directoryMenuState,
} from "../atoms/directoryMenuAtom";
import { FaReddit } from "react-icons/fa";

//! this hook is going to manage the recoil state of the directory menu 
const useDirectory = () => {
  const [directoryState, setDirectoryState] = useRecoilState(directoryMenuState);
  const communityStateValue = useRecoilValue(CommunityState);

  const router = useRouter();

  //! the function that is going to get triggered when the user actually clicks on a menu item in the directory
  const onSelectMenuItem = (menuItem: DirectoryMenuItem) => {
    //? update the directory state to have this menu item and navigate to this page

    setDirectoryState((prev) => ({
      ...prev,
      selectedMenuItem: menuItem,
    }));

    router.push(menuItem.link);
    if (directoryState.isOpen) {
      toggleMenuOpen();
    }
  };

  //! open and close the menu item of the communities
  const toggleMenuOpen = () => {
    setDirectoryState((prev) => ({
      ...prev,
      isOpen: !directoryState.isOpen,
    }));
  };

  useEffect(() => {
    const { currentCommunity } = communityStateValue;

    if (currentCommunity) {
      setDirectoryState((prev) => ({
        ...prev,
        selectedMenuItem: {
          displayText: `r/${currentCommunity.id}`,
          link: `/r/${currentCommunity.id}`,
          imageURL: currentCommunity.imageURL,
          icon: FaReddit,
          iconColor: "blue.500",
        },
      }));
    }
  }, [communityStateValue.currentCommunity]);

  return { directoryState, toggleMenuOpen, onSelectMenuItem };
};
export default useDirectory;
