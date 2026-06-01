-- ===================================================================
-- Morning-shift rate proposals
-- Lets managers propose a new morning_shift_rate for their direct
-- reports; HR (admin) approves or rejects. On approval, the
-- employees.morning_shift_rate column is updated.
-- ===================================================================

CREATE TABLE IF NOT EXISTS morning_shift_rate_proposals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  proposed_rate NUMERIC(10,2) NOT NULL CHECK (proposed_rate >= 0),
  proposed_by   UUID        NOT NULL REFERENCES profiles(id),
  proposed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewed_by   UUID        REFERENCES profiles(id),
  reviewed_at   TIMESTAMPTZ,
  note          TEXT
);

-- Only one PENDING proposal per employee at a time. Approved/rejected
-- rows accumulate as audit history.
CREATE UNIQUE INDEX IF NOT EXISTS morning_shift_rate_proposals_one_pending
  ON morning_shift_rate_proposals (employee_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS morning_shift_rate_proposals_employee_status
  ON morning_shift_rate_proposals (employee_id, status);

CREATE INDEX IF NOT EXISTS morning_shift_rate_proposals_proposed_by
  ON morning_shift_rate_proposals (proposed_by);
