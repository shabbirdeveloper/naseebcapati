-- Naseeb Chapati production content and operations storage.
-- Run this file once in Supabase SQL Editor before using the connected admin.

create table if not exists public.naseeb_content_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.naseeb_operations_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.naseeb_set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists naseeb_content_updated_at on public.naseeb_content_state;
create trigger naseeb_content_updated_at
before update on public.naseeb_content_state
for each row execute function public.naseeb_set_updated_at();

drop trigger if exists naseeb_operations_updated_at on public.naseeb_operations_state;
create trigger naseeb_operations_updated_at
before update on public.naseeb_operations_state
for each row execute function public.naseeb_set_updated_at();

alter table public.naseeb_content_state enable row level security;
alter table public.naseeb_operations_state enable row level security;

drop policy if exists "Public can read Naseeb content" on public.naseeb_content_state;
create policy "Public can read Naseeb content"
on public.naseeb_content_state for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated admins can insert content" on public.naseeb_content_state;
create policy "Authenticated admins can insert content"
on public.naseeb_content_state for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can update content" on public.naseeb_content_state;
create policy "Authenticated admins can update content"
on public.naseeb_content_state for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can read operations" on public.naseeb_operations_state;
create policy "Authenticated admins can read operations"
on public.naseeb_operations_state for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Authenticated admins can insert operations" on public.naseeb_operations_state;
create policy "Authenticated admins can insert operations"
on public.naseeb_operations_state for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can update operations" on public.naseeb_operations_state;
create policy "Authenticated admins can update operations"
on public.naseeb_operations_state for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

insert into public.naseeb_content_state (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.naseeb_operations_state (id, payload)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- Publicly served restaurant media. Upload, update, and delete remain admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'naseeb-media',
  'naseeb-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/avif']::text[];

drop policy if exists "Public can read Naseeb media" on storage.objects;
create policy "Public can read Naseeb media"
on storage.objects for select
to public
using (bucket_id = 'naseeb-media');

drop policy if exists "Authenticated admins can upload Naseeb media" on storage.objects;
create policy "Authenticated admins can upload Naseeb media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'naseeb-media' and auth.uid() is not null);

drop policy if exists "Authenticated admins can update Naseeb media" on storage.objects;
create policy "Authenticated admins can update Naseeb media"
on storage.objects for update
to authenticated
using (bucket_id = 'naseeb-media' and auth.uid() is not null)
with check (bucket_id = 'naseeb-media' and auth.uid() is not null);

drop policy if exists "Authenticated admins can delete Naseeb media" on storage.objects;
create policy "Authenticated admins can delete Naseeb media"
on storage.objects for delete
to authenticated
using (bucket_id = 'naseeb-media' and auth.uid() is not null);

-- Public forms write into dedicated tables; staff can review and update them in Admin.
create extension if not exists pgcrypto;

create table if not exists public.naseeb_reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 7 and 40),
  email text,
  branch text not null,
  reservation_date date not null,
  reservation_time time not null,
  guests integer not null default 2 check (guests between 1 and 50),
  special_request text,
  status text not null default 'New' check (status in ('New', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'No Show')),
  internal_notes text,
  assigned_staff text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.naseeb_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 7 and 40),
  email text not null,
  branch text not null,
  subject text not null check (char_length(trim(subject)) between 2 and 160),
  message text not null check (char_length(trim(message)) between 2 and 4000),
  status text not null default 'New' check (status in ('New', 'In Progress', 'Resolved', 'Spam')),
  internal_notes text,
  assigned_staff text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists naseeb_reservations_updated_at on public.naseeb_reservations;
create trigger naseeb_reservations_updated_at
before update on public.naseeb_reservations
for each row execute function public.naseeb_set_updated_at();

drop trigger if exists naseeb_enquiries_updated_at on public.naseeb_enquiries;
create trigger naseeb_enquiries_updated_at
before update on public.naseeb_enquiries
for each row execute function public.naseeb_set_updated_at();

create index if not exists naseeb_reservations_created_at_idx on public.naseeb_reservations (created_at desc);
create index if not exists naseeb_reservations_branch_date_idx on public.naseeb_reservations (branch, reservation_date);
create index if not exists naseeb_reservations_status_idx on public.naseeb_reservations (status);
create index if not exists naseeb_enquiries_created_at_idx on public.naseeb_enquiries (created_at desc);
create index if not exists naseeb_enquiries_branch_status_idx on public.naseeb_enquiries (branch, status);

alter table public.naseeb_reservations enable row level security;
alter table public.naseeb_enquiries enable row level security;

drop policy if exists "Guests can submit reservations" on public.naseeb_reservations;
create policy "Guests can submit reservations"
on public.naseeb_reservations for insert
to anon, authenticated
with check (status = 'New');

drop policy if exists "Authenticated admins can read reservations" on public.naseeb_reservations;
create policy "Authenticated admins can read reservations"
on public.naseeb_reservations for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Authenticated admins can update reservations" on public.naseeb_reservations;
create policy "Authenticated admins can update reservations"
on public.naseeb_reservations for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can delete reservations" on public.naseeb_reservations;
create policy "Authenticated admins can delete reservations"
on public.naseeb_reservations for delete
to authenticated
using (auth.uid() is not null);

drop policy if exists "Guests can submit enquiries" on public.naseeb_enquiries;
create policy "Guests can submit enquiries"
on public.naseeb_enquiries for insert
to anon, authenticated
with check (status = 'New');

drop policy if exists "Authenticated admins can read enquiries" on public.naseeb_enquiries;
create policy "Authenticated admins can read enquiries"
on public.naseeb_enquiries for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Authenticated admins can update enquiries" on public.naseeb_enquiries;
create policy "Authenticated admins can update enquiries"
on public.naseeb_enquiries for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can delete enquiries" on public.naseeb_enquiries;
create policy "Authenticated admins can delete enquiries"
on public.naseeb_enquiries for delete
to authenticated
using (auth.uid() is not null);

-- Finance and HR CRM tables. All records are staff-only and protected by RLS.
create table if not exists public.naseeb_finance_transactions (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('Income', 'Expense')),
  description text not null check (char_length(trim(description)) between 2 and 240),
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  branch text not null,
  payment_method text not null default 'Other',
  reference text,
  status text not null default 'Posted' check (status in ('Posted', 'Pending', 'Void')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.naseeb_staff (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  role text not null,
  branch text not null,
  phone text,
  email text,
  employment_type text not null default 'Full-time' check (employment_type in ('Full-time', 'Part-time', 'Contract')),
  monthly_salary numeric(12,2) not null default 0 check (monthly_salary >= 0),
  start_date date,
  status text not null default 'Active' check (status in ('Active', 'On Leave', 'Inactive')),
  emergency_contact text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.naseeb_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.naseeb_staff(id) on delete cascade,
  staff_name text not null,
  employee_code text not null,
  branch text not null,
  attendance_date date not null,
  status text not null default 'Present' check (status in ('Present', 'Absent', 'Late', 'Leave')),
  clock_in time,
  clock_out time,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (staff_id, attendance_date)
);

create table if not exists public.naseeb_leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.naseeb_staff(id) on delete cascade,
  staff_name text not null,
  employee_code text not null,
  branch text not null,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_date >= start_date)
);

drop trigger if exists naseeb_finance_updated_at on public.naseeb_finance_transactions;
create trigger naseeb_finance_updated_at before update on public.naseeb_finance_transactions for each row execute function public.naseeb_set_updated_at();
drop trigger if exists naseeb_staff_updated_at on public.naseeb_staff;
create trigger naseeb_staff_updated_at before update on public.naseeb_staff for each row execute function public.naseeb_set_updated_at();
drop trigger if exists naseeb_attendance_updated_at on public.naseeb_attendance;
create trigger naseeb_attendance_updated_at before update on public.naseeb_attendance for each row execute function public.naseeb_set_updated_at();
drop trigger if exists naseeb_leave_updated_at on public.naseeb_leave_requests;
create trigger naseeb_leave_updated_at before update on public.naseeb_leave_requests for each row execute function public.naseeb_set_updated_at();

create index if not exists naseeb_finance_date_idx on public.naseeb_finance_transactions (transaction_date desc);
create index if not exists naseeb_finance_branch_type_idx on public.naseeb_finance_transactions (branch, entry_type);
create index if not exists naseeb_staff_branch_status_idx on public.naseeb_staff (branch, status);
create index if not exists naseeb_attendance_date_idx on public.naseeb_attendance (attendance_date desc);
create index if not exists naseeb_attendance_staff_idx on public.naseeb_attendance (staff_id, attendance_date desc);
create index if not exists naseeb_leave_status_idx on public.naseeb_leave_requests (status, start_date);

alter table public.naseeb_finance_transactions enable row level security;
alter table public.naseeb_staff enable row level security;
alter table public.naseeb_attendance enable row level security;
alter table public.naseeb_leave_requests enable row level security;

drop policy if exists "Authenticated admins can read finance" on public.naseeb_finance_transactions;
create policy "Authenticated admins can read finance" on public.naseeb_finance_transactions for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated admins can insert finance" on public.naseeb_finance_transactions;
create policy "Authenticated admins can insert finance" on public.naseeb_finance_transactions for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can update finance" on public.naseeb_finance_transactions;
create policy "Authenticated admins can update finance" on public.naseeb_finance_transactions for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can delete finance" on public.naseeb_finance_transactions;
create policy "Authenticated admins can delete finance" on public.naseeb_finance_transactions for delete to authenticated using (auth.uid() is not null);

drop policy if exists "Authenticated admins can read staff" on public.naseeb_staff;
create policy "Authenticated admins can read staff" on public.naseeb_staff for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated admins can insert staff" on public.naseeb_staff;
create policy "Authenticated admins can insert staff" on public.naseeb_staff for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can update staff" on public.naseeb_staff;
create policy "Authenticated admins can update staff" on public.naseeb_staff for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can delete staff" on public.naseeb_staff;
create policy "Authenticated admins can delete staff" on public.naseeb_staff for delete to authenticated using (auth.uid() is not null);

drop policy if exists "Authenticated admins can read attendance" on public.naseeb_attendance;
create policy "Authenticated admins can read attendance" on public.naseeb_attendance for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated admins can insert attendance" on public.naseeb_attendance;
create policy "Authenticated admins can insert attendance" on public.naseeb_attendance for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can update attendance" on public.naseeb_attendance;
create policy "Authenticated admins can update attendance" on public.naseeb_attendance for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can delete attendance" on public.naseeb_attendance;
create policy "Authenticated admins can delete attendance" on public.naseeb_attendance for delete to authenticated using (auth.uid() is not null);

drop policy if exists "Authenticated admins can read leave" on public.naseeb_leave_requests;
create policy "Authenticated admins can read leave" on public.naseeb_leave_requests for select to authenticated using (auth.uid() is not null);
drop policy if exists "Authenticated admins can insert leave" on public.naseeb_leave_requests;
create policy "Authenticated admins can insert leave" on public.naseeb_leave_requests for insert to authenticated with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can update leave" on public.naseeb_leave_requests;
create policy "Authenticated admins can update leave" on public.naseeb_leave_requests for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists "Authenticated admins can delete leave" on public.naseeb_leave_requests;
create policy "Authenticated admins can delete leave" on public.naseeb_leave_requests for delete to authenticated using (auth.uid() is not null);

-- Public leadership profiles managed by the Team Members CMS.
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  position text not null check (char_length(trim(position)) between 2 and 160),
  department text,
  short_intro text,
  biography text,
  vision text,
  quote text,
  experience text,
  qualification text,
  profile_image text,
  cover_image text,
  email text,
  phone text,
  whatsapp text,
  linkedin text,
  facebook text,
  instagram text,
  website text,
  featured boolean not null default false,
  display_order integer not null default 0 check (display_order >= 0),
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  seo_title text,
  seo_description text,
  meta_image text,
  image_alt text,
  gallery_images jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery_images) = 'array'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists team_members_updated_at on public.team_members;
create trigger team_members_updated_at
before update on public.team_members
for each row execute function public.naseeb_set_updated_at();

create index if not exists team_members_status_order_idx
on public.team_members (status, featured desc, display_order, full_name);

create index if not exists team_members_published_order_idx
on public.team_members (featured desc, display_order, full_name)
where status = 'Published';

create index if not exists team_members_department_idx
on public.team_members (department)
where department is not null;

alter table public.team_members enable row level security;

drop policy if exists "Public can read published team members" on public.team_members;
create policy "Public can read published team members"
on public.team_members for select
to anon
using (status = 'Published');

drop policy if exists "Authenticated admins can read team members" on public.team_members;
create policy "Authenticated admins can read team members"
on public.team_members for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Authenticated admins can insert team members" on public.team_members;
create policy "Authenticated admins can insert team members"
on public.team_members for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can update team members" on public.team_members;
create policy "Authenticated admins can update team members"
on public.team_members for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Authenticated admins can delete team members" on public.team_members;
create policy "Authenticated admins can delete team members"
on public.team_members for delete
to authenticated
using (auth.uid() is not null);
