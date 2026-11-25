create type public.app_role as enum ('admin','user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.product_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  published boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.product_pages to anon;
grant select, insert, update, delete on public.product_pages to authenticated;
grant all on public.product_pages to service_role;
alter table public.product_pages enable row level security;
create policy "public reads published" on public.product_pages for select to anon, authenticated using (published = true);
create policy "admin read" on public.product_pages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin insert" on public.product_pages for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.product_pages for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.product_pages for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger product_pages_touch before update on public.product_pages for each row execute function public.touch_updated_at();

create policy "public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));