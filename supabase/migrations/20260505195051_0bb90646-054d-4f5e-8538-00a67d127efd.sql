-- Enums
create type public.app_role as enum ('super_admin','club_admin','organizer','player');
create type public.club_role as enum ('admin','organizer','member');
create type public.club_privacy as enum ('public','private','invite_only');
create type public.gender as enum ('male','female','other','unspecified');
create type public.skill_level as enum ('beginner','intermediate','advanced','league');
create type public.event_type as enum ('singles_tournament','doubles_tournament','mixed_doubles','league','ladder','round_robin','knockout','casual','training','rotating_doubles','custom');
create type public.event_status as enum ('draft','published','registration_open','registration_closed','in_progress','completed','cancelled');
create type public.registration_status as enum ('pending','approved','rejected','waitlist','cancelled');
create type public.match_status as enum ('scheduled','in_progress','completed','cancelled','walkover','retired');
create type public.discipline as enum ('singles','doubles','mixed');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  gender public.gender not null default 'unspecified',
  skill_level public.skill_level not null default 'beginner',
  rating_singles numeric not null default 1200,
  rating_doubles numeric not null default 1200,
  rating_mixed numeric not null default 1200,
  dominant_hand text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users view own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'super_admin'));
create policy "super admin manages roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

-- Auto-create profile + default player role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'player');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clubs
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location text,
  logo_url text,
  privacy public.club_privacy not null default 'public',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.clubs enable row level security;

create table public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.club_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);
alter table public.club_members enable row level security;

create or replace function public.is_club_member(_club_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.club_members where club_id = _club_id and user_id = _user_id)
$$;

create or replace function public.is_club_admin(_club_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.club_members
    where club_id = _club_id and user_id = _user_id and role in ('admin','organizer')
  ) or public.has_role(_user_id,'super_admin')
$$;

create policy "view public or member clubs" on public.clubs for select to authenticated
  using (privacy = 'public' or public.is_club_member(id, auth.uid()) or public.has_role(auth.uid(),'super_admin'));
create policy "any user can create club" on public.clubs for insert to authenticated
  with check (auth.uid() = created_by);
create policy "club admins update club" on public.clubs for update to authenticated
  using (public.is_club_admin(id, auth.uid()));
create policy "club admins delete club" on public.clubs for delete to authenticated
  using (public.is_club_admin(id, auth.uid()));

-- Auto add creator as admin member
create or replace function public.handle_new_club()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.club_members (club_id, user_id, role) values (new.id, new.created_by, 'admin');
  return new;
end; $$;
create trigger on_club_created after insert on public.clubs
  for each row execute function public.handle_new_club();

create policy "view members of own clubs" on public.club_members for select to authenticated
  using (public.is_club_member(club_id, auth.uid()) or public.has_role(auth.uid(),'super_admin'));
create policy "self join public club" on public.club_members for insert to authenticated
  with check (
    auth.uid() = user_id and (
      exists (select 1 from public.clubs c where c.id = club_id and c.privacy = 'public')
      or public.is_club_admin(club_id, auth.uid())
    )
  );
create policy "club admin manages members" on public.club_members for update to authenticated
  using (public.is_club_admin(club_id, auth.uid()));
create policy "club admin removes members" on public.club_members for delete to authenticated
  using (public.is_club_admin(club_id, auth.uid()) or auth.uid() = user_id);

-- Courts
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  surface text,
  indoor boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.courts enable row level security;
create policy "view courts of accessible clubs" on public.courts for select to authenticated
  using (public.is_club_member(club_id, auth.uid()) or exists(select 1 from public.clubs c where c.id = club_id and c.privacy='public'));
create policy "club admin manages courts" on public.courts for all to authenticated
  using (public.is_club_admin(club_id, auth.uid())) with check (public.is_club_admin(club_id, auth.uid()));

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  description text,
  event_type public.event_type not null,
  discipline public.discipline not null default 'singles',
  starts_at timestamptz,
  ends_at timestamptz,
  registration_deadline timestamptz,
  max_participants int,
  allow_waitlist boolean not null default true,
  auto_approve boolean not null default true,
  ranking_impact boolean not null default true,
  status public.event_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "view events of accessible clubs" on public.events for select to authenticated
  using (
    public.is_club_member(club_id, auth.uid())
    or exists(select 1 from public.clubs c where c.id = club_id and c.privacy='public' and status <> 'draft')
  );
create policy "organizers manage events" on public.events for all to authenticated
  using (public.is_club_admin(club_id, auth.uid())) with check (public.is_club_admin(club_id, auth.uid()));

-- Registrations
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id),
  status public.registration_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
alter table public.event_registrations enable row level security;
create policy "view own or organizer registrations" on public.event_registrations for select to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = partner_id
    or exists(select 1 from public.events e where e.id = event_id and public.is_club_admin(e.club_id, auth.uid()))
  );
create policy "self register" on public.event_registrations for insert to authenticated
  with check (auth.uid() = user_id);
create policy "organizer or self update registration" on public.event_registrations for update to authenticated
  using (
    auth.uid() = user_id
    or exists(select 1 from public.events e where e.id = event_id and public.is_club_admin(e.club_id, auth.uid()))
  );
create policy "organizer or self cancel registration" on public.event_registrations for delete to authenticated
  using (
    auth.uid() = user_id
    or exists(select 1 from public.events e where e.id = event_id and public.is_club_admin(e.club_id, auth.uid()))
  );

-- Matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  court_id uuid references public.courts(id),
  player1_id uuid references auth.users(id),
  player2_id uuid references auth.users(id),
  player3_id uuid references auth.users(id),
  player4_id uuid references auth.users(id),
  starts_at timestamptz,
  status public.match_status not null default 'scheduled',
  score text,
  winner_side smallint, -- 1 or 2
  notes text,
  created_at timestamptz not null default now()
);
alter table public.matches enable row level security;
create policy "view matches accessible" on public.matches for select to authenticated
  using (
    public.is_club_member(club_id, auth.uid())
    or exists(select 1 from public.clubs c where c.id = club_id and c.privacy='public')
  );
create policy "organizer manages matches" on public.matches for all to authenticated
  using (public.is_club_admin(club_id, auth.uid())) with check (public.is_club_admin(club_id, auth.uid()));

-- Rankings
create table public.rankings (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  discipline public.discipline not null default 'singles',
  rating numeric not null default 1200,
  matches_played int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  updated_at timestamptz not null default now(),
  unique (club_id, user_id, discipline)
);
alter table public.rankings enable row level security;
create policy "view rankings of accessible clubs" on public.rankings for select to authenticated
  using (
    public.is_club_member(club_id, auth.uid())
    or exists(select 1 from public.clubs c where c.id = club_id and c.privacy='public')
  );
create policy "organizer manages rankings" on public.rankings for all to authenticated
  using (public.is_club_admin(club_id, auth.uid())) with check (public.is_club_admin(club_id, auth.uid()));
