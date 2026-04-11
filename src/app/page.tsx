import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import LandingPage from "./landing/page";

export default async function Home() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-in users go straight to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Everyone else sees the landing page
  return <LandingPage />;
}
