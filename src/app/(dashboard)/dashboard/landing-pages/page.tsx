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
} from "lucide-react";

const LOADING_MESSAGES = [
  "L'IA génère votre page...",
  "Optimisation pour la conversion...",
  "Finalisation du design...",
];

function autoSlugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function LandingPagesPage() {
  const { activeWorkspace: workspace } = useWorkspace();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // --- Form state ---
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyBenefits, setKeyBenefits] = useState("");
  const [colorTheme, setColorTheme] = useState("#2563EB");
  const [pageLanguage, setPageLanguage] = useState<"fr" | "ar">("fr");
  const [customSlug, setCustomSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // --- Edit mode ---
  const [editingPage, setEditingPage] = useState<LandingPage | null>(null);

  // --- Generate / preview state ---
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

  // --- Post-publish success ---
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- Pages list ---
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Refs for cleanup
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagePreviewRef = useRef<string | null>(null);
  const previewBlobRef = useRef<string | null>(null);

  useEffect(() => { imagePreviewRef.current = imagePreview; }, [imagePreview]);
  useEffect(() => { previewBlobRef.current = previewBlobUrl; }, [previewBlobUrl]);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
    };
  }, []);

  // Auto-slug from product name (only when user hasn't manually edited it)
  useEffect(() => {
    if (!slugManuallyEdited) {
      setCustomSlug(autoSlugify(productName));
    }
  }, [productName, slugManuallyEdited]);

  // Rotate loading messages during generation
  useEffect(() => {
    if (generating) {
      loadingIntervalRef.current = setInterval(() => {
        setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setLoadingMsgIdx(0);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [generating]);

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

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // ------------------------------------------------------------------ helpers

  function handleFileChange(file: File | null) {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (!file) {
      setProductImage(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image trop grande (max 5 MB)");
      return;
    }
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
  }

  function handleEditPage(page: LandingPage) {
    const cfg = page.generation_config ?? {};
    setProductName(page.product_name);
    setProductDescription(page.product_description);
    setProductPrice(String(page.product_price));
    setProductCategory(cfg.product_category ?? "");
    setTargetAudience(cfg.target_audience ?? "");
    setKeyBenefits(cfg.key_benefits ?? "");
    setColorTheme(cfg.color_theme ?? "#2563EB");
    setPageLanguage(cfg.language ?? "fr");
    setProductImage(null);
    setImagePreview(page.product_images?.[0] ?? null);
    setCustomSlug(page.slug);
    setSlugManuallyEdited(true); // keep slug locked while editing
    setEditingPage(page);
    setPublishedSlug(null);
    setGenerateError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------------------------------------------------------------- generate

  async function handleGenerate() {
    if (!productName || !productDescription || !productPrice) {
      alert("Veuillez remplir le nom, la description et le prix");
      return;
    }
    setGenerating(true);
    setGenerateError(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      // In edit mode, productImage is null but imagePreview may be an existing CDN URL
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
      if (!res.ok || data.error) {
        setGenerateError(data.error || "Erreur de génération");
        return;
      }

      // Open preview
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

  // ---------------------------------------------------------------- publish

  async function handlePublish() {
    if (!previewHtmlContent || !previewSlug) return;
    setPublishing(true);
    setPublishError(null);

    try {
      const generation_config = {
        product_category: productCategory,
        target_audience: targetAudience,
        key_benefits: keyBenefits,
        color_theme: colorTheme,
        language: pageLanguage,
      };

      let res: Response;
      if (editingPage) {
        // Update existing page
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
        // Create new page
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
      if (!res.ok || data.error) {
        setPublishError(data.error || "Erreur de publication");
        return;
      }

      setShowPreview(false);
      if (previewBlobRef.current) {
        URL.revokeObjectURL(previewBlobRef.current);
        setPreviewBlobUrl(null);
      }
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
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current);
      setPreviewBlobUrl(null);
    }
    setPublishError(null);
  }

  // ---------------------------------------------------------------- page actions

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

  // ---------------------------------------------------------------- analyze image

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
      if (data.product_category) setProductCategory(data.product_category);
      if (data.target_audience) setTargetAudience(data.target_audience);
      if (data.key_benefits) setKeyBenefits(data.key_benefits);
      if (data.suggested_color) setColorTheme(data.suggested_color);
      setAutoFillSuccess(true);
      setTimeout(() => setAutoFillSuccess(false), 4000);
    } catch {
      alert("Erreur lors de l'analyse de l'image");
    } finally {
      setAnalyzing(false);
    }
  }

  // ---------------------------------------------------------------- styles

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

  // ================================================================ RENDER

  return (
    <>
      {/* ── Preview modal ── */}
      {showPreview && previewBlobUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
          {/* Header */}
          <div className="h-14 shrink-0 bg-[var(--bg-card)] border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Eye size={16} className="text-muted-foreground" />
              <span className="text-sm text-white font-medium">
                {isAr ? "معاينة" : "Aperçu"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                /p/{previewSlug}
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                {isAr ? "النموذج معطّل في الوضع التجريبي" : "Formulaire désactivé en aperçu"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {publishError && (
                <span className="text-red-400 text-xs">{publishError}</span>
              )}
              <button
                onClick={handleCancelPreview}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {isAr ? "إلغاء" : "Annuler"}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg font-semibold disabled:opacity-60 transition-colors hover:bg-accent/90"
              >
                {publishing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {editingPage
                  ? (isAr ? "تحديث الصفحة" : "Mettre à jour")
                  : (isAr ? "نشر الصفحة" : "Publier")}
              </button>
            </div>
          </div>
          {/* iframe */}
          <iframe
            src={previewBlobUrl}
            className="flex-1 w-full bg-white"
            title="Page preview"
          />
        </div>
      )}

      {/* ── Main page ── */}
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
                ? "أنشئ صفحات هبوط احترافية لمنتجاتك بالذكاء الاصطناعي"
                : "Créez des landing pages professionnelles pour vos produits avec l'IA"}
            </p>
          </div>
          {editingPage && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              {isAr ? "إلغاء التعديل" : "Annuler l'édition"}
            </button>
          )}
        </div>

        {/* Success banner (shown after publish) */}
        {publishedSlug && (
          <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={18} />
              {editingPage
                ? (isAr ? "تم تحديث الصفحة بنجاح!" : "Page mise à jour avec succès !")
                : (isAr ? "تم نشر الصفحة بنجاح!" : "Page publiée avec succès !")}
              <span className="text-green-300/70 font-mono text-xs">
                /p/{publishedSlug}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyLink(publishedSlug)}
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <Copy size={14} />
                {copied
                  ? (isAr ? "تم النسخ!" : "Copié !")
                  : (isAr ? "نسخ الرابط" : "Copier le lien")}
              </button>
              <a
                href={`/p/${publishedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <ExternalLink size={14} />
                {isAr ? "معاينة" : "Aperçu"}
              </a>
            </div>
          </div>
        )}

        {/* === SECTION A: Create / Edit form === */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <h2 className="font-semibold text-white text-lg">
            {editingPage
              ? (isAr ? "تعديل الصفحة وإعادة التوليد" : "Modifier et régénérer la page")
              : (isAr ? "إنشاء صفحة جديدة" : "Nouvelle page produit")}
          </h2>

          {/* Image upload */}
          <div>
            <div
              className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer
                ${imagePreview ? "border-accent/50" : "border-border hover:border-accent/50"}
                bg-white/[0.02]`}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-48 object-contain rounded-xl"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileChange(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <ImagePlus size={32} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? "اسحب صورة المنتج أو انقر للاستيراد"
                      : "Glissez une photo de votre produit ou cliquez pour importer"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    JPEG, PNG, WebP — max 5 MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            {productImage && (
              <button
                onClick={handleAnalyzeImage}
                disabled={analyzing}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/40 text-accent text-sm hover:bg-accent/10 disabled:opacity-50 transition-colors"
              >
                {analyzing ? <Loader2 size={15} className="animate-spin" /> : "🔍"}
                {analyzing
                  ? (isAr ? "جارٍ التحليل..." : "Analyse en cours...")
                  : (isAr ? "ملء تلقائي بالذكاء الاصطناعي" : "Auto-remplir avec l'IA")}
              </button>
            )}
            {autoFillSuccess && (
              <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 size={15} />
                {isAr ? "تم ملء الحقول تلقائياً ✨" : "Champs remplis automatiquement ✨"}
              </div>
            )}
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "اسم المنتج" : "Nom du produit"} *
              </label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={inputCls}
                placeholder={isAr ? "مثال: كريم مرطب" : "Ex: Crème hydratante"}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "السعر (دج)" : "Prix (DA)"} *
              </label>
              <input
                type="number"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                className={inputCls}
                placeholder="1500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {isAr ? "وصف المنتج" : "Description du produit"} *
            </label>
            <textarea
              rows={3}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder={isAr ? "صف منتجك بالتفصيل..." : "Décrivez votre produit en détail..."}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "الفئة" : "Catégorie"}
              </label>
              <input
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className={inputCls}
                placeholder={isAr ? "مثال: مستحضرات تجميل" : "Ex: Cosmétiques"}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "الفئة المستهدفة" : "Cible"}
              </label>
              <input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className={inputCls}
                placeholder={isAr ? "مثال: نساء 18-35" : "Ex: Femmes 18-35"}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {isAr ? "المزايا الرئيسية" : "Avantages clés"}
            </label>
            <textarea
              rows={2}
              value={keyBenefits}
              onChange={(e) => setKeyBenefits(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder={
                isAr ? "ميزة 1، ميزة 2، ميزة 3" : "Livraison rapide, Prix compétitif, Qualité garantie"
              }
            />
          </div>

          {/* Color + language + slug */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "اللون الرئيسي" : "Couleur principale"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <span className="text-sm text-muted-foreground font-mono">{colorTheme}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "لغة الصفحة" : "Langue de la page"}
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["fr", "ar"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setPageLanguage(l)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      pageLanguage === l
                        ? "bg-accent text-white"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {l === "fr" ? "FR" : "AR"}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom slug */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted-foreground mb-1">
                {isAr ? "رابط مخصص (اختياري)" : "URL personnalisée (optionnel)"}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">/p/</span>
                <input
                  value={customSlug}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    setCustomSlug(val);
                    setSlugManuallyEdited(true);
                  }}
                  disabled={!!editingPage}
                  className={`${inputCls} font-mono text-xs ${editingPage ? "opacity-50 cursor-not-allowed" : ""}`}
                  placeholder="mon-produit"
                />
              </div>
              {editingPage && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {isAr ? "لا يمكن تغيير الرابط بعد النشر" : "L'URL ne peut pas changer après publication"}
                </p>
              )}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors text-sm"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {LOADING_MESSAGES[loadingMsgIdx]}
              </>
            ) : editingPage ? (
              `${isAr ? "إعادة التوليد بالذكاء الاصطناعي" : "Régénérer avec l'IA"} ✨`
            ) : (
              `${isAr ? "توليد بالذكاء الاصطناعي" : "Générer avec l'IA"} ✨`
            )}
          </button>

          {generateError && (
            <p className="text-red-400 text-sm">
              {isAr ? "خطأ: " : "Erreur : "}{generateError}
            </p>
          )}
        </div>

        {/* === SECTION B: My pages === */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-white text-lg mb-4">
            {isAr ? "صفحاتي المنشورة" : "Mes pages publiées"}
            {pages.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({pages.length})
              </span>
            )}
          </h2>

          {loadingPages ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : pages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {isAr
                ? "لا توجد صفحات بعد. أنشئ أولى صفحاتك أعلاه."
                : "Aucune page pour l'instant. Créez votre première page ci-dessus."}
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
                    const convRate =
                      page.views > 0
                        ? `${((page.orders_count / page.views) * 100).toFixed(1)}%`
                        : "—";
                    return (
                      <tr key={page.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-white">{page.product_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            /p/{page.slug}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[page.status]}`}
                          >
                            {statusLabels[page.status]}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{page.views}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{page.orders_count}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-xs font-medium ${
                              page.views > 0 && page.orders_count > 0
                                ? "text-green-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {convRate}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground text-xs">
                          {format(new Date(page.created_at), "dd/MM/yyyy")}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditPage(page)}
                              title={isAr ? "تعديل وإعادة التوليد" : "Modifier et régénérer"}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => copyLink(page.slug)}
                              title={isAr ? "نسخ الرابط" : "Copier le lien"}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            >
                              <Copy size={14} />
                            </button>
                            <a
                              href={`/p/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={isAr ? "معاينة" : "Aperçu"}
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button
                              onClick={() => handleStatusToggle(page)}
                              title={
                                page.status === "active"
                                  ? (isAr ? "إيقاف مؤقت" : "Mettre en pause")
                                  : (isAr ? "تفعيل" : "Activer")
                              }
                              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            >
                              {page.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button
                              onClick={() => handleDelete(page.id)}
                              title={isAr ? "حذف" : "Supprimer"}
                              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            >
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
