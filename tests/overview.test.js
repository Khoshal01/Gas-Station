import test from 'node:test';
import assert from 'node:assert/strict';
import {overviewTotals} from '../src/overview-domain.js';
test('overview counts distinct staff on duty and separates totals, payroll and retail stock value',()=>{
 const data={staff:[{id:'a',salary:1000},{id:'b',salary:2000}],shifts:[{staffId:'a',status:'open'},{staffId:'a',status:'open'},{staffId:'b',status:'closed'},{status:'open',name:'Legacy'}],tanks:[{stock:100,capacity:1000,price:75}],pumps:[{status:'ready'},{status:'service'}],sales:[{date:'2026-09-23',amount:1000,liters:10},{date:'2026-09-01',amount:500,liters:5},{date:'2026-09-24',amount:9999}],expenses:[{date:'2026-09-23',amount:100,category:'general'},{date:'2026-09-01',amount:400,category:'salary',staffId:'a',salaryMonth:'2026-09',salaryDue:1000},{date:'2026-08-01',amount:1000,category:'salary',staffId:'a',salaryMonth:'2026-08',salaryDue:1000}],deliveries:[{date:'2026-09-01',liters:100,amount:5000}]};
 const s=overviewTotals(data,'2026-09-23');
 assert.equal(s.onDuty.length,1);assert.equal(s.totalStaff,2);assert.equal(s.openShifts,3);
 assert.equal(s.revenue,1500);assert.equal(s.todayRevenue,1000);assert.equal(s.expenseTotal,1500);assert.equal(s.todayExpenses,100);
 assert.equal(s.generalExpenses+s.salaryExpenses,s.expenseTotal);assert.equal(s.salaryRemaining,2600);assert.equal(s.salaryPaid,400);
 assert.equal(s.stock,100);assert.equal(s.retailValue,7500);assert.equal(s.deliveryCost,5000);assert.equal(s.lowTanks,1);
});
test('empty overview has finite zero totals',()=>{const s=overviewTotals({staff:[],shifts:[],tanks:[],pumps:[],sales:[],expenses:[],deliveries:[]},'2026-09-23');assert.equal(s.retailValue,0);assert.equal(s.capacity,0);assert.equal(s.salaryRemaining,0);assert.equal(s.onDuty.length,0);});
