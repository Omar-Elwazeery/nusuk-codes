# Nusuk Challenge Codes · أكواد تحدي نسك

**Live:** https://omar-elwazeery.github.io/nusuk-codes/

A simple bilingual (Arabic default / English) site where people share their Nusuk Challenge referral codes (`NG-...`).

- The site owner's code is always pinned at the top.
- A random code is featured for 30 minutes at a time, the same one for every visitor.
- Anyone can add their code, or paste many codes at once with bulk add.
- "Open in Nusuk" opens `https://services.nusuk.sa/app?p=27&id=CODE`.
- The list sorts least-used first so everyone gets a turn. Codes you already opened move to the end.

## Stack
- **Frontend:** static HTML/CSS/JS on GitHub Pages
- **Backend:** Supabase (Postgres). The site only calls 3 database functions: `get_codes`, `add_codes` and `track_clicks`. The table itself is locked by row-level security.

## Setup
1. Create a free project at https://supabase.com.
2. **SQL Editor → New query**, paste `supabase/schema.sql`, then **Run**.
3. **Project Settings → API**: copy the Project URL and the publishable (anon) key into `config.js`.
4. Push. GitHub Pages serves the site from `main` / root.

## Keeping the free project awake
Supabase pauses free projects after 7 days without activity. Site visits count as activity, and `.github/workflows/keepalive.yml` also pings the database every 3 days.
GitHub disables scheduled workflows after 60 days with no commits to the repo. If you get that email, open **Actions → Keep Supabase awake → Enable**.
If the project does pause, open the Supabase dashboard and click **Restore**. No data is lost.

## Managing codes
Use **Table Editor → codes** in Supabase to delete spam rows.

> Unofficial community site. Not affiliated with Nusuk or the Ministry of Hajj and Umrah.
