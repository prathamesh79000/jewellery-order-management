import type { UserProfile } from "../contexts/AuthContext";

export function isAdmin(
  userProfile: UserProfile | null
): boolean {
  return userProfile?.role === "admin";
}

export function isStaff(
  userProfile: UserProfile | null
): boolean {
  return userProfile?.role === "user";
}