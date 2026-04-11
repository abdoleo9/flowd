"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Order } from "@/types/database";
import { formatDA, formatDate } from "@/lib/utils";
import { getWilayaName } from "@/constants/wilayas";
import { OrderStatusBadge, OrderSourceBadge } from "@/components/orders/OrderStatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecentOrdersTableProps {
  orders: Order[];
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h2 className="font-semibold text-white">{t.dashboard.recentOrders}</h2>
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
        >
          {t.orders.all} <ArrowRight size={12} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t.dashboard.noOrders}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.orders.customer}</th>
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.orders.product}</th>
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.orders.wilaya}</th>
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.orders.price}</th>
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.orders.source}</th>
                <th className="text-left py-3 px-5 text-xs text-muted-foreground font-medium">{t.orders.date}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5">
                    <div>
                      <p className="text-sm font-medium text-white">{order.customer_name}</p>
                      <p className="text-xs text-muted">{order.customer_phone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <p className="text-sm text-white">{order.product_name}</p>
                    <p className="text-xs text-muted">×{order.quantity}</p>
                  </td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{getWilayaName(order.wilaya_code)}</td>
                  <td className="py-3 px-5 text-sm font-medium text-white">{formatDA(order.total_price)}</td>
                  <td className="py-3 px-5"><OrderSourceBadge source={order.source} /></td>
                  <td className="py-3 px-5"><OrderStatusBadge status={order.status} /></td>
                  <td className="py-3 px-5 text-xs text-muted-foreground">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
