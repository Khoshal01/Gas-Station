import { createClient } from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase=url&&key?createClient(url,key):null;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function initialData(){return {tanks:[{id:'regular',name:'regular',capacity:12000,stock:8420,price:75},{id:'premium',name:'premium',capacity:10000,stock:5830,price:85},{id:'diesel',name:'diesel',capacity:12000,stock:7240,price:70},{id:'super',name:'super',capacity:12000,stock:2910,price:90}],sales:[{id:'DEMO-001',date:today(),fuel:'regular',liters:38.2,price:75,amount:2865,note:'P01'},{id:'DEMO-002',date:today(),fuel:'diesel',liters:51.4,price:70,amount:3598,note:'P02'}],expenses:[],deliveries:[],shifts:[],staff:[],pumps:[{id:'P01',fuel:'regular',status:'ready'},{id:'P02',fuel:'diesel',status:'ready'},{id:'P03',fuel:'premium',status:'ready'},{id:'P04',fuel:'super',status:'service'}]};}
