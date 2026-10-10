begin;

set local search_path = public, extensions, auth;

select plan(75);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'producer@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'finance@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'approver@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'viewer@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'unassigned@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated', 'foreign@test.invalid', '', now(), '{}', '{}', now(), now()),
  ('10000000-0000-4000-8000-000000000008', 'authenticated', 'authenticated', 'tenant-only@test.invalid', '', now(), '{}', '{}', now(), now());

insert into public.tenants (id, name) values
  ('20000000-0000-4000-8000-000000000001', 'Security test tenant one'),
  ('20000000-0000-4000-8000-000000000002', 'Security test tenant two');

insert into public.tenant_memberships (tenant_id, user_id, role) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'member'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'member'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'member'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'member'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000008', 'member'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007', 'member');

insert into public.productions (id, tenant_id, name, production_type, industry) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Security test production one', 'Film', 'Test'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Security test production two', 'Film', 'Test'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Security test production three', 'Film', 'Test');

insert into public.production_memberships (tenant_id, production_id, user_id, role) values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'producer'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'finance'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'approver'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'viewer'),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007', 'viewer');

insert into public.departments (id, tenant_id, production_id, name) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Security test department'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Foreign department'),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'Unassigned department');

insert into public.budget_allocations (
  tenant_id, production_id, department_id, original_paise, revised_paise
) values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 1000000, 1000000),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 1000000, 1000000),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 1000000, 1000000);

insert into public.expenses (
  id, tenant_id, production_id, department_id, vendor_name, title, expense_date,
  amount_paise, status, created_by
) values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Test vendor', 'Pending linked expense', current_date, 250000, 'pending', '10000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Test vendor', 'Draft expense', current_date, 150000, 'draft', '10000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Test vendor', 'Inconsistent linked expense', current_date, 100000, 'approved', '10000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'Test vendor', 'Mismatched linked expense', current_date, 100000, 'pending', '10000000-0000-4000-8000-000000000002');

insert into public.approvals (
  id, tenant_id, production_id, expense_id, title, owner, amount_paise, status
) values
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Linked approval', 'Test', 250000, 'pending'),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000003', 'Inconsistent approval', 'Test', 100000, 'pending'),
  ('60000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000004', 'Mismatched approval', 'Test', 200000, 'pending');

insert into public.crew_members (
  id, tenant_id, production_id, department_id, name, role, due_paise
) values
(
  '70000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
  'Test crew member', 'Crew', 500000
),
(
  '70000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
  'Maximum due crew member', 'Crew', 9007199254740991
),
(
  '70000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
  'Minimum due crew member', 'Crew', 1
);

set local role anon;
select throws_ok(
  $$select * from public.productions$$,
  '42501',
  null,
  'anonymous role cannot read production records'
);
select throws_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Anon expense', 'Test vendor', current_date, 100, ''
  )$$,
  '42501',
  null,
  'anonymous role cannot execute financial mutation functions'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000006', true);
select is((select count(*)::integer from public.productions), 0, 'authenticated user without tenant membership sees no production');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000008', true);
select is((select count(*)::integer from public.productions), 0, 'tenant member without production assignment sees no production');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000005', true);
select is((select count(*)::integer from public.productions), 1, 'viewer sees only its assigned production');
select is((select count(*)::integer from public.productions where id = '30000000-0000-4000-8000-000000000002'), 0, 'viewer cannot read another tenant production');
select throws_ok(
  $$update public.productions set name = 'Unauthorized' where id = '30000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'authenticated users cannot directly update business tables'
);
select throws_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Viewer expense', 'Test vendor', current_date, 100, ''
  )$$,
  '42501',
  null,
  'viewer cannot create an expense'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', 2000000)$$,
  '42501',
  null,
  'approver cannot revise a budget'
);
select throws_ok(
  $$select public.record_expense_payment('50000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  'approver cannot record a payment'
);
select throws_ok(
  $$select public.update_production(
    '30000000-0000-4000-8000-000000000002', 'Cross-tenant write', 'Film', 'Test', 'watch'
  )$$,
  '42501',
  null,
  'production role cannot mutate another tenant production by supplying its ID'
);
select is(
  (select count(*)::integer from pg_enum where enumtypid = 'public.production_role'::regtype and enumlabel in ('production_manager', 'department_head')),
  0,
  'unmapped Production Manager and Department Head role labels are not granted access'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.update_production(
    '30000000-0000-4000-8000-000000000001', 'Updated assigned production', 'Film', 'Test', 'watch'
  )$$,
  'producer can update the assigned production'
);
select throws_ok(
  $$select public.update_production(
    '30000000-0000-4000-8000-000000000003', 'Unauthorized same-tenant production', 'Film', 'Test', 'watch'
  )$$,
  '42501',
  null,
  'producer cannot update another production in the same tenant by changing the client production ID'
);
select lives_ok(
  $$select public.submit_expense('50000000-0000-4000-8000-000000000002')$$,
  'producer can submit a draft expense'
);
select is((select status::text from public.expenses where id = '50000000-0000-4000-8000-000000000002'), 'pending', 'submission moves the expense to pending');
select is((select count(*)::integer from public.approvals where expense_id = '50000000-0000-4000-8000-000000000002'), 1, 'submission creates exactly one linked approval');
select throws_ok(
  $$select public.submit_expense('50000000-0000-4000-8000-000000000002')$$,
  '22023',
  null,
  'duplicate expense submission is rejected'
);
select throws_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Out of range expense', 'Test vendor', current_date, 9007199254740992, ''
  )$$,
  '22023',
  null,
  'direct expense RPC rejects amounts above JavaScript safe-integer range'
);
select lives_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Maximum safe amount expense', 'Test vendor', current_date, 9007199254740991, ''
  )$$,
  'direct expense RPC accepts the maximum JavaScript safe-integer amount'
);
select is(
  (select amount_paise from public.expenses where title = 'Maximum safe amount expense'),
  9007199254740991::bigint,
  'maximum safe expense amount is stored without changing its value'
);
select lives_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Minimum positive amount expense', 'Test vendor', current_date, 1, ''
  )$$,
  'direct expense RPC accepts the minimum positive paise amount'
);
select is(
  (select amount_paise from public.expenses where title = 'Minimum positive amount expense'),
  1::bigint,
  'minimum positive expense amount is stored without changing its value'
);
select throws_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Zero amount expense', 'Test vendor', current_date, 0, ''
  )$$,
  '22023',
  null,
  'direct expense RPC rejects zero paise'
);
select throws_ok(
  $$select public.create_expense(
    '30000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Negative amount expense', 'Test vendor', current_date, -1, ''
  )$$,
  '22023',
  null,
  'direct expense RPC rejects negative paise'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select lives_ok(
  $$select public.decide_approval('60000000-0000-4000-8000-000000000001', 'approved')$$,
  'approver can decide an assigned pending approval'
);
select is((select status::text from public.expenses where id = '50000000-0000-4000-8000-000000000001'), 'approved', 'approval atomically updates the linked expense');
select is((select status::text from public.approvals where id = '60000000-0000-4000-8000-000000000001'), 'approved', 'approval decision is persisted');
select throws_ok(
  $$select public.decide_approval('60000000-0000-4000-8000-000000000001', 'approved')$$,
  '22023',
  null,
  'duplicate approval decision is rejected'
);
select throws_ok(
  $$select public.decide_approval('60000000-0000-4000-8000-000000000002', 'approved')$$,
  '22023',
  null,
  'inconsistent linked expense causes the approval transaction to fail'
);
select is((select status::text from public.approvals where id = '60000000-0000-4000-8000-000000000002'), 'pending', 'failed approval leaves its approval row unchanged');
select throws_ok(
  $$select public.decide_approval('60000000-0000-4000-8000-000000000003', 'approved')$$,
  '22023',
  null,
  'approval cannot proceed when its amount differs from the linked expense'
);
select is((select status::text from public.approvals where id = '60000000-0000-4000-8000-000000000003'), 'pending', 'amount mismatch leaves approval unchanged');
select throws_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Approver cannot create', 'Film', 'Test', 'General', 100000
  )$$,
  '42501',
  null,
  'approver cannot create a production even when passing an authorized tenant ID'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.record_expense_payment('50000000-0000-4000-8000-000000000001')$$,
  'finance role can pay an approved expense'
);
select is((select status::text from public.expenses where id = '50000000-0000-4000-8000-000000000001'), 'paid', 'payment marks the expense paid');
select is((select status::text from public.approvals where id = '60000000-0000-4000-8000-000000000001'), 'paid', 'payment also marks its linked approval paid');
select is((select count(*)::integer from public.payments where expense_id = '50000000-0000-4000-8000-000000000001'), 1, 'payment creates one payment record');
select throws_ok(
  $$select public.record_expense_payment('50000000-0000-4000-8000-000000000001')$$,
  '22023',
  null,
  'duplicate payment is rejected after state transition'
);
select is((select count(*)::integer from public.payments where expense_id = '50000000-0000-4000-8000-000000000001'), 1, 'duplicate payment did not create another payment');
select throws_ok(
  $$select public.record_expense_payment('50000000-0000-4000-8000-000000000003')$$,
  '22023',
  null,
  'approved expense cannot be paid without an approved linked record of the same amount'
);
select is((select count(*)::integer from public.payments where expense_id = '50000000-0000-4000-8000-000000000003'), 0, 'inconsistent expense payment creates no payment row');
select is(
  (select old_values ->> 'status' from public.audit_events where entity_id = '60000000-0000-4000-8000-000000000001' and actor_id = '10000000-0000-4000-8000-000000000004'),
  'pending',
  'audit event captures the prior approval status and actor'
);
select is(
  (select new_values ->> 'status' from public.audit_events where entity_id = '60000000-0000-4000-8000-000000000001' and actor_id = '10000000-0000-4000-8000-000000000004'),
  'approved',
  'audit event captures the resulting approval status'
);
select is(
  (select count(*)::integer from public.audit_events where entity_type = 'payments' and actor_id = '10000000-0000-4000-8000-000000000003' and new_values ->> 'amount_paise' = '250000'),
  1,
  'audit event records the payment amount and authenticated actor'
);
select lives_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', 1200000)$$,
  'finance role can revise an assigned production budget'
);
select throws_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', 9007199254740992)$$,
  '22023',
  null,
  'direct budget RPC rejects allocations above JavaScript safe-integer range'
);
select is((select revised_paise from public.budget_allocations where department_id = '40000000-0000-4000-8000-000000000001'), 1200000::bigint, 'budget revision stores the supplied integer-paise amount');
select lives_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', 9007199254740991)$$,
  'budget revision RPC accepts the maximum JavaScript safe-integer amount'
);
select is(
  (select revised_paise from public.budget_allocations where department_id = '40000000-0000-4000-8000-000000000001'),
  9007199254740991::bigint,
  'maximum safe revised budget is stored without changing its value'
);
select throws_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', 0)$$,
  '22023',
  null,
  'budget revision RPC rejects zero paise'
);
select throws_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', -1)$$,
  '22023',
  null,
  'budget revision RPC rejects negative paise'
);
select lives_ok(
  $$select public.revise_budget('40000000-0000-4000-8000-000000000001', 1)$$,
  'budget revision RPC accepts the minimum positive paise amount'
);
select is(
  (select revised_paise from public.budget_allocations where department_id = '40000000-0000-4000-8000-000000000001'),
  1::bigint,
  'minimum positive revised budget is stored without changing its value'
);
select lives_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000001', 400000, current_date)$$,
  'finance role can make a crew payment within the due amount'
);
select throws_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000001', 200000, current_date)$$,
  '22023',
  null,
  'crew payment cannot exceed the remaining due amount'
);
select is((select count(*)::integer from public.payments where crew_id = '70000000-0000-4000-8000-000000000001'), 1, 'rejected crew overpayment is not recorded');
select lives_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000002', 9007199254740991, current_date)$$,
  'crew payment RPC accepts the maximum safe amount when it does not exceed the due amount'
);
select is(
  (select amount_paise from public.payments where crew_id = '70000000-0000-4000-8000-000000000002'),
  9007199254740991::bigint,
  'maximum safe crew payment is stored without changing its value'
);
select throws_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000002', 0, current_date)$$,
  '22023',
  null,
  'crew payment RPC rejects zero paise'
);
select throws_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000002', -1, current_date)$$,
  '22023',
  null,
  'crew payment RPC rejects negative paise'
);
select throws_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000002', 9007199254740992, current_date)$$,
  '22023',
  null,
  'crew payment RPC rejects amounts above JavaScript safe-integer range'
);
select lives_ok(
  $$select public.record_crew_payment('70000000-0000-4000-8000-000000000003', 1, current_date)$$,
  'crew payment RPC accepts the minimum positive paise amount'
);
select is(
  (select amount_paise from public.payments where crew_id = '70000000-0000-4000-8000-000000000003'),
  1::bigint,
  'minimum positive crew payment is stored without changing its value'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.productions), 2, 'tenant owner can read all productions in its tenant');
select is((select count(*)::integer from public.productions where id = '30000000-0000-4000-8000-000000000002'), 0, 'tenant owner cannot read another tenant production');
select lives_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Created by tenant owner', 'Film', 'Test', 'General', 100000
  )$$,
  'tenant owner can create a production in its own tenant'
);
select throws_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000002',
    'Cross-tenant production', 'Film', 'Test', 'General', 100000
  )$$,
  '42501',
  null,
  'tenant owner cannot create a production in another tenant by supplying its ID'
);
select throws_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Out of range budget', 'Film', 'Test', 'General', 9007199254740992
  )$$,
  '22023',
  null,
  'direct production RPC rejects a budget above JavaScript safe-integer range'
);
select lives_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Maximum safe budget production', 'Film', 'Test', 'General', 9007199254740991
  )$$,
  'production creation RPC accepts the maximum JavaScript safe-integer budget'
);
select is(
  (
    select ba.original_paise
    from public.budget_allocations ba
    join public.productions p on p.id = ba.production_id
    where p.name = 'Maximum safe budget production'
  ),
  9007199254740991::bigint,
  'maximum safe original production budget is stored without changing its value'
);
select throws_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Zero budget production', 'Film', 'Test', 'General', 0
  )$$,
  '22023',
  null,
  'production creation RPC rejects zero paise budgets'
);
select throws_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Negative budget production', 'Film', 'Test', 'General', -1
  )$$,
  '22023',
  null,
  'production creation RPC rejects negative paise budgets'
);
select lives_ok(
  $$select public.create_production(
    '20000000-0000-4000-8000-000000000001',
    'Minimum budget production', 'Film', 'Test', 'General', 1
  )$$,
  'production creation RPC accepts the minimum positive paise budget'
);
select is(
  (
    select ba.original_paise
    from public.budget_allocations ba
    join public.productions p on p.id = ba.production_id
    where p.name = 'Minimum budget production'
  ),
  1::bigint,
  'minimum positive original production budget is stored without changing its value'
);

select * from finish();
rollback;
