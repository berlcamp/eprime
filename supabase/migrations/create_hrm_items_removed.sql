-- Create table for tracking removed employees from plantilla
CREATE TABLE IF NOT EXISTS hrm_items_removed (
  id BIGSERIAL PRIMARY KEY,
  item_id BIGINT NOT NULL REFERENCES hrm_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES hrm_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  removed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_by UUID REFERENCES hrm_users(id),
  org_id BIGINT NOT NULL,
  -- Store historical data from the item for reference
  item_number TEXT,
  position_id BIGINT REFERENCES hrm_positions(id),
  implementing_unit_id UUID,
  school_id BIGINT REFERENCES hrm_schools(id),
  office_id BIGINT REFERENCES hrm_offices(id),
  salary_grade TEXT,
  date_of_original_appointment DATE,
  date_of_last_promotion DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hrm_items_removed_user_id ON hrm_items_removed(user_id);
CREATE INDEX IF NOT EXISTS idx_hrm_items_removed_item_id ON hrm_items_removed(item_id);
CREATE INDEX IF NOT EXISTS idx_hrm_items_removed_org_id ON hrm_items_removed(org_id);
CREATE INDEX IF NOT EXISTS idx_hrm_items_removed_removed_at ON hrm_items_removed(removed_at DESC);

-- Add RLS policies if needed (adjust based on your RLS setup)
-- ALTER TABLE hrm_items_removed ENABLE ROW LEVEL SECURITY;
