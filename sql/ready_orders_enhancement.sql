-- =============================================================================
-- HHA Ready Orders Enhancement – Migration Script
-- =============================================================================
-- Run this in Supabase SQL Editor to add:
--   1. status column to ready_orders (قيد التجهيز / تجهيز مكتمل)
--   2. mark_ready_order RPC function
--   3. save_ready_order RPC function (if missing)
-- All statements are idempotent (safe to re-run).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add status column to ready_orders if missing
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ready_orders'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.ready_orders
      ADD COLUMN status TEXT NOT NULL DEFAULT 'preparing'
      CHECK (status IN ('preparing', 'ready'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Fix save_ready_order – match the EXACT original parameter order
--    The frontend calls: supabase.rpc('save_ready_order', { p_order_id, p_name, ... })
--    but the original function signature has p_name FIRST (alphabetical pg order).
-- ---------------------------------------------------------------------------

-- Drop every overload of save_ready_order
DROP FUNCTION IF EXISTS public.save_ready_order(INTEGER, TEXT, DECIMAL, DECIMAL, DECIMAL[]);
DROP FUNCTION IF EXISTS public.save_ready_order(UUID, TEXT, DECIMAL, DECIMAL, DECIMAL[]);
DROP FUNCTION IF EXISTS public.save_ready_order(TEXT, INTEGER, DECIMAL, DECIMAL, DECIMAL[]);
DROP FUNCTION IF EXISTS public.save_ready_order(TEXT, UUID, DECIMAL, DECIMAL, DECIMAL[]);

CREATE OR REPLACE FUNCTION public.save_ready_order(
  p_name        TEXT,
  p_order_id    UUID,
  p_pipe_length DECIMAL(10, 2),
  p_pipe_weight DECIMAL(10, 2),
  p_rolls       DECIMAL(10, 2)[]
)
RETURNS TEXT AS $$
DECLARE
  rw   DECIMAL(10, 2);
  fk_col TEXT;
BEGIN
  -- Update order header
  UPDATE public.ready_orders
     SET name        = p_name,
         pipe_length = p_pipe_length,
         pipe_weight = p_pipe_weight
   WHERE id = p_order_id;

  -- Detect the actual FK column name on ready_order_rolls
  SELECT kcu.column_name INTO fk_col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_schema = 'public'
     AND tc.table_name   = 'ready_order_rolls'
     AND tc.constraint_type = 'FOREIGN KEY'
   LIMIT 1;

  -- Fallback if we can't detect
  IF fk_col IS NULL THEN
    fk_col := 'order_id';
  END IF;

  -- Delete existing rolls using dynamic SQL
  EXECUTE format(
    'DELETE FROM public.ready_order_rolls WHERE %I = $1', fk_col
  ) USING p_order_id;

  -- Re-insert rolls using dynamic SQL
  IF p_rolls IS NOT NULL THEN
    FOREACH rw IN ARRAY p_rolls
    LOOP
      EXECUTE format(
        'INSERT INTO public.ready_order_rolls (%I, weight) VALUES ($1, $2)', fk_col
      ) USING p_order_id, rw;
    END LOOP;
  END IF;

  RETURN 'OK';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Fix mark_ready_order – drop overloads, recreate with UUID
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.mark_ready_order(INTEGER);
DROP FUNCTION IF EXISTS public.mark_ready_order(UUID);

CREATE OR REPLACE FUNCTION public.mark_ready_order(p_order_id UUID)
RETURNS TEXT AS $$
DECLARE
  ord RECORD;
BEGIN
  SELECT id, status INTO ord
    FROM public.ready_orders
   WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN 'ERROR: Order not found';
  END IF;

  IF ord.status = 'ready' THEN
    RETURN 'ERROR: Order is already marked as ready';
  END IF;

  UPDATE public.ready_orders
     SET status = 'ready'
   WHERE id = p_order_id;

  RETURN 'OK: Order marked as ready';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 4. Ensure RLS on ready_orders and ready_order_rolls
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['ready_orders', 'ready_order_rolls']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;
