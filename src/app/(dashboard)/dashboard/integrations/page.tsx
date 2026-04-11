"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Settings, Trash2, ExternalLink, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, Check, X, Copy,
} from "lucide-react";
import type { Integration, IntegrationType } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IntegrationDef {
  type: IntegrationType;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  connectMode: "wizard" | "whatsapp" | "standard";
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
    connectMode: "wizard",
    fields: [
      { key: "access_token", label: "Page Access Token", placeholder: "EAABwzLixnjYBO..." },
      { key: "page_id", label: "Page ID", placeholder: "123456789" },
    ],
  },
  {
    type: "messenger",
    name: "Messenger",
    description: "Connectez votre page Facebook pour gérer les messages Messenger via le chatbot.",
    category: "Messagerie",
    icon: "💙",
    color: "#0084FF",
    connectMode: "wizard",
    fields: [
      { key: "access_token", label: "Page Access Token", placeholder: "EAABwzLixnjYBO..." },
      { key: "verify_token", label: "Verify Token", placeholder: "flowd_secret_2024" },
    ],
  },
  {
    type: "whatsapp",
    name: "WhatsApp Business",
    description: "Confirmez les commandes clients via WhatsApp. Le chatbot IA gère les conversations automatiquement.",
    category: "Messagerie",
    icon: "💬",
    color: "#25D366",
    connectMode: "whatsapp",
    fields: [
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "123456789012345" },
      { key: "access_token", label: "Access Token", placeholder: "EAABwzLixnjYBO..." },
    ],
  },
  {
    type: "shopify",
    name: "Shopify",
    description: "Synchronisez automatiquement vos commandes Shopify dans Flowd en temps réel.",
    category: "Boutique en ligne",
    icon: "🛍️",
    color: "#96BF48",
    connectMode: "standard",
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
    connectMode: "standard",
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
    connectMode: "standard",
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
    connectMode: "standard",
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
    connectMode: "standard",
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
    connectMode: "standard",
    fields: [
      { key: "api_key", label: "Clé API", placeholder: "mst_...", hint: "Dashboard Maystro → Paramètres → API" },
      { key: "center_id", label: "Centre ID", placeholder: "5" },
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

// ─── Visual Guide Components ─────────────────────────────────────────────────

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl text-[11px]">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111318] border-b border-white/10">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <div className="flex-1 mx-3 bg-[#1e2028] rounded px-2.5 py-1 text-[9px] text-white/30 font-mono truncate">{url}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function N({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex-shrink-0 ring-2 ring-red-500/30 shadow-lg">
      {n}
    </span>
  );
}

function StepInstruction({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <N n={n} />
      <p className="text-sm text-white/80 leading-snug pt-0.5">{children}</p>
    </div>
  );
}

// ── Step 1: Create Meta App ──────────────────────────────────────────────────
function CreateAppVisual() {
  return (
    <div className="space-y-2">
      <BrowserFrame url="developers.facebook.com → My Apps → Create App">
        <div className="bg-[#1877F2] px-3 py-2 flex items-center justify-between">
          <span className="text-white font-bold text-[10px]">Meta for Developers</span>
          <div className="relative">
            <div className="bg-white/20 text-white text-[9px] px-2 py-1 rounded font-semibold border border-white/30">My Apps ▼</div>
            <div className="absolute -top-1.5 -right-1.5 animate-bounce"><N n={1} /></div>
          </div>
        </div>
        <div className="bg-[#f0f2f5] p-3 space-y-2">
          <div className="bg-white rounded-lg border border-[#ddd] p-2.5">
            <div className="text-[9px] font-bold text-[#444] mb-2">Sélectionner un cas d&apos;usage</div>
            <div className="space-y-1.5">
              <div className="px-2 py-1.5 rounded text-[9px] text-[#555] bg-[#f8f8f8] border border-[#eee]">Authentifier et demander des données…</div>
              <div className="px-2 py-1.5 rounded text-[9px] text-[#555] bg-[#f8f8f8] border border-[#eee]">Créer et gérer…</div>
              <div className="relative px-2 py-1.5 rounded text-[9px] font-bold bg-[#E8F0FE] border-2 border-[#1877F2] text-[#1565C0]">
                ✓ Autre (Other)
                <div className="absolute -top-1.5 -right-1.5"><N n={2} /></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-[#ddd] p-2.5">
            <div className="text-[9px] font-bold text-[#444] mb-2">Type d&apos;application</div>
            <div className="relative px-2 py-1.5 rounded text-[9px] font-bold bg-[#E8F5E9] border-2 border-[#4CAF50] text-[#1B5E20]">
              ✓ Business
              <div className="absolute -top-1.5 -right-1.5"><N n={3} /></div>
            </div>
          </div>
        </div>
      </BrowserFrame>
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
        <p className="text-[10px] text-amber-400 font-semibold">⚠️ Le nom de l&apos;app ne peut PAS contenir &quot;Instagram&quot; ni &quot;Facebook&quot;</p>
      </div>
    </div>
  );
}

// ── Step 2: Add Instagram Product ────────────────────────────────────────────
function AddInstagramVisual() {
  return (
    <BrowserFrame url="developers.facebook.com/apps/VOTRE-APP → Dashboard">
      <div className="flex" style={{ minHeight: 160 }}>
        {/* Sidebar */}
        <div className="w-24 bg-[#1a1a2e] border-r border-[#2a2a3e] p-2 space-y-1 flex-shrink-0">
          <div className="text-[8px] text-[#666] font-bold uppercase mb-2">Menu</div>
          <div className="px-1.5 py-1 rounded text-[8px] text-[#888]">Dashboard</div>
          <div className="px-1.5 py-1 rounded text-[8px] text-[#888]">App Settings</div>
          <div className="px-1.5 py-1 rounded text-[8px] text-[#888]">App Roles</div>
          <div className="relative px-1.5 py-1 rounded text-[8px] font-bold bg-[#1877F2]/20 text-[#5B9CF5] border border-[#1877F2]/30">
            Instagram
            <div className="absolute -top-1 -right-1"><N n={3} /></div>
          </div>
          <div className="px-1.5 py-1 ml-2 rounded text-[8px] text-[#5B9CF5] bg-[#1877F2]/10">→ API Setup</div>
        </div>
        {/* Main */}
        <div className="flex-1 bg-[#f0f2f5] p-2.5">
          <div className="text-[9px] font-bold text-[#444] mb-2">Ajouter des produits</div>
          <div className="space-y-1.5">
            <div className="bg-white rounded border border-[#ddd] p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-[#833ab4] to-[#fd1d1d] flex items-center justify-center">
                  <span className="text-white text-[7px] font-bold">IG</span>
                </div>
                <span className="text-[9px] font-bold text-[#333]">Instagram</span>
              </div>
              <div className="relative">
                <div className="bg-[#1877F2] text-white text-[8px] px-2 py-0.5 rounded font-bold">Set Up</div>
                <div className="absolute -top-1.5 -right-1.5 animate-bounce"><N n={1} /></div>
              </div>
            </div>
            <div className="bg-white rounded border border-[#ddd] p-2 flex items-center justify-between opacity-50">
              <span className="text-[9px] text-[#333]">Messenger</span>
              <div className="bg-[#eee] text-[#999] text-[8px] px-2 py-0.5 rounded">Set Up</div>
            </div>
          </div>
          <div className="mt-2 bg-[#E8F0FE] border border-[#90CAF9] rounded p-1.5">
            <p className="text-[8px] text-[#1565C0]">Puis dans le menu gauche : Instagram <strong>→ API Setup</strong> <N n={2} /></p>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ── Step 3: Tester Handshake ──────────────────────────────────────────────────
function TesterHandshakeVisual() {
  return (
    <div className="space-y-2">
      <BrowserFrame url="developers.facebook.com → App Roles → Roles">
        <div className="flex" style={{ minHeight: 100 }}>
          <div className="w-24 bg-[#1a1a2e] border-r border-[#2a2a3e] p-2 space-y-1 flex-shrink-0">
            <div className="px-1.5 py-1 rounded text-[8px] text-[#888]">Dashboard</div>
            <div className="relative px-1.5 py-1 rounded text-[8px] font-bold bg-[#1877F2]/20 text-[#5B9CF5] border border-[#1877F2]/30">
              App Roles
              <div className="absolute -top-1 -right-1"><N n={1} /></div>
            </div>
            <div className="px-1.5 py-1 ml-2 rounded text-[8px] text-[#5B9CF5] bg-[#1877F2]/10">→ Roles</div>
          </div>
          <div className="flex-1 bg-[#f0f2f5] p-2.5">
            <div className="text-[9px] font-bold text-[#444] mb-2">Instagram Testers</div>
            <div className="relative">
              <div className="bg-[#1877F2] text-white text-[8px] px-2 py-1 rounded inline-block font-bold">+ Add People</div>
              <div className="absolute -top-1.5 left-14"><N n={2} /></div>
            </div>
            <div className="mt-2 bg-white border border-[#ddd] rounded p-1.5">
              <div className="text-[8px] text-[#888] mb-1">Rôle :</div>
              <div className="relative bg-[#E8F5E9] border border-[#C8E6C9] rounded px-2 py-1 text-[8px] font-bold text-[#1B5E20] inline-block">
                ✓ Instagram Tester
                <div className="absolute -top-1.5 -right-1.5"><N n={3} /></div>
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
      <BrowserFrame url="instagram.com → Plus → Paramètres → Autorisations → Invitations Testeur">
        <div className="bg-white p-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#833ab4] to-[#fd1d1d] flex items-center justify-center">
              <span className="text-white text-[7px] font-bold">IG</span>
            </div>
            <span className="text-[9px] font-bold text-[#333]">Instagram.com — Invitations Testeur</span>
          </div>
          <div className="bg-[#f8f8f8] border border-[#eee] rounded p-2 flex items-center justify-between">
            <span className="text-[9px] text-[#444]">Mon App Meta</span>
            <div className="relative">
              <div className="bg-[#0095F6] text-white text-[8px] px-2 py-0.5 rounded font-bold">Accepter</div>
              <div className="absolute -top-1.5 -right-1.5 animate-bounce"><N n={4} /></div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

// ── Step 4: Generate Token ────────────────────────────────────────────────────
function TokenGeneratorVisual() {
  return (
    <div className="space-y-2">
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
        <p className="text-[10px] text-amber-400 font-semibold">⚠️ Votre compte Instagram doit être <strong>Professionnel</strong> (Créateur ou Business)</p>
      </div>
      <BrowserFrame url="developers.facebook.com → Instagram → API Setup → User Token Generator">
        <div className="bg-[#f0f2f5] p-2.5">
          <div className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-2">User Token Generator</div>
          <div className="bg-white rounded-lg border border-[#ddd] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#833ab4] to-[#fd1d1d]" />
                <div>
                  <div className="text-[9px] font-bold text-[#333]">votre_compte_instagram</div>
                  <div className="text-[8px] text-[#888]">Compte professionnel</div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-[#1877F2] text-white text-[8px] px-2 py-1 rounded font-bold">Generate Token</div>
                <div className="absolute -top-1.5 -right-1.5 animate-bounce"><N n={1} /></div>
              </div>
            </div>
            <div className="border-t border-[#eee] pt-2">
              <div className="text-[8px] text-[#888] mb-1">Popup de permissions :</div>
              <div className="flex items-center gap-1.5 bg-[#E8F5E9] rounded px-2 py-1 border border-[#C8E6C9]">
                <div className="w-3 h-3 rounded bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
                  <svg width="6" height="6" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <span className="text-[8px] text-[#1B5E20]">I Understand</span>
                <div className="relative ml-auto">
                  <div className="bg-[#1877F2] text-white text-[7px] px-1.5 py-0.5 rounded font-bold">Allow</div>
                  <div className="absolute -top-1.5 -right-1.5"><N n={2} /></div>
                </div>
              </div>
            </div>
            <div className="border-t border-[#eee] pt-2">
              <div className="text-[8px] text-[#888] mb-1">Votre token :</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 bg-[#f8f8f8] border border-[#e0e0e0] text-[7px] text-[#555] px-2 py-1 rounded font-mono truncate">IGAAVJh8wXT4BZDZD...</div>
                <div className="relative">
                  <div className="bg-[#E3F2FD] border border-[#90CAF9] text-[#1565C0] text-[7px] px-1.5 py-1 rounded font-bold">📋</div>
                  <div className="absolute -top-1.5 -right-1.5"><N n={3} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

// ── Step 5: Webhook Setup ─────────────────────────────────────────────────────
function WebhookSetupVisual({ webhookUrl, verifyToken }: { webhookUrl: string; verifyToken: string }) {
  return (
    <BrowserFrame url="developers.facebook.com → Instagram → API Setup → Webhooks">
      <div className="bg-[#f0f2f5] p-3">
        <div className="text-[9px] font-bold text-[#444] uppercase tracking-wider mb-2">Configurer le Webhook Instagram</div>
        <div className="bg-white rounded-lg border border-[#ddd] p-3 space-y-2.5">
          <div>
            <div className="text-[9px] text-[#888] font-semibold mb-1">Callback URL *</div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-[#E8F0FE] border-2 border-[#1877F2] text-[8px] text-[#1565C0] px-2 py-1.5 rounded font-mono truncate">{webhookUrl}</div>
              <div className="relative"><N n={1} /></div>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[#888] font-semibold mb-1">Verify Token *</div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-[#E8F0FE] border-2 border-[#1877F2] text-[8px] text-[#1565C0] px-2 py-1.5 rounded font-mono">{verifyToken}</div>
              <div className="relative"><N n={2} /></div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#E8F5E9] rounded px-2 py-1.5 border border-[#C8E6C9]">
            <div className="w-3.5 h-3.5 rounded bg-[#4CAF50] flex items-center justify-center flex-shrink-0">
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <code className="text-[9px] font-mono font-bold text-[#1B5E20]">messages</code>
            <div className="relative ml-auto"><N n={3} /></div>
          </div>
          <div className="bg-[#1877F2] text-white text-[9px] text-center py-2 rounded-lg font-bold">
            Verify and Save →
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

// ─── Visual Wizard Modal ──────────────────────────────────────────────────────
function WizardModal({
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
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(existing?.credentials ?? {});
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; name?: string; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const WEBHOOK_URL = "https://flowd-nine.vercel.app/api/webhooks/meta";
  const VERIFY_TOKEN_VALUE = "flowd_webhook_2024";

  // 5-phase tutorial steps
  const STEPS = [
    { id: "create-app",      label: "Créer l'App" },
    { id: "add-instagram",   label: "Instagram" },
    { id: "tester",          label: "Testeur" },
    { id: "token",           label: "Token" },
    { id: "webhook",         label: "Webhook" },
  ];

  const currentId = STEPS[step].id;
  const isTokenStep = currentId === "token";
  const isWebhookStep = currentId === "webhook";
  const token = values["access_token"] ?? "";

  useEffect(() => {
    if (!isTokenStep || !token || token.length < 20) { setValidationResult(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await fetch(`/api/integrations/validate?token=${encodeURIComponent(token)}`);
        setValidationResult(await res.json());
      } catch {
        setValidationResult({ valid: false, error: "Erreur réseau" });
      } finally { setValidating(false); }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [token, isTokenStep]);

  async function handleSaveAndNext() {
    setSaving(true);
    await onSave(values);
    setSaving(false);
    setSaved(true);
    setStep(4); // advance to webhook step (step 5)
  }

  // Allow save as long as both fields are filled — validation is a warning, not a hard block
  const canSave = values["access_token"]?.trim().length > 10 && values["page_id"]?.trim().length > 3;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Connecter ${def.name} — Guide étape par étape`}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => step === 0 ? onClose() : setStep(step - 1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> {step === 0 ? "Annuler" : "Retour"}
          </button>
          {isWebhookStep ? (
            <Button onClick={onClose}><Check size={13} /> Terminer</Button>
          ) : isTokenStep ? (
            <Button loading={saving} disabled={saving} onClick={handleSaveAndNext}>
              {saving ? "Enregistrement…" : <>Enregistrer et continuer <ArrowRight size={13} /></>}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>Suivant <ArrowRight size={13} /></Button>
          )}
        </div>
      }
    >
      {/* YouTube Tutorial Banner */}
      <a
        href="https://www.youtube.com/watch?v=sPjlyDSNYQs"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-5 hover:bg-red-500/15 transition-colors group"
      >
        <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Voir le tutoriel vidéo</p>
          <p className="text-xs text-red-400/80 mt-0.5">Facebook Messenger Bot — Guide complet Meta API &amp; Webhooks</p>
        </div>
        <ExternalLink size={13} className="text-red-400/50 flex-shrink-0 group-hover:text-red-400 transition-colors" />
      </a>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-5">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
              i < step ? "bg-accent text-white" : i === step ? "bg-accent/20 text-accent ring-1 ring-accent/50" : "bg-white/5 text-white/25"
            }`}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 transition-all ${i < step ? "bg-accent" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-5">

        {/* LEFT — Visual mockup */}
        <div className="md:w-5/12 flex-shrink-0">
          {currentId === "create-app"    && <CreateAppVisual />}
          {currentId === "add-instagram" && <AddInstagramVisual />}
          {currentId === "tester"        && <TesterHandshakeVisual />}
          {currentId === "token"         && <TokenGeneratorVisual />}
          {currentId === "webhook"       && <WebhookSetupVisual webhookUrl={WEBHOOK_URL} verifyToken={VERIFY_TOKEN_VALUE} />}
        </div>

        {/* RIGHT — Instructions */}
        <div className="md:w-7/12 flex flex-col gap-4">

          {/* Phase 1 — Create Meta App */}
          {currentId === "create-app" && (<>
            <div>
              <h3 className="text-base font-bold text-white">Créez votre application Meta</h3>
              <p className="text-sm text-muted-foreground mt-1">Rendez-vous sur <strong className="text-white">developers.facebook.com</strong> et créez une nouvelle application.</p>
            </div>
            <div className="space-y-3">
              <StepInstruction n={1}>Cliquez sur <span className="text-white font-semibold">My Apps</span> en haut à droite, puis sur <span className="text-white font-semibold">Create App</span></StepInstruction>
              <StepInstruction n={2}>Choisissez le cas d&apos;usage <span className="text-white font-semibold">Other</span> (Autre)</StepInstruction>
              <StepInstruction n={3}>Sélectionnez le type <span className="text-white font-semibold">Business</span> puis donnez un nom à votre app</StepInstruction>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs text-amber-400">⚠️ Le nom de votre app ne peut <strong>pas</strong> contenir &quot;Instagram&quot; ni &quot;Facebook&quot; — utilisez le nom de votre boutique.</p>
            </div>
            <a href="https://developers.facebook.com/apps/create/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-[#1877F2]/15 border border-[#1877F2]/30 rounded-xl p-3.5 hover:bg-[#1877F2]/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1877F2]/25 flex items-center justify-center">
                  <ExternalLink size={14} className="text-[#5B9CF5]" />
                </div>
                <span className="text-sm font-semibold text-[#5B9CF5]">Ouvrir Meta for Developers →</span>
              </div>
              <ExternalLink size={12} className="text-[#5B9CF5]/50 flex-shrink-0" />
            </a>
          </>)}

          {/* Phase 2 — Add Instagram Product */}
          {currentId === "add-instagram" && (<>
            <div>
              <h3 className="text-base font-bold text-white">Ajoutez Instagram à votre app</h3>
              <p className="text-sm text-muted-foreground mt-1">Dans le tableau de bord de votre app, ajoutez le produit Instagram puis configurez l&apos;API.</p>
            </div>
            <div className="space-y-3">
              <StepInstruction n={1}>Dans <span className="text-white font-semibold">Add Products to Your App</span>, trouvez <span className="text-white font-semibold">Instagram</span> et cliquez <span className="text-white font-semibold">Set Up</span></StepInstruction>
              <StepInstruction n={2}>Dans le menu latéral gauche, cliquez sur <span className="text-white font-semibold">Instagram → API Setup</span></StepInstruction>
              <StepInstruction n={3}>Instagram apparaîtra maintenant dans votre menu de navigation</StepInstruction>
            </div>
            <div className="bg-[#1877F2]/10 border border-[#1877F2]/25 rounded-xl p-3">
              <p className="text-xs text-[#90CAF9]">💡 Si vous ne voyez pas Instagram dans la liste des produits, assurez-vous que votre app est de type <strong>Business</strong>.</p>
            </div>
          </>)}

          {/* Phase 3 — Tester Handshake */}
          {currentId === "tester" && (<>
            <div>
              <h3 className="text-base font-bold text-white">Ajoutez votre compte comme Testeur</h3>
              <p className="text-sm text-muted-foreground mt-1">Cette étape lie votre compte Instagram à l&apos;app pour pouvoir générer un token.</p>
            </div>
            <div className="space-y-3">
              <StepInstruction n={1}>Dans votre app Meta, allez dans <span className="text-white font-semibold">App Roles → Roles</span></StepInstruction>
              <StepInstruction n={2}>Cliquez sur <span className="text-white font-semibold">Add People</span> et cherchez votre nom d&apos;utilisateur Instagram</StepInstruction>
              <StepInstruction n={3}>Sélectionnez le rôle <span className="text-white font-semibold">Instagram Tester</span> et envoyez l&apos;invitation</StepInstruction>
              <StepInstruction n={4}>Sur <span className="text-white font-semibold">instagram.com</span> → Plus → Paramètres → Sécurité → <span className="text-white font-semibold">Invitations Testeur</span> → cliquez <span className="text-white font-semibold">Accepter</span></StepInstruction>
            </div>
            <a href="https://www.instagram.com/accounts/manage_access/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-gradient-to-r from-[#833ab4]/15 to-[#fd1d1d]/15 border border-[#833ab4]/30 rounded-xl p-3.5 hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-3">
                <span className="text-lg">📸</span>
                <span className="text-sm font-semibold text-white">Ouvrir Instagram Invitations →</span>
              </div>
              <ExternalLink size={12} className="text-white/40 flex-shrink-0" />
            </a>
          </>)}

          {/* Phase 4 — Generate Token */}
          {currentId === "token" && (<>
            <div>
              <h3 className="text-base font-bold text-white">Générez et copiez votre token</h3>
              <p className="text-sm text-muted-foreground mt-1">Dans <strong className="text-white">Instagram → API Setup → User Token Generator</strong>, générez votre token d&apos;accès.</p>
            </div>
            <div className="space-y-2.5 mb-1">
              <StepInstruction n={1}>Cliquez sur <span className="text-white font-semibold">Generate Token</span> à côté de votre compte Instagram</StepInstruction>
              <StepInstruction n={2}>Dans le popup : cochez <span className="text-white font-semibold">I Understand</span> puis cliquez <span className="text-white font-semibold">Allow</span></StepInstruction>
              <StepInstruction n={3}>Copiez le token généré (commence par <code className="text-accent text-[11px]">IGAAVJh...</code>) et collez-le ci-dessous</StepInstruction>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-1.5">
                <N n={1} /> Page Access Token
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={values["access_token"] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, access_token: e.target.value }))}
                  placeholder="EAABwzLixnjYBO..."
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors resize-none font-mono"
                />
                <div className="absolute top-2.5 right-2.5">
                  {validating && <Loader2 size={14} className="text-muted-foreground animate-spin" />}
                  {!validating && validationResult?.valid && <CheckCircle2 size={14} className="text-green-400" />}
                  {!validating && validationResult && !validationResult.valid && <X size={14} className="text-red-400" />}
                </div>
              </div>
              {validating && <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><Loader2 size={9} className="animate-spin" /> Validation en cours...</p>}
              {!validating && validationResult?.valid && <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1"><CheckCircle2 size={10} /> Token valide — Page : <strong>{validationResult.name}</strong></p>}
              {!validating && validationResult && !validationResult.valid && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><X size={10} /> Token invalide — {validationResult.error}</p>}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-1.5">
                <N n={2} /> Page ID
              </label>
              <input
                type="text"
                value={values["page_id"] ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, page_id: e.target.value }))}
                placeholder="123456789012"
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1.5">C&apos;est l&apos;<strong className="text-white/60">Instagram Account ID</strong> — il s&apos;affiche sous votre nom dans la section User Token Generator, ou dans <strong className="text-white/60">Instagram → API Setup</strong></p>
            </div>
          </>)}

          {/* Phase 5 — Webhook Setup */}
          {currentId === "webhook" && (<>
            <div>
              <h3 className="text-base font-bold text-white">Configurez le Webhook</h3>
              <p className="text-sm text-muted-foreground mt-1">Dans <strong className="text-white">Instagram → API Setup → Webhooks</strong>, collez ces valeurs pour recevoir les DMs en temps réel.</p>
            </div>
            {saved && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3.5 py-2.5">
                <CheckCircle2 size={14} /> Intégration enregistrée — plus qu&apos;une étape !
              </div>
            )}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><N n={1} /> Callback URL</p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3.5 py-2.5">
                  <code className="flex-1 text-xs text-accent font-mono break-all">{WEBHOOK_URL}</code>
                  <button onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); toast.success("URL copiée !"); }}
                    className="flex-shrink-0 p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-lg">
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><N n={2} /> Verify Token</p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3.5 py-2.5">
                  <code className="flex-1 text-xs text-accent font-mono">{VERIFY_TOKEN_VALUE}</code>
                  <button onClick={() => { navigator.clipboard.writeText(VERIFY_TOKEN_VALUE); toast.success("Token copié !"); }}
                    className="flex-shrink-0 p-1.5 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-lg">
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-background border border-border rounded-xl px-3.5 py-3">
                <N n={3} />
                <p className="text-xs text-white/70 pt-0.5">Cochez <code className="text-accent font-mono">messages</code> dans les champs d&apos;abonnement, puis cliquez <strong className="text-white">&quot;Vérifier et enregistrer&quot;</strong></p>
              </div>
            </div>
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between bg-[#1877F2]/15 border border-[#1877F2]/30 rounded-xl p-3.5 hover:bg-[#1877F2]/20 transition-colors">
              <span className="text-sm font-semibold text-[#5B9CF5]">Ouvrir Meta for Developers →</span>
              <ExternalLink size={13} className="text-[#5B9CF5]/50" />
            </a>
          </>)}

        </div>
      </div>
    </Modal>
  );
}

// ─── WhatsApp Embedded Signup Modal ──────────────────────────────────────────
declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (callback: (response: { authResponse?: { code?: string; accessToken?: string } }) => void, options: Record<string, unknown>) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function WhatsAppModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: Integration;
  onClose: () => void;
  onSave: (credentials: Record<string, string>) => Promise<void>;
}) {
  const [phase, setPhase] = useState<"intro" | "connecting" | "manual" | "success">(existing?.is_active ? "success" : "intro");
  const [values, setValues] = useState<Record<string, string>>(existing?.credentials ?? {});
  const [saving, setSaving] = useState(false);
  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;

  // Load Meta SDK
  useEffect(() => {
    if (window.FB || document.getElementById("fb-sdk")) return;
    window.fbAsyncInit = function () {
      window.FB!.init({ appId: metaAppId ?? "", version: "v19.0", xfbml: false, cookie: true });
    };
    const script = document.createElement("script");
    script.id = "fb-sdk";
    script.src = "https://connect.facebook.net/fr_FR/sdk.js";
    script.async = true;
    document.body.appendChild(script);
  }, [metaAppId]);

  function handleEmbeddedSignup() {
    if (!window.FB) { toast.error("SDK Meta non chargé, réessayez."); return; }
    setPhase("connecting");
    window.FB.login(
      async (response) => {
        if (response.authResponse) {
          const token = response.authResponse.accessToken ?? response.authResponse.code ?? "";
          const creds = { access_token: token, source: "embedded_signup" };
          setSaving(true);
          await onSave(creds);
          setSaving(false);
          setPhase("success");
        } else {
          setPhase("intro");
          toast.error("Connexion annulée");
        }
      },
      {
        scope: "whatsapp_business_management,whatsapp_business_messaging",
        ...(metaAppId
          ? {
              config_id: metaAppId,
              response_type: "code",
              override_default_response_type: true,
              extras: { setup: {}, featureName: "whatsapp_embedded_signup", sessionInfoVersion: "3" },
            }
          : {}),
      }
    );
  }

  async function handleManualSave() {
    setSaving(true);
    await onSave(values);
    setSaving(false);
    setPhase("success");
  }

  return (
    <Modal open onClose={onClose} title="Connecter WhatsApp Business" footer={null}>
      {phase === "intro" && (
        <div className="space-y-5">
          {/* What you get */}
          <div className="bg-background rounded-xl border border-border p-4 space-y-3">
            {[
              { icon: "🤖", text: "Le chatbot IA répond à vos clients en darija, français et anglais" },
              { icon: "📦", text: "Confirmations de commande automatiques avant la livraison" },
              { icon: "📍", text: "Suivi de livraison envoyé automatiquement aux clients" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className="text-sm text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Two connection options */}
          <div className="space-y-3">
            {/* Option 1 - Embedded Signup (recommended) */}
            <button
              onClick={handleEmbeddedSignup}
              className="w-full flex items-center gap-4 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-4 hover:bg-[#25D366]/15 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center text-xl flex-shrink-0">💬</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">Connecter via Meta</p>
                  <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/15 px-2 py-0.5 rounded-full">RECOMMANDÉ</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Connexion officielle — guidée par Meta en 2 minutes</p>
              </div>
              <ArrowRight size={14} className="text-[#25D366] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Option 2 - Manual */}
            <button
              onClick={() => setPhase("manual")}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-border/60 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">⚙️</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Configurer manuellement</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vous avez déjà un WhatsApp Business API — entrez vos clés</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="text-sm text-muted-foreground hover:text-white transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {phase === "connecting" && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center">
            <Loader2 size={22} className="text-[#25D366] animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Connexion à Meta en cours…</p>
            <p className="text-xs text-muted-foreground mt-1">Complétez le processus dans la fenêtre Meta qui vient de s&apos;ouvrir</p>
          </div>
          <button onClick={() => setPhase("intro")} className="text-xs text-muted-foreground hover:text-white transition-colors mt-2">
            Annuler
          </button>
        </div>
      )}

      {phase === "manual" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setPhase("intro")} className="text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft size={15} />
            </button>
            <p className="text-sm font-semibold text-white">Configuration manuelle</p>
          </div>

          {/* Instructions link */}
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-accent hover:underline"
          >
            <ExternalLink size={11} /> Guide officiel WhatsApp Business API
          </a>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Phone Number ID</label>
              <input
                type="text"
                value={values.phone_number_id ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, phone_number_id: e.target.value }))}
                placeholder="123456789012345"
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Meta for Developers → App → WhatsApp → Configuration</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Access Token permanent</label>
              <input
                type="password"
                value={values.access_token ?? ""}
                onChange={(e) => setValues((p) => ({ ...p, access_token: e.target.value }))}
                placeholder="EAABwzLixnjYBO..."
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Meta Business Suite → Paramètres système → Utilisateurs système</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setPhase("intro")} className="text-sm text-muted-foreground hover:text-white transition-colors">Retour</button>
            <Button
              loading={saving}
              disabled={!values.phone_number_id?.trim() || !values.access_token?.trim()}
              onClick={handleManualSave}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      {phase === "success" && (
        <div className="flex flex-col items-center justify-center py-8 gap-5">
          <div className="w-16 h-16 rounded-full bg-[#25D366]/15 border-2 border-[#25D366]/30 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-[#25D366]" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-white">WhatsApp connecté !</p>
            <p className="text-sm text-muted-foreground mt-1">Le chatbot peut maintenant répondre à vos clients via WhatsApp.</p>
          </div>
          <div className="bg-background rounded-xl border border-border p-4 w-full space-y-2 text-center">
            <p className="text-xs text-muted-foreground">Prochaine étape</p>
            <p className="text-sm text-white font-medium">Configurez les messages automatiques dans <strong>Chatbot IA</strong></p>
          </div>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      )}
    </Modal>
  );
}

// ─── Standard Connect Modal ───────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDef, setOpenDef] = useState<IntegrationDef | null>(null);
  const supabase = getSupabaseBrowserClient();
  const { activeWorkspace } = useWorkspace();

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

      let error;
      if (existing) {
        ({ error } = await supabase.from("integrations").update(payload).eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("integrations").insert(payload));
      }

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

  const openModal = openDef;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Intégrations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connectez vos outils — le chatbot et la livraison s&apos;activent automatiquement
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const defs = INTEGRATIONS.filter((i) => i.category === category);
        return (
          <div key={category} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{category}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_DESCRIPTIONS[category]}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {defs.map((def) => {
                const connected = getIntegration(def.type);
                const isActive = connected?.is_active;
                return (
                  <div key={def.type} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
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
                            {def.connectMode === "wizard" && (
                              <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Guidé</span>
                            )}
                            {def.connectMode === "whatsapp" && (
                              <span className="text-[9px] font-bold text-[#25D366] bg-[#25D366]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Meta</span>
                            )}
                          </div>
                          {isActive ? (
                            <Badge variant="success" dot>Connecté</Badge>
                          ) : connected ? (
                            <Badge variant="warning" dot>Inactif</Badge>
                          ) : (
                            <Badge variant="muted">Non connecté</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>

                    {isActive && connected && (
                      <p className="text-xs text-muted bg-background rounded-lg px-3 py-2 font-mono truncate">
                        {Object.values(connected.credentials)[0]
                          ? "•••••••••••" + String(Object.values(connected.credentials)[0]).slice(-4)
                          : "Configuré"}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-auto">
                      <Button
                        size="sm"
                        variant={isActive ? "secondary" : "primary"}
                        icon={isActive ? <Settings size={13} /> : <Plus size={13} />}
                        className="flex-1"
                        onClick={() => setOpenDef(def)}
                      >
                        {isActive ? "Configurer" : "Connecter"}
                      </Button>
                      {isActive && (
                        <Button size="icon" variant="danger" onClick={() => handleDisconnect(def.type)}>
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Modals */}
      {loading && null}

      {openModal?.connectMode === "wizard" && (
        <WizardModal
          def={openModal}
          existing={getIntegration(openModal.type)}
          onClose={() => setOpenDef(null)}
          onSave={(creds) => handleSave(openModal, creds)}
        />
      )}

      {openModal?.connectMode === "whatsapp" && (
        <WhatsAppModal
          existing={getIntegration(openModal.type)}
          onClose={() => setOpenDef(null)}
          onSave={(creds) => handleSave(openModal, creds)}
        />
      )}

      {openModal?.connectMode === "standard" && (
        <StandardModal
          def={openModal}
          existing={getIntegration(openModal.type)}
          onClose={() => setOpenDef(null)}
          onSave={(creds) => handleSave(openModal, creds)}
        />
      )}
    </div>
  );
}
