-- 1. Apply schema.sql (or migration 004 if 001-003 were already applied).
-- 2. Replace YOUR_LOGIN_EMAIL_HERE with the email you use to log in.
-- 3. Run this complete file in the Supabase SQL editor, then refresh the app.
-- Adds sample records alongside existing records. Existing tank quantities, settings and staff are preserved.
-- Mock activity is included in reports. Run this only where you want sample records.
begin;
do $$
declare
  login_email text := 'YOUR_LOGIN_EMAIL_HERE';
  target_user uuid;
  previous public.station_workspaces%rowtype;
  payload jsonb;
  tanks jsonb := '[]';
  sales jsonb := '[]';
  deliveries jsonb := '[]';
  expenses jsonb := '[]';
  shifts jsonb := '[]';
  staff jsonb;
  pumps jsonb := '[]';
  local_day date := (now() at time zone 'Asia/Kabul')::date;
  pay_month text := to_char(now() at time zone 'Asia/Kabul','YYYY-MM');
  fuel text;
  tank_stock numeric;
  sold numeric;
  liters numeric;
  price numeric;
  salary numeric;
  staff_name text;
  item_date date;
  existing_tank jsonb;
  collection text;
  i integer;
  d integer;
  j integer;
begin
  select id into target_user from auth.users where lower(email)=lower(login_email);
  if target_user is null then raise exception 'Replace YOUR_LOGIN_EMAIL_HERE with an existing Supabase Auth login email.'; end if;
  perform pg_advisory_xact_lock(hashtext(target_user::text));
  select * into previous from public.station_workspaces where owner_id=target_user for update;
  if found then
    if previous.data->>'sampleData' in ('northline-management-v1','northline-management-v2') then
      raise notice 'Sample data already exists. Nothing was changed.';return;
    end if;
  end if;
  -- Thirty days of dated records, newest first, including today.
  for d in 0..29 loop
    item_date := local_day-d;
    for i in 1..4 loop
      fuel := (array['regular','premium','diesel','super'])[i];
      price := (array[75,85,70,90])[i];
      for j in 1..3 loop
        liters := 18+i*5+j*4+(d%7)*2;
        sales := sales || jsonb_build_array(jsonb_build_object('id','mock-sale-'||d||'-'||i||'-'||j,'date',item_date,'fuel',fuel,'liters',liters,'price',price,'amount',round(liters*price,2),'note','P0'||i||' · Sample sale'));
      end loop;
    end loop;
    if d%3=0 then
      expenses:=expenses||jsonb_build_array(jsonb_build_object('id','mock-expense-'||d,'date',item_date,'amount',300+(d%5)*125,'category','general','reason',(array['Generator fuel','Cleaning supplies','Pump maintenance','Office supplies'])[1+(d%4)],'note','Sample operating expense'));
    end if;
  end loop;
  for i in 1..4 loop
    fuel := (array['regular','premium','diesel','super'])[i];
    price := (array[75,85,70,90])[i];
    tank_stock := (array[8420,5830,7240,1910])[i];
    select sum((s->>'liters')::numeric) into sold from jsonb_array_elements(sales) s where s->>'fuel'=fuel;
    select value into existing_tank from jsonb_array_elements(coalesce(previous.data->'tanks','[]'::jsonb)) where value->>'id'=fuel;
    if existing_tank is null then
      tanks:=tanks||jsonb_build_array(jsonb_build_object('id',fuel,'name',fuel,'capacity',20000,'stock',tank_stock,'price',price));
    else
      -- Existing tank is retained untouched. Sample deliveries offset sample sales exactly.
      tank_stock:=0;
    end if;
    deliveries:=deliveries||jsonb_build_array(jsonb_build_object('id','mock-delivery-'||i,'date',local_day-29,'fuel',fuel,'liters',tank_stock+sold,'price',price-12,'amount',round((tank_stock+sold)*(price-12),2),'note','Sample opening delivery · Kabul supplier'));
    if not exists(select 1 from jsonb_array_elements(coalesce(previous.data->'pumps','[]'::jsonb)) p where p->>'fuel'=fuel) then
      pumps:=pumps||jsonb_build_array(jsonb_build_object('id','mock-pump-'||i,'fuel',fuel,'status',case when i=4 then 'service' else 'ready' end));
    end if;
  end loop;
  staff:='[]';
  for i in 1..4 loop
    staff_name:=(array['Ahmad Rahimi','Farid Ahmadi','Maryam Azizi','Omar Safi'])[i];
    salary:=(array[22000,18000,26000,16000])[i];
    staff:=staff||jsonb_build_array(jsonb_build_object('id','mock-staff-'||i,'date',local_day-30,'name',staff_name,'role',case when i=3 then 'manager' else 'operator' end,'phone','','salary',salary));
    if i<4 then
      expenses:=jsonb_build_array(jsonb_build_object('id','mock-salary-'||i,'date',local_day,'category','salary','staffId','mock-staff-'||i,'staffName',staff_name,'salaryMonth',pay_month,'salaryDue',salary,'amount',case when i=1 then salary else salary/2 end,'reason','Salary payment','note','Sample monthly salary payment'))||expenses;
    end if;
    for d in 1..3 loop
      shifts:=shifts||jsonb_build_array(jsonb_build_object('id','mock-shift-'||i||'-'||d,'staffId','mock-staff-'||i,'name',staff_name,'date',local_day-d,'status','closed','startedAt',((local_day-d)+time '06:00') at time zone 'Asia/Kabul','endedAt',((local_day-d)+time '14:00') at time zone 'Asia/Kabul','note','Sample completed shift'));
    end loop;
    if i in (1,2) then
      shifts:=jsonb_build_array(jsonb_build_object('id','mock-active-'||i,'staffId','mock-staff-'||i,'name',staff_name,'date',local_day,'status','open','startedAt',now(),'endedAt',null,'note','Sample active shift'))||shifts;
    end if;
  end loop;
  select jsonb_agg(s order by s->>'date' desc,s->>'id') into shifts from jsonb_array_elements(shifts) s;
  payload:=jsonb_build_object('settings',coalesce(previous.data->'settings',jsonb_build_object('name','Northline Fuel Station','address','Kabul, Afghanistan','theme','light')),'tanks',tanks,'pumps',pumps,'sales',sales,'deliveries',deliveries,'expenses',expenses,'staff',staff,'shifts',shifts,'sampleData','northline-management-v2');
  if previous.owner_id is not null then
    foreach collection in array array['tanks','pumps','sales','deliveries','expenses','staff','shifts'] loop
      if exists (
        select 1 from jsonb_array_elements(coalesce(previous.data->collection,'[]'::jsonb)) old_item
        join jsonb_array_elements(payload->collection) new_item on old_item->>'id'=new_item->>'id'
      ) then
        raise exception 'Sample IDs already exist in %. No changes made; sample data may have been loaded previously.',collection;
      end if;
      payload:=jsonb_set(payload,array[collection],(payload->collection)||coalesce(previous.data->collection,'[]'::jsonb));
      if collection in ('sales','deliveries','expenses','shifts') then
        payload:=jsonb_set(payload,array[collection],coalesce((select jsonb_agg(value order by value->>'date' desc,value->>'id') from jsonb_array_elements(payload->collection)),'[]'::jsonb));
      end if;
    end loop;
    -- Retain any custom top-level fields as well as settings and all existing records.
    payload:=previous.data||payload;
  end if;
  if previous.owner_id is null then
    insert into public.station_workspaces(owner_id,data,version) values(target_user,payload,0);
  else
    update public.station_workspaces set data=payload,version=version+1 where owner_id=target_user;
  end if;
  raise notice 'Sample records added. Existing records and tank quantities were preserved. Refresh the app.';
end;
$$;
commit;
