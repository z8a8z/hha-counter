-- =============================================================================
-- HHA Purchase Lists System – نظام قوائم المشتريات (v2)
-- =============================================================================
-- Paste this script into the Supabase SQL Editor AFTER factory_storage.sql
-- Adds: purchase_offices, purchase_lists, purchase_list_items
-- =============================================================================
-- CHANGES FROM v1:
--   - purchase_lists: added company_number (unique per list, user-chosen)
--   - purchase_list_items: removed location column
--   - purchase_list_items: added weight_id (for ink barrel weight)
--   - confirm_purchase_list: rolls are inserted as individual items with weight
--   - confirm_purchase_list: ink items use weight_id × barrel_count
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. PURCHASE OFFICES (مكاتب الشراء / الموردين)
--    Managed via Settings → "مكاتب الشراء" tab
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.purchase_offices (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- 2. PURCHASE LISTS (قوائم المشتريات)
--    One list = one purchase session from a specific office
--    status: draft (قيد الإدخال) → confirmed (مؤكد / أضيف للمخزن) / cancelled (ملغي)
--    company_number: unique number chosen by the user for this purchase
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.purchase_lists (
  id              SERIAL PRIMARY KEY,
  office_id       INTEGER NOT NULL REFERENCES public.purchase_offices(id) ON DELETE RESTRICT,
  company_number  TEXT NOT NULL,                -- unique purchase number assigned by user
  purchase_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  created_by      TEXT,                          -- username of creator
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------------
-- 3. PURCHASE LIST ITEMS (عناصر قائمة المشتريات)
--    Polymorphic: item_type determines which variant columns are used
--
--    item_type = 'roll'   → variant_id_1 = width_id,   variant_id_2 = type_id
--                           quantity = 1 (each roll is unique), unit = 'roll'
--                           weight stored in notes or a separate field? No – roll weight
--                           is entered per-item via the quantity field for rolls
--                           ACTUALLY: for rolls, quantity is unused (always 1),
--                           the roll's individual weight is stored in a custom way.
--                           We use: quantity = weight (kg) for the roll itself.
--
--    item_type = 'pipe'   → variant_id_1 = length_id,  variant_id_2 = NULL
--    item_type = 'liquid' → variant_id_1 = type_id,    variant_id_2 = NULL
--    item_type = 'ink'    → variant_id_1 = company_id, variant_id_2 = color_id
--                           weight_id = ink barrel weight, quantity = barrel count
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.purchase_list_items (
  id               SERIAL PRIMARY KEY,
  purchase_list_id INTEGER NOT NULL
                   REFERENCES public.purchase_lists(id) ON DELETE CASCADE,
  item_type        TEXT NOT NULL
                   CHECK (item_type IN ('roll', 'pipe', 'liquid', 'ink')),
  variant_id_1     INTEGER NOT NULL,
  variant_id_2     INTEGER,
  quantity         DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit             TEXT DEFAULT 'piece',
  weight_id        INTEGER REFERENCES public.ink_weights(id),  -- only for ink
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =============================================================================
-- HELPER FUNCTION – Confirm a purchase list (add items to المخزن)
-- =============================================================================
-- When a list is confirmed, each item is UPSERTed into the appropriate
-- inventory table.
--   - ROLLS: each item = one unique roll row with its weight (quantity field = weight in kg)
--   - PIPES: quantity added to existing aggregate
--   - LIQUIDS: quantity added to existing aggregate
--   - INKS: weight_id × quantity (barrel count) = total kg added
-- =============================================================================

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
  -- Check list exists and is in 'draft' status
  SELECT status INTO list_status
    FROM public.purchase_lists
   WHERE id = p_list_id;

  IF NOT FOUND THEN
    RETURN 'ERROR: Purchase list not found';
  END IF;

  IF list_status != 'draft' THEN
    RETURN 'ERROR: Purchase list is not in draft status (current: ' || list_status || ')';
  END IF;

  -- Process each item
  FOR rec IN
    SELECT * FROM public.purchase_list_items
     WHERE purchase_list_id = p_list_id
  LOOP
    item_count := item_count + 1;

    IF rec.item_type = 'roll' THEN
      -- Each roll is a unique item – INSERT a new row for every roll
      -- quantity field holds the individual roll weight in kg
      INSERT INTO public.rolls (width_id, type_id, weight, notes)
      VALUES (rec.variant_id_1, rec.variant_id_2, rec.quantity, rec.notes);

    ELSIF rec.item_type = 'pipe' THEN
      -- Add to existing aggregate quantity
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
      -- Get barrel weight from ink_weights
      SELECT weight INTO barrel_kg
        FROM public.ink_weights
       WHERE id = rec.weight_id;

      IF NOT FOUND THEN
        RETURN 'ERROR: Ink weight not found for weight_id ' || rec.weight_id;
      END IF;

      -- Total kg = barrel weight × barrel count (quantity)
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

  -- Mark list as confirmed
  UPDATE public.purchase_lists
     SET status = 'confirmed', updated_at = now()
   WHERE id = p_list_id;

  RETURN 'OK: ' || item_count || ' items confirmed and added to storage';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- TRIGGER – auto-update purchase_lists.updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS set_updated_at_purchase_lists ON public.purchase_lists;

CREATE TRIGGER set_updated_at_purchase_lists
  BEFORE UPDATE ON public.purchase_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


-- =============================================================================
-- ROW LEVEL SECURITY – Enable for new tables
-- =============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
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


-- =============================================================================
-- CONVENIENCE VIEWS – flattened for the frontend
-- =============================================================================

-- Purchase lists with office name, company number, and item count
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

-- Purchase list items with human-readable labels
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
      ic.name || ' - ' || ico.name || ' (' || iw.weight::TEXT || ' kg × ' || pli.quantity::TEXT || ' barrels)'
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
