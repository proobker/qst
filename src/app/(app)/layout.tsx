import { redirect } from "next/navigation";
import { AppNav } from "@/components/nav";
import { ensureUserProfile } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  await ensureUserProfile(user);

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
