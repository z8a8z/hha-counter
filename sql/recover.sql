-- ============================================================
-- COMPLETE RECOVERY SCRIPT – Run in Supabase SQL Editor
-- Handles: missing views, missing function, missing triggers,
--          missing columns, and the failed rolls migration.
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- ============================================================
-- PART A: Ensure all tables/columns exist (idempotent)
-- ============================================================

-- A1. Create roll_widths if missing
CREATE TABLE IF NOT EXISTS public.roll_widths (
  id         SERIAL PRIMARY KEY,
  width      DECIMAL(10, 2) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A2. Create ink_weights if missing
CREATE TABLE IF NOT EXISTS public.ink_weights (
  id         SERIAL PRIMARY KEY,
  weight     DECIMAL(10, 2) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A3. Fix rolls table (the failed migration step)
DO $$
BEGIN
  -- Add width_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rolls' AND column_name='width_id') THEN
    ALTER TABLE public.rolls ADD COLUMN width_id INTEGER
      REFERENCES public.roll_widths(id) ON DELETE RESTRICT;
  END IF;

  -- Drop old quantity column if still exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rolls' AND column_name='quantity') THEN
    ALTER TABLE public.rolls DROP COLUMN quantity;
  END IF;

  -- Drop old location column if still exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rolls' AND column_name='location') THEN
    ALTER TABLE public.rolls DROP COLUMN location;
  END IF;

  -- Drop old dimension_id if still exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rolls' AND column_name='dimension_id') THEN
    ALTER TABLE public.rolls DROP COLUMN dimension_id CASCADE;
  END IF;

  -- Add weight column if missing (the SAFE way)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rolls' AND column_name='weight') THEN
    ALTER TABLE public.rolls ADD COLUMN weight DECIMAL(10, 2);
    UPDATE public.rolls SET weight = 1.0 WHERE weight IS NULL;
    ALTER TABLE public.rolls ALTER COLUMN weight SET NOT NULL;
    ALTER TABLE public.rolls ADD CONSTRAINT rolls_weight_check CHECK (weight > 0);
  END IF;
END $$;

-- A4. Remove location from pipes, liquids, inks if still present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='pipes' AND column_name='location') THEN
    ALTER TABLE public.pipes DROP COLUMN location;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='liquids' AND column_name='location') THEN
    ALTER TABLE public.liquids DROP COLUMN location;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inks' AND column_name='location') THEN
    ALTER TABLE public.inks DROP COLUMN location;
  END IF;
END $$;

-- A5. Add company_number to purchase_lists if missing
ALTER TABLE public.purchase_lists ADD COLUMN IF NOT EXISTS company_number TEXT;

-- A6. Remove location from purchase_list_items if still present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='purchase_list_items' AND column_name='location') THEN
    ALTER TABLE public.purchase_list_items DROP COLUMN location;
  END IF;
END $$;

-- A7. Add weight_id to purchase_list_items if missing
ALTER TABLE public.purchase_list_items ADD COLUMN IF NOT EXISTS weight_id INTEGER
  REFERENCES public.ink_weights(id);

-- A8. Drop old roll_dimensions if still exists
DROP TABLE IF EXISTS public.roll_dimensions CASCADE;

-- ============================================================
-- PART B: Recreate ALL views
-- ============================================================

-- B1. v_rolls
CREATE OR REPLACE VIEW public.v_rolls AS
SELECT
  r.id,
  rw.width,
  rw.width::TEXT || ' cm' AS width_label,
  t.name AS type_name,
  r.weight,
  r.notes,
  r.updated_at
FROM public.rolls r
JOIN public.roll_widths rw ON rw.id = r.width_id
JOIN public.roll_types t    ON t.id = r.type_id
ORDER BY rw.width, t.name, r.id;

-- B2. v_pipes
CREATE OR REPLACE VIEW public.v_pipes AS
SELECT
  p.id,
  pl.length,
  pl.length::TEXT || ' cm' AS length_label,
  p.quantity,
  p.notes,
  p.updated_at
FROM public.pipes p
JOIN public.pipe_lengths pl ON pl.id = p.length_id
ORDER BY pl.length;

-- B3. v_liquids
CREATE OR REPLACE VIEW public.v_liquids AS
SELECT
  l.id,
  lt.name AS type_name,
  l.quantity,
  l.unit,
  l.notes,
  l.updated_at
FROM public.liquids l
JOIN public.liquid_types lt ON lt.id = l.type_id
ORDER BY lt.name;

-- B4. v_inks
CREATE OR REPLACE VIEW public.v_inks AS
SELECT
  i.id,
  c.name AS company_name,
  col.name AS color_name,
  c.name || ' – ' || col.name AS label,
  i.quantity,
  i.unit,
  i.notes,
  i.updated_at
FROM public.inks i
JOIN public.ink_companies c   ON c.id = i.company_id
JOIN public.ink_colors col    ON col.id = i.color_id
ORDER BY c.name, col.name;

-- B5. v_purchase_lists
CREATE OR REPLACE VIEW public.v_purchase_lists AS
SELECT
  pl.id,
  pl.office_id,
  po.name AS office_name,
  pl.company_number,
  pl.purchase_date,
  pl.notes,
  pl.status,
  pl.created_by,
  pl.created_at,
  pl.updated_at,
  COUNT(pli.id) AS item_count,
  COALESCE(SUM(pli.quantity), 0) AS total_quantity
FROM public.purchase_lists pl
JOIN public.purchase_offices po ON po.id = pl.office_id
LEFT JOIN public.purchase_list_items pli ON pli.purchase_list_id = pl.id
GROUP BY pl.id, po.name
ORDER BY pl.created_at DESC;

-- B6. v_purchase_list_items
CREATE OR REPLACE VIEW public.v_purchase_list_items AS
SELECT
  pli.id,
  pli.purchase_list_id,
  pli.item_type,
  pli.variant_id_1,
  pli.variant_id_2,
  pli.quantity,
  pli.unit,
  pli.weight_id,
  pli.notes,
  iw.weight AS barrel_weight,
  CASE
    WHEN pli.item_type = 'roll' THEN
      rw.width::TEXT || ' cm - ' || rt.name || ' (' || pli.quantity::TEXT || ' kg)'
    WHEN pli.item_type = 'pipe' THEN
      ppl.length::TEXT || ' cm'
    WHEN pli.item_type = 'liquid' THEN
      lt.name
    WHEN pli.item_type = 'ink' THEN
      ic.name || ' - ' || ico.name || ' (' || iw.weight::TEXT || ' kg x ' || pli.quantity::TEXT || ' barrels)'
  END AS item_label,
  CASE
    WHEN pli.item_type = 'roll' THEN rw.width::TEXT || ' cm'
    WHEN pli.item_type = 'pipe' THEN ppl.length::TEXT || ' cm'
    WHEN pli.item_type = 'liquid' THEN lt.name
    WHEN pli.item_type = 'ink' THEN ic.name || ' - ' || ico.name
  END AS description
FROM public.purchase_list_items pli
LEFT JOIN public.roll_widths rw      ON pli.item_type = 'roll' AND pli.variant_id_1 = rw.id
LEFT JOIN public.roll_types rt       ON pli.item_type = 'roll' AND pli.variant_id_2 = rt.id
LEFT JOIN public.pipe_lengths ppl    ON pli.item_type = 'pipe' AND pli.variant_id_1 = ppl.id
LEFT JOIN public.liquid_types lt     ON pli.item_type = 'liquid' AND pli.variant_id_1 = lt.id
LEFT JOIN public.ink_companies ic    ON pli.item_type = 'ink' AND pli.variant_id_1 = ic.id
LEFT JOIN public.ink_colors ico      ON pli.item_type = 'ink' AND pli.variant_id_2 = ico.id
LEFT JOIN public.ink_weights iw      ON pli.item_type = 'ink' AND pli.weight_id = iw.id
ORDER BY pli.id;

-- ============================================================
-- PART C: Recreate confirm_purchase_list function
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirm_purchase_list(p_list_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  rec           RECORD;
  list_status   TEXT;
  new_qty       DECIMAL(10, 2);
  barrel_kg     DECIMAL(10, 2);
  total_added   DECIMAL(10, 2);
  item_count    INTEGER := 0;
BEGIN
  SELECT status INTO list_status
    FROM public.purchase_lists
   WHERE id = p_list_id;

  IF NOT FOUND THEN
    RETURN 'ERROR: Purchase list not found';
  END IF;

  IF list_status != 'draft' THEN
    RETURN 'ERROR: Purchase list is not in draft status (current: ' || list_status || ')';
  END IF;

  FOR rec IN
    SELECT * FROM public.purchase_list_items
     WHERE purchase_list_id = p_list_id
  LOOP
    item_count := item_count + 1;

    IF rec.item_type = 'roll' THEN
      INSERT INTO public.rolls (width_id, type_id, weight, notes)
      VALUES (rec.variant_id_1, rec.variant_id_2, rec.quantity, rec.notes);

    ELSIF rec.item_type = 'pipe' THEN
      SELECT COALESCE(quantity, 0) INTO new_qty
        FROM public.pipes
       WHERE length_id = rec.variant_id_1;
      new_qty := COALESCE(new_qty, 0) + rec.quantity;
      INSERT INTO public.pipes (length_id, quantity, notes)
      VALUES (rec.variant_id_1, new_qty, rec.notes)
      ON CONFLICT (length_id)
      DO UPDATE SET quantity   = EXCLUDED.quantity,
                    notes      = CASE WHEN EXCLUDED.notes IS NOT NULL
                                     THEN pipes.notes || E'\n' || EXCLUDED.notes
                                     ELSE pipes.notes END,
                    updated_at = now();

    ELSIF rec.item_type = 'liquid' THEN
      SELECT COALESCE(quantity, 0) INTO new_qty
        FROM public.liquids
       WHERE type_id = rec.variant_id_1;
      new_qty := COALESCE(new_qty, 0) + rec.quantity;
      INSERT INTO public.liquids (type_id, quantity, unit, notes)
      VALUES (rec.variant_id_1, new_qty, rec.unit, rec.notes)
      ON CONFLICT (type_id)
      DO UPDATE SET quantity   = EXCLUDED.quantity,
                    unit       = COALESCE(EXCLUDED.unit, liquids.unit),
                    notes      = CASE WHEN EXCLUDED.notes IS NOT NULL
                                     THEN liquids.notes || E'\n' || EXCLUDED.notes
                                     ELSE liquids.notes END,
                    updated_at = now();

    ELSIF rec.item_type = 'ink' THEN
      SELECT weight INTO barrel_kg
        FROM public.ink_weights
       WHERE id = rec.weight_id;
      IF NOT FOUND THEN
        RETURN 'ERROR: Ink weight not found for weight_id ' || rec.weight_id;
      END IF;
      total_added := barrel_kg * rec.quantity;
      SELECT COALESCE(quantity, 0) INTO new_qty
        FROM public.inks
       WHERE company_id = rec.variant_id_1 AND color_id = rec.variant_id_2;
      new_qty := COALESCE(new_qty, 0) + total_added;
      INSERT INTO public.inks (company_id, color_id, quantity, unit, notes)
      VALUES (rec.variant_id_1, rec.variant_id_2, new_qty, 'kg', rec.notes)
      ON CONFLICT (company_id, color_id)
      DO UPDATE SET quantity   = EXCLUDED.quantity,
                    notes      = CASE WHEN EXCLUDED.notes IS NOT NULL
                                     THEN inks.notes || E'\n' || EXCLUDED.notes
                                     ELSE inks.notes END,
                    updated_at = now();
    END IF;
  END LOOP;

  UPDATE public.purchase_lists
     SET status = 'confirmed', updated_at = now()
   WHERE id = p_list_id;

  RETURN 'OK: ' || item_count || ' items confirmed and added to storage';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART D: Ensure RLS on ALL tables
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'roll_widths', 'roll_types', 'rolls',
    'pipe_lengths', 'pipes',
    'liquid_types', 'liquids',
    'ink_companies', 'ink_colors', 'ink_weights', 'inks',
    'purchase_offices', 'purchase_lists', 'purchase_list_items'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- PART E: Recreate update triggers
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['rolls', 'pipes', 'liquids', 'inks']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', tbl);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_modified_column()',
      tbl
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_purchase_lists ON public.purchase_lists;
CREATE TRIGGER set_updated_at_purchase_lists
  BEFORE UPDATE ON public.purchase_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ============================================================
-- PART F: Seed data (idempotent)
-- ============================================================
INSERT INTO public.roll_widths (width) VALUES (133.50),(200.00),(160.00)
  ON CONFLICT (width) DO NOTHING;
INSERT INTO public.roll_types (name) VALUES
  ('BOPP transparent'),('BOPP white'),('BOPP metallized')
  ON CONFLICT (name) DO NOTHING;