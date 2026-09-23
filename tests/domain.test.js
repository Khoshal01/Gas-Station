import test from 'node:test';
import assert from 'node:assert/strict';
import {applyEntry,inPeriod} from '../src/domain.js';
const seed=()=>({tanks:[{id:'regular',stock:100,capacity:200}],sales:[],deliveries:[],expenses:[]});
test('sale deducts stock and calculates total without mutating original',()=>{const original=seed();const result=applyEntry(original,'sales',{fuel:'regular',liters:12.5,price:75});assert.equal(result.tanks[0].stock,87.5);assert.equal(result.sales[0].amount,937.5);assert.equal(original.tanks[0].stock,100);});
test('overselling and overfilling are rejected',()=>{assert.throws(()=>applyEntry(seed(),'sales',{fuel:'regular',liters:101,price:75}),/insufficient/);assert.throws(()=>applyEntry(seed(),'deliveries',{fuel:'regular',liters:101,price:75}),/capacityError/);});
test('delivery increases stock and rejects invalid numbers',()=>{assert.equal(applyEntry(seed(),'deliveries',{fuel:'regular',liters:50,price:60}).tanks[0].stock,150);for(const liters of [0,-1,NaN,Infinity])assert.throws(()=>applyEntry(seed(),'sales',{fuel:'regular',liters,price:75}),/invalid/);});
test('expenses require a positive finite amount',()=>{assert.throws(()=>applyEntry(seed(),'expenses',{amount:-1}),/invalid/);assert.throws(()=>applyEntry(seed(),'expenses',{amount:NaN}),/invalid/);});
test('report periods are inclusive, Monday-start weeks, exclude future dates',()=>{assert.equal(inPeriod('2026-09-21','weekly','2026-09-23'),true);assert.equal(inPeriod('2026-09-20','weekly','2026-09-23'),false);assert.equal(inPeriod('2026-09-01','monthly','2026-09-23'),true);assert.equal(inPeriod('2026-09-24','monthly','2026-09-23'),false);assert.equal(inPeriod('2026-09-22','daily','2026-09-23'),false);});
