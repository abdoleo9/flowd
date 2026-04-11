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

const roleConfig: Record<TeamRole, { label: string; variant: "orange" | "blue" | "success" | "purple" }> = {
  owner: { label: "Propriétaire", variant: "orange" },
  admin: { label: "Admin", variant: "blue" },
  confirmer: { label: "Confirmeur", variant: "success" },
  agent: { label: "Agent", variant: "purple" },
};

const PERMISSIONS = [
  { label: "Voir le dashboard", owner: true, admin: true, confirmer: true, agent: false },
  { label: "Gérer les commandes", owner: true, admin: true, confirmer: true, agent: false },
  { label: "Chatbot", owner: true, admin: true, confirmer: false, agent: true },
  { label: "Livraison", owner: true, admin: true, confirmer: true, agent: false },
  { label: "Intégrations", owner: true, admin: true, confirmer: false, agent: false },
  { label: "Gérer l'équipe", owner: true, admin: true, confirmer: false, agent: false },
  { label: "Facturation", owner: true, admin: false, confirmer: false, agent: false },
  { label: "Supprimer le workspace", owner: true, admin: false, confirmer: false, agent: false },
];

export default function TeamPage() {
  const [members, setMembers] = useState<(TeamMember & { user?: { email: string; full_name: string | null } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("agent");
  const [inviting, setInviting] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

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
          <h1 className="text-xl font-bold text-white">Équipe</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez les membres de votre workspace
          </p>
        </div>
        <Button size="sm" icon={<UserPlus size={14} />} onClick={() => setInviteOpen(true)}>
          Inviter un membre
        </Button>
      </div>

      {/* Members table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Membre</th>
              <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Email</th>
              <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Rôle</th>
              <th className="hidden md:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Depuis</th>
              <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-muted-foreground font-medium">Statut</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                  Chargement…
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                  Aucun membre
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
                        Actif
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {member.role !== "owner" && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-xs text-danger hover:text-danger/70 transition-colors"
                        >
                          Retirer
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
        <h2 className="text-sm font-semibold text-white mb-4">Rôles & Permissions</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">Permission</th>
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
        title="Inviter un membre"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button loading={inviting} onClick={handleInvite}>Envoyer l&apos;invitation</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Adresse email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collègue@exemple.com"
          />
          <Select
            label="Rôle"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as TeamRole)}
          >
            <option value="admin">Admin</option>
            <option value="confirmer">Confirmeur</option>
            <option value="agent">Agent</option>
          </Select>
          <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground">
            Un email d&apos;invitation sera envoyé à cette adresse.
          </div>
        </div>
      </Modal>
    </div>
  );
}
