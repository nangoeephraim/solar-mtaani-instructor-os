-- ============================================
-- PRISM Fee Payment System Schema
-- ============================================

-- Fee structures (tuition, registration, etc.)
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  term INTEGER,
  student_group TEXT,
  is_recurring BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual payments
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'pending',
  mpesa_receipt_number TEXT,
  mpesa_phone_number TEXT,
  transaction_date TIMESTAMPTZ DEFAULT now(),
  fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  term INTEGER,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON public.fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_method ON public.fee_payments(method);
CREATE INDEX IF NOT EXISTS idx_fee_payments_transaction_date ON public.fee_payments(transaction_date);

-- Enable RLS
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users can manage)
CREATE POLICY "Authenticated users can read fee_structures"
  ON public.fee_structures FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert fee_structures"
  ON public.fee_structures FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update fee_structures"
  ON public.fee_structures FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete fee_structures"
  ON public.fee_structures FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read fee_payments"
  ON public.fee_payments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert fee_payments"
  ON public.fee_payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update fee_payments"
  ON public.fee_payments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete fee_payments"
  ON public.fee_payments FOR DELETE USING (auth.role() = 'authenticated');

-- Summary view for quick balance lookups
CREATE OR REPLACE VIEW public.student_fee_balances AS
SELECT
  s.id AS student_id,
  s.name AS student_name,
  COALESCE(SUM(CASE WHEN fp.status = 'completed' THEN fp.amount ELSE 0 END), 0) AS total_paid,
  MAX(fp.transaction_date) AS last_payment_date
FROM public.students s
LEFT JOIN public.fee_payments fp ON fp.student_id = s.id
GROUP BY s.id, s.name;

-- Enable Realtime for fee_payments
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_payments;
