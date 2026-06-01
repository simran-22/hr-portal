-- ===================================================================
-- Shift-based working-hours migration
-- Adds per-employee shift timing (start, end, paid break) so the
-- system can compute late minutes, early-leave minutes, overtime,
-- and expected vs actual hours from each day's check_in / check_out.
-- ===================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS shift_start TIME,
  ADD COLUMN IF NOT EXISTS shift_end   TIME,
  ADD COLUMN IF NOT EXISTS shift_break_minutes INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN employees.shift_start IS
  'Daily shift start time (local). NULL = no shift configured; report skips this employee.';
COMMENT ON COLUMN employees.shift_end IS
  'Daily shift end time (local). If shift_end < shift_start the shift is treated as crossing midnight.';
COMMENT ON COLUMN employees.shift_break_minutes IS
  'Paid break duration in minutes subtracted from the gross shift window when computing expected hours.';
