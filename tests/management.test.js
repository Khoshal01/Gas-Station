import test from 'node:test';
import assert from 'node:assert/strict';
import {payroll,paySalary,toggleShift,saveStaff,reportCSV} from '../src/management-domain.js';
const seed=()=>({staff:[{id:'s1',name:'Ahmad',salary:20000}],expenses:[],shifts:[],tanks:[],pumps:[],sales:[],deliveries:[]});
test('partial salary payments accumulate by month and cannot overpay',()=>{
 let data=paySalary(seed(),{staffId:'s1',date:'2026-09-23',salaryMonth:'2026-09',amount:8000});
 assert.equal(payroll(data,'s1','2026-09').remaining,12000);
 assert.equal(payroll(data,'s1','2026-08').remaining,20000);
 assert.throws(()=>paySalary(data,{staffId:'s1',date:'2026-09-23',salaryMonth:'2026-09',amount:12001}),/overpayment/);
 data=paySalary(data,{staffId:'s1',date:'2026-09-23',salaryMonth:'2026-09',amount:12000});
 assert.equal(payroll(data,'s1','2026-09').remaining,0);
 assert.equal(data.expenses.reduce((s,e)=>s+e.amount,0),20000);
});
test('salary edits preserve a month with existing payments',()=>{
 let data=paySalary(seed(),{staffId:'s1',date:'2026-09-23',salaryMonth:'2026-09',amount:8000});
 data=saveStaff(data,{name:'Ahmad',salary:25000},'s1');
 assert.equal(payroll(data,'s1','2026-09').due,20000);
 assert.equal(payroll(data,'s1','2026-10').due,25000);
});
test('shift can start, end and restart without losing history',()=>{
 let data=toggleShift(seed(),'s1','2026-09-23','2026-09-23T02:00:00Z');
 data=toggleShift(data,'s1','2026-09-23','2026-09-23T10:00:00Z');
 assert.equal(data.shifts[0].status,'closed');assert.equal(data.shifts[0].endedAt,'2026-09-23T10:00:00Z');
 data=toggleShift(data,'s1','2026-09-23','2026-09-23T12:00:00Z');
 assert.equal(data.shifts.length,2);assert.equal(data.shifts.filter(s=>s.status==='open').length,1);
});
test('export covers every collection, filters transactions and escapes formula cells',()=>{
 const data=seed();data.staff[0].name='=CMD()';data.sales=[{id:'old',date:'2026-08-01',amount:100},{id:'today',date:'2026-09-23',amount:200}];
 const csv=reportCSV(data,'daily','2026-09-23');for(const label of ['Inventory','Sales','Deliveries','Expenses','Staff','Payroll','Shifts','Pumps'])assert.ok(csv.includes(label));
 assert.ok(!csv.includes('"old"'));assert.ok(csv.includes('"today"'));assert.ok(csv.includes("'=CMD()"));
 assert.ok(reportCSV(data,'allTime','2026-09-23').includes('"old"'));
});
