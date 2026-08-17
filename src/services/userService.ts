import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export type UserRole = "admin" | "user";

export interface ManagedUser {
  uid: string;
  username: string;
  name: string;
  role: UserRole;
  disabled: boolean;
}

export async function getAllUsers(): Promise<ManagedUser[]> {
  const usersCollection = collection(db, "users");

  const usersQuery = query(usersCollection, orderBy("name", "asc"));

  const snapshot = await getDocs(usersQuery);

  return snapshot.docs.map((document) => {
    const data = document.data();

    return {
      uid: document.id,
      username: data.username ?? "",
      name: data.name ?? "",
      role: data.role === "admin" ? "admin" : "user",
      disabled: data.disabled === true,
    };
  });
}

export async function updateUserDisabledStatus(
  uid: string,
  disabled: boolean,
): Promise<void> {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    disabled,
    updatedAt: serverTimestamp(),
  });
}
