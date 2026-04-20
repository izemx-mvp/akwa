// Simple in-memory auth state for the prototype.
export type Role = "client" | "admin" | null;

const KEY = "akwa.role";

export const auth = {
  get role(): Role {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(KEY) as Role) ?? null;
  },
  setRole(role: Role) {
    if (typeof window === "undefined") return;
    if (role) localStorage.setItem(KEY, role);
    else localStorage.removeItem(KEY);
  },
  signOut() {
    this.setRole(null);
  },
};
