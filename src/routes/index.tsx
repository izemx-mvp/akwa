import { createFileRoute, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const role = auth.role;
    if (role === "admin") throw redirect({ to: "/admin" });
    if (role === "client") throw redirect({ to: "/client" });
    throw redirect({ to: "/login" });
  },
});
