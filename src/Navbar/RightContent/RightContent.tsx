import { Flex } from "@chakra-ui/react";
import { User } from "firebase/auth";
import React from "react";
import AuthModel from "../../components/Modal/Auth/AuthModel";
import { auth } from "../../firebase/clientApp";
import AuthButtons from "./AuthButtons";
import Icons from "./Icons";
import UserMenu from "./UserMenu";

type RightContentProps = {
  user?: User | null; // this indecate
};

const RightContent: React.FC<RightContentProps> = ({ user }) => {
  return (
    <>
      <AuthModel /> {/* the model that pops up when you click */}
      <Flex justify="center" align="center"> {/* cEnTeR A dIv */} 
        {user ? <Icons /> : <AuthButtons />}
        <UserMenu user={user} />
      </Flex>
    </>
  );
};
export default RightContent;
