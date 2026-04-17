"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Trash2, AlertTriangle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { WILAYAS } from "@/constants/wilayas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Translations } from "@/lib/i18n";

type SettingsSection =
  | "business"
  | "chatbot"
  | "notifications"
  | "profile"
  | "password"
  | "danger";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSection>("business");
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

  const NAV_ITEMS: { id: SettingsSection; label: string }[] = [
    { id: "business", label: t.settings.business },
    { id: "chatbot", label: t.settings.chatbotAI },
    { id: "notifications", label: t.settings.notifications },
    { id: "profile", label: t.settings.profile },
    { id: "password", label: t.settings.password },
    { id: "danger", label: t.settings.danger },
  ];

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
    toast.success(t.settings.saved);
    fetchData();
  }

  async function saveProfile(updates: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("users").update(updates).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t.settings.saved);
  }

  async function updatePassword(newPassword: string) {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t.settings.saved);
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm p-8">{t.actions.loading}</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 max-w-5xl">
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

      <div className="flex-1 min-w-0">
        {activeSection === "business" && workspace && (
          <BusinessSection workspace={workspace} onSave={saveWorkspace} saving={saving} t={t} />
        )}
        {activeSection === "chatbot" && workspace && (
          <ChatbotSection
            config={(workspace.chatbot_config as Record<string, unknown>) ?? {}}
            onSave={(config: Record<string, unknown>) => saveWorkspace({ chatbot_config: config })}
            saving={saving}
            t={t}
          />
        )}
        {activeSection === "notifications" && workspace && (
          <NotificationsSection
            notifications={(workspace.notifications as Record<string, boolean>) ?? null}
            onSave={(n: Record<string, boolean>) => saveWorkspace({ notifications: n })}
            saving={saving}
            t={t}
          />
        )}
        {activeSection === "profile" && profile && (
          <ProfileSection profile={profile} onSave={saveProfile} saving={saving} t={t} />
        )}
        {activeSection === "password" && (
          <PasswordSection onSave={updatePassword} saving={saving} t={t} />
        )}
        {activeSection === "danger" && (
          <DangerSection t={t} />
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

function BusinessSection({ workspace, onSave, saving, t }: { workspace: Record<string, unknown>; onSave: (u: Record<string, unknown>) => void; saving: boolean; t: Translations }) {
  const [form, setForm] = useState({
    name: String(workspace.name ?? ""),
    phone: String(workspace.phone ?? ""),
    email: String(workspace.email ?? ""),
    wilaya_code: workspace.wilaya_code != null ? String(workspace.wilaya_code) : "16",
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title={t.settings.business} description={t.settings.businessDesc} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t.settings.shopName}
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ma Boutique"
        />
        <Input
          label={t.settings.phone}
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="0555 123 456"
        />
        <Input
          label={t.settings.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="contact@maboutique.dz"
        />
        <Select
          label={t.settings.wilaya}
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
        {t.actions.save}
      </Button>
    </div>
  );
}

function ChatbotSection({ config, onSave, saving, t }: { config: Record<string, unknown>; onSave: (c: Record<string, unknown>) => void; saving: boolean; t: Translations }) {
  const [form, setForm] = useState({
    product_category: String(config?.product_category ?? ""),
    delivery_days: String(config?.delivery_days ?? ""),
    payment_methods: String(config?.payment_methods ?? ""),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title={t.settings.chatbotAI} description={t.settings.chatbotDesc} />
      <Input
        label={t.settings.productCategory}
        value={form.product_category}
        onChange={(e) => setForm((p) => ({ ...p, product_category: e.target.value }))}
        placeholder="ex: smartphones et électronique, vêtements femme, cosmétiques…"
      />
      <Input
        label={t.settings.deliveryDays}
        value={form.delivery_days}
        onChange={(e) => setForm((p) => ({ ...p, delivery_days: e.target.value }))}
        placeholder="ex: 3 à 7"
      />
      <Input
        label={t.settings.paymentMethods}
        value={form.payment_methods}
        onChange={(e) => setForm((p) => ({ ...p, payment_methods: e.target.value }))}
        placeholder="ex: الدفع عند الاستلام، CCP، Baridimob"
      />
      <Button icon={<Save size={14} />} loading={saving} onClick={() => onSave({ ...config, ...form })}>
        {t.actions.save}
      </Button>
    </div>
  );
}

function NotificationsSection({ notifications, onSave, saving, t }: { notifications: Record<string, boolean> | null; onSave: (n: Record<string, boolean>) => void; saving: boolean; t: Translations }) {
  const [form, setForm] = useState(
    notifications ?? { new_order: true, handoff: true, delivery_updates: true, integration_errors: true }
  );

  const items = [
    { key: "new_order", label: t.settings.notifNewOrder, desc: t.settings.notifNewOrderDesc },
    { key: "handoff", label: t.settings.notifHandoff, desc: t.settings.notifHandoffDesc },
    { key: "delivery_updates", label: t.settings.notifDelivery, desc: t.settings.notifDeliveryDesc },
    { key: "integration_errors", label: t.settings.notifErrors, desc: t.settings.notifErrorsDesc },
  ] as const;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title={t.settings.notifications} description={t.settings.notificationsDesc} />
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
        {t.actions.save}
      </Button>
    </div>
  );
}

function ProfileSection({ profile, onSave, saving, t }: { profile: Record<string, unknown>; onSave: (u: Record<string, unknown>) => void; saving: boolean; t: Translations }) {
  const [form, setForm] = useState({ full_name: String(profile.full_name ?? "") });

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <SectionHeader title={t.settings.profile} description={t.settings.profileDesc} />
      <div className="space-y-4">
        <Input
          label={t.settings.email}
          value={String(profile.email ?? "")}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
        <Input
          label={t.settings.fullName}
          value={form.full_name}
          onChange={(e) => setForm({ full_name: e.target.value })}
          placeholder="Ahmed Benali"
        />
      </div>
      <Button icon={<Save size={14} />} loading={saving} onClick={() => onSave(form)}>
        {t.actions.save}
      </Button>
    </div>
  );
}

function PasswordSection({ onSave, saving, t }: { onSave: (p: string) => void; saving: boolean; t: Translations }) {
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
      <SectionHeader title={t.settings.password} description={t.settings.passwordDesc} />
      <div className="space-y-4">
        <Input
          label={t.settings.newPassword}
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
          placeholder="••••••••"
        />
        <Input
          label={t.settings.confirmPassword}
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          placeholder="••••••••"
        />
      </div>
      <Button icon={<Save size={14} />} loading={saving} onClick={handleSave}>
        {t.settings.changePassword}
      </Button>
    </div>
  );
}

function DangerSection({ t }: { t: Translations }) {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="bg-danger-muted border border-danger/20 rounded-xl p-6 space-y-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-danger">{t.settings.danger}</h2>
          <p className="text-sm text-danger/70 mt-0.5">{t.settings.dangerDesc}</p>
        </div>
      </div>

      <div className="bg-background rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">{t.settings.deleteWorkspace}</h3>
        <p className="text-sm text-muted-foreground">{t.settings.deleteWorkspaceDesc}</p>
        <Input
          label={t.settings.deleteConfirmLabel}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t.settings.deleteConfirmWord}
        />
        <Button
          variant="danger"
          icon={<Trash2 size={14} />}
          disabled={confirm !== t.settings.deleteConfirmWord}
          loading={deleting}
          onClick={() => {
            setDeleting(true);
            toast.error("Suppression non implémentée en démo");
            setDeleting(false);
          }}
        >
          {t.settings.deleteButton}
        </Button>
      </div>
    </div>
  );
}
