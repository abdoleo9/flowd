"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";

// ─── Flowd Logo ───────────────────────────────────────────────────────────────
function FlowdLogo({ size = 34 }: { size?: number }) {
  const r = Math.round(size * 0.27);
  return (
    <div
      style={{
        width: size, height: size,
        background: "#0052FF",
        borderRadius: r,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,82,255,0.35)",
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="13" height="3.5" rx="1.2" fill="white" />
        <rect x="3" y="3" width="3.5" height="16" rx="1.2" fill="white" />
        <rect x="3" y="9.5" width="9" height="3.5" rx="1.2" fill="white" />
      </svg>
    </div>
  );
}

// ─── Nav Icons ────────────────────────────────────────────────────────────────
function NavIcon({ type, active }: { type: string; active: boolean }) {
  const c = active ? "white" : "var(--text-4)";
  const icons: Record<string, JSX.Element> = {
    grid:  <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill={c}/><rect x="10" y="1" width="7" height="7" rx="1.5" fill={c}/><rect x="1" y="10" width="7" height="7" rx="1.5" fill={c}/><rect x="10" y="10" width="7" height="7" rx="1.5" fill={c}/></svg>,
    bag:   <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M5 5V4a4 4 0 0 1 8 0v1" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><rect x="2" y="5" width="14" height="11" rx="2" stroke={c} strokeWidth="1.6"/><path d="M6 8a3 3 0 0 0 6 0" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
    chat:  <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M15 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2v3l4-3h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg>,
    plug:  <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><path d="M6 2v4M12 2v4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><rect x="3" y="6" width="12" height="4" rx="1" stroke={c} strokeWidth="1.6"/><path d="M9 10v6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><path d="M6 16h6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
    globe: <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.6"/><path d="M9 2c-2 2-3 4-3 7s1 5 3 7M9 2c2 2 3 4 3 7s-1 5-3 7" stroke={c} strokeWidth="1.6"/><path d="M2 9h14" stroke={c} strokeWidth="1.6"/></svg>,
    truck: <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="11" height="9" rx="1" stroke={c} strokeWidth="1.6"/><path d="M12 7h2.5l2.5 3v3h-5V7z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/><circle cx="4.5" cy="14.5" r="1.5" stroke={c} strokeWidth="1.4"/><circle cx="13.5" cy="14.5" r="1.5" stroke={c} strokeWidth="1.4"/></svg>,
    users: <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="7" cy="6" r="3" stroke={c} strokeWidth="1.6"/><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/><circle cx="13" cy="5" r="2.5" stroke={c} strokeWidth="1.4"/><path d="M16 16c0-2.8-1.3-5-3.5-5.5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/></svg>,
    gear:  <svg width="17" height="17" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke={c} strokeWidth="1.6"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M14.8 3.2l-1.4 1.4M4.6 13.4l-1.4 1.4" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  };
  return icons[type] ?? null;
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/dashboard",             icon: "grid",  labelKey: "dashboard" },
  { href: "/dashboard/orders",      icon: "bag",   labelKey: "orders" },
  { href: "/dashboard/chatbot",     icon: "chat",  labelKey: "chatbot" },
  { href: "/dashboard/integrations",icon: "plug",  labelKey: "integrations" },
  { href: "/dashboard/landing-pages",icon:"globe", labelKey: "landingPages" },
  { href: "/dashboard/delivery",    icon: "truck", labelKey: "delivery" },
  { href: "/dashboard/team",        icon: "users", labelKey: "team" },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { open, setOpen } = useMobileNav();
  const { activeWorkspace } = useWorkspace();

  const navLabels: Record<string, string> = {
    dashboard:    t.nav.dashboard,
    orders:       t.nav.orders,
    chatbot:      t.nav.chatbot,
    integrations: t.nav.integrations,
    landingPages: t.landingPages?.landingPages ?? "Pages Produit",
    delivery:     t.nav.delivery,
    team:         t.nav.team,
  };

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarStyle: React.CSSProperties = {
    height: "100vh",
    background: "var(--bg-sidebar)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 16px var(--shadow)",
    width: 220,
    flexShrink: 0,
  };

  const content = (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid var(--border-sub)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <FlowdLogo size={34} />
          <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", letterSpacing: -0.4 }}>Flowd</span>
          {/* Mobile close */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden btn btn-ghost btn-sq-sm"
            style={{ marginLeft: "auto", borderRadius: 8 }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="var(--text-3)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Workspace pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px" }}>
          <div style={{ width: 20, height: 20, background: "#0052FF", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "white" }}>
              {(activeWorkspace?.name ?? "M")[0].toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {activeWorkspace?.name ?? "Mon Boutique"}
          </span>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M4 5.5l3 3 3-3" stroke="var(--text-4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 11px",
                borderRadius: 10,
                marginBottom: 2,
                textDecoration: "none",
                transition: "all 0.14s",
                background: active ? "#0052FF" : "transparent",
              }}
              className={active ? "" : "hover-nav-item"}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <NavIcon type={item.icon} active={active} />
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "white" : "var(--text-3)", flex: 1 }}>
                {navLabels[item.labelKey]}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Settings + User */}
      <div style={{ padding: "8px 8px 14px", borderTop: "1px solid var(--border-sub)" }}>
        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 11px",
            borderRadius: 10,
            marginBottom: 6,
            textDecoration: "none",
            background: pathname.startsWith("/dashboard/settings") ? "#0052FF" : "transparent",
            transition: "all 0.14s",
          }}
          onMouseEnter={(e) => {
            if (!pathname.startsWith("/dashboard/settings"))
              (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            if (!pathname.startsWith("/dashboard/settings"))
              (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <NavIcon type="gear" active={pathname.startsWith("/dashboard/settings")} />
          <span style={{ fontSize: 13, fontWeight: 500, color: pathname.startsWith("/dashboard/settings") ? "white" : "var(--text-3)" }}>
            {t.nav.settings}
          </span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block" style={{ flexShrink: 0 }}>
        {content}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}
          className="md:hidden"
        >
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }}
            onClick={() => setOpen(false)}
          />
          <div style={{ position: "relative" }}>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
