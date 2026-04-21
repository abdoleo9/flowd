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
} from "lucide-react";

const LOADING_MESSAGES = [
  "L'IA génère votre page...",
  "Optimisation pour la conversion...",
  "Finalisation...",
];

export default function LandingPagesPage() {
  const { activeWorkspace: workspace } = useWorkspace();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  // Form state
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

  // UI state
  const [analyzing, setAnalyzing] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Pages list
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    imagePreviewRef.current = imagePreview;
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    };
  }, []);

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
        const base64 = result.split(",")[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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

  async function handleGenerate() {
    if (!workspace?.id) return;
    if (!productName || !productDescription || !productPrice) {
      alert("Veuillez remplir le nom, la description et le prix");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    setGeneratedSlug(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      if (productImage) {
        const res = await toBase64(productImage);
        imageBase64 = res.base64;
        mimeType = res.mimeType;
      }

      const res = await fetch("/api/landing-pages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspace.id,
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
        }),
      });

      const data = await res.json();
      if (data.slug) {
        setGeneratedSlug(data.slug);
        fetchPages();
        // Reset form
        setProductName("");
        setProductDescription("");
        setProductPrice("");
        setProductCategory("");
        setTargetAudience("");
        setKeyBenefits("");
        setColorTheme("#2563EB");
        setProductImage(null);
        setImagePreview(null);
      } else {
        setGenerateError(data.error || "Erreur inconnue");
      }
    } catch (err) {
      setGenerateError(String(err));
    } finally {
      setGenerating(false);
    }
  }

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
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

      {/* === SECTION A: Create new page === */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <h2 className="font-semibold text-white text-lg">
          {isAr ? "إنشاء صفحة جديدة" : "Nouvelle page produit"}
        </h2>

        {/* Image upload zone */}
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

          {/* Auto-fill button */}
          {productImage && (
            <button
              onClick={handleAnalyzeImage}
              disabled={analyzing}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/40 text-accent text-sm hover:bg-accent/10 disabled:opacity-50 transition-colors"
            >
              {analyzing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                "🔍"
              )}
              {analyzing
                ? isAr ? "جارٍ التحليل..." : "Analyse en cours..."
                : isAr ? "ملء تلقائي بالذكاء الاصطناعي" : "Auto-remplir avec l'IA"}
            </button>
          )}

          {autoFillSuccess && (
            <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={15} />
              {isAr ? "تم ملء الحقول تلقائياً ✨" : "Champs remplis automatiquement ✨"}
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              {isAr ? "اسم المنتج" : "Nom du produit"} *
            </label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent"
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
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent"
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
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent resize-none"
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
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent"
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
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent"
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
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-white text-sm focus:outline-none focus:border-accent resize-none"
            placeholder={isAr ? "ميزة 1، ميزة 2، ميزة 3" : "Livraison rapide, Prix compétitif, Qualité garantie"}
          />
        </div>

        <div className="flex items-center gap-4">
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
              {(["fr", "ar"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setPageLanguage(lang)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    pageLanguage === lang
                      ? "bg-accent text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {lang === "fr" ? "FR" : "AR"}
                </button>
              ))}
            </div>
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
          ) : (
            `${isAr ? "توليد بالذكاء الاصطناعي" : "Générer avec l'IA"} ✨`
          )}
        </button>

        {/* Success banner */}
        {generatedSlug && (
          <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 size={18} />
              {isAr ? "تم توليد الصفحة بنجاح!" : "Page générée avec succès !"}
              <span className="text-green-300/70 font-mono text-xs">/p/{generatedSlug}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyLink(generatedSlug)}
                className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <Copy size={14} />
                {copied ? (isAr ? "تم النسخ!" : "Copié !") : (isAr ? "نسخ الرابط" : "Copier le lien")}
              </button>
              <a
                href={`/p/${generatedSlug}`}
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

        {generateError && (
          <p className="text-red-400 text-sm">Erreur: {generateError}</p>
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
                  <th className="pb-3 pr-4">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="pb-3">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-white">{page.product_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">/p/{page.slug}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[page.status]}`}>
                        {statusLabels[page.status]}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{page.views}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{page.orders_count}</td>
                    <td className="py-3 pr-4 text-muted-foreground text-xs">
                      {format(new Date(page.created_at), "dd/MM/yyyy")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
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
                          title={page.status === "active"
                            ? (isAr ? "إيقاف مؤقت" : "Mettre en pause")
                            : (isAr ? "تفعيل" : "Activer")}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
