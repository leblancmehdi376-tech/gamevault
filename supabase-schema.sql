-- ================================================
-- GameVault — Schema Supabase
-- Colle ce fichier dans ton Supabase SQL Editor
-- ================================================

-- 1. Table des profils publics
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- 2. Table des jeux de chaque utilisateur
create table if not exists user_games (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  igdb_id integer not null,
  title text not null,
  cover_url text,
  platform text not null,
  status text not null default 'En cours',
  created_at timestamptz default now() not null,
  -- Empêche d'ajouter le même jeu deux fois sur la même plateforme
  unique(user_id, igdb_id, platform)
);

-- ================================================
-- Row Level Security
-- ================================================

alter table profiles enable row level security;
alter table user_games enable row level security;

-- Profils : lecture publique, écriture perso
create policy "Profiles lisibles par tous"
  on profiles for select using (true);

create policy "Créer son propre profil"
  on profiles for insert with check (auth.uid() = id);

create policy "Modifier son propre profil"
  on profiles for update using (auth.uid() = id);

-- Jeux : lecture publique, écriture perso
create policy "Jeux lisibles par tous"
  on user_games for select using (true);

create policy "Ajouter ses propres jeux"
  on user_games for insert with check (auth.uid() = user_id);

create policy "Modifier ses propres jeux"
  on user_games for update using (auth.uid() = user_id);

create policy "Supprimer ses propres jeux"
  on user_games for delete using (auth.uid() = user_id);

-- ================================================
-- Trigger : création automatique du profil
-- Se déclenche quand un utilisateur s'inscrit
-- ================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Supprime le trigger s'il existe déjà avant de le recréer
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ================================================
-- Index pour les performances
-- ================================================
create index if not exists idx_user_games_user_id on user_games(user_id);
create index if not exists idx_user_games_status on user_games(status);
create index if not exists idx_profiles_username on profiles(username);
