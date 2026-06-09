"use server";

import { cookies } from "next/headers";

export async function markOnboardingComplete() {
  cookies().set("onboarding_seen", "1", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
