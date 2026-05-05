"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LandingPage } from "@/types/database";
import { format } from "date-fns";
import {
  ImagePlus,
  X,
  ExternalLink,
  Copy,
  Pause,
  Play,
  Trash2,
  Loader2,
  CheckCircle2,
  Globe,
  Pencil,
  Eye,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";

const LOADING_MESSAGES = [
  "L'IA génère votre page...",
  "Optimisation pour la conversion...",
  "Finalisation du design...",
];

const FUNNEL_LOADING_MESSAGES_FR = [
  "🎨 Analyse de l'image produit...",
  "🖼️ Génération des visuels produit...",
  "✍️ Rédaction des textes de vente...",
  "🔧 Construction du funnel...",
  "✨ Touches finales...",
];

const FUNNEL_LOADING_MESSAGES_AR = [
  "🎨 جاري تحليل صورة المنتج...",
  "🖼️ جاري توليد صور المنتج بالذكاء الاصطناعي...",
  "✍️ جاري كتابة نصوص المبيعات...",
  "🔧 جاري بناء صفحة الفانل...",
  "✨ لمسات أخيرة...",
];

function autoSlugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type PageMode = "landing" | "funnel";

export default function LandingPagesPage() {
  const { activeWorkspace: workspace } = useWorkspace();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // Mode toggle
  const [pageMode, setPageMode] = useState<PageMode>("landing");

  // ── Shared state ──
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [pageLanguage, setPageLanguage] = useState<"fr" | "ar">("fr");

  // ── Landing mode state ──
  const [productCategory, setProductCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyBenefits, setKeyBenefits] = useState("");
  const [colorTheme, setColorTheme] = useState("#2563EB");
  const [customSlug, setCustomSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // ── Funnel mode state ──
  const [funnelOriginalPrice, setFunnelOriginalPrice] = useState("");
  const [funnelDiscountLabel, setFunnelDiscountLabel] = useState("");
  const [funnelCategory, setFunnelCategory] = useState("Electronics");
  const [funnelBenefits, setFunnelBenefits] = useState<string[]>(["", "", ""]);
  const [funnelHowItWorks, setFunnelHowItWorks] = useState(["", "", ""]);
  const [funnelUrgencyStock, setFunnelUrgencyStock] = useState("");
  const [funnelDeliveryDays, setFunnelDeliveryDays] = useState("48h");
  const [funnelDeliveryFree, setFunnelDeliveryFree] = useState(true);
  const [funnelColorPrimary, setFunnelColorPrimary] = useState("#E63946");

  // ── Edit mode ──
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);

  // ── Generate / preview state ──
  const [analyzing, setAnalyzing] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState("");
  const [previewHtmlContent, setPreviewHtmlContent] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // ── Post-publish success ──
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Pages list ──
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagePreviewRef = useRef<string | null>(null);
  const previewBlobRef = useRef<string | null>(null);

  useEffect(() => { imagePreviewRef.current = imagePreview; }, [imagePreview]);
  useEffect(() => { previewBlobRef.current = previewBlobUrl; }, [previewBlobUrl]);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current?.startsWith("blob:")) URL.revokeObjectURL(imagePreviewRef.current);
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
    };
  }, []);

  // Auto-slug from product name (landing mode only)
  useEffect(() => {
    if (pageMode === "landing" && !slugManuallyEdited) {
      setCustomSlug(autoSlugify(productName));
    }
  }, [productName, slugManuallyEdited, pageMode]);

  // Rotate loading messages
  const msgs = pageMode === "funnel"
    ? (pageLanguage === "ar" ? FUNNEL_LOADING_MESSAGES_AR : FUNNEL_LOADING_MESSAGES_FR)
    : LOADING_MESSAGES;
  const msgsInterval = pageMode === "funnel" ? 5000 : 2000;
  useEffect(() => {
    if (generating) {
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx((i) => (i + 1) % msgs.length);
      }, msgsInterval);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setLoadingMsgIdx(0);
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [generating, msgs.length, msgsInterval]);

  const fetchPages = useCallback(async () => {
    if (!workspace?.id) return;
    setLoadingPages(true);
    try {
      const res = await fetch(`/api/landing-pages?workspace_id=${workspace.id}`);
      const data = await res.json();
      setPages(data.pages || []);
    } finally {
      setLoadingPages(false);
    }
  }, [workspace?.id]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  // ──────────────────────────────────────── helpers

  function handleFileChange(file: File | null) {
    setImagePreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (!file) { setProductImage(null); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image trop grande (max 5 MB)"); return; }
    setProductImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileChange(file);
  }

  function toBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({ base64: result.split(",")[1], mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resetForm() {
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory("");
    setTargetAudience("");
    setKeyBenefits("");
    setColorTheme("#2563EB");
    setPageLanguage("fr");
    setProductImage(null);
    setImagePreview(null);
    setCustomSlug("");
    setSlugManuallyEdited(false);
    setEditingPage(null);
    setGenerateError(null);
    // funnel
    setFunnelOriginalPrice("");
    setFunnelDiscountLabel("");
    setFunnelCategory("Electronics");
    setFunnelBenefits(["", "", ""]);
    setFunnelHowItWorks(["", "", ""]);
    setFunnelUrgencyStock("");
    setFunnelDeliveryDays("48h");
    setFunnelDeliveryFree(true);
    setFunnelColorPrimary("#E63946");
  }

  function handleEditPage(page: LandingPage) {
    const cfg = page.generation_config ?? {};
    const isFunnel = cfg.mode === "funnel";
    setPageMode(isFunnel ? "funnel" : "landing");
    setProductName(page.product_name);
    setProductDescription(page.product_description);
    setProductPrice(String(page.product_price));
    setPageLanguage(cfg.language ?? "fr");
    setProductImage(null);
    setImagePreview(page.product_images?.[0] ?? null);
    setEditingPage(page);
    setPublishedSlug(null);
    setGenerateError(null);

    if (isFunnel) {
      setFunnelOriginalPrice(cfg.original_price ? String(cfg.original_price) : "");
      setFunnelDiscountLabel(cfg.discount_label ?? "");
      setFunnelCategory(cfg.product_category ?? "Electronics");
      setFunnelBenefits(cfg.funnel_key_benefits?.length ? cfg.funnel_key_benefits : ["", "", ""]);
      setFunnelHowItWorks(cfg.how_it_works?.length ? cfg.how_it_works : ["", "", ""]);
      setFunnelUrgencyStock(cfg.urgency_stock ? String(cfg.urgency_stock) : "");
      setFunnelDeliveryDays(cfg.delivery_days ?? "48h");
      setFunnelDeliveryFree(cfg.delivery_free ?? true);
      setFunnelColorPrimary(cfg.color_primary ?? "#E63946");
    } else {
      setProductCategory(cfg.product_category ?? "");
      setTargetAudience(cfg.target_audience ?? "");
      setKeyBenefits(cfg.key_benefits ?? "");
      setColorTheme(cfg.color_theme ?? "#2563EB");
      setCustomSlug(page.slug);
      setSlugManuallyEdited(true);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ──────────────────────────────────────── generate

  async function handleGenerate() {
    if (pageMode === "funnel") {
      await handleGenerateFunnel();
    } else {
      await handleGenerateLanding();
    }
  }

  async function handleGenerateLanding() {
    if (!productName || !productDescription || !productPrice) {
      alert("Veuillez remplir le nom, la description et le prix");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      const existingImageUrl =
        !productImage && imagePreview?.startsWith("http") ? imagePreview : undefined;
      if (productImage) {
        const res = await toBase64(productImage);
        imageBase64 = res.base64;
        mimeType = res.mimeType;
      }
      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          product_description: productDescription,
          product_price: parseFloat(productPrice),
          product_category: productCategory,
          target_audience: targetAudience,
          key_benefits: keyBenefits,
          color_theme: colorTheme,
          language: pageLanguage,
          imageBase64,
          mimeType,
          existing_image_url: existingImageUrl,
          custom_slug: customSlug || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setGenerateError(data.error || "Erreur de génération"); return; }
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
      const blob = new Blob([data.html_content], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(blobUrl);
      setPreviewHtmlContent(data.html_content);
      setPreviewSlug(data.slug);
      setPreviewImageUrl(data.image_url ?? null);
      setPublishError(null);
      setShowPreview(true);
    } catch (err) {
      setGenerateError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateFunnel() {
    const validBenefits = funnelBenefits.filter((b) => b.trim());
    if (!productName || !productDescription || !productPrice || !funnelCategory || validBenefits.length < 3) {
      alert("Veuillez remplir le nom, la description, le prix, la catégorie et au moins 3 avantages");
      return;
    }
    if (!workspace?.id) { alert("Workspace non trouvé"); return; }
    setGenerating(true);
    setGenerateError(null);
    try {
      let image_base64: string | undefined;
      let image_mime_type: string | undefined;
      if (productImage) {
        const res = await toBase64(productImage);
        image_base64 = res.base64;
        image_mime_type = res.mimeType;
      }
      const validHowItWorks = funnelHowItWorks.filter((s) => s.trim());
      const res = await fetch("/api/landing-pages/generate-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          product_description: productDescription,
          product_price: parseFloat(productPrice),
          original_price: funnelOriginalPrice ? parseFloat(funnelOriginalPrice) : undefined,
          discount_label: funnelDiscountLabel || undefined,
          product_category: funnelCategory,
          key_benefits: validBenefits,
          how_it_works: validHowItWorks.length === 3 ? validHowItWorks : undefined,
          urgency_stock: funnelUrgencyStock ? parseInt(funnelUrgencyStock) : undefined,
          delivery_days: funnelDeliveryDays,
          delivery_free: funnelDeliveryFree,
          language: pageLanguage,
          color_primary: funnelColorPrimary,
          image_base64,
          image_mime_type,
          workspace_id: workspace.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setGenerateError(data.error || "Erreur de génération"); return; }
      // Funnel route saves directly — show success
      setPublishedSlug(data.slug);
      resetForm();
      fetchPages();
    } catch (err) {
      setGenerateError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  // ──────────────────────────────────────── publish (landing mode)

  async function handlePublish() {
    if (!previewHtmlContent || !previewSlug) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const generation_config = {
        mode: "landing" as const,
        product_category: productCategory,
        target_audience: targetAudience,
        key_benefits: keyBenefits,
        color_theme: colorTheme,
        language: pageLanguage,
      };
      let res: Response;
      if (editingPage) {
        res = await fetch(`/api/landing-pages/${editingPage.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html_content: previewHtmlContent,
            image_url: previewImageUrl,
            product_name: productName,
            product_description: productDescription,
            product_price: parseFloat(productPrice),
            generation_config,
          }),
        });
      } else {
        res = await fetch("/api/landing-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html_content: previewHtmlContent,
            slug: previewSlug,
            image_url: previewImageUrl,
            product_name: productName,
            product_description: productDescription,
            product_price: parseFloat(productPrice),
            generation_config,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok || data.error) { setPublishError(data.error || "Erreur de publication"); return; }
      setShowPreview(false);
      if (previewBlobRef.current) { URL.revokeObjectURL(previewBlobRef.current); setPreviewBlobUrl(null); }
      setPublishedSlug(editingPage ? editingPage.slug : previewSlug);
      resetForm();
      fetchPages();
    } catch (err) {
      setPublishError(String(err));
    } finally {
      setPublishing(false);
    }
  }

  function handleCancelPreview() {
    setShowPreview(false);
    if (previewBlobRef.current) { URL.revokeObjectURL(previewBlobRef.current); setPreviewBlobUrl(null); }
    setPublishError(null);
  }

  // ──────────────────────────────────────── page actions

  async function handleStatusToggle(page: LandingPage) {
    const newStatus = page.status === "active" ? "paused" : "active";
    await fetch(`/api/landing-pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchPages();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette page ?")) return;
    await fetch(`/api/landing-pages?id=${id}`, { method: "DELETE" });
    fetchPages();
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ──────────────────────────────────────── analyze image

  async function handleAnalyzeImage() {
    if (!productImage) return;
    setAnalyzing(true);
    setAutoFillSuccess(false);
    try {
      const { base64, mimeType } = await toBase64(productImage);
      const res = await fetch("/api/landing-pages/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (data.product_name) setProductName(data.product_name);
      if (data.product_description) setProductDescription(data.product_description);
      if (pageMode === "landing") {
        if (data.product_category) setProductCategory(data.product_category);
        if (data.target_audience) setTargetAudience(data.target_audience);
        if (data.key_benefits) setKeyBenefits(data.key_benefits);
        if (data.suggested_color) setColorTheme(data.suggested_color);
      } else {
        if (data.product_category) setFunnelCategory(data.product_category);
        if (data.suggested_color) setFunnelColorPrimary(data.suggested_color);
      }
      setAutoFillSuccess(true);
      setTimeout(() => setAutoFillSuccess(false), 4000);
    } catch {
      alert("Erreur lors de l'analyse de l'image");
    } finally {
      setAnalyzing(false);
    }
  }

  // ──────────────────────────────────────── styles

  const statusColors: Record<string, string> = {
    active: "bg-green-500/15 text-green-400 border border-green-500/30",
    paused: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
    archived: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30",
  };
  const statusLabels: Record<string, string> = {
    active: isAr ? "نشط" : "Active",
    paused: isAr ? "موقوف" : "En pause",
    archived: isAr ? "مؤرشف" : "Archivé",
  };
  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent";

  const CATEGORIES = ["Electronics", "Beauty", "Kitchen", "Health", "Fashion", "Home", "Other"];

  // ══════════════════════════════════════════════════════ RENDER

  return (
    <>
      {/* Preview modal */}
      {showPreview && previewBlobUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          <div className="h-14 shrink-0 bg-[var(--bg-card)] border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Eye size={16} className="text-muted-foreground" />
              <span className="text-sm text-white font-medium">{isAr ? "معاينة" : "Aperçu"}</span>
              <span className="text-xs text-muted-foreground font-mono">/p/{previewSlug}</span>
              <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                {isAr ? "النموذج معطّل في الوضع التجريبي" : "Formulaire désactivé en aperçu"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {publishError && <span className="text-red-400 text-xs">{publishError}</span>}
              <button onClick={handleCancelPreview} className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors">
                {isAr ? "إلغاء" : "Annuler"}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg font-semibold disabled:opacity-60 transition-colors hover:bg-accent/90"
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {editingPage ? (isAr ? "تحديث الصفحة" : "Mettre à jour") : (isAr ? "نشر الصفحة" : "Publier")}
              </button>
            </div>
          </div>
          <iframe src={previewBlobUrl} className="flex-1 w-full bg-white" title="Page preview" />
        </div>
      )}

      {/* Main page */}
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Globe size={24} />
              {isAr ? "صفحات المنتج" : "Pages produit"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {isAr
                ? "أنشئ صفحات هبوط وفنلات مبيعات بالذكاء الاصطناعي"
                : "Créez des landing pages et funnels de vente avec l'IA"}
            </p>
          </div>
          {editingPage && (
            <button onClick={resetForm} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
              <ArrowLeft size={16} />
              {isAr ? "إلغاء التعديل" : "Annuler l'édition"}
            </button>
          )}
        </div>

        {/* Success banner */}
        {publishedSlug && (
          <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={18} />
              {isAr ? "تم نشر الصفحة بنجاح!" : "Page publiée avec succès !"}
              <span className="text-green-300/70 font-mono text-xs">/p/{publishedSlug}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => copyLink(publishedSlug)} className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
                <Copy size={14} />
                {copied ? (isAr ? "تم النسخ!" : "Copié !") : (isAr ? "نسخ الرابط" : "Copier le lien")}
              </button>
              <a href={`/p/${publishedSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
                <ExternalLink size={14} />
                {isAr ? "معاينة" : "Aperçu"}
              </a>
            </div>
          </div>
        )}

        {/* ═══ SECTION A: Create form ═══ */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          {/* Mode toggle (only shown when not in edit mode) */}
          {!editingPage && (
            <div>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setPageMode("landing")}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    pageMode === "landing"
                      ? "bg-accent text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  📄 {isAr ? "صفحة المنتج" : "Page Produit"}
                </button>
                <button
                  onClick={() => setPageMode("funnel")}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                    pageMode === "funnel"
                      ? "bg-[#E63946] text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  🔥 {isAr ? "فنل المبيعات" : "Funnel de Vente"}
                </button>
              </div>
              {pageMode === "funnel" && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {isAr
                    ? "صفحة مبيعات مخصصة للسوق الجزائري — تصميم داكن، RTL، فورم طلب مع جميع الولايات"
                    : "Page de vente optimisée pour le dropshipping algérien — dark mode, formulaire avec 58 wilayas"}
                </p>
              )}
            </div>
          )}

          {editingPage && (
            <h2 className="font-semibold text-white text-lg">
              {isAr ? "تعديل الصفحة وإعادة التوليد" : "Modifier et régénérer la page"}
            </h2>
          )}

          {/* Image upload (shared) */}
          <div>
            <div
              className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                imagePreview ? "border-accent/50" : "border-border hover:border-accent/50"
              } bg-white/[0.02]`}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Product preview" className="w-full h-48 object-contain rounded-xl" />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFileChange(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <ImagePlus size={32} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "اسحب صورة المنتج أو انقر للاستيراد" : "Glissez une photo de votre produit ou cliquez pour importer"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG, WebP — max 5 MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
            {productImage && (
              <button onClick={handleAnalyzeImage} disabled={analyzing}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/40 text-accent text-sm hover:bg-accent/10 disabled:opacity-50 transition-colors"
              >
                {analyzing ? <Loader2 size={15} className="animate-spin" /> : "🔍"}
                {analyzing ? (isAr ? "جارٍ التحليل..." : "Analyse en cours...") : (isAr ? "ملء تلقائي بالذكاء الاصطناعي" : "Auto-remplir avec l'IA")}
              </button>
            )}
            {autoFillSuccess && (
              <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={15} />
                {isAr ? "تم ملء الحقول تلقائياً ✨" : "Champs remplis automatiquement ✨"}
              </div>
            )}
          </div>

          {/* ── Shared fields ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{isAr ? "اسم المنتج" : "Nom du produit"} *</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} className={inputCls}
                placeholder={isAr ? "مثال: بلندر USB محمول" : "Ex: Blender USB Portable"} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{isAr ? "السعر النهائي (دج)" : "Prix final (DA)"} *</label>
              <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className={inputCls} placeholder="2500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">{isAr ? "وصف المنتج" : "Description du produit"} *</label>
            <textarea rows={3} value={productDescription} onChange={(e) => setProductDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder={isAr ? "صف منتجك بالتفصيل..." : "Décrivez votre produit en détail..."} />
          </div>

          {/* ── LANDING MODE fields ── */}
          {pageMode === "landing" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "الفئة" : "Catégorie"}</label>
                  <input value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className={inputCls}
                    placeholder={isAr ? "مثال: مستحضرات تجميل" : "Ex: Cosmétiques"} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "الفئة المستهدفة" : "Cible"}</label>
                  <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className={inputCls}
                    placeholder={isAr ? "مثال: نساء 18-35" : "Ex: Femmes 18-35"} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{isAr ? "المزايا الرئيسية" : "Avantages clés"}</label>
                <textarea rows={2} value={keyBenefits} onChange={(e) => setKeyBenefits(e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder={isAr ? "ميزة 1، ميزة 2، ميزة 3" : "Livraison rapide, Prix compétitif, Qualité garantie"} />
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "اللون الرئيسي" : "Couleur principale"}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={colorTheme} onChange={(e) => setColorTheme(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent" />
                    <span className="text-sm text-muted-foreground font-mono">{colorTheme}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "لغة الصفحة" : "Langue de la page"}</label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["fr", "ar"] as const).map((l) => (
                      <button key={l} onClick={() => setPageLanguage(l)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${pageLanguage === l ? "bg-accent text-white" : "text-muted-foreground hover:text-white"}`}>
                        {l === "fr" ? "FR 🇫🇷" : "AR 🇩🇿"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "رابط مخصص (اختياري)" : "URL personnalisée (optionnel)"}</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">/p/</span>
                    <input value={customSlug}
                      onChange={(e) => { const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""); setCustomSlug(val); setSlugManuallyEdited(true); }}
                      disabled={!!editingPage}
                      className={`${inputCls} font-mono text-xs ${editingPage ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder="mon-produit" />
                  </div>
                  {editingPage && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {isAr ? "لا يمكن تغيير الرابط بعد النشر" : "L'URL ne peut pas changer après publication"}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── FUNNEL MODE fields ── */}
          {pageMode === "funnel" && (
            <div className="space-y-5">
              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "السعر الأصلي (دج)" : "Prix original (DA)"}</label>
                  <input type="number" value={funnelOriginalPrice} onChange={(e) => setFunnelOriginalPrice(e.target.value)}
                    className={inputCls} placeholder="3500" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "علامة الخصم" : "Label de remise"}</label>
                  <input value={funnelDiscountLabel} onChange={(e) => setFunnelDiscountLabel(e.target.value)}
                    className={inputCls} placeholder={isAr ? "مثال: 30% OFF" : "Ex: 30% OFF"} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "الفئة" : "Catégorie"} *</label>
                  <select value={funnelCategory} onChange={(e) => setFunnelCategory(e.target.value)}
                    className={`${inputCls} cursor-pointer`}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Key benefits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">{isAr ? "المزايا الرئيسية" : "Avantages clés"} * (min 3)</label>
                  {funnelBenefits.length < 6 && (
                    <button onClick={() => setFunnelBenefits([...funnelBenefits, ""])}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
                      <Plus size={13} /> {isAr ? "إضافة ميزة" : "Ajouter"}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {funnelBenefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                      <input value={b} onChange={(e) => { const n = [...funnelBenefits]; n[i] = e.target.value; setFunnelBenefits(n); }}
                        className={inputCls}
                        placeholder={isAr ? `ميزة ${i + 1}` : `Avantage ${i + 1}`} />
                      {funnelBenefits.length > 3 && (
                        <button onClick={() => setFunnelBenefits(funnelBenefits.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-red-400 transition-colors">
                          <Minus size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">
                  {isAr ? "كيف يعمل؟ (اختياري — 3 خطوات)" : "Comment ça marche ? (optionnel — 3 étapes)"}
                </label>
                <div className="space-y-2">
                  {funnelHowItWorks.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#E63946] w-5 shrink-0">{i + 1}</span>
                      <input value={step} onChange={(e) => { const n = [...funnelHowItWorks]; n[i] = e.target.value; setFunnelHowItWorks(n); }}
                        className={inputCls}
                        placeholder={isAr ? `الخطوة ${i + 1}` : `Étape ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery + urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "مدة التوصيل" : "Délai livraison"} *</label>
                  <input value={funnelDeliveryDays} onChange={(e) => setFunnelDeliveryDays(e.target.value)}
                    className={inputCls} placeholder="48h" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "مخزون الاستعجال" : "Stock urgence"}</label>
                  <input type="number" value={funnelUrgencyStock} onChange={(e) => setFunnelUrgencyStock(e.target.value)}
                    className={inputCls} placeholder={isAr ? "مثال: 15" : "Ex: 15"} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={funnelDeliveryFree} onChange={(e) => setFunnelDeliveryFree(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#E63946]" />
                    <span className="text-sm text-white">{isAr ? "توصيل مجاني 🚚" : "Livraison gratuite 🚚"}</span>
                  </label>
                </div>
              </div>

              {/* Language + color */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "لغة الصفحة" : "Langue de la page"}</label>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {(["fr", "ar"] as const).map((l) => (
                      <button key={l} onClick={() => setPageLanguage(l)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${pageLanguage === l ? "bg-[#E63946] text-white" : "text-muted-foreground hover:text-white"}`}>
                        {l === "fr" ? "FR 🇫🇷" : "AR 🇩🇿"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{isAr ? "لون الزر الرئيسي" : "Couleur CTA"}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={funnelColorPrimary} onChange={(e) => setFunnelColorPrimary(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent" />
                    <span className="text-sm text-muted-foreground font-mono">{funnelColorPrimary}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleGenerate} disabled={generating}
            className={`w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors text-sm ${
              pageMode === "funnel" ? "bg-[#E63946] hover:bg-[#c8313d]" : "bg-accent hover:bg-accent/90"
            }`}
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" />{msgs[loadingMsgIdx]}</>
            ) : pageMode === "funnel" ? (
              `${isAr ? "توليد الفنل بالذكاء الاصطناعي" : "Générer le Funnel avec l'IA"} 🔥`
            ) : editingPage ? (
              `${isAr ? "إعادة التوليد بالذكاء الاصطناعي" : "Régénérer avec l'IA"} ✨`
            ) : (
              `${isAr ? "توليد بالذكاء الاصطناعي" : "Générer avec l'IA"} ✨`
            )}
          </button>

          {generateError && <p className="text-red-400 text-sm">{isAr ? "خطأ: " : "Erreur : "}{generateError}</p>}
        </div>

        {/* ═══ SECTION B: Pages list ═══ */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-white text-lg mb-4">
            {isAr ? "صفحاتي المنشورة" : "Mes pages publiées"}
            {pages.length > 0 && <span className="ml-2 text-xs text-muted-foreground font-normal">({pages.length})</span>}
          </h2>

          {loadingPages ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : pages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {isAr ? "لا توجد صفحات بعد. أنشئ أولى صفحاتك أعلاه." : "Aucune page pour l'instant. Créez votre première page ci-dessus."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-xs border-b border-border">
                    <th className="pb-3 pr-4">{isAr ? "المنتج" : "Produit"}</th>
                    <th className="pb-3 pr-4">{isAr ? "الحالة" : "Statut"}</th>
                    <th className="pb-3 pr-4">{isAr ? "المشاهدات" : "Vues"}</th>
                    <th className="pb-3 pr-4">{isAr ? "الطلبات" : "Commandes"}</th>
                    <th className="pb-3 pr-4">{isAr ? "التحويل" : "Conversion"}</th>
                    <th className="pb-3 pr-4">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="pb-3">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pages.map((page) => {
                    const convRate = page.views > 0 ? `${((page.orders_count / page.views) * 100).toFixed(1)}%` : "—";
                    const isFunnelPage = page.generation_config?.mode === "funnel";
                    return (
                      <tr key={page.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{page.product_name}</span>
                            {isFunnelPage && (
                              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/30">
                                🔥 Funnel
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">/p/{page.slug}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[page.status]}`}>
                            {statusLabels[page.status]}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{page.views}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{page.orders_count}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-medium ${page.views > 0 && page.orders_count > 0 ? "text-green-400" : "text-muted-foreground"}`}>
                            {convRate}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">{format(new Date(page.created_at), "dd/MM/yyyy")}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEditPage(page)} title={isAr ? "تعديل وإعادة التوليد" : "Modifier et régénérer"}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => copyLink(page.slug)} title={isAr ? "نسخ الرابط" : "Copier le lien"}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                              <Copy size={14} />
                            </button>
                            <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"
                              title={isAr ? "معاينة" : "Aperçu"}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                              <ExternalLink size={14} />
                            </a>
                            <button onClick={() => handleStatusToggle(page)}
                              title={page.status === "active" ? (isAr ? "إيقاف مؤقت" : "Mettre en pause") : (isAr ? "تفعيل" : "Activer")}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                              {page.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button onClick={() => handleDelete(page.id)} title={isAr ? "حذف" : "Supprimer"}
                              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
