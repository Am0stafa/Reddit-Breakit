import { atom } from "recoil";

//! first create an interface which represent the properties that our auth modal atom is going to have
export interface AuthModelState {
  open: boolean;
  view: "login" | "signup" | "resetPassword"; //we can make it a string but we know that our model is having only that
}

// an object of type AuthModelState that we created an interface for and this will be the default state
const defaultModelState: AuthModelState = {
  open: false,
  view: "login",
};

// now create the atom itself of type of AuthModelState
export const authModelState = atom<AuthModelState>({
  key: "authModelState",// so that we dont have conflicting state
  default: defaultModelState, // default value
});
