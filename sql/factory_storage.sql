-- =============================================================================
-- HHA Factory Storage Database – Inventory Schema (v2)
-- =============================================================================
-- Paste this script into the Supabase SQL Editor and run it.
-- All tables live in the public schema with RLS enabled.
-- =============================================================================
-- CHANGES FROM v1:
--   - roll_dimensions replaced by roll_widths (width only, in cm)
--   - rolls are unique items with individual weight (kg), no quantity
--   - location column purged from all inventory tables
--   - pipes length now in cm (was meters)
--   - ink_weights lookup table added for fixed barrel weights
--   - all units unified: width/length in cm, weight in kg
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROLLS (رولات)
--    Each roll is a unique item with its own width, type, and weight
-- ---------------------------------------------------------------------------

-- 1a. Roll widths lookup (width in cm – extensible via Settings)
CREATE TABLE IF NOT EXISTS public.roll_widths (
  id         SERIAL PRIMARY KEY,
  width      DECIMAL(10, 2) NOT NULL UNIQUE,   -- e.g. 133.50 cm
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. Roll types lookup (e.g. "BOPP transparent")
CREATE TABLE IF NOT EXISTS public.roll_types (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1c. Rolls inventory – each row = one unique roll
CREATE TABLE IF NOT EXISTS public.rolls (
  id           SERIAL PRIMARY KEY,
  width_id     INTEGER NOT NULL REFERENCES public.roll_widths(id) ON DELETE RESTRICT,
  type_id      INTEGER NOT NULL REFERENCES public.roll_types(id) ON DELETE RESTRICT,
  weight       DECIMAL(10, 2) NOT NULL CHECK (weight > 0),  -- kg
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: common roll widths (in cm)
INSERT INTO public.roll_widths (width) VALUES
  (133.50),
  (200.00),
  (160.00)
ON CONFLICT (width) DO NOTHING;

-- Seed: common roll types
INSERT INTO public.roll_types (name) VALUES
  ('BOPP transparent'),
  ('BOPP white'),
  ('BOPP metallized')
ON CONFLICT (name) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 2. PIPES (مواسير)
--    Length varies, now in cm
-- ---------------------------------------------------------------------------

-- 2a. Pipe lengths lookup (in cm)
CREATE TABLE IF NOT EXISTS public.pipe_lengths (
  id         SERIAL PRIMARY KEY,
  length     DECIMAL(10, 2) NOT NULL UNIQUE,   -- cm
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2b. Pipes inventory
CREATE TABLE IF NOT EXISTS public.pipes (
  id         SERIAL PRIMARY KEY,
  length_id  INTEGER NOT NULL REFERENCES public.pipe_lengths(id) ON DELETE RESTRICT,
  quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (length_id)
);


-- ---------------------------------------------------------------------------
-- 3. LIQUIDS (سوائل)
--    Fixed types with no variation – simple lookup + inventory
-- ---------------------------------------------------------------------------

-- 3a. Liquid types lookup
CREATE TABLE IF NOT EXISTS public.liquid_types (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3b. Liquids inventory
CREATE TABLE IF NOT EXISTS public.liquids (
  id         SERIAL PRIMARY KEY,
  type_id    INTEGER NOT NULL REFERENCES public.liquid_types(id) ON DELETE RESTRICT,
  quantity   DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit       TEXT NOT NULL DEFAULT 'liter',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type_id)
);


-- ---------------------------------------------------------------------------
-- 4. INKS (أحبار)
--    Different companies, different colors – weight in kg
-- ---------------------------------------------------------------------------

-- 4a. Ink companies lookup
CREATE TABLE IF NOT EXISTS public.ink_companies (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4b. Ink colors lookup
CREATE TABLE IF NOT EXISTS public.ink_colors (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4c. Ink barrel weights lookup (fixed weights for purchase, managed in Settings)
CREATE TABLE IF NOT EXISTS public.ink_weights (
  id         SERIAL PRIMARY KEY,
  weight     DECIMAL(10, 2) NOT NULL UNIQUE,   -- kg per barrel
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4d. Inks inventory (one row per company × color combination)
CREATE TABLE IF NOT EXISTS public.inks (
  id         SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES public.ink_companies(id) ON DELETE RESTRICT,
  color_id   INTEGER NOT NULL REFERENCES public.ink_colors(id) ON DELETE RESTRICT,
  quantity   DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),  -- total kg
  unit       TEXT NOT NULL DEFAULT 'kg',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, color_id)
);


-- =============================================================================
-- ROW LEVEL SECURITY – Enable & create permissive policies for all tables
-- =============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'roll_widths', 'roll_types', 'rolls',
    'pipe_lengths', 'pipes',
    'liquid_types', 'liquids',
    'ink_companies', 'ink_colors', 'ink_weights', 'inks'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    -- DROP first to avoid "policy already exists" on re-run
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;


-- =============================================================================
-- HELPER FUNCTION – auto-update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to every inventory table that has updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['rolls', 'pipes', 'liquids', 'inks']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I',
      tbl
    );
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_modified_column()',
      tbl
    );
  END LOOP;
END $$;


-- =============================================================================
-- CONVENIENCE VIEWS (flattened for the frontend)
-- =============================================================================

-- All rolls with width + type + individual weight
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

-- All pipes with length label (cm)
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

-- All liquids
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

-- All inks with company + color
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
