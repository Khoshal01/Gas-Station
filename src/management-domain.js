import {inPeriod} from './domain.js';
export const cents=n=>Math.round((Number(n)+Number.EPSILON)*100);
export function payroll(data,staffId,month){
 const staff=data.staff.find(s=>s.id===staffId);
 const payments=data.expenses.filter(e=>e.category==='salary'&&e.staffId===staffId&&e.salaryMonth===month);
 const due=payments.length?Number(payments[0].salaryDue):Number(staff?.salary||0);
 const paid=cents(payments.reduce((sum,e)=>sum+Number(e.amount),0))/100;
 return {due,paid,remaining:Math.max(0,cents(due-paid)/100),payments};
}
export function saveStaff(data,entry,id){
 if(!entry.name?.trim()||!Number.isFinite(entry.salary)||entry.salary<0)throw Error('invalid');
 const next=structuredClone(data);const existing=next.staff.find(s=>s.id===id);
 if(existing)Object.assign(existing,entry,{id});else next.staff.unshift({...entry,id:crypto.randomUUID()});
 return next;
}
export function paySalary(data,{staffId,date,amount,salaryMonth,note=''}){
 const staff=data.staff.find(s=>s.id===staffId);
 if(!staff||!/^\d{4}-(0[1-9]|1[0-2])$/.test(salaryMonth)||!Number.isFinite(amount)||cents(amount)<=0)throw Error('invalid');
 const balance=payroll(data,staffId,salaryMonth);
 if(cents(amount)>cents(balance.remaining))throw Error('overpayment');
 const next=structuredClone(data);
 next.expenses.unshift({id:crypto.randomUUID(),date,amount:cents(amount)/100,category:'salary',staffId,staffName:staff.name,salaryMonth,salaryDue:balance.due,reason:'Salary payment',note:note.trim()||'Salary payment'});
 return next;
}
export function toggleShift(data,staffId,date,now=new Date().toISOString()){
 const staff=data.staff.find(s=>s.id===staffId);if(!staff)throw Error('invalid');
 const next=structuredClone(data),active=next.shifts.find(s=>s.staffId===staffId&&s.status==='open');
 if(active){active.status='closed';active.endedAt=now;}else next.shifts.unshift({id:crypto.randomUUID(),staffId,name:staff.name,date,status:'open',startedAt:now,endedAt:null,note:''});
 return next;
}
export function csvCell(value){return '"'+String(value??'').replace(/^[\s]*[=+@\-]/,"'$&").replaceAll('"','""')+'"';}
export function reportCSV(data,period,now){
 const filter=rows=>rows.filter(r=>inPeriod(r.date,period,now));
 const sections=[];const add=(name,columns,rows)=>{sections.push([name],columns,...rows.map(row=>columns.map(c=>row[c]??'')),[]);};
 const sales=filter(data.sales),expenses=filter(data.expenses);
 add('Report metadata',['station','address','period','through','timezone','currency'],[{station:data.settings?.name||'Northline',address:data.settings?.address||'',period,through:now,timezone:'Asia/Kabul',currency:'AFN'}]);
 add('Period totals (salary payments already included in expenses)',['salesRevenue','expenses','revenueLessExpenses'],[{salesRevenue:sales.reduce((s,r)=>s+r.amount,0),expenses:expenses.reduce((s,r)=>s+r.amount,0),revenueLessExpenses:sales.reduce((s,r)=>s+r.amount,0)-expenses.reduce((s,r)=>s+r.amount,0)}]);
 add('Inventory - current snapshot, not historical stock',['id','name','capacity','stock','price'],data.tanks);
 add('Sales',['id','date','fuel','liters','price','amount','note'],sales);
 add('Deliveries',['id','date','fuel','liters','price','amount','note'],filter(data.deliveries));
 add('Expenses including salary payments',['id','date','category','reason','note','amount','staffId','staffName','salaryMonth','salaryDue'],expenses.map(e=>({...e,reason:e.reason||e.note})));
 add('Staff - current snapshot',['id','name','role','phone','salary'],data.staff);
 add('Payroll - current calendar month snapshot',['staffId','name','salaryMonth','due','paid','remaining'],data.staff.map(s=>({staffId:s.id,name:s.name,salaryMonth:now.slice(0,7),...payroll(data,s.id,now.slice(0,7))})));
 add('Shifts (by start date)',['id','date','staffId','name','status','startedAt','endedAt','note'],filter(data.shifts));
 add('Pumps - current snapshot',['id','fuel','status'],data.pumps);
 return '\ufeff'+sections.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
export function download(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
