-- Add token_expires_at to integrations table
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Index for fast JSONB lookup by page_id (used in webhook handler)
CREATE INDEX IF NOT EXISTS idx_integrations_page_id
  ON integrations ((credentials->>'page_id'))
  WHERE is_active = true;
