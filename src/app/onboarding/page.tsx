"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { WILAYAS } from "@/constants/wilayas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Profil", icon: User },
  { id: 2, label: "Boutique", icon: Building2 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    phone: "",
    wilayaCode: "16",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.fullName.trim()) {
      toast.error("Entrez votre nom complet");
      return;
    }
    if (!form.businessName.trim()) {
      toast.error("Entrez le nom de votre boutique");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          businessName: form.businessName,
          phone: form.phone,
          wilayaCode: form.wilayaCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Une erreur s'est produite");
        return;
      }

      router.push("/dashboard");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">flowd</span>
        </div>
        <p className="text-muted-foreground text-sm">Configurez votre espace en 2 étapes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  step > s.id
                    ? "bg-accent text-white"
                    : step === s.id
                    ? "bg-accent text-white"
                    : "bg-white/5 text-muted-foreground"
                )}
              >
                {step > s.id ? "✓" : s.id}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  step >= s.id ? "text-white" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-12 h-px",
                  step > s.id ? "bg-accent" : "bg-white/10"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
        {/* Step 1: Personal */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-white">Bienvenue sur Flowd!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Commençons par faire connaissance.
              </p>
            </div>

            <Input
              label="Votre nom complet"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Ahmed Benali"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && form.fullName.trim()) setStep(2);
              }}
            />

            <Button
              className="w-full"
              size="lg"
              icon={<ArrowRight size={16} />}
              disabled={!form.fullName.trim()}
              onClick={() => setStep(2)}
            >
              Continuer
            </Button>
          </div>
        )}

        {/* Step 2: Business */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-white">Votre boutique</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ces informations apparaîtront dans vos commandes et livraisons.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Nom de la boutique"
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                placeholder="Ma Boutique DZ"
                autoFocus
              />
              <Input
                label="Téléphone (optionnel)"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0555 123 456"
                type="tel"
              />
              <Select
                label="Wilaya"
                value={form.wilayaCode}
                onChange={(e) => set("wilayaCode", e.target.value)}
              >
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
              <Button
                size="lg"
                className="flex-1"
                loading={loading}
                disabled={!form.businessName.trim()}
                onClick={handleSubmit}
              >
                Lancer Flowd
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Vous pourrez modifier ces informations dans les paramètres.
      </p>
    </div>
  );
}
