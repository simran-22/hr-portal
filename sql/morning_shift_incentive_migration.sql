-- ===================================================================
-- Morning-shift incentive migration
-- 1) Adds employees.morning_shift_rate (flat amount paid per day the
--    employee's attendance is marked 'morning_only' / "P-Morning").
-- 2) Expands the profiles.role check constraint to allow 'manager',
--    so the system can scope incentive visibility to HR / Manager /
--    Employee. Existing 'admin' and 'employee' values remain valid.
-- ===================================================================

-- 1) Per-employee flat rate (in your local currency, e.g. INR per day)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS morning_shift_rate NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN employees.morning_shift_rate IS
  'Flat amount paid per day the employee is marked morning_only in attendance.';

-- 2) Allow profiles.role = 'manager'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'employee'));
