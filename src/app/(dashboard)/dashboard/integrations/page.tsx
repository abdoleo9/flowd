"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Settings, Trash2, Loader2, CheckCircle2, X } from "lucide-react";
import type { Integration, IntegrationType } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMetaConnect } from "@/hooks/useMetaConnect";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IntegrationDef {
  type: IntegrationType;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  isMeta: boolean;
  fields: { key: string; label: string; placeholder: string; type?: string; hint?: string }[];
}

// ─── Integration definitions ──────────────────────────────────────────────────
const INTEGRATIONS: IntegrationDef[] = [
  {
    type: "instagram",
    name: "Instagram",
    description: "Recevez les DMs Instagram directement dans Flowd et répondez via le chatbot IA.",
    category: "Messagerie",
    icon: "📸",
    color: "#E1306C",
    isMeta: true,
    fields: [],
  },
  {
    type: "messenger",
    name: "Messenger",
    description: "Connectez votre page Facebook pour gérer les messages Messenger via le chatbot.",
    category: "Messagerie",
    icon: "💙",
    color: "#0084FF",
    isMeta: true,
    fields: [],
  },
  {
    type: "whatsapp",
    name: "WhatsApp Business",
    description: "Confirmez les commandes clients via WhatsApp. Le chatbot IA gère les conversations automatiquement.",
    category: "Messagerie",
    icon: "💬",
    color: "#25D366",
    isMeta: true,
    fields: [
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "123456789012345", hint: "Meta for Developers → App → WhatsApp → Configuration" },
      { key: "access_token", label: "Access Token permanent", placeholder: "EAABwzLixnjYBO...", type: "password", hint: "Meta Business Suite → Paramètres système → Utilisateurs système" },
    ],
  },
  {
    type: "shopify",
    name: "Shopify",
    description: "Synchronisez automatiquement vos commandes Shopify dans Flowd en temps réel.",
    category: "Boutique en ligne",
    icon: "🛍️",
    color: "#96BF48",
    isMeta: false,
    fields: [
      { key: "shop_url", label: "URL de boutique", placeholder: "ma-boutique.myshopify.com", hint: "Sans https://" },
      { key: "access_token", label: "Admin API Token", placeholder: "shpat_...", hint: "Shopify Admin → Apps → Développer des apps" },
    ],
  },
  {
    type: "woocommerce",
    name: "WooCommerce",
    description: "Importez vos commandes WooCommerce et gérez-les dans Flowd.",
    category: "Boutique en ligne",
    icon: "🟣",
    color: "#96588A",
    isMeta: false,
    fields: [
      { key: "site_url", label: "URL du site", placeholder: "https://monsite.com" },
      { key: "consumer_key", label: "Consumer Key", placeholder: "ck_...", hint: "WooCommerce → Paramètres → Avancé → REST API" },
      { key: "consumer_secret", label: "Consumer Secret", placeholder: "cs_..." },
    ],
  },
  {
    type: "google_sheets",
    name: "Google Sheets",
    description: "Synchronisez votre catalogue produits depuis un Google Sheet.",
    category: "Catalogue produits",
    icon: "📊",
    color: "#34A853",
    isMeta: false,
    fields: [
      { key: "sheet_id", label: "ID du Sheet", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms", hint: "Dans l'URL : docs.google.com/spreadsheets/d/[ID]/edit" },
      { key: "api_key", label: "Google API Key", placeholder: "AIzaSy...", hint: "Google Cloud Console → APIs & Services → Identifiants" },
    ],
  },
  {
    type: "yalidine",
    name: "Yalidine",
    description: "Créez et suivez vos colis Yalidine Express directement depuis Flowd.",
    category: "Livraison",
    icon: "🚚",
    color: "#FF6B35",
    isMeta: false,
    fields: [
      { key: "api_token", label: "API Token", placeholder: "yalidine_token...", hint: "Espace Yalidine → Paramètres → API" },
      { key: "center_id", label: "Centre ID", placeholder: "1234" },
    ],
  },
  {
    type: "zr_express",
    name: "ZR Express",
    description: "Intégration avec ZR Express pour la livraison à travers l'Algérie.",
    category: "Livraison",
    icon: "📦",
    color: "#E63946",
    isMeta: false,
    fields: [
      { key: "api_key", label: "Clé API", placeholder: "zr_api_key..." },
      { key: "api_url", label: "URL API", placeholder: "https://api.zrexpress.dz" },
    ],
  },
  {
    type: "maystro",
    name: "Maystro",
    description: "Connectez Maystro Delivery pour automatiser vos expéditions.",
    category: "Livraison",
    icon: "🏎️",
    color: "#4CC9F0",
    isMeta: false,
    fields: [
      { key: "api_key", label: "Clé API", placeholder: "mst_...", hint: "Dashboard Maystro → Paramètres → API" },
      { key: "center_id", label: "Centre ID", placeholder: "5" },
    ],
  },
  {
    type: "eddyapp",
    name: "EddyApp",
    description: "Connectez EddyApp pour gérer vos livraisons et suivre vos colis en Algérie.",
    category: "Livraison",
    icon: "⚡",
    color: "#F4A261",
    isMeta: false,
    fields: [
      { key: "api_key", label: "Clé API", placeholder: "eddy_...", hint: "Dashboard EddyApp → Paramètres → API" },
    ],
  },
];

const CATEGORIES = ["Messagerie", "Boutique en ligne", "Catalogue produits", "Livraison"];
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Messagerie": "Connectez vos canaux — le chatbot IA prendra en charge les conversations clients",
  "Boutique en ligne": "Synchronisez vos commandes automatiquement depuis votre boutique",
  "Catalogue produits": "Importez et mettez à jour vos produits depuis des sources externes",
  "Livraison": "Créez des colis et suivez les livraisons directement dans Flowd",
};

// ─── Page picker modal (shown after Meta OAuth when user has multiple pages) ───
function PagePickerModal({
  pages,
  onPick,
  onClose,
}: {
  pages: { id: string; name: string; category?: string }[];
  onPick: (page: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="Choisir une page à connecter" footer={null}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Votre compte gère plusieurs pages. Choisissez celle que vous souhaitez connecter à Flowd.
        </p>
        <div className="space-y-2">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPick(page)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-accent/50 hover:bg-accent/5 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">📄</div>
              <div>
                <p className="text-sm font-semibold text-white">{page.name}</p>
                {page.category && <p className="text-xs text-muted-foreground mt-0.5">{page.category}</p>}
                <p className="text-xs text-muted-foreground font-mono">ID: {page.id}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-white transition-colors">Annuler</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Standard credentials modal (non-Meta integrations) ──────────────────────
function StandardModal({
  def,
  existing,
  onClose,
  onSave,
}: {
  def: IntegrationDef;
  existing?: Integration;
  onClose: () => void;
  onSave: (credentials: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(existing?.credentials ?? {});
  const [saving, setSaving] = useState(false);
  const allFilled = def.fields.every((f) => values[f.key]?.trim());

  async function handleSave() {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Connecter ${def.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button loading={saving} disabled={!allFilled} onClick={handleSave}>Enregistrer</Button>
        </>
      }
    >
      <div className="space-y-4">
        {def.fields.map((field) => (
          <div key={field.key}>
            <Input
              label={field.label}
              type={field.type ?? "text"}
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
            {field.hint && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{field.hint}</p>}
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Token expiry warning ─────────────────────────────────────────────────────
function TokenExpiryWarning({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null;
  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 7) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
      <X size={11} />
      Token expire dans {daysLeft} jour{daysLeft !== 1 ? "s" : ""}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const { t } = useLanguage();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDef, setOpenDef] = useState<IntegrationDef | null>(null);
  const [pagePicker, setPagePicker] = useState<{
    pages: { id: string; name: string; category?: string }[];
    channel: string;
    token: string;
    workspaceId: string;
  } | null>(null);

  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

  const instagramMeta = useMetaConnect("instagram", !!integrations.find((i) => i.type === "instagram")?.is_active);
  const messengerMeta = useMetaConnect("messenger", !!integrations.find((i) => i.type === "messenger")?.is_active);
  const whatsappMeta  = useMetaConnect("whatsapp",  !!integrations.find((i) => i.type === "whatsapp")?.is_active);
  const metaHooks = { instagram: instagramMeta, messenger: messengerMeta, whatsapp: whatsappMeta };

  const categoryLabels: Record<string, string> = {
    "Messagerie": t.integrations.catMessaging,
    "Boutique en ligne": t.integrations.catStore,
    "Catalogue produits": t.integrations.catCatalog,
    "Livraison": t.integrations.catDelivery,
  };

  const fetchIntegrations = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    const { data } = await supabase
      .from("integrations")
      .select("*")
      .eq("workspace_id", activeWorkspace.id);
    setIntegrations(data ?? []);
    setLoading(false);
  }, [supabase, activeWorkspace]);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  // Re-sync DB after a successful Meta OAuth popup
  useEffect(() => {
    if (
      instagramMeta.status === "connected" ||
      messengerMeta.status === "connected" ||
      whatsappMeta.status === "connected"
    ) {
      fetchIntegrations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instagramMeta.status, messengerMeta.status, whatsappMeta.status]);

  // Listen for page-picker requests coming from the OAuth callback popup
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "META_PAGE_PICKER") {
        setPagePicker({
          pages: event.data.pages,
          channel: event.data.channel,
          token: event.data.token,
          workspaceId: event.data.workspaceId,
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function handlePagePick(page: { id: string; name: string }) {
    if (!pagePicker || !activeWorkspace) return;
    const { channel, token, workspaceId } = pagePicker;
    setPagePicker(null);

    const { error } = await supabase.from("integrations").upsert({
      workspace_id: workspaceId,
      type: channel,
      label: page.name,
      is_active: true,
      credentials: { access_token: token, page_id: page.id },
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "workspace_id,type" });

    if (error) {
      toast.error(`Erreur DB : ${error.message}`);
    } else {
      toast.success(`${channel.charAt(0).toUpperCase() + channel.slice(1)} connecté — page : ${page.name}`);
      fetchIntegrations();
    }
  }

  function getIntegration(type: IntegrationType) {
    return integrations.find((i) => i.type === type);
  }

  async function handleSave(def: IntegrationDef, credentials: Record<string, string>) {
    if (!activeWorkspace) {
      toast.error("Aucun workspace actif — rechargez la page et réessayez.");
      return;
    }
    try {
      const existing = getIntegration(def.type);
      const payload = {
        workspace_id: activeWorkspace.id,
        type: def.type,
        label: def.name,
        credentials,
        is_active: true,
      };

      const { error } = existing
        ? await supabase.from("integrations").update(payload).eq("id", existing.id)
        : await supabase.from("integrations").insert(payload);

      if (error) {
        toast.error(`Erreur DB : ${error.message} (code: ${error.code})`);
        return;
      }

      toast.success(`${def.name} connecté avec succès !`);
      setOpenDef(null);
      await fetchIntegrations();
    } catch (err) {
      toast.error(`Erreur inattendue : ${String(err)}`);
    }
  }

  async function handleDisconnect(type: IntegrationType) {
    const existing = getIntegration(type);
    if (!existing) return;
    await supabase.from("integrations").update({ is_active: false }).eq("id", existing.id);
    toast.success("Intégration déconnectée");
    fetchIntegrations();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">{t.integrations.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.integrations.subtitle}</p>
      </div>

      {CATEGORIES.map((category) => {
        const defs = INTEGRATIONS.filter((i) => i.category === category);
        return (
          <div key={category} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{categoryLabels[category] ?? category}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_DESCRIPTIONS[category]}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {defs.map((def) => {
                const connected = getIntegration(def.type);
                const isActive = connected?.is_active;
                const metaHook = def.isMeta
                  ? metaHooks[def.type as "instagram" | "messenger" | "whatsapp"]
                  : null;
                const isConnected = isActive || metaHook?.status === "connected";

                return (
                  <div key={def.type} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: def.color + "20", border: `1px solid ${def.color}30` }}
                        >
                          {def.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{def.name}</p>
                            {def.isMeta && (
                              <span className="text-[9px] font-bold text-[#1877F2] bg-[#1877F2]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Meta</span>
                            )}
                          </div>
                          {isConnected ? (
                            <Badge variant="success" dot>{t.status.connected}</Badge>
                          ) : connected ? (
                            <Badge variant="warning" dot>{t.status.inactive}</Badge>
                          ) : (
                            <Badge variant="muted">{t.status.disconnected}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>

                    {/* Token expiry warning */}
                    {isActive && connected && (
                      <TokenExpiryWarning expiresAt={(connected as Integration & { token_expires_at?: string }).token_expires_at ?? null} />
                    )}

                    {/* Masked credentials preview */}
                    {isActive && connected && (
                      <p className="text-xs text-muted bg-background rounded-lg px-3 py-2 font-mono truncate">
                        {Object.values(connected.credentials)[0]
                          ? "•••••••••••" + String(Object.values(connected.credentials)[0]).slice(-4)
                          : "Configuré"}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-auto">
                      {metaHook ? (
                        isConnected ? (
                          <>
                            <Button size="sm" variant="secondary" icon={<Settings size={13} />} className="flex-1" onClick={() => setOpenDef(def)}>
                              {t.actions.configure}
                            </Button>
                            <Button size="icon" variant="danger" onClick={() => handleDisconnect(def.type)}>
                              <Trash2 size={13} />
                            </Button>
                          </>
                        ) : metaHook.status === "connecting" ? (
                          <Button size="sm" variant="primary" className="flex-1" disabled>
                            <Loader2 size={13} className="animate-spin mr-1.5" /> Connexion…
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={metaHook.status === "error" ? <X size={13} /> : <CheckCircle2 size={13} />}
                            className="flex-1"
                            onClick={metaHook.connect}
                          >
                            {metaHook.status === "error" ? "Réessayer via Meta" : "Connecter via Meta"}
                          </Button>
                        )
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant={isActive ? "secondary" : "primary"}
                            icon={isActive ? <Settings size={13} /> : <Plus size={13} />}
                            className="flex-1"
                            onClick={() => setOpenDef(def)}
                          >
                            {isActive ? t.actions.configure : t.actions.connect}
                          </Button>
                          {isActive && (
                            <Button size="icon" variant="danger" onClick={() => handleDisconnect(def.type)}>
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Page picker modal — shown when user has multiple FB pages after OAuth */}
      {pagePicker && (
        <PagePickerModal
          pages={pagePicker.pages}
          onPick={handlePagePick}
          onClose={() => setPagePicker(null)}
        />
      )}

      {/* Standard credentials modal for non-Meta integrations */}
      {openDef && !openDef.isMeta && (
        <StandardModal
          def={openDef}
          existing={getIntegration(openDef.type)}
          onClose={() => setOpenDef(null)}
          onSave={(creds) => handleSave(openDef, creds)}
        />
      )}

      {loading && null}
    </div>
  );
}
