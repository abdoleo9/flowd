import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MobileNavProvider } from "@/contexts/MobileNavContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { getActiveWorkspaceId } from "@/lib/active-workspace";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all workspaces this user belongs to
  const { data: memberships } = await supabase
    .from("team_members")
    .select("workspace_id, role, workspace:workspaces(id, name, slug)")
    .eq("user_id", user.id);

  if (!memberships?.length) {
    redirect("/onboarding");
  }

  const workspaces = memberships.map((m) => {
    const ws = (Array.isArray(m.workspace) ? m.workspace[0] : m.workspace) as { id: string; name: string; slug: string } | null;
    return {
      id: ws?.id ?? "",
      name: ws?.name ?? "",
      slug: ws?.slug ?? "",
      role: m.role,
    };
  }).filter((w) => w.id);

  const activeWorkspaceId = await getActiveWorkspaceId() ?? workspaces[0].id;

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <LanguageProvider>
      <MobileNavProvider>
        <WorkspaceProvider
          initialWorkspaces={workspaces}
          initialActiveId={activeWorkspaceId}
        >
          <div style={{ display: "flex", height: "100vh", background: "var(--bg-page)", overflow: "hidden" }}>
            <Sidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
              <Topbar
                userName={profile?.full_name ?? undefined}
                userEmail={user.email}
              />
              <main style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }} className="md:p-7">{children}</main>
            </div>
          </div>
        </WorkspaceProvider>
      </MobileNavProvider>
    </LanguageProvider>
  );
}
