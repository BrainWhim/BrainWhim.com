# Supabase SQL record

These are the scripts that were pasted into Supabase (SQL Editor) to set up the database.
They contain no keys or passwords. The site does not read these files; they are only a record.

Run order (already done on the live project):
1. `supabase-auth-setup.sql`  - sign-in lookups and the daily match counter
2. `supabase-lockdown.sql`    - row-level security: nobody can edit their own points/membership or read other people's emails
3. `supabase-scores.sql`      - server-side scoring (`bw_report_result`) with anti-cheat checks
4. `supabase-house.sql`       - points for games against The House (`bw_house_begin` / `bw_house_finish`), capped per day (NEW: not yet run on the live project)

If the database is ever rebuilt from scratch, run them in this order.
