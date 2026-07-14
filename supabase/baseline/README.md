# PRIME-HRM Baseline Schema

Complete schema of the PRIME-HRM system, generated **2026-07-14** from the live
production database (Supabase project `nuhirhfevxoonendpfsm`). Intended as the
starting point for the full system rebuild: copy these two files into the new
project's `supabase/migrations/` folder as its first migrations.

| File | Contents |
|------|----------|
| `0001_initial_schema.sql` | Extensions, 91 tables (grouped by module), 200 FKs, unique/check constraints, indexes, RLS + 120 policies, realtime publication, storage buckets |
| `0002_functions_and_cron.sql` | The 4 cron functions (bug-fixed versions) + pg_cron schedule |

Validated end-to-end against a clean PostgreSQL instance.

## What is intentionally excluded

- **Other systems sharing the old database** (`agriko_*`, `ccb_*`, `ceedo_*`,
  `ddm_*`, and others). The new project should be a **dedicated** Supabase
  project — the old one hosts many unrelated apps, which magnified the impact
  of the leaked service-role key.
- **Junk/backup tables**: `hrm_items_`, `hrm_items_duplicate`,
  `hrm_leave_cards_bkup`, `hrm_leave_credits_bkup`,
  `hrm_service_records_duplicate`, `ddm_profiles_old`.
- **Dead function** `automated_cto_expiration` (superseded by
  `automate_cto_expiration`).

## Quirks found in the old system (decisions baked into this baseline)

1. **`hrm_promotions` had an FK to the stale `hrm_items_` table** — re-pointed
   to `hrm_items` here. ⚠️ Before migrating data, verify every
   `hrm_promotions.item_id` exists in `hrm_items` (some may only exist in the
   stale copy):
   ```sql
   select p.id, p.item_id from hrm_promotions p
   left join hrm_items i on i.id = p.item_id
   where p.item_id is not null and i.id is null;
   ```
2. **RLS is disabled on some tables** — listed in a comment in
   `0001_initial_schema.sql`. Kept identical so the app behaves the same, but
   the rebuild should enable RLS everywhere with real policies (most existing
   policies are "any authenticated user can do anything").
3. **Dead code in the old app** references tables that don't exist anywhere:
   `hrm_leave_requests`, `hrm_reclassifications`,
   `hrm_reclassification_applicants`, `hrm_document_remarks`,
   `hrm_leave_cardsxx`. Those code paths were silently broken — don't carry
   them into the rebuild. (`hrm`, `hrm_documents`, `hrm_public` are storage
   buckets, not tables.)
4. `hrm_users.fts` is a **generated column** (full-text search over names) —
   never insert into it during data migration; Postgres computes it.
5. The old repo's `generate:types` script pointed at the wrong project id
   (`jwpaamhdlufycuopiguy`); production is `nuhirhfevxoonendpfsm`.

## Data migration plan (old → new project)

1. **Apply the schema**: run `0001` then `0002` on the new project
   (`supabase db push`, or SQL Editor in order).
2. **Migrate auth users first** (everything hangs off `auth.users` via
   `hrm_users.id`). UUIDs must be preserved. Easiest:
   `pg_dump 'OLD_DB_URL' --data-only --schema=auth --table=auth.users \
    --table=auth.identities | psql 'NEW_DB_URL'`
   (dumping the whole `auth` schema data keeps passwords working; the Admin
   API alternative would force password resets).
3. **Migrate table data** with FK-safe ordering handled by pg_dump:
   ```bash
   pg_dump 'OLD_DB_URL' --data-only --disable-triggers \
     $(sed 's/^/--table=public./' tables.txt) | psql 'NEW_DB_URL'
   ```
   where `tables.txt` is the 91 baseline table names. Migrate only rows for
   your org if the old shared tables contain other orgs' data
   (`organizations`, `users`, `error_logs` are shared — filter by org where
   applicable).
4. **Fix identity sequences** after import:
   ```sql
   select setval(pg_get_serial_sequence(format('%I.%I', schemaname, tablename), 'id'),
                 coalesce((select max(id) from ...), 1))
   -- or simply, per table:
   select setval(pg_get_serial_sequence('public.hrm_users_x', 'id'), (select coalesce(max(id),1) from public.hrm_users_x));
   ```
   (Generate one `setval` per table with a bigint identity `id`; skip uuid PKs.)
5. **Storage objects**: copy files in the `hrm`, `hrm_documents`, and
   `hrm_public` buckets between projects (e.g. `rclone`, or a script over
   `storage.from().download()/upload()`).
6. **Verify**: compare `count(*)` per table between old and new, spot-check a
   few employees' leave cards/balances, and confirm the 4 pg_cron jobs exist
   (`select jobname, schedule from cron.job`).

## Post-migration hygiene for the new system

- Keep the service-role key **server-side only** (never `NEXT_PUBLIC_`).
- Rotate any keys that were exposed by the old app.
- Keep schema changes in migrations from day one — the old system's schema
  lived only in the database, which is why this baseline had to be
  reverse-engineered.
