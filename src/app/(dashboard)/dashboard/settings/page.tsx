"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Trash2, AlertTriangle, Sparkles, RefreshCw, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { WILAYAS } from "@/constants/wilayas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

type SettingsSection =
  | "business"
  | "chatbot"
  | "notifications"
  | "profile"
  | "password"
  | "danger";

const NAV_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: "business", label: "Profil business" },
  { id: "chatbot", label: "Chatbot IA" },
  { id: "notifications", label: "Notifications" },
  { id: "profile", label: "Mon profil" },
  { id: "password", label: "Mot de passe" },
  { id: "danger", label: "Zone dangereuse" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("business");
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

  const fetchData = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: ws }, { data: userProfile }] = await Promise.all([
      supabase.from("workspaces").select("*").eq("id", activeWorkspace.id).single(),
      supabase.from("users").select("*").eq("id", user.id).single(),
    ]);

    setWorkspace(ws ?? null);
    setProfile(userProfile ?? { email: user.email, full_name: "" });
    setLoading(false);
  }, [supabase, activeWorkspace]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function saveWorkspace(updates: Record<string, unknown>) {
    if (!workspace) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update(updates)
      .eq("id", workspace.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Paramètres sauvegardés");
    fetchData();
  }

  async function saveProfile(updates: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("users").update(updates).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil mis à jour");
  }

  async function updatePassword(newPassword: string) {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Mot de passe mis à jour");
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm p-8">Chargement…</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 max-w-5xl">
      {/* Inner nav — horizontal scroll on mobile, vertical on desktop */}
      <nav className="flex md:flex-col md:w-48 md:flex-shrink-0 gap-1 overflow-x-auto pb-1 md:pb-0 md:space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={cn(
              "whitespace-nowrap md:w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
              activeSection === item.id
                ? "bg-accent-muted text-accent"
                : "text-muted-foreground hover:text-white hover:bg-white/5",
              item.id === "danger" && activeSection !== "danger" && "text-danger/70 hover:text-danger"
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Business Profile */}
        {activeSection === "business" && workspace && (
          <BusinessSection workspace={workspace} onSave={saveWorkspace} saving={saving} />
        )}

        {/* AI Chatbot */}
        {activeSection === "chatbot" && workspace && (
          <ChatbotSection
            config={(workspace.chatbot_config as Record<string, unknown>) ?? {}}
            onSave={(config: Record<string, unknown>) => saveWorkspace({ chatbot_config: config })}
            saving={saving}
          />
        )}

        {/* Notifications */}
        {activeSection === "notifications" && workspace && (
          <NotificationsSection
            notifications={(workspace.notifications as Record<string, boolean>) ?? null}
            onSave={(n: Record<string, boolean>) => saveWorkspace({ notifications: n })}
            saving={saving}
          />
        )}

        {/* Profile */}
        {activeSection === "profile" && profile && (
          <ProfileSection profile={profile} onSave={saveProfile} saving={saving} />
        )}

        {/* Password */}
        {activeSection === "password" && (
          <PasswordSection onSave={updatePassword} saving={saving} />
        )}

        {/* Danger zone */}
        {activeSection === "danger" && (
          <DangerSection />
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

function BusinessSection({ workspace, onSave, saving }: { workspace: Record<string, unknown>; onSave: (u: Record<string, unknown>) => void; saving: boolean }) {
  const [form, setForm] = useState({
    name: String(workspace.name ?? ""),
    phone: String(workspace.phone ?? ""),
    email: String(workspace.email ?? ""),
    wilaya_code: workspace.wilaya_code != null ? String(workspace.wilaya_code) : "16",
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title="Profil business" description="Informations générales de votre boutique" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nom de la boutique"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ma Boutique"
        />
        <Input
          label="Téléphone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="0555 123 456"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="contact@maboutique.dz"
        />
        <Select
          label="Wilaya"
          value={form.wilaya_code}
          onChange={(e) => setForm((p) => ({ ...p, wilaya_code: e.target.value }))}
        >
          {WILAYAS.map((w) => (
            <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
          ))}
        </Select>
      </div>
      <Button
        icon={<Save size={14} />}
        loading={saving}
        onClick={() => onSave({ ...form, wilaya_code: parseInt(form.wilaya_code) })}
      >
        Sauvegarder
      </Button>
    </div>
  );
}

function StyleAnalyzer({ config, onSave }: { config: Record<string, unknown>; onSave: (c: Record<string, unknown>) => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const profile = (config?.style_profile ?? null) as Record<string, string | string[]> | null;
  const analyzedAt = config?.style_analyzed_at as string | undefined;
  const source = config?.style_source as string | undefined;

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/analyze-style", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return;
      }
      // Refresh the parent config
      onSave({ ...config, style_profile: data.profile, style_analyzed_at: new Date().toISOString(), style_source: source });
      toast.success("Style analysé et activé ✓");
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-accent/5 border-b border-border px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Sparkles size={15} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Style d&apos;écriture IA</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Le bot analysera vos vrais messages et imitera votre façon de parler
            </p>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-1 flex-shrink-0">
            <CheckCircle2 size={11} /> Actif
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Analyzed profile summary */}
        {profile && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {profile.tone && (
                <div className="bg-background rounded-lg border border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Ton</p>
                  <p className="text-xs text-white">{profile.tone as string}</p>
                </div>
              )}
              {profile.emoji_usage && (
                <div className="bg-background rounded-lg border border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Emojis</p>
                  <p className="text-xs text-white">{profile.emoji_usage as string}</p>
                </div>
              )}
              {Array.isArray(profile.languages) && (
                <div className="bg-background rounded-lg border border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Langues</p>
                  <p className="text-xs text-white">{(profile.languages as string[]).join(", ")}</p>
                </div>
              )}
              {profile.greeting_style && (
                <div className="bg-background rounded-lg border border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Salutation</p>
                  <p className="text-xs text-white italic">&quot;{profile.greeting_style as string}&quot;</p>
                </div>
              )}
            </div>

            {/* Common phrases */}
            {Array.isArray(profile.common_phrases) && (profile.common_phrases as string[]).length > 0 && (
              <div className="bg-background rounded-lg border border-border px-3 py-2.5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Expressions typiques</p>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.common_phrases as string[]).map((phrase, i) => (
                    <span key={i} className="text-xs bg-accent/10 text-accent border border-accent/20 rounded-full px-2.5 py-0.5">
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Style instructions collapsible */}
            {profile.style_instructions && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-white transition-colors py-1"
              >
                <span>Instructions injectées dans le bot</span>
                {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
            {showDetails && profile.style_instructions && (
              <div className="bg-background border border-border rounded-lg px-3 py-2.5">
                <p className="text-xs text-white/70 leading-relaxed italic">{profile.style_instructions as string}</p>
              </div>
            )}

            {analyzedAt && (
              <p className="text-[10px] text-muted-foreground">
                Analysé le {new Date(analyzedAt).toLocaleDateString("fr-DZ", { day: "numeric", month: "long", year: "numeric" })}
                {source && ` depuis ${source === "instagram" ? "Instagram" : "Messenger"}`}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
        >
          {analyzing ? (
            <><RefreshCw size={14} className="animate-spin" /> Analyse en cours…</>
          ) : profile ? (
            <><RefreshCw size={14} /> Ré-analyser mon style</>
          ) : (
            <><Sparkles size={14} /> Analyser mon style depuis Meta</>
          )}
        </button>

        {!profile && (
          <p className="text-[11px] text-muted-foreground text-center">
            Nécessite Instagram ou Messenger connecté dans <strong className="text-white">Intégrations</strong>
          </p>
        )}
      </div>
    </div>
  );
}

function ChatbotSection({ config, onSave, saving }: { config: Record<string, unknown>; onSave: (c: Record<string, unknown>) => void; saving: boolean }) {
  const [form, setForm] = useState({
    persona: String(config?.persona ?? ""),
    order_instructions: String(config?.order_instructions ?? ""),
    language_mode: String(config?.language_mode ?? "auto"),
    languages: (config?.languages as { darija: boolean; french: boolean; english: boolean; arabic: boolean }) ?? { darija: true, french: true, english: true, arabic: false },
  });

  return (
    <div className="space-y-4">
      {/* Style analyzer card */}
      <StyleAnalyzer config={config} onSave={onSave} />

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <SectionHeader title="Chatbot IA" description="Configurez la personnalité et le comportement du bot" />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white">Langues activées</label>
          <div className="flex flex-wrap gap-3">
            {(["darija", "french", "english", "arabic"] as const).map((lang) => {
              const labels = { darija: "Darija", french: "Français", english: "English", arabic: "العربية" };
              return (
                <label key={lang} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.languages[lang]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        languages: { ...p.languages, [lang]: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-white">{labels[lang]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Textarea
          label="Personnalité du chatbot"
          value={form.persona}
          onChange={(e) => setForm((p) => ({ ...p, persona: e.target.value }))}
          placeholder="Assistant amical et professionnel pour une boutique algérienne…"
          rows={3}
        />

        <Textarea
          label="Instructions de prise de commande"
          value={form.order_instructions}
          onChange={(e) => setForm((p) => ({ ...p, order_instructions: e.target.value }))}
          placeholder="Quand un client veut commander, demande: nom complet, numéro de téléphone, wilaya, adresse, produit(s). Confirme ensuite le récapitulatif."
          rows={4}
        />

        <Button
          icon={<Save size={14} />}
          loading={saving}
          onClick={() => onSave({ ...config, ...form })}
        >
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}

function NotificationsSection({ notifications, onSave, saving }: { notifications: Record<string, boolean> | null; onSave: (n: Record<string, boolean>) => void; saving: boolean }) {
  const [form, setForm] = useState(
    notifications ?? { new_order: true, handoff: true, delivery_updates: true, integration_errors: true }
  );

  const items = [
    { key: "new_order", label: "Nouvelle commande", desc: "Alerte à chaque nouvelle commande reçue" },
    { key: "handoff", label: "Handoff chatbot", desc: "Quand le bot transfère à un agent humain" },
    { key: "delivery_updates", label: "Mises à jour livraison", desc: "Changements de statut des colis" },
    { key: "integration_errors", label: "Erreurs d'intégration", desc: "Problèmes avec les connexions externes" },
  ] as const;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title="Notifications" description="Gérez vos alertes et notifications" />
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => setForm((p) => ({ ...p, [item.key]: !p[item.key] }))}
              className={cn(
                "w-10 h-5.5 relative rounded-full transition-colors",
                form[item.key] ? "bg-accent" : "bg-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  form[item.key] ? "left-5.5 translate-x-0.5" : "left-0.5"
                )}
              />
            </button>
          </div>
        ))}
      </div>
      <Button icon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>
        Sauvegarder
      </Button>
    </div>
  );
}

function ProfileSection({ profile, onSave, saving }: { profile: Record<string, unknown>; onSave: (u: Record<string, unknown>) => void; saving: boolean }) {
  const [form, setForm] = useState({ full_name: String(profile.full_name ?? "") });

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title="Mon profil" description="Informations de votre compte personnel" />
      <div className="space-y-4">
        <Input
          label="Email"
          value={String(profile.email ?? "")}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
        <Input
          label="Nom complet"
          value={form.full_name}
          onChange={(e) => setForm({ full_name: e.target.value })}
          placeholder="Ahmed Benali"
        />
      </div>
      <Button icon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>
        Sauvegarder
      </Button>
    </div>
  );
}

function PasswordSection({ onSave, saving }: { onSave: (p: string) => void; saving: boolean }) {
  const [form, setForm] = useState({ newPassword: "", confirm: "" });

  function handleSave() {
    if (form.newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (form.newPassword !== form.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    onSave(form.newPassword);
    setForm({ newPassword: "", confirm: "" });
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title="Mot de passe" description="Changez votre mot de passe" />
      <div className="space-y-4">
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
          placeholder="••••••••"
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          placeholder="••••••••"
        />
      </div>
      <Button icon={<Save size={14} />} loading={saving} onClick={handleSave}>
        Changer le mot de passe
      </Button>
    </div>
  );
}

function DangerSection() {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="bg-danger-muted border border-danger/20 rounded-xl p-6 space-y-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-danger">Zone dangereuse</h2>
          <p className="text-sm text-danger/70 mt-0.5">
            Ces actions sont irréversibles. Procédez avec extrême prudence.
          </p>
        </div>
      </div>

      <div className="bg-background rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Supprimer le workspace</h3>
        <p className="text-sm text-muted-foreground">
          Toutes les données (commandes, conversations, colis) seront définitivement supprimées.
        </p>
        <Input
          label='Tapez "SUPPRIMER" pour confirmer'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="SUPPRIMER"
        />
        <Button
          variant="danger"
          icon={<Trash2 size={14} />}
          disabled={confirm !== "SUPPRIMER"}
          loading={deleting}
          onClick={() => {
            setDeleting(true);
            toast.error("Suppression non implémentée en démo");
            setDeleting(false);
          }}
        >
          Supprimer définitivement
        </Button>
      </div>
    </div>
  );
}
