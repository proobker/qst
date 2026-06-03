import { redirect } from "next/navigation";
import { LandingHero } from "@/components/landing-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/discover");
  }

  return <LandingHero />;
}
