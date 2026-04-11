import { Badge } from "@/components/ui/Badge";
import type { OrderStatus, OrderSource } from "@/types/database";

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "success" | "warning" | "danger" | "blue" | "purple" | "orange" | "muted" }
> = {
  pending: { label: "Nouveau", variant: "warning" },
  confirmed: { label: "Confirmé", variant: "blue" },
  ready: { label: "Prêt", variant: "purple" },
  shipped: { label: "Expédié", variant: "orange" },
  delivered: { label: "Livré", variant: "success" },
  returned: { label: "Retourné", variant: "danger" },
  cancelled: { label: "Annulé", variant: "muted" },
};

const sourceConfig: Record<
  OrderSource,
  { label: string; variant: "purple" | "blue" | "success" | "orange" | "muted" | "warning" }
> = {
  manual: { label: "Manuel", variant: "muted" },
  messenger: { label: "Messenger", variant: "blue" },
  instagram: { label: "Instagram", variant: "purple" },
  shopify: { label: "Shopify", variant: "success" },
  woocommerce: { label: "WooCommerce", variant: "orange" },
  google_sheets: { label: "Google Sheets", variant: "warning" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function OrderSourceBadge({ source }: { source: OrderSource }) {
  const config = sourceConfig[source];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
