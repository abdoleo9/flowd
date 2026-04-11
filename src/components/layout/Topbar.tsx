"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LogOut, Bell, Globe, Menu } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  title?: string;
}

export function Topbar({ userName, userEmail, title }: TopbarProps) {
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();
  const { toggle } = useMobileNav();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    toast.success(lang === "ar" ? "تم تسجيل الخروج" : lang === "en" ? "Signed out" : "Déconnexion réussie");
    router.push("/login");
    router.refresh();
  }

  const displayName = userName || userEmail || "Utilisateur";
  const initials = getInitials(displayName);
  const currentLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <header className="h-14 border-b border-border bg-sidebar/50 backdrop-blur px-3 md:px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
        >
          <Menu size={18} />
        </button>
        {title && <h1 className="text-sm font-semibold text-white">{title}</h1>}
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Notifications */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
          title={t.topbar.notifications}
        >
          <Bell size={16} />
        </button>

        {/* Language switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-2 md:px-2.5 rounded-lg text-xs font-medium transition-colors",
              langOpen ? "bg-white/10 text-white" : "hover:bg-white/5 text-muted-foreground hover:text-white"
            )}
            title={t.topbar.language}
          >
            <Globe size={15} />
            <span className="hidden sm:block">{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
          </button>

          {langOpen && (
            <div className="absolute top-11 right-0 z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[150px]">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as Language); setLangOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left",
                    lang === l.code
                      ? "text-accent bg-accent/10"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {lang === l.code && <span className="ml-auto text-accent text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm text-white hidden lg:block truncate max-w-[120px]">
            {displayName}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-danger transition-colors"
          title={t.topbar.signOut}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
