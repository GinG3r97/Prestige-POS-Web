"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supa = createClient();
  await supa.auth.signOut();
  redirect("/login");
}
