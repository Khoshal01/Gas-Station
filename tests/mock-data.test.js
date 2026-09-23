import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('sample SQL populates correct balances, is repeatable, and management validation rejects invalid payroll/shifts',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to authenticated,anon;
 insert into auth.users values ('11111111-1111-1111-1111-111111111111','sample@example.com');`);
 await db.exec(await readFile('supabase/schema.sql','utf8'));
 const seed=(await readFile('supabase/mock-data.sql','utf8')).replaceAll('YOUR_LOGIN_EMAIL_HERE','sample@example.com');
 await db.exec(seed);
 const first=(await db.query('select * from public.station_workspaces')).rows[0];
 assert.equal(first.data.sales.length,360);assert.equal(first.data.staff.length,4);
 for(const tank of first.data.tanks){const sold=first.data.sales.filter(s=>s.fuel===tank.id).reduce((sum,s)=>sum+s.liters,0);const delivered=first.data.deliveries.filter(s=>s.fuel===tank.id).reduce((sum,s)=>sum+s.liters,0);assert.equal(delivered-sold,tank.stock);}
 await db.exec(seed);assert.equal((await db.query('select version from public.station_workspaces')).rows[0].version,0);
 const wrong=structuredClone(first.data);wrong.expenses.find(e=>e.category==='salary').amount=999999;
 assert.equal((await db.query('select public.validate_station_management($1) as valid',[JSON.stringify(wrong)])).rows[0].valid,false);
 const duplicate=structuredClone(first.data);const shift=duplicate.shifts.find(s=>s.status==='open');duplicate.shifts.push({...shift,id:'duplicate-open'});
 assert.equal((await db.query('select public.validate_station_management($1) as valid',[JSON.stringify(duplicate)])).rows[0].valid,false);
 // A missing marker must not allow colliding sample IDs to be duplicated.
 await db.query("update public.station_workspaces set data=data-'sampleData',version=version+1");
 await assert.rejects(db.exec(seed),/Sample IDs already exist/);await db.exec('rollback;');
 assert.equal((await db.query('select data from public.station_workspaces')).rows[0].data.sales.length,360);
 }finally{await db.close();}
});
