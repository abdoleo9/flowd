"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (searchParams.get("tab") === "signup") setMode("signup");
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = getSupabaseBrowserClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      // Auto sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.success("Compte créé! Connectez-vous.");
        setMode("login");
        setLoading(false);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex bg-background rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === "login"
              ? "bg-card text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === "signup"
              ? "bg-card text-white shadow-sm"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          Créer un compte
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="vous@exemple.com"
            className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-1.5">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
            className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-muted outline-none focus:border-accent transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors mt-2"
        >
          {loading
            ? mode === "signup" ? "Création en cours…" : "Connexion en cours…"
            : mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
