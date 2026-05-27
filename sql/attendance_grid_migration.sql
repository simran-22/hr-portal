-- ===================================================================
-- Attendance Grid migration
-- Expands attendance.status to support all HR matrix codes
-- and ensures (employee_id, date) is unique so cell-edits can upsert.
-- ===================================================================

-- 1) Drop and recreate status check constraint with the full code set
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE attendance ADD CONSTRAINT attendance_status_check
  CHECK (status IN (
    'present',          -- P  (green)
    'absent',           -- Absent (red)
    'half_day',         -- Half-day (blue)
    'late',             -- Late (kept)
    'on_leave',         -- generic on-leave (kept)
    'weekly_off',       -- WO (yellow)
    'privilege_leave',  -- PL (orange)
    'sick_leave',       -- SL (pink)
    'casual_leave',     -- CL (purple)
    'unpaid_leave',     -- LWP (gray)
    'morning_only'      -- P-Morning (dark green)
  ));

-- 2) Ensure one attendance row per (employee, date) for upserts
CREATE UNIQUE INDEX IF NOT EXISTS attendance_employee_date_unique
  ON attendance(employee_id, date);
