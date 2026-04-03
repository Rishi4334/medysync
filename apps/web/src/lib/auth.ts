export interface CurrentUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "admin" | "caretaker" | "patient";
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export function getCurrentUser(): CurrentUser | null {
  try {
    const stored = localStorage.getItem("currentUser");
    if (!stored) return null;
    return JSON.parse(stored) as CurrentUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: CurrentUser): void {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("authToken");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
}
