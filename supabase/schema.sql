-- =====================================================================
-- Nusuk Codes - Supabase schema
-- Run once in Supabase Dashboard > SQL Editor > New query > Run
-- Safe to run again (it only creates/replaces).
-- =====================================================================

create table if not exists public.codes (
  id      bigint generated always as identity primary key,
  code    text        not null check (code ~ '^NG-[A-Za-z0-9]{4,24}$'),
  added   timestamptz not null default now(),
  clicks  integer     not null default 0
);

create unique index if not exists codes_code_lower_idx on public.codes (lower(code));
create index if not exists codes_clicks_idx on public.codes (clicks, added desc);
create index if not exists codes_added_idx  on public.codes (added desc);

-- Hashed visitor IP (never the raw IP), used only for the per-person limit
alter table public.codes add column if not exists ip_hash text;
create index if not exists codes_ip_added_idx on public.codes (ip_hash, added);


-- Hashed IP of the current API caller (null if unavailable)
create or replace function public.caller_ip_hash()
returns text language plpgsql stable as $$
declare h json; ip text;
begin
  begin
    h := current_setting('request.headers', true)::json;
  exception when others then
    return null;
  end;
  ip := coalesce(
    nullif(h->>'cf-connecting-ip', ''),
    nullif(trim(split_part(coalesce(h->>'x-forwarded-for', ''), ',', 1)), ''),
    nullif(h->>'x-real-ip', '')
  );
  if ip is null then return null; end if;
  return md5('nusuk-codes:' || ip);
end $$;

-- Nobody touches the table directly; everything goes through the functions below.
alter table public.codes enable row level security;
revoke all on public.codes from anon, authenticated;


-- Extracts "NG-xxxx" from a code, a share message or a link
create or replace function public.normalize_code(raw text)
returns text language sql immutable as $$
  select case
    when m is null then null
    when ('NG-' || substr(m, 4)) ~ '^NG-[A-Za-z0-9]{4,24}$' then 'NG-' || substr(m, 4)
    else null end
  from (select substring(coalesce(raw, '') from '(?i)NG-[A-Za-z0-9]+') as m) s
$$;


-- Add one or many codes (max 50 per call). Returns {ok, added, exists, status}
create or replace function public.add_codes(p_codes text[])
returns json language plpgsql security definer set search_path = public as $$
declare
  v_clean  text[];
  v_added  int;
  v_recent int;
  v_ip     text := public.caller_ip_hash();
  v_mine   int;
begin
  select coalesce(array_agg(c), '{}') into v_clean
  from (
    select distinct on (lower(c)) c
    from (select public.normalize_code(x) as c from unnest(p_codes[1:50]) as x) a
    where c is not null
  ) b;

  if cardinality(v_clean) = 0 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  -- per-person limit: 100 new codes per 10 minutes
  if v_ip is not null then
    select count(*) into v_mine from codes
    where ip_hash = v_ip and added > now() - interval '10 minutes';
    if v_mine + cardinality(v_clean) > 100 then
      return json_build_object('ok', false, 'error', 'rate_limited');
    end if;
  end if;

  -- global safety net: 1000 new codes per minute from everyone together
  select count(*) into v_recent from codes where added > now() - interval '1 minute';
  if v_recent + cardinality(v_clean) > 1000 then
    return json_build_object('ok', false, 'error', 'busy');
  end if;

  insert into codes (code, ip_hash)
  select unnest(v_clean), v_ip
  on conflict ((lower(code))) do nothing;
  get diagnostics v_added = row_count;

  return json_build_object(
    'ok', true,
    'added', v_added,
    'exists', cardinality(v_clean) - v_added,
    'status', case when v_added > 0 then 'added' else 'exists' end
  );
end $$;


-- Batched click counting (max 50 per call)
create or replace function public.track_clicks(p_codes text[])
returns json language sql security definer set search_path = public as $$
  with c as (
    select lower(public.normalize_code(x)) as k, count(*)::int as n
    from unnest(p_codes[1:50]) as x
    group by 1
  ), u as (
    update codes set clicks = codes.clicks + c.n
    from c where c.k is not null and lower(codes.code) = c.k
    returning 1
  )
  select json_build_object('ok', true, 'updated', (select count(*) from u));
$$;


-- One page of codes + total + the featured code for the current 30-minute window
-- p_sort: 'least' | 'newest' | 'random'
create or replace function public.get_codes(
  p_sort    text default 'least',
  p_q       text default '',
  p_limit   int  default 60,
  p_offset  int  default 0,
  p_seed    text default '',
  p_exclude text default ''
)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_q        text   := lower(regexp_replace(coalesce(p_q, ''), '[^A-Za-z0-9-]', '', 'g'));
  v_ex       text   := lower(coalesce(p_exclude, ''));
  v_slot     bigint := floor(extract(epoch from now()) / 1800);
  v_all      int;
  v_total    int;
  v_featured text;
  v_rows     json;
begin
  p_limit  := least(greatest(coalesce(p_limit, 60), 1), 200);
  p_offset := greatest(coalesce(p_offset, 0), 0);

  select count(*) into v_all from codes where lower(code) <> v_ex;

  -- same code for every visitor during each 30-minute window
  if v_all > 0 then
    select code into v_featured from codes
    where lower(code) <> v_ex
    order by added, id
    offset (abs(hashtext('slot' || v_slot::text)::bigint) % v_all)
    limit 1;
  end if;

  select count(*) into v_total from codes
  where lower(code) <> v_ex and (v_q = '' or lower(code) like '%' || v_q || '%');

  select coalesce(json_agg(json_build_object('code', code, 'added', added_ms, 'clicks', clicks) order by rn), '[]'::json)
  into v_rows
  from (
    select code, clicks,
           (extract(epoch from added) * 1000)::bigint as added_ms,
           row_number() over (order by
             case when p_sort = 'random' then md5(code || coalesce(p_seed, '')) end,
             case when p_sort = 'newest' then added end desc,
             case when p_sort not in ('random', 'newest') then clicks end,
             added desc, id desc) as rn
    from codes
    where lower(code) <> v_ex and (v_q = '' or lower(code) like '%' || v_q || '%')
    order by rn
    offset p_offset limit p_limit
  ) r;

  return json_build_object(
    'ok', true,
    'total', v_total,
    'all', v_all,
    'featured', v_featured,
    'codes', v_rows,
    'nextChange', (v_slot + 1) * 1800000
  );
end $$;


-- Only these functions are callable from the website
revoke execute on function public.add_codes(text[])    from public;
revoke execute on function public.track_clicks(text[]) from public;
revoke execute on function public.get_codes(text, text, int, int, text, text) from public;
grant  execute on function public.add_codes(text[])    to anon, authenticated;
grant  execute on function public.track_clicks(text[]) to anon, authenticated;
grant  execute on function public.get_codes(text, text, int, int, text, text) to anon, authenticated;
