"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getInitials, formatDA } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Language } from "@/lib/i18n";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
}

const PAGE_LABELS: Record<string, string> = {
  "/dashboard":              "Tableau de bord",
  "/dashboard/orders":       "Commandes",
  "/dashboard/chatbot":      "Chatbot IA",
  "/dashboard/integrations": "Intégrations",
  "/dashboard/landing-pages":"Pages Produit",
  "/dashboard/delivery":     "Livraison",
  "/dashboard/team":         "Équipe",
  "/dashboard/settings":     "Paramètres",
};

// ─── Dark mode hook ───────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("flowd-theme");
    const isDark = stored !== "light";
    setDark(isDark);
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("flowd-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("flowd-theme", "light");
    }
  }

  return { dark, toggle };
}

// ─── Search types ─────────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  type: "order" | "conversation" | "parcel";
  title: string;
  subtitle: string;
  href: string;
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
export function Topbar({ userName, userEmail }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const { toggle: toggleNav } = useMobileNav();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { activeWorkspace } = useWorkspace();

  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close all dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Live search with debounce
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || !activeWorkspace?.id) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    setSearchOpen(true);
    const supabase = getSupabaseBrowserClient();
    const wid = activeWorkspace.id;

    const [{ data: orders }, { data: convs }, { data: parcels }] = await Promise.all([
      supabase.from("orders").select("id,customer_name,product_name,total_price,status")
        .eq("workspace_id", wid)
        .or(`customer_name.ilike.%${q}%,product_name.ilike.%${q}%`)
        .limit(4),
      supabase.from("conversations").select("id,customer_name,channel,status")
        .eq("workspace_id", wid)
        .ilike("customer_name", `%${q}%`)
        .limit(3),
      supabase.from("delivery_parcels").select("id,recipient_name,tracking_number,carrier")
        .eq("workspace_id", wid)
        .or(`recipient_name.ilike.%${q}%,tracking_number.ilike.%${q}%`)
        .limit(3),
    ]);

    const results: SearchResult[] = [
      ...(orders ?? []).map((o: { id: string; customer_name: string | null; product_name: string | null; total_price: number | null; status: string }) => ({
        id: o.id, type: "order" as const,
        title: o.customer_name ?? "—",
        subtitle: `${o.product_name} · ${formatDA(o.total_price ?? 0)}`,
        href: "/dashboard/orders",
      })),
      ...(convs ?? []).map((c: { id: string; customer_name: string | null; channel: string; status: string }) => ({
        id: c.id, type: "conversation" as const,
        title: c.customer_name ?? "—",
        subtitle: `Chatbot · ${c.channel}`,
        href: "/dashboard/chatbot",
      })),
      ...(parcels ?? []).map((p: { id: string; recipient_name: string | null; tracking_number: string | null; carrier: string | null }) => ({
        id: p.id, type: "parcel" as const,
        title: p.recipient_name ?? "—",
        subtitle: `${p.tracking_number} · ${p.carrier}`,
        href: "/dashboard/delivery",
      })),
    ];

    setSearchResults(results);
    setSearchLoading(false);
  }, [activeWorkspace?.id]);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    debounceRef.current = setTimeout(() => runSearch(value), 280);
  }

  function handleResultClick(href: string) {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    toast.success(lang === "ar" ? "تم تسجيل الخروج" : "Déconnexion réussie");
    router.push("/login");
    router.refresh();
  }

  const displayName = userName || userEmail || "Utilisateur";
  const initials = getInitials(displayName);
  const pageLabel = PAGE_LABELS[pathname] ?? "Flowd";

  const btnStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 9,
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "transparent",
    color: "var(--text-3)",
    transition: "all 0.14s",
    flexShrink: 0,
  };

  const typeIcon: Record<string, string> = {
    order: "🛍️",
    conversation: "💬",
    parcel: "📦",
  };

  return (
    <header
      style={{
        height: 56,
        background: "var(--bg-topbar)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 1px 8px var(--shadow)",
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Hamburger — mobile */}
      <button
        className="md:hidden"
        onClick={toggleNav}
        style={{ ...btnStyle }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* Breadcrumb — desktop */}
      <div className="hidden md:flex" style={{ alignItems: "center", gap: 6, minWidth: 180 }}>
        <span style={{ fontSize: 12, color: "var(--text-4)" }}>Flowd</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="var(--text-5)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{pageLabel}</span>
      </div>

      {/* Search — desktop */}
      <div ref={searchRef} className="hidden md:block" style={{ flex: 1, maxWidth: 360, margin: "0 16px", position: "relative" }}>
        <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }}>
          {searchLoading ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" stroke="var(--text-4)" strokeWidth="2" strokeDasharray="32" strokeDashoffset="8" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="var(--text-4)" strokeWidth="1.5" />
              <path d="m11 11 3 3" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <input
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => { if (searchResults.length) setSearchOpen(true); }}
          placeholder="Rechercher commandes, clients, colis…"
          className="flowd-input"
          style={{
            width: "100%", height: 34,
            background: "var(--bg-input)",
            border: "1.5px solid var(--border)",
            borderRadius: 9,
            paddingLeft: 30, paddingRight: 12,
            fontSize: 12.5,
            color: "var(--text-1)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Search dropdown */}
        {searchOpen && (
          <div style={{
            position: "absolute", top: 40, left: 0, right: 0, zIndex: 200,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 8px 32px var(--shadow-lg)",
            overflow: "hidden",
          }}>
            {searchResults.length === 0 && !searchLoading ? (
              <div style={{ padding: "20px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "var(--text-4)", margin: 0 }}>
                  Aucun résultat pour &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result.href)}
                    style={{
                      width: "100%", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      background: "transparent", border: "none",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-sub)",
                      transition: "background 0.1s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcon[result.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.title}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {result.subtitle}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-5)", background: "var(--bg-input)", padding: "2px 7px", borderRadius: 20, flexShrink: 0, textTransform: "capitalize" }}>
                      {result.type === "order" ? "Commande" : result.type === "conversation" ? "Chat" : "Colis"}
                    </span>
                  </button>
                ))}
                <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 11, color: "var(--text-5)", margin: 0 }}>
                    {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""} — cliquez pour accéder
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer — mobile */}
      <div className="md:hidden" style={{ flex: 1 }} />

      {/* Right group */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Language switcher */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: 2, gap: 1 }}>
            {(["FR", "EN", "AR"] as const).map((l) => {
              const code = l.toLowerCase() as Language;
              const active = lang === code;
              return (
                <button
                  key={l}
                  onClick={() => setLang(code)}
                  style={{
                    background: active ? "#0052FF" : "transparent",
                    color: active ? "white" : "var(--text-3)",
                    border: "none", borderRadius: 6,
                    minWidth: 28, height: 24, fontSize: 10.5,
                    fontWeight: active ? 700 : 500,
                    padding: "0 7px", cursor: "pointer",
                    transition: "all 0.14s", fontFamily: "inherit",
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          style={{ ...btnStyle }}
          title={dark ? "Mode clair" : "Mode sombre"}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
        >
          {dark ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.2 3.2l1 1M11.8 11.8l1 1M12.8 3.2l-1 1M4.2 11.8l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 9A6 6 0 0 1 7 2.5a6 6 0 1 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            style={{ ...btnStyle, background: notifOpen ? "var(--bg-hover)" : "transparent", color: notifOpen ? "var(--text-1)" : "var(--text-3)" }}
            title={t.topbar.notifications}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; }}
            onMouseLeave={(e) => { if (!notifOpen) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; } }}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 0 0-6 6v3l-2 2v1h16v-1l-2-2V8a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "#EF4444", borderRadius: "50%", border: "2px solid var(--bg-topbar)", pointerEvents: "none" }} />

          {notifOpen && (
            <div style={{
              position: "absolute", top: 44, right: 0, zIndex: 100,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 14, boxShadow: "0 8px 32px var(--shadow-lg)", width: 320,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{t.topbar.notifications}</span>
                <button style={{ fontSize: 11, color: "#0052FF", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  Tout marquer lu
                </button>
              </div>
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2a6 6 0 0 0-6 6v3l-2 2v1h16v-1l-2-2V8a6 6 0 0 0-6-6z" stroke="var(--text-4)" strokeWidth="1.6" />
                    <path d="M8 17a2 2 0 0 0 4 0" stroke="var(--text-4)" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)", margin: 0 }}>Aucune notification</p>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 4 }}>Vous êtes à jour ✓</p>
              </div>
            </div>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            onClick={() => setUserOpen((o) => !o)}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg,#0052FF,#6B9FFF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 2px 6px rgba(0,82,255,0.3)",
              border: "none", flexShrink: 0,
            }}
            title={displayName}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>{initials}</span>
          </button>

          {userOpen && (
            <div style={{
              position: "absolute", top: 40, right: 0, zIndex: 100,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 12, boxShadow: "0 8px 32px var(--shadow-lg)",
              minWidth: 180, padding: "6px 0",
            }}>
              <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{displayName}</div>
                {userEmail && <div style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1 }}>{userEmail}</div>}
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  width: "100%", textAlign: "left", padding: "9px 14px",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: 13, color: "#EF4444",
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "inherit", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M13 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M8 15l5-5-5-5M13 10H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t.topbar.signOut}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  );
}
