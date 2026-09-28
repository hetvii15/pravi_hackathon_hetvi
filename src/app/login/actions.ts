"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { DEMO_EMAILS, DEMO_PASSWORD } from "@/lib/demo-users";
import type { Role } from "@/lib/constants";

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!DEMO_EMAILS.includes(email as (typeof DEMO_EMAILS)[number]) || password !== DEMO_PASSWORD) {
    return { error: "Invalid email or password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "That demo account hasn't been seeded into the database yet." };
  }

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role as Role });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
