"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, UserPlus } from "lucide-react";
import type { TeamMember, TeamRole } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TeamPage() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<(TeamMember & { user?: { email: string; full_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("agent");
  const [inviting, setInviting] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

  const roleConfig: Record<TeamRole, { label: string; variant: "orange" | "blue" | "success" | "purple" }> = {
    owner: { label: t.team.roles.owner, variant: "orange" },
    admin: { label: t.team.roles.admin, variant: "blue" },
    confirmer: { label: t.team.roles.confirmer, variant: "success" },
    agent: { label: t.team.roles.agent, variant: "purple" },
  };

  const PERMISSIONS = [
    { label: t.team.permView, owner: true, admin: true, confirmer: true, agent: false },
    { label: t.team.permOrders, owner: true, admin: true, confirmer: true, agent: false },
    { label: t.team.permChatbot, owner: true, admin: true, confirmer: false, agent: true },
    { label: t.team.permDelivery, owner: true, admin: true, confirmer: true, agent: false },
    { label: t.team.permIntegrations, owner: true, admin: true, confirmer: false, agent: false },
    { label: t.team.permTeam, owner: true, admin: true, confirmer: false, agent: false },
    { label: t.team.permBilling, owner: true, admin: false, confirmer: false, agent: false },
    { label: t.team.permDelete, owner: true, admin: false, confirmer: false, agent: false },
  ];

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("*, user:users(email, full_name)")
      .eq("workspace_id", activeWorkspace.id)
      .order("joined_at", { ascending: true });
    setMembers(data ?? []);
    setLoading(false);
  }, [supabase, activeWorkspace]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    setInviting(false);
    if (res.ok) {
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail("");
      fetchMembers();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Erreur lors de l'invitation");
    }
  }

  async function removeMember(memberId: string) {
    await supabase.from("team_members").delete().eq("id", memberId);
    toast.success("Membre supprimé");
    fetchMembers();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{t.team.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.team.subtitle}</p>
        </div>
        <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setInviteOpen(true)}>
          {t.team.invite}
        </Button>
      </div>

      {/* Members table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.team.member}</th>
              <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.settings.email}</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.team.role}</th>
              <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.team.joined}</th>
              <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">{t.nav.dashboard}</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                  {t.actions.loading}
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                  {t.team.noMembers}
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const rc = roleConfig[member.role];
                const name = member.user?.full_name ?? member.user?.email ?? "—";
                return (
                  <tr key={member.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                          {getInitials(name)}
                        </div>
                        <span className="text-sm font-medium text-white truncate max-w-[100px] sm:max-w-none">{name}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm text-muted-foreground">
                      {member.user?.email ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={rc.variant}>{rc.label}</Badge>
                    </td>
                    <td className="hidden md:table-cell py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(member.joined_at)}
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4">
                      <span className="flex items-center gap-1.5 text-xs text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        {t.team.active}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {member.role !== "owner" && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-xs text-danger hover:text-danger/70 transition-colors"
                        >
                          {t.team.remove}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Permissions grid */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">{t.team.rolesPermissions}</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.team.permission}</th>
                {(["owner", "admin", "confirmer", "agent"] as TeamRole[]).map((role) => (
                  <th key={role} className="text-center py-3 px-5 text-xs font-medium">
                    <Badge variant={roleConfig[role].variant}>{roleConfig[role].label}</Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm) => (
                <tr key={perm.label} className="border-b border-border last:border-0">
                  <td className="py-3 px-5 text-sm text-muted-foreground">{perm.label}</td>
                  {(["owner", "admin", "confirmer", "agent"] as const).map((role) => (
                    <td key={role} className="py-3 px-5 text-center">
                      {perm[role] ? (
                        <CheckCircle size={15} className="mx-auto text-success" />
                      ) : (
                        <XCircle size={15} className="mx-auto text-border" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteEmail(""); }}
        title={t.team.inviteTitle}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>{t.actions.cancel}</Button>
            <Button loading={inviting} onClick={handleInvite}>{t.team.sendInvitation}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.team.emailAddress}
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collègue@exemple.com"
          />
          <Select
            label={t.team.role}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as TeamRole)}
          >
            <option value="admin">{t.team.roles.admin}</option>
            <option value="confirmer">{t.team.roles.confirmer}</option>
            <option value="agent">{t.team.roles.agent}</option>
          </Select>
          <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground">
            {t.team.inviteNote}
          </div>
        </div>
      </Modal>
    </div>
  );
}
