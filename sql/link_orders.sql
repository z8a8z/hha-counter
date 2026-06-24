-- =============================================================================
-- HHA Link Orders to Ready Orders Migration
-- =============================================================================
-- Adds order_id foreign key column to ready_orders table.
-- =============================================================================

ALTER TABLE public.ready_orders 
  ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL;
