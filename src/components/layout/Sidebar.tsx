"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobileNav } from "@/contexts/MobileNavContext";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Bot,
  Plug,
  Users,
  Settings,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { open, setOpen } = useMobileNav();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { href: "/dashboard/orders", icon: ShoppingBag, label: t.nav.orders },
    { href: "/dashboard/delivery", icon: Truck, label: t.nav.delivery },
    { href: "/dashboard/chatbot", icon: Bot, label: t.nav.chatbot },
    { href: "/dashboard/integrations", icon: Plug, label: t.nav.integrations },
    { href: "/dashboard/team", icon: Users, label: t.nav.team },
    { href: "/dashboard/settings", icon: Settings, label: t.nav.settings },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <aside className="w-60 flex-shrink-0 bg-sidebar border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Flowd" className="h-8 w-8 object-contain flex-shrink-0" />
          <span className="font-bold text-white text-base">Flowd</span>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white"
          onClick={() => setOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-white"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — workspace switcher */}
      <div className="border-t border-border p-4">
        <WorkspaceSwitcher />
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="relative flex h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
