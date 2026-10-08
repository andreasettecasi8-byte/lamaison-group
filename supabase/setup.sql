-- LA MAISON GROUP — preparazione del progetto Supabase
-- Incolla tutto in Supabase → SQL Editor → New query e premi "Run".
-- Prima cambia l'email nell'ultima riga con quella del tuo utente amministratore.

-- 1. Contenuti del sito: una riga per ogni file (testi IT/EN, immobili, progetti, recensioni)
create table if not exists public.contenuti (
  percorso   text primary key,
  dati       jsonb not null,
  aggiornato timestamptz not null default now()
);

-- 2. Chi può modificare il sito
create table if not exists public.amministratori (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.amministratori a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 3. Regole di accesso: tutti leggono, solo gli amministratori scrivono
alter table public.contenuti enable row level security;
alter table public.amministratori enable row level security;

drop policy if exists "contenuti: lettura pubblica" on public.contenuti;
create policy "contenuti: lettura pubblica" on public.contenuti
  for select using (true);

drop policy if exists "contenuti: modifica amministratori" on public.contenuti;
create policy "contenuti: modifica amministratori" on public.contenuti
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. Spazio per le foto (pubblico in lettura)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto', 'foto', true, 10485760, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = true;

drop policy if exists "foto: lettura amministratori" on storage.objects;
create policy "foto: lettura amministratori" on storage.objects
  for select to authenticated using (bucket_id = 'foto' and public.is_admin());

drop policy if exists "foto: caricamento amministratori" on storage.objects;
create policy "foto: caricamento amministratori" on storage.objects
  for insert to authenticated with check (bucket_id = 'foto' and public.is_admin());

drop policy if exists "foto: modifica amministratori" on storage.objects;
create policy "foto: modifica amministratori" on storage.objects
  for update to authenticated using (bucket_id = 'foto' and public.is_admin());

drop policy if exists "foto: eliminazione amministratori" on storage.objects;
create policy "foto: eliminazione amministratori" on storage.objects
  for delete to authenticated using (bucket_id = 'foto' and public.is_admin());

-- 5. L'amministratore: CAMBIA QUESTA EMAIL con quella con cui entrerai nell'Area riservata
insert into public.amministratori (email) values ('LA-TUA-EMAIL@esempio.it')
on conflict do nothing;
