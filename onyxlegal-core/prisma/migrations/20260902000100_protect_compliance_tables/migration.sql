-- Protect the compliance tables from being dropped.
--
-- WHY THIS EXISTS
-- ---------------
-- onyxlegal-worker/prisma/schema.prisma describes none of the eight compliance
-- models, has no migrations directory, and its DATABASE_URL points at this same
-- database. A single `prisma db push` from that directory would therefore drop
-- every table below, along with every licence, reminder and document in them.
--
-- This was reported in three consecutive slices. A note in a report is not a
-- control, and neither is an npm script: `npx prisma db push` never runs one.
-- Only the database itself can refuse, so the refusal lives here.
--
-- ESCAPE HATCH
-- ------------
-- A legitimate drop (a real migration, or `prisma migrate reset` against a test
-- database) opts in for the current session:
--
--     SET onyxlegal.allow_compliance_drop = 'on';
--
-- It is session-scoped, so it cannot be left switched on by accident.

CREATE OR REPLACE FUNCTION onyxlegal_protect_compliance_tables()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  dropped record;
  protected_tables text[] := ARRAY[
    'sites',
    'licenses',
    'license_reminders',
    'authorities',
    'license_types',
    'tenant_license_requirements',
    'license_documents',
    'compliance_audit_log'
  ];
BEGIN
  -- Deliberate opt-in, checked first so a real migration is never blocked.
  IF coalesce(current_setting('onyxlegal.allow_compliance_drop', true), 'off') = 'on' THEN
    RETURN;
  END IF;

  FOR dropped IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF dropped.object_type = 'table'
       AND dropped.object_name = ANY(protected_tables) THEN
      RAISE EXCEPTION
        'BLOCKED: "%" is a compliance table and must not be dropped.',
        dropped.object_name
      USING HINT =
        'If you ran this from onyxlegal-worker, stop: that schema does not '
        'describe the compliance tables and will destroy them. If this drop is '
        'genuinely intended, run: SET onyxlegal.allow_compliance_drop = ''on'';';
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS onyxlegal_protect_compliance;

CREATE EVENT TRIGGER onyxlegal_protect_compliance
  ON sql_drop
  EXECUTE FUNCTION onyxlegal_protect_compliance_tables();
