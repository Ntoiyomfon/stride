-- Add device_id column to sessions table for stable device tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT 'unknown';

-- Create index for faster device-based queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON sessions(user_id, device_id) WHERE is_revoked = false;

-- Update existing sessions to have a device_id based on user_agent + ip_address
UPDATE sessions 
SET device_id = 'legacy_' || substr(md5(user_agent || '_' || ip_address), 1, 12)
WHERE device_id = 'unknown' OR device_id IS NULL;