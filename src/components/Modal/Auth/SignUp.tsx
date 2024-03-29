import { Button, Flex, Input, Text, useColorModeValue } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { useSetRecoilState } from "recoil";

import { authModelState } from "../../../atoms/authModalAtom";
import { auth, firestore } from "../../../firebase/clientApp";
import { FIREBASE_ERRORS } from "../../../firebase/errors";

const SignUp: React.FC = () => {
  const setAuthModelState = useSetRecoilState(authModelState);

  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    conformPassword: "",
  });

  const [error, setError] = useState("");
  const searchBorder = useColorModeValue("blue.500", "#4A5568");
  const inputBg = useColorModeValue("gray.50", "#4A5568");
  const focusedInputBg = useColorModeValue("white", "#2D3748");
  const placeholderColor = useColorModeValue("gray.500", "#CBD5E0");

  //console.log(signUpForm);

  const [createUserWithEmailAndPassword, userCred, loading, userError] = useCreateUserWithEmailAndPassword(auth);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (error) setError("");

    if (signUpForm.password !== signUpForm.conformPassword) {
      setError("Password Do Not Match");
      return;
    }

    // check that the password length is more than 8 and contain a number else set the error state
    if (signUpForm.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    } else if (!/\d/.test(signUpForm.password)) {
      setError('Password must contain at least a number.');
      return;
    } else {
      setError('');
    }
    
    try{
        createUserWithEmailAndPassword(signUpForm.email, signUpForm.password);
    }catch{
        console.log("Signup Error", error);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const createUserDocument = async (user: User) => {
    await addDoc( collection(firestore, "users"), JSON.parse(JSON.stringify(user)) );
  };

//   useEffect(() => {
//     if (userCred) {
//       createUserDocument(userCred.user);
//     }
//   }, [userCred]);

  return (
    <form onSubmit={onSubmit}>
      <Input
        required
        name="email"
        placeholder="Email..."
        type="email"
        mb={2}
        onChange={onChange}
        fontSize="10pt"
        _placeholder={{ color: placeholderColor }}
        _hover={{
          bg: focusedInputBg,
          border: "1px solid",
          borderColor: searchBorder,
        }}
        _focus={{
          outline: "none",
          bg: focusedInputBg,
          border: "1px solid",
          borderColor: searchBorder,
        }}
        bg={inputBg}
      />
      <Input
        required
        name="password"
        placeholder="Password..."
        type="password"
        mb={2}
        onChange={onChange}
        fontSize="10pt"
        _placeholder={{ color: placeholderColor }}
        _hover={{
          bg: focusedInputBg,
          border: "1px solid",
          borderColor: "blue.500",
        }}
        _focus={{
          outline: "none",
          bg: focusedInputBg,
          border: "1px solid",
          borderColor: searchBorder,
        }}
        bg={inputBg}
      />

      <Input
        required
        name="conformPassword"
        placeholder="Confirm Password..."
        type="password"
        mb={2}
        onChange={onChange}
        fontSize="10pt"
        _placeholder={{ color: placeholderColor }}
        _hover={{
          bg: focusedInputBg,
          border: "1px solid",
          borderColor: "blue.500",
        }}
        _focus={{
          outline: "none",
          bg: focusedInputBg,
          border: "1px solid",
          borderColor: searchBorder,
        }}
        bg={inputBg}
      />
      {error ||
        (userError && (
          <Text textAlign="center" color="red" fontSize="10px">
            {error ||
              FIREBASE_ERRORS[
                userError.message as keyof typeof FIREBASE_ERRORS
              ]// be more specific of what type it is that we are tring to use to index that particular object

            }
          </Text>
        ))
      }
      <Button
        width="100%"
        height="36px"
        mt={2}
        mb={2}
        type="submit"
        isLoading={loading}
      >
        Sign Up
      </Button>
      <Flex fontSize="9pt" justifyContent="center">
        <Text mr={1}>Already a User?</Text>
        <Text
          color="blue.500"
          fontWeight={700}
          cursor="pointer"
          onClick={() =>
            setAuthModelState((prev) => ({
              ...prev,
              view: "login",
            }))
          }
        >
          Log In
        </Text>
      </Flex>
    </form>
  );
};
export default SignUp;
