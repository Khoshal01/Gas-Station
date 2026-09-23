import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('seed appends to a populated workspace without changing existing records, stock or payroll',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 insert into auth.users values('11111111-1111-1111-1111-111111111111','owner@example.com');`);
 await db.exec(await readFile('supabase/schema.sql','utf8'));
 const original={settings:{name:'My station',address:'My address',theme:'dark'},custom:'preserve me',
 tanks:[{id:'regular',name:'regular',capacity:1000,stock:970,price:75}],pumps:[{id:'P01',fuel:'regular',status:'ready'}],
 sales:[{id:'real-sale',date:'2026-09-23',fuel:'regular',liters:30,price:75,amount:2250,note:'Real sale'}],deliveries:[],
 staff:[{id:'real-staff',date:'2026-09-23',name:'Existing staff',role:'manager',salary:1000}],
 expenses:[{id:'real-payment',date:'2026-09-23',category:'salary',staffId:'real-staff',salaryMonth:'2026-09',salaryDue:1000,amount:250,reason:'Salary payment'}],
 shifts:[{id:'real-shift',date:'2026-09-23',name:'Existing staff',staffId:'real-staff',status:'open',startedAt:'2026-09-23T06:00:00Z',endedAt:null}]};
 await db.query("insert into public.station_workspaces(owner_id,data) values('11111111-1111-1111-1111-111111111111',$1)",[JSON.stringify(original)]);
 const seed=(await readFile('supabase/mock-data.sql','utf8')).replaceAll('YOUR_LOGIN_EMAIL_HERE','owner@example.com');
 await db.exec(seed);
 const row=(await db.query('select * from public.station_workspaces')).rows[0];
 assert.equal(row.version,1);assert.equal(row.data.sales.length,361);assert.equal(row.data.staff.length,5);
 assert.deepEqual(row.data.settings,original.settings);assert.equal(row.data.custom,'preserve me');
 for(const key of ['tanks','pumps','sales','expenses','staff','shifts'])for(const record of original[key])assert.deepEqual(row.data[key].find(x=>x.id===record.id),record);
 const sampleSales=row.data.sales.filter(x=>x.id.startsWith('mock-')&&x.fuel==='regular').reduce((s,x)=>s+x.liters,0);
 const sampleDeliveries=row.data.deliveries.filter(x=>x.id.startsWith('mock-')&&x.fuel==='regular').reduce((s,x)=>s+x.liters,0);
 assert.equal(sampleSales,sampleDeliveries);assert.equal(row.data.tanks.find(x=>x.id==='regular').stock,970);
 await db.exec(seed);assert.deepEqual((await db.query('select * from public.station_workspaces')).rows[0],row);
 }finally{await db.close();}
});
