import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('migrations rerun safely and enforce ownership, shape and concurrency',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as
 $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to authenticated,anon;
 insert into auth.users values ('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');`);
 const files=(await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).sort();
 const sql=(await Promise.all(files.map(f=>readFile('supabase/migrations/'+f,'utf8')))).join('\n');
 await db.exec(sql);
 const payload={tanks:[{id:'regular',name:'regular',capacity:1000,stock:200,price:75}],pumps:[{id:'P01',fuel:'regular',status:'ready'}],sales:[],deliveries:[],expenses:[],staff:[],shifts:[]};
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);`);
 await db.query('insert into public.station_workspaces(owner_id,data) values (auth.uid(),$1)',[JSON.stringify(payload)]);
 await db.query('update public.station_workspaces set version=1,data=$1 where owner_id=auth.uid() and version=0',[JSON.stringify(payload)]);
 assert.equal((await db.query('select version from public.station_workspaces')).rows[0].version,1);
 assert.equal((await db.query('update public.station_workspaces set version=1 where version=0 returning version')).rows.length,0);
 await assert.rejects(db.query('update public.station_workspaces set version=1'),/advance by one/);
 await assert.rejects(db.query('delete from public.station_workspaces'),/permission denied/);
 const invalid=structuredClone(payload);invalid.tanks[0].stock=1001;
 await assert.rejects(db.query('update public.station_workspaces set version=2,data=$1',[JSON.stringify(invalid)]),/Invalid station data/);
 invalid.tanks[0].stock=200;invalid.sales=[{id:'sale1',date:'2026-09-23',fuel:'regular',liters:10,price:75,amount:999}];
 await assert.rejects(db.query('update public.station_workspaces set version=2,data=$1',[JSON.stringify(invalid)]),/Invalid station data/);
 await db.exec(`select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);`);
 assert.equal((await db.query('select * from public.station_workspaces')).rows.length,0);
 await assert.rejects(db.query("insert into public.station_workspaces(owner_id,data) values ('11111111-1111-1111-1111-111111111111',$1)",[JSON.stringify(payload)]),/row-level security/);
 await db.exec('reset role;');await db.exec(sql);
 assert.equal((await db.query('select version from public.station_workspaces')).rows[0].version,1);
 await db.exec('set role anon;');await assert.rejects(db.query('select * from public.station_workspaces'),/permission denied/);
 }finally{await db.close();}
});
