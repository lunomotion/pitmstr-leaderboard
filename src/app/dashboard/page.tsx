import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/roles";

export default async function DashboardRouter() {
  const { sessionClaims } = await auth();

  const metadata = sessionClaims?.metadata as
    | Record<string, unknown>
    | undefined;
  const role = metadata?.role as Role | undefined;

  // Route to the correct dashboard based on role
  switch (role) {
    case "admin":
      redirect("/admin");
    case "teacher":
      redirect("/dashboard/school");
    case "student":
    case "parent":
      redirect("/dashboard/my");
    case "state_director":
      redirect("/dashboard/state");
    default:
      // No role assigned yet — show pending screen
      redirect("/dashboard/pending");
  }
}
