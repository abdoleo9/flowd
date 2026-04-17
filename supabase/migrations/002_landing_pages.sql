CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  product_images TEXT[] DEFAULT '{}',
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  views INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_workspace_id ON landing_pages(workspace_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Public read access for published pages
CREATE POLICY "Public can view active landing pages"
  ON landing_pages FOR SELECT
  USING (status = 'active');

-- Workspace members can manage their pages
CREATE POLICY "Workspace members manage landing pages"
  ON landing_pages FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM team_members WHERE user_id = auth.uid()
  ));

-- Increment orders count
CREATE OR REPLACE FUNCTION increment_landing_page_orders(page_id UUID)
RETURNS void AS $$
  UPDATE landing_pages SET orders_count = orders_count + 1 WHERE id = page_id;
$$ LANGUAGE sql;

-- Increment views count
CREATE OR REPLACE FUNCTION increment_landing_page_views(page_id UUID)
RETURNS void AS $$
  UPDATE landing_pages SET views = views + 1 WHERE id = page_id;
$$ LANGUAGE sql;
