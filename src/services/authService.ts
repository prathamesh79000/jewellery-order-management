import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

function usernameToAuthEmail(username: string): string {
  const normalizedUsername = username.trim().toLowerCase();

  return `${normalizedUsername}@auth.hardikjewellers.internal`;
}

export async function loginWithUsername(
  username: string,
  password: string
) {
  const authEmail = usernameToAuthEmail(username);

  const userCredential = await signInWithEmailAndPassword(
    auth,
    authEmail,
    password
  );

  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}