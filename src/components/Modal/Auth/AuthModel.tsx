/* eslint-disable react-hooks/exhaustive-deps */
//! Root component
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState } from "recoil";
import { authModelState } from "../../../atoms/authModalAtom";
import { auth } from "../../../firebase/clientApp";
import AuthInput from "./AuthInput";
import OAuthButtons from "./OAuthButtons";
import ResetPassword from "./ResetPassword";

const AuthModel: React.FC = () => {
  const [modelState, setModelState] = useRecoilState(authModelState); // get a recoil atom
  const [user, loading, error] = useAuthState(auth);

  const handleClose = () => {
    // use the set function to close it
    setModelState((prev) => ({
      ...prev,
      open: false,
    }));
  };

  useEffect(() => {
    // a bug that we have is after a user login it is still poped up so we close it here
    if (user) handleClose();
    //console.log(user, "🔥");
  }, [user]);

  return (
    <>
      <Modal isOpen={modelState.open} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign="center">
            {modelState.view === "login" && "Welcome back, Login"}
            {modelState.view === "signup" && "Sign Up"}
            {modelState.view === "resetPassword" && "Reset Password"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            pb={6}
          >
            <Flex
              direction="column"
              align="center"
              justify="center"
              width="70%"
            >
              {modelState.view === "login" || modelState.view === "signup" ? (
                <>
                  <OAuthButtons />
                  <Text color="gray.500" fontWeight={700}>
                    ---------- OR ----------
                  </Text>
                  <AuthInput />
                </>
              ) : (
                <ResetPassword />
              )}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
export default AuthModel;
