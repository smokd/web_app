"use server";

import { cookies } from "next/headers";

export async function logout() {
  (await cookies()).delete("session");
  return { success: true };
}

/* import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/");
}
 */
