-- =============================================================================
-- HHA Orders System – نظام الطلبيات
-- =============================================================================
-- Run this script in the Supabase SQL Editor to create the orders table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id              SERIAL PRIMARY KEY,
  customer_name   TEXT NOT NULL,
  order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  details         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by      TEXT,                          -- username of the creator
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Permissive policy for all actions
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.orders;
CREATE POLICY "Allow all for authenticated" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
