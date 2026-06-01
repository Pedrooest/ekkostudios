-- Add __archived column to tasks table (missing column causing 500 on GET)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false;

-- Update existing rows to have __archived = false
UPDATE tasks SET __archived = false WHERE __archived IS NULL;
