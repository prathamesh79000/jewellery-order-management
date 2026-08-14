import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { auth, db } from "../firebase/firebase";

export type UserRole = "admin" | "user";

export interface UserProfile {
  username: string;
  name: string;
  role: UserRole;
  disabled: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setFirebaseUser(user);

        if (!user) {
          setUserProfile(null);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          console.error(
            "Authenticated user does not have a Firestore profile.",
          );

          setUserProfile(null);
          return;
        }

        const profile = userSnapshot.data() as UserProfile;

        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to load authenticated user profile:", error);

        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = firebaseUser !== null && userProfile !== null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
