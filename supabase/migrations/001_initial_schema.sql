-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- WORKSPACES
-- =============================================
create table workspaces (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  logo_url      text,
  phone         text,
  wilaya_code   smallint,
  email         text,
  chatbot_config jsonb default '{
    "persona": "Assistant sympathique pour e-commerce algérien",
    "language_mode": "auto",
    "greeting": "Marhba! Kifach naaounek?",
    "order_instructions": "Demande le nom complet, numéro de téléphone, wilaya et adresse, puis confirme la commande.",
    "languages": {"darija": true, "french": true, "english": true, "arabic": false}
  }'::jsonb,
  notifications  jsonb default '{
    "new_order": true,
    "handoff": true,
    "delivery_updates": true,
    "integration_errors": true
  }'::jsonb,
  created_at    timestamptz default now()
);

-- =============================================
-- USERS (extends Supabase auth.users)
-- =============================================
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  created_at    timestamptz default now()
);

-- =============================================
-- TEAM MEMBERS
-- =============================================
create type team_role as enum ('owner', 'admin', 'confirmer', 'agent');

create table team_members (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  role          team_role not null default 'agent',
  invited_by    uuid references users(id),
  joined_at     timestamptz default now(),
  unique(workspace_id, user_id)
);

-- =============================================
-- ORDERS
-- =============================================
create type order_status as enum (
  'pending', 'confirmed', 'ready', 'shipped', 'delivered', 'returned', 'cancelled'
);
create type order_source as enum (
  'manual', 'messenger', 'instagram', 'shopify', 'woocommerce', 'google_sheets'
);

create table orders (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  reference       text not null,
  customer_name   text not null,
  customer_phone  text not null,
  wilaya_code     smallint not null check (wilaya_code between 1 and 58),
  commune         text,
  address         text,
  product_name    text not null,
  quantity        integer not null default 1,
  unit_price      numeric(12,2) not null,
  total_price     numeric(12,2) generated always as (quantity * unit_price) stored,
  status          order_status not null default 'pending',
  source          order_source not null default 'manual',
  notes           text,
  created_by      uuid references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index orders_workspace_id_idx on orders(workspace_id);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- Auto-generate order reference
create or replace function generate_order_reference()
returns trigger as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'ORD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_ref_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create sequence order_ref_seq;
create trigger orders_reference before insert on orders
  for each row execute function generate_order_reference();

-- =============================================
-- CONVERSATIONS
-- =============================================
create type conversation_channel as enum ('messenger', 'instagram', 'web', 'manual');
create type conversation_status as enum ('open', 'resolved', 'bot', 'human_takeover');

create table conversations (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  channel             conversation_channel not null default 'web',
  external_id         text,
  customer_name       text,
  customer_phone      text,
  customer_ig_handle  text,
  wilaya_code         smallint,
  status              conversation_status not null default 'bot',
  assigned_to         uuid references users(id),
  order_id            uuid references orders(id),
  language_detected   text default 'auto',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index conversations_workspace_id_idx on conversations(workspace_id);
create trigger conversations_updated_at before update on conversations
  for each row execute function update_updated_at();

-- =============================================
-- MESSAGES
-- =============================================
create type message_role as enum ('user', 'assistant', 'system');

create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            message_role not null,
  content         text not null,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

create index messages_conversation_id_idx on messages(conversation_id);

-- =============================================
-- INTEGRATIONS
-- =============================================
create type integration_type as enum (
  'messenger', 'instagram', 'shopify', 'woocommerce',
  'google_sheets', 'yalidine', 'zr_express', 'maystro', 'eddyapp'
);

create table integrations (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  type            integration_type not null,
  label           text,
  credentials     jsonb not null default '{}'::jsonb,
  is_active       boolean default false,
  last_synced_at  timestamptz,
  created_at      timestamptz default now(),
  unique(workspace_id, type)
);

-- =============================================
-- DELIVERY PARCELS
-- =============================================
create type parcel_status as enum (
  'pending_pickup', 'picked_up', 'in_transit',
  'out_for_delivery', 'delivered', 'failed_attempt',
  'returned_to_sender', 'lost'
);

create table delivery_parcels (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  order_id        uuid references orders(id),
  tracking_number text not null,
  carrier         text not null,
  status          parcel_status not null default 'pending_pickup',
  wilaya_code     smallint,
  commune         text,
  recipient_name  text,
  recipient_phone text,
  cod_amount      numeric(12,2),
  status_history  jsonb default '[]'::jsonb,
  carrier_raw     jsonb default '{}'::jsonb,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index delivery_parcels_workspace_id_idx on delivery_parcels(workspace_id);
create index delivery_parcels_tracking_idx on delivery_parcels(tracking_number);
create trigger delivery_parcels_updated_at before update on delivery_parcels
  for each row execute function update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table workspaces enable row level security;
alter table users enable row level security;
alter table team_members enable row level security;
alter table orders enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table integrations enable row level security;
alter table delivery_parcels enable row level security;

-- Helper: is current user a member of a workspace?
create or replace function is_workspace_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from team_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$ language sql security definer;

-- Helper: get user's role in a workspace
create or replace function workspace_role(ws_id uuid)
returns team_role as $$
  select role from team_members
  where workspace_id = ws_id and user_id = auth.uid();
$$ language sql security definer;

-- Workspace policies
create policy "members can read their workspace"
  on workspaces for select using (is_workspace_member(id));
create policy "owners and admins can update workspace"
  on workspaces for update using (workspace_role(id) in ('owner', 'admin'));

-- Users policies
create policy "users can read their own profile"
  on users for select using (auth.uid() = id);
create policy "users can update their own profile"
  on users for update using (auth.uid() = id);
create policy "workspace members can read each other"
  on users for select using (
    exists (
      select 1 from team_members tm1
      join team_members tm2 on tm1.workspace_id = tm2.workspace_id
      where tm1.user_id = auth.uid() and tm2.user_id = id
    )
  );

-- Team members policies
create policy "members can read their workspace team"
  on team_members for select using (is_workspace_member(workspace_id));
create policy "owners and admins can manage team"
  on team_members for all using (workspace_role(workspace_id) in ('owner', 'admin'));

-- Orders policies
create policy "members can read orders"
  on orders for select using (is_workspace_member(workspace_id));
create policy "confirmers and above can insert orders"
  on orders for insert with check (
    workspace_role(workspace_id) in ('owner', 'admin', 'confirmer')
  );
create policy "confirmers and above can update orders"
  on orders for update using (
    workspace_role(workspace_id) in ('owner', 'admin', 'confirmer')
  );

-- Conversations policies
create policy "members can read conversations"
  on conversations for select using (is_workspace_member(workspace_id));
create policy "members can insert conversations"
  on conversations for insert with check (is_workspace_member(workspace_id));
create policy "members can update conversations"
  on conversations for update using (is_workspace_member(workspace_id));

-- Messages policies
create policy "members can read messages"
  on messages for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and is_workspace_member(c.workspace_id)
    )
  );
create policy "members can insert messages"
  on messages for insert with check (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and is_workspace_member(c.workspace_id)
    )
  );

-- Integrations policies
create policy "members can read integrations"
  on integrations for select using (is_workspace_member(workspace_id));
create policy "owners and admins can manage integrations"
  on integrations for all using (workspace_role(workspace_id) in ('owner', 'admin'));

-- Delivery parcels policies
create policy "members can read parcels"
  on delivery_parcels for select using (is_workspace_member(workspace_id));
create policy "confirmers and above can manage parcels"
  on delivery_parcels for all using (
    workspace_role(workspace_id) in ('owner', 'admin', 'confirmer')
  );

-- =============================================
-- REALTIME
-- Enable in Supabase Dashboard: Database > Replication
-- Enable for: orders, messages, delivery_parcels, conversations
-- =============================================
