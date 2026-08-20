"use server";

import prisma from "@/lib/prisma";
import { verifyPassword, createSession, logoutAction } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  const returnTo = String(formData.get("returnTo") || "/dashboard");

  if (!email || !password) {
    return {
      error: "Email and password are required",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        error: "Invalid email or password",
      };
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
      return {
        error: "Invalid email or password",
      };
    }

    await createSession(user.id, user.role);
  } catch (error) {
    console.error("Login error:", error);

    return {
      error: "An unexpected error occurred",
    };
  }

  // Prevent redirecting to an external website.
  const safeReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/dashboard";

  redirect(safeReturnTo);
}

export async function logout() {
  await logoutAction();

  redirect("/login");
}
