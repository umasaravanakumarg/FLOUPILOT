create extension if not exists pgcrypto;

create type public.tenant_role as enum ('owner', 'admin', 'member');
create type public.production_role as enum ('producer', 'finance', 'approver', 'viewer');
create type public.production_status as enum ('on_track', 'watch', 'at_risk');
create type public.expense_status as enum ('draft', 'pending', 'approved', 'rejected', 'paid');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'paid');
create type public.approval_priority as enum ('high', 'medium', 'low');
create type public.vendor_risk as enum ('low', 'medium', 'high');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.productions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  production_type text not null check (length(trim(production_type)) between 1 and 100),
  industry text not null check (length(trim(industry)) between 1 and 100),
  status public.production_status not null default 'on_track',
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);
create unique index productions_tenant_name_lower_idx
  on public.productions (tenant_id, lower(name));

create table public.production_memberships (
  tenant_id uuid not null,
  production_id uuid not null,
  user_id uuid not null,
  role public.production_role not null,
  created_at timestamptz not null default now(),
  primary key (production_id, user_id),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, user_id) references public.tenant_memberships(tenant_id, user_id) on delete cascade
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  unique (tenant_id, production_id, id),
  unique (production_id, name),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade
);
create unique index departments_production_name_lower_idx
  on public.departments (production_id, lower(name));

create table public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  department_id uuid not null,
  original_paise bigint not null check (original_paise between 0 and 9007199254740991),
  revised_paise bigint not null check (revised_paise between 0 and 9007199254740991),
  updated_at timestamptz not null default now(),
  unique (tenant_id, production_id, department_id),
  foreign key (tenant_id, production_id, department_id)
    references public.departments(tenant_id, production_id, id) on delete cascade
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  category text not null default 'Unclassified' check (length(trim(category)) between 1 and 120),
  contact text check (contact is null or length(contact) <= 254),
  risk public.vendor_risk not null default 'low',
  created_at timestamptz not null default now(),
  unique (tenant_id, production_id, id),
  unique (production_id, name),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade
);
create unique index vendors_production_name_lower_idx
  on public.vendors (production_id, lower(name));

create table public.crew_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  department_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  role text not null check (length(trim(role)) between 1 and 120),
  due_paise bigint not null check (due_paise between 0 and 9007199254740991),
  next_payment_date date,
  created_at timestamptz not null default now(),
  unique (tenant_id, production_id, id),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, production_id, department_id)
    references public.departments(tenant_id, production_id, id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  department_id uuid not null,
  vendor_id uuid,
  vendor_name text not null check (length(trim(vendor_name)) between 1 and 160),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 4000),
  expense_date date not null,
  amount_paise bigint not null check (amount_paise between 1 and 9007199254740991),
  status public.expense_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, production_id, id),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, production_id, department_id)
    references public.departments(tenant_id, production_id, id),
  foreign key (tenant_id, production_id, vendor_id)
    references public.vendors(tenant_id, production_id, id)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  expense_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  owner text not null check (length(trim(owner)) between 1 and 160),
  amount_paise bigint not null check (amount_paise between 1 and 9007199254740991),
  priority public.approval_priority not null default 'medium',
  status public.approval_status not null default 'pending',
  rationale text not null default '' check (length(rationale) <= 2000),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, production_id, id),
  unique (tenant_id, expense_id),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, production_id, expense_id)
    references public.expenses(tenant_id, production_id, id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  production_id uuid not null,
  expense_id uuid,
  approval_id uuid,
  crew_id uuid,
  amount_paise bigint not null check (amount_paise between 1 and 9007199254740991),
  paid_at date not null default current_date,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (num_nonnulls(expense_id, approval_id, crew_id) = 1),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, production_id, expense_id)
    references public.expenses(tenant_id, production_id, id),
  foreign key (tenant_id, production_id, approval_id)
    references public.approvals(tenant_id, production_id, id),
  foreign key (tenant_id, production_id, crew_id)
    references public.crew_members(tenant_id, production_id, id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  production_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, production_id) references public.productions(tenant_id, id) on delete cascade
);

create index production_memberships_user_idx on public.production_memberships(user_id, production_id);
create index departments_production_idx on public.departments(production_id);
create index expenses_production_status_idx on public.expenses(production_id, status, expense_date desc);
create index approvals_production_status_idx on public.approvals(production_id, status, created_at desc);
create index vendors_production_idx on public.vendors(production_id);
create index crew_production_idx on public.crew_members(production_id);
create index payments_production_paid_at_idx on public.payments(production_id, paid_at desc);
create index payments_crew_idx on public.payments(crew_id) where crew_id is not null;
create index audit_events_production_created_idx on public.audit_events(production_id, created_at desc);

create function public.has_tenant_role(p_tenant_id uuid, p_roles public.tenant_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.role = any (p_roles)
  );
$$;

create function public.has_production_role(p_production_id uuid, p_roles public.production_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.productions p
    join public.tenant_memberships tm
      on tm.tenant_id = p.tenant_id
     and tm.user_id = (select auth.uid())
    left join public.production_memberships pm
      on pm.tenant_id = p.tenant_id
     and pm.production_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = p_production_id
      and (
        tm.role in ('owner', 'admin')
        or pm.role = any (p_roles)
      )
  );
$$;

create function public.can_access_production(p_production_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.productions p
    join public.tenant_memberships tm
      on tm.tenant_id = p.tenant_id
     and tm.user_id = (select auth.uid())
    left join public.production_memberships pm
      on pm.tenant_id = p.tenant_id
     and pm.production_id = p.id
     and pm.user_id = (select auth.uid())
    where p.id = p_production_id
      and (tm.role in ('owner', 'admin') or pm.user_id is not null)
  );
$$;

create function public.current_user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tm.tenant_id
  from public.tenant_memberships tm
  where tm.user_id = (select auth.uid());
$$;

create function public.capture_financial_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_data jsonb;
  before_data jsonb;
  after_data jsonb;
  tenant_value uuid;
  production_value uuid;
  entity_value uuid;
begin
  row_data := to_jsonb(new);
  after_data := row_data;
  if tg_op = 'UPDATE' then
    before_data := to_jsonb(old);
  end if;

  tenant_value := (row_data ->> 'tenant_id')::uuid;
  production_value := coalesce(
    (row_data ->> 'production_id')::uuid,
    (row_data ->> 'id')::uuid
  );
  entity_value := (row_data ->> 'id')::uuid;

  insert into public.audit_events (
    tenant_id, production_id, actor_id, entity_type, entity_id,
    action, old_values, new_values
  ) values (
    tenant_value, production_value, (select auth.uid()), tg_table_name,
    entity_value, lower(tg_op), before_data, after_data
  );
  return new;
end;
$$;

create trigger audit_productions
after insert or update on public.productions
for each row execute function public.capture_financial_audit_event();
create trigger audit_departments
after insert or update on public.departments
for each row execute function public.capture_financial_audit_event();
create trigger audit_budget_allocations
after insert or update on public.budget_allocations
for each row execute function public.capture_financial_audit_event();
create trigger audit_expenses
after insert or update on public.expenses
for each row execute function public.capture_financial_audit_event();
create trigger audit_approvals
after insert or update on public.approvals
for each row execute function public.capture_financial_audit_event();
create trigger audit_vendors
after insert or update on public.vendors
for each row execute function public.capture_financial_audit_event();
create trigger audit_crew_members
after insert or update on public.crew_members
for each row execute function public.capture_financial_audit_event();
create trigger audit_payments
after insert or update on public.payments
for each row execute function public.capture_financial_audit_event();

alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.production_memberships enable row level security;
alter table public.productions enable row level security;
alter table public.departments enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.expenses enable row level security;
alter table public.approvals enable row level security;
alter table public.vendors enable row level security;
alter table public.crew_members enable row level security;
alter table public.payments enable row level security;
alter table public.audit_events enable row level security;

create policy tenants_read_member on public.tenants
for select to authenticated using (id in (select public.current_user_tenant_ids()));
create policy tenant_memberships_read_self on public.tenant_memberships
for select to authenticated using (user_id = (select auth.uid()));
create policy production_memberships_read_self on public.production_memberships
for select to authenticated using (user_id = (select auth.uid()));
create policy productions_read_member on public.productions
for select to authenticated using (public.can_access_production(id));

create policy departments_read_member on public.departments
for select to authenticated using (public.can_access_production(production_id));
create policy budgets_read_member on public.budget_allocations
for select to authenticated using (public.can_access_production(production_id));
create policy expenses_read_member on public.expenses
for select to authenticated using (public.can_access_production(production_id));
create policy approvals_read_member on public.approvals
for select to authenticated using (public.can_access_production(production_id));
create policy vendors_read_member on public.vendors
for select to authenticated using (public.can_access_production(production_id));
create policy crew_read_member on public.crew_members
for select to authenticated using (public.can_access_production(production_id));
create policy payments_read_member on public.payments
for select to authenticated using (public.can_access_production(production_id));
create policy audit_events_read_member on public.audit_events
for select to authenticated using (public.can_access_production(production_id));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.tenants, public.tenant_memberships, public.production_memberships,
  public.productions, public.departments, public.budget_allocations, public.expenses,
  public.approvals, public.vendors, public.crew_members, public.payments,
  public.audit_events to authenticated;

revoke all on function public.has_tenant_role(uuid, public.tenant_role[]) from public, anon;
revoke all on function public.has_production_role(uuid, public.production_role[]) from public, anon;
revoke all on function public.can_access_production(uuid) from public, anon;
revoke all on function public.current_user_tenant_ids() from public, anon;
revoke all on function public.capture_financial_audit_event() from public, anon, authenticated;
grant execute on function public.has_tenant_role(uuid, public.tenant_role[]) to authenticated;
grant execute on function public.has_production_role(uuid, public.production_role[]) to authenticated;
grant execute on function public.can_access_production(uuid) to authenticated;
grant execute on function public.current_user_tenant_ids() to authenticated;

create function public.create_production(
  p_tenant_id uuid,
  p_name text,
  p_type text,
  p_industry text,
  p_department_name text,
  p_budget_paise bigint
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_production_id uuid;
  new_department_id uuid;
begin
  if not public.has_tenant_role(p_tenant_id, array['owner', 'admin']::public.tenant_role[]) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if length(trim(p_name)) not between 1 and 160
    or length(trim(p_type)) not between 1 and 100
    or length(trim(p_industry)) not between 1 and 100
    or length(trim(p_department_name)) not between 1 and 120
    or p_budget_paise not between 1 and 9007199254740991 then
    raise exception 'invalid production input' using errcode = '22023';
  end if;

  insert into public.productions (tenant_id, name, production_type, industry)
  values (p_tenant_id, trim(p_name), trim(p_type), trim(p_industry))
  returning id into new_production_id;

  insert into public.production_memberships (tenant_id, production_id, user_id, role)
  values (p_tenant_id, new_production_id, (select auth.uid()), 'producer');

  insert into public.departments (tenant_id, production_id, name)
  values (p_tenant_id, new_production_id, trim(p_department_name))
  returning id into new_department_id;

  insert into public.budget_allocations (
    tenant_id, production_id, department_id, original_paise, revised_paise
  ) values (
    p_tenant_id, new_production_id, new_department_id, p_budget_paise, p_budget_paise
  );
  return new_production_id;
end;
$$;

create function public.update_production(
  p_production_id uuid, p_name text, p_type text, p_industry text, p_status public.production_status
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.has_production_role(p_production_id, array['producer']::public.production_role[]) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if length(trim(p_name)) not between 1 and 160
    or length(trim(p_type)) not between 1 and 100
    or length(trim(p_industry)) not between 1 and 100 then
    raise exception 'invalid production input' using errcode = '22023';
  end if;
  update public.productions
  set name = trim(p_name), production_type = trim(p_type),
      industry = trim(p_industry), status = p_status
  where id = p_production_id;
  if not found then raise exception 'production not found' using errcode = 'P0002'; end if;
end;
$$;

create function public.create_expense(
  p_production_id uuid,
  p_department_id uuid,
  p_title text,
  p_vendor_name text,
  p_expense_date date,
  p_amount_paise bigint,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tenant_value uuid;
  vendor_value uuid;
  new_expense_id uuid;
begin
  if not public.has_production_role(p_production_id, array['producer', 'finance']::public.production_role[]) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if length(trim(p_title)) not between 1 and 200
    or length(trim(p_vendor_name)) not between 1 and 160
    or length(p_description) > 4000
    or p_amount_paise not between 1 and 9007199254740991 then
    raise exception 'invalid expense input' using errcode = '22023';
  end if;
  select tenant_id into tenant_value from public.productions where id = p_production_id;
  if tenant_value is null then raise exception 'production not found' using errcode = 'P0002'; end if;
  if not exists (
    select 1 from public.departments
    where id = p_department_id and production_id = p_production_id and tenant_id = tenant_value
  ) then
    raise exception 'department not found' using errcode = '22023';
  end if;
  select id into vendor_value from public.vendors
  where production_id = p_production_id and lower(name) = lower(trim(p_vendor_name))
  limit 1;
  insert into public.expenses (
    tenant_id, production_id, department_id, vendor_id, vendor_name,
    title, description, expense_date, amount_paise, created_by
  ) values (
    tenant_value, p_production_id, p_department_id, vendor_value, trim(p_vendor_name),
    trim(p_title), coalesce(p_description, ''), p_expense_date, p_amount_paise, (select auth.uid())
  ) returning id into new_expense_id;
  return new_expense_id;
end;
$$;

create function public.submit_expense(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expense_row public.expenses%rowtype;
begin
  select * into expense_row from public.expenses where id = p_expense_id for update;
  if not found or not public.has_production_role(expense_row.production_id, array['producer', 'finance']::public.production_role[]) then
    raise exception 'not authorized or not found' using errcode = '42501';
  end if;
  if expense_row.status <> 'draft' then raise exception 'invalid expense transition' using errcode = '22023'; end if;
  update public.expenses set status = 'pending' where id = expense_row.id;
  insert into public.approvals (
    tenant_id, production_id, expense_id, title, owner, amount_paise,
    priority, status, rationale
  ) values (
    expense_row.tenant_id, expense_row.production_id, expense_row.id,
    expense_row.title, 'Production Finance', expense_row.amount_paise,
    'medium', 'pending', 'Submitted expense awaiting producer approval.'
  );
end;
$$;

create function public.decide_approval(p_approval_id uuid, p_decision public.approval_status)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  approval_row public.approvals%rowtype;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  select * into approval_row from public.approvals where id = p_approval_id for update;
  if not found or not public.has_production_role(approval_row.production_id, array['producer', 'finance', 'approver']::public.production_role[]) then
    raise exception 'not authorized or not found' using errcode = '42501';
  end if;
  if approval_row.status <> 'pending' then raise exception 'approval is no longer pending' using errcode = '22023'; end if;
  if approval_row.expense_id is not null and not exists (
    select 1 from public.expenses
    where id = approval_row.expense_id
      and status = 'pending'
      and amount_paise = approval_row.amount_paise
  ) then
    raise exception 'linked expense is not pending or amount does not match approval' using errcode = '22023';
  end if;
  update public.approvals
  set status = p_decision, decided_by = (select auth.uid()), decided_at = now()
  where id = approval_row.id;
  if approval_row.expense_id is not null then
    update public.expenses set status = p_decision::text::public.expense_status
    where id = approval_row.expense_id and status = 'pending';
    if not found then raise exception 'linked expense is not pending' using errcode = '22023'; end if;
  end if;
end;
$$;

create function public.record_expense_payment(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  expense_row public.expenses%rowtype;
begin
  select * into expense_row from public.expenses where id = p_expense_id for update;
  if not found or not public.has_production_role(expense_row.production_id, array['producer', 'finance']::public.production_role[]) then
    raise exception 'not authorized or not found' using errcode = '42501';
  end if;
  if expense_row.status <> 'approved' then raise exception 'only approved expenses can be paid' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.approvals
    where expense_id = expense_row.id
      and status = 'approved'
      and amount_paise = expense_row.amount_paise
  ) then
    raise exception 'approved linked approval with matching amount is required before payment' using errcode = '22023';
  end if;
  insert into public.payments (
    tenant_id, production_id, expense_id, amount_paise, paid_at, recorded_by
  ) values (
    expense_row.tenant_id, expense_row.production_id, expense_row.id,
    expense_row.amount_paise, current_date, (select auth.uid())
  );
  update public.expenses set status = 'paid' where id = expense_row.id;
  update public.approvals
  set status = 'paid'
  where expense_id = expense_row.id and status = 'approved';
  if not found then raise exception 'linked approval is no longer approved' using errcode = '22023'; end if;
end;
$$;

create function public.record_approval_payment(p_approval_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  approval_row public.approvals%rowtype;
begin
  select * into approval_row from public.approvals where id = p_approval_id for update;
  if not found or not public.has_production_role(approval_row.production_id, array['producer', 'finance']::public.production_role[]) then
    raise exception 'not authorized or not found' using errcode = '42501';
  end if;
  if approval_row.status <> 'approved' or approval_row.expense_id is not null then
    raise exception 'only approved standalone requests can be paid here' using errcode = '22023';
  end if;
  insert into public.payments (
    tenant_id, production_id, approval_id, amount_paise, paid_at, recorded_by
  ) values (
    approval_row.tenant_id, approval_row.production_id, approval_row.id,
    approval_row.amount_paise, current_date, (select auth.uid())
  );
  update public.approvals set status = 'paid' where id = approval_row.id;
end;
$$;

create function public.revise_budget(p_department_id uuid, p_revised_paise bigint)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  production_value uuid;
begin
  select production_id into production_value
  from public.budget_allocations where department_id = p_department_id for update;
  if production_value is null
    or not public.has_production_role(production_value, array['producer', 'finance']::public.production_role[]) then
    raise exception 'not authorized or not found' using errcode = '42501';
  end if;
  if p_revised_paise not between 1 and 9007199254740991 then
    raise exception 'budget must be a positive safe integer in paise' using errcode = '22023';
  end if;
  update public.budget_allocations
  set revised_paise = p_revised_paise, updated_at = now()
  where department_id = p_department_id;
end;
$$;

create function public.record_crew_payment(p_crew_id uuid, p_amount_paise bigint, p_paid_at date)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  crew_row public.crew_members%rowtype;
  already_paid bigint;
begin
  select * into crew_row from public.crew_members where id = p_crew_id for update;
  if not found or not public.has_production_role(crew_row.production_id, array['producer', 'finance']::public.production_role[]) then
    raise exception 'not authorized or not found' using errcode = '42501';
  end if;
  if p_amount_paise not between 1 and 9007199254740991 then
    raise exception 'payment must be a positive safe integer in paise' using errcode = '22023';
  end if;
  select coalesce(sum(amount_paise), 0) into already_paid
  from public.payments where crew_id = crew_row.id;
  if p_amount_paise > crew_row.due_paise - already_paid then
    raise exception 'payment exceeds outstanding crew amount' using errcode = '22023';
  end if;
  insert into public.payments (
    tenant_id, production_id, crew_id, amount_paise, paid_at, recorded_by
  ) values (
    crew_row.tenant_id, crew_row.production_id, crew_row.id,
    p_amount_paise, p_paid_at, (select auth.uid())
  );
end;
$$;

revoke all on function public.create_production(uuid, text, text, text, text, bigint) from public, anon;
revoke all on function public.update_production(uuid, text, text, text, public.production_status) from public, anon;
revoke all on function public.create_expense(uuid, uuid, text, text, date, bigint, text) from public, anon;
revoke all on function public.submit_expense(uuid) from public, anon;
revoke all on function public.decide_approval(uuid, public.approval_status) from public, anon;
revoke all on function public.record_expense_payment(uuid) from public, anon;
revoke all on function public.record_approval_payment(uuid) from public, anon;
revoke all on function public.revise_budget(uuid, bigint) from public, anon;
revoke all on function public.record_crew_payment(uuid, bigint, date) from public, anon;

grant execute on function public.create_production(uuid, text, text, text, text, bigint) to authenticated;
grant execute on function public.update_production(uuid, text, text, text, public.production_status) to authenticated;
grant execute on function public.create_expense(uuid, uuid, text, text, date, bigint, text) to authenticated;
grant execute on function public.submit_expense(uuid) to authenticated;
grant execute on function public.decide_approval(uuid, public.approval_status) to authenticated;
grant execute on function public.record_expense_payment(uuid) to authenticated;
grant execute on function public.record_approval_payment(uuid) to authenticated;
grant execute on function public.revise_budget(uuid, bigint) to authenticated;
grant execute on function public.record_crew_payment(uuid, bigint, date) to authenticated;
