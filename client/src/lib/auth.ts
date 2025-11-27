import { useQuery } from "@tanstack/react-query";

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "technician" | "technical_advisor";
  email?: string;
  department?: string;
  headquarters?: string;
  profilePicture?: string;
  bannerImage?: string;
  mood?: string;
};

export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  window.location.href = "/login";
}
