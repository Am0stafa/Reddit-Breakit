import { Button } from "@chakra-ui/react";
import React from "react";
import { useSetRecoilState } from "recoil";
import { authModelState } from "../../atoms/authModalAtom";

// this is the login and sign up buttons
const AuthButtons: React.FC = () => {
  const setAuthModelState = useSetRecoilState(authModelState);

  return (
    <>
      <Button
        variant="outline"
        height="28px"
        display={{ base: "none", sm: "flex" }} // base = mobile screen
        width={{ base: "70px", md: "110px" }}
        mr={2}
        onClick={() => setAuthModelState({ open: true, view: "login" })} // trigger the modal to popup
      >
        Log In
      </Button>
      <Button
        variant="solid"
        height="28px"
        display={{ base: "none", sm: "flex" }}
        width={{ base: "70px", md: "110px" }}
        mr={2}
        onClick={() => setAuthModelState({ open: true, view: "signup" })}
      >
        Sign Up
      </Button>
    </>
  );
};
export default AuthButtons;
