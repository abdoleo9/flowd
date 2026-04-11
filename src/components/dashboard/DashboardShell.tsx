"use client";

import { ShoppingBag, Banknote, Truck, RotateCcw } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { RecentOrdersTable } from "./RecentOrdersTable";
import { DeliveryPanel } from "./DeliveryPanel";
import { ChatbotFeed } from "./ChatbotFeed";
import { formatDA } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Order, DeliveryParcel, Conversation } from "@/types/database";

interface Props {
  totalOrders: number;
  totalRevenue: number;
  deliveryRate: number;
  returnRate: number;
  recentOrders: Order[];
  parcels: DeliveryParcel[];
  conversations: Conversation[];
}

export function DashboardShell({
  totalOrders,
  totalRevenue,
  deliveryRate,
  returnRate,
  recentOrders,
  parcels,
  conversations,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{t.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t.dashboard.title === "Dashboard"
            ? "Overview of your activity"
            : t.dashboard.title === "لوحة التحكم"
            ? "نظرة عامة على نشاطك"
            : "Vue d'ensemble de votre activité"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title={t.dashboard.totalOrders}
          value={totalOrders.toString()}
          icon={<ShoppingBag size={18} className="text-accent" />}
          accentColor="bg-accent"
        />
        <MetricCard
          title={t.dashboard.revenue}
          value={formatDA(totalRevenue)}
          icon={<Banknote size={18} className="text-success" />}
          accentColor="bg-success"
        />
        <MetricCard
          title={t.dashboard.deliveryRate}
          value={`${deliveryRate}%`}
          icon={<Truck size={18} className="text-orange" />}
          accentColor="bg-orange"
        />
        <MetricCard
          title={t.dashboard.returnRate}
          value={`${returnRate}%`}
          icon={<RotateCcw size={18} className="text-danger" />}
          accentColor="bg-danger"
        />
      </div>

      <RecentOrdersTable orders={recentOrders} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryPanel parcels={parcels} />
        <ChatbotFeed conversations={conversations} />
      </div>
    </div>
  );
}
