create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_range text,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null,
  value numeric not null,
  value2 numeric,
  source text not null default 'manual',
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index readings_user_time on public.readings(user_id, measured_at desc);
grant select, insert, update, delete on public.readings to authenticated;
grant all on public.readings to service_role;
alter table public.readings enable row level security;

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  mood int, sleep_quality int,
  symptoms text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);
create index checkins_user_time on public.checkins(user_id, created_at desc);
grant select, insert, update, delete on public.checkins to authenticated;
grant all on public.checkins to service_role;
alter table public.checkins enable row level security;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 10),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.teams to authenticated;
grant all on public.teams to service_role;
alter table public.teams enable row level security;

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('member','helper')),
  sharing boolean not null default false,
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
grant select, delete on public.team_members to authenticated;
grant all on public.team_members to service_role;
alter table public.team_members enable row level security;

create or replace function public.is_team_member(_team uuid, _user uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = _team and user_id = _user) $$;
create or replace function public.can_view_health(_viewer uuid, _owner uuid) returns boolean language sql stable security definer set search_path = public as $$
  select _viewer = _owner or exists (
    select 1 from team_members h join team_members m on m.team_id = h.team_id
    where h.user_id = _viewer and h.role = 'helper' and m.user_id = _owner and m.sharing) $$;

create policy "view readings" on public.readings for select to authenticated using (public.can_view_health(auth.uid(), user_id));
create policy "own readings insert" on public.readings for insert to authenticated with check (user_id = auth.uid());
create policy "own readings delete" on public.readings for delete to authenticated using (user_id = auth.uid());
create policy "view checkins" on public.checkins for select to authenticated using (public.can_view_health(auth.uid(), user_id));
create policy "own checkins insert" on public.checkins for insert to authenticated with check (user_id = auth.uid());
create policy "own checkins delete" on public.checkins for delete to authenticated using (user_id = auth.uid());

create policy "members see team" on public.teams for select to authenticated using (public.is_team_member(id, auth.uid()) or created_by = auth.uid());
create policy "create team" on public.teams for insert to authenticated with check (created_by = auth.uid());
create policy "creator deletes team" on public.teams for delete to authenticated using (created_by = auth.uid());
create policy "members see members" on public.team_members for select to authenticated using (public.is_team_member(team_id, auth.uid()));
create policy "leave team" on public.team_members for delete to authenticated using (user_id = auth.uid() or exists (select 1 from teams t where t.id = team_id and t.created_by = auth.uid()));

-- creator becomes helper automatically
create or replace function public.add_team_creator() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into team_members (team_id, user_id, role, sharing, display_name)
  values (new.id, new.created_by, 'helper', false, (select display_name from profiles where id = new.created_by));
  return new;
end $$;
create trigger on_team_created after insert on public.teams for each row execute function public.add_team_creator();

create or replace function public.join_team(_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into t from teams where invite_code = _code;
  if t is null then raise exception 'invalid invite'; end if;
  insert into team_members (team_id, user_id, role, sharing, display_name)
  values (t, auth.uid(), 'member', false, (select display_name from profiles where id = auth.uid()))
  on conflict do nothing;
  return t;
end $$;

create or replace function public.set_sharing(_team uuid, _on boolean) returns void language sql security definer set search_path = public as $$
  update team_members set sharing = _on where team_id = _team and user_id = auth.uid() $$;

revoke execute on function public.join_team(text), public.set_sharing(uuid, boolean) from anon, public;
grant execute on function public.join_team(text), public.set_sharing(uuid, boolean), public.is_team_member(uuid, uuid), public.can_view_health(uuid, uuid) to authenticated;