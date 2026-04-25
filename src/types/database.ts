export type TeamRole = "owner" | "admin" | "confirmer" | "agent";
export type OrderStatus = "pending" | "confirmed" | "ready" | "shipped" | "delivered" | "returned" | "cancelled";
export type OrderSource = "manual" | "messenger" | "instagram" | "shopify" | "woocommerce" | "google_sheets";
export type ConversationStatus = "open" | "resolved" | "bot" | "human_takeover";
export type ConversationChannel = "messenger" | "instagram" | "web" | "manual";
export type MessageRole = "user" | "assistant" | "system";
export type ParcelStatus = "pending_pickup" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed_attempt" | "returned_to_sender" | "lost";
export type IntegrationType = "messenger" | "instagram" | "whatsapp" | "shopify" | "woocommerce" | "google_sheets" | "yalidine" | "zr_express" | "maystro" | "eddyapp";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  chatbot_config: {
    persona: string;
    language_mode: "auto" | "darija" | "french" | "english";
    greeting: string;
    order_instructions: string;
    languages: {
      darija: boolean;
      french: boolean;
      english: boolean;
      arabic: boolean;
    };
  };
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string | null;
  joined_at: string;
  user?: User;
}

export interface Order {
  id: string;
  workspace_id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  wilaya_code: number;
  commune: string | null;
  address: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  source: OrderSource;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  channel: ConversationChannel;
  external_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_ig_handle: string | null;
  wilaya_code: number | null;
  status: ConversationStatus;
  assigned_to: string | null;
  order_id: string | null;
  language_detected: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Integration {
  id: string;
  workspace_id: string;
  type: IntegrationType;
  label: string | null;
  credentials: Record<string, string>;
  is_active: boolean;
  last_synced_at: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface LandingPage {
  id: string;
  workspace_id: string;
  slug: string;
  product_name: string;
  product_description: string;
  product_price: number;
  product_images: string[];
  html_content: string;
  status: 'active' | 'paused' | 'archived';
  views: number;
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryParcel {
  id: string;
  workspace_id: string;
  order_id: string | null;
  tracking_number: string;
  carrier: string;
  status: ParcelStatus;
  wilaya_code: number | null;
  commune: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  cod_amount: number | null;
  status_history: Array<{ status: string; timestamp: string; note?: string }>;
  carrier_raw: Record<string, unknown>;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}
