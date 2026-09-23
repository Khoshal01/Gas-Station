import {payroll,cents} from './management-domain.js';
export function overviewTotals(data,date){
 const sum=(rows,key)=>rows.reduce((total,row)=>total+Number(row[key]||0),0);
 const sales=data.sales.filter(x=>x.date<=date),expenses=data.expenses.filter(x=>x.date<=date),deliveries=data.deliveries.filter(x=>x.date<=date);
 const activeIds=new Set(data.shifts.filter(x=>x.status==='open'&&x.staffId).map(x=>x.staffId));
 const onDuty=data.staff.filter(x=>activeIds.has(x.id));
 const balances=data.staff.map(s=>payroll(data,s.id,date.slice(0,7)));
 const revenue=cents(sum(sales,'amount'))/100,expenseTotal=cents(sum(expenses,'amount'))/100;
 return {revenue,expenseTotal,todayRevenue:cents(sum(sales.filter(x=>x.date===date),'amount'))/100,todayExpenses:cents(sum(expenses.filter(x=>x.date===date),'amount'))/100,
 salesCount:sales.length,litersSold:sum(sales,'liters'),todayLiters:sum(sales.filter(x=>x.date===date),'liters'),
 salaryExpenses:cents(sum(expenses.filter(x=>x.category==='salary'),'amount'))/100,generalExpenses:cents(sum(expenses.filter(x=>x.category!=='salary'),'amount'))/100,
 revenueLessExpenses:cents(revenue-expenseTotal)/100,deliveryCost:cents(sum(deliveries,'amount'))/100,deliveryLiters:sum(deliveries,'liters'),deliveryCount:deliveries.length,
 stock:sum(data.tanks,'stock'),capacity:sum(data.tanks,'capacity'),retailValue:cents(data.tanks.reduce((s,x)=>s+x.stock*x.price,0))/100,
 lowTanks:data.tanks.filter(x=>x.capacity>0&&x.stock/x.capacity<.25).length,
 onDuty,totalStaff:data.staff.length,openShifts:data.shifts.filter(x=>x.status==='open').length,
 salaryDue:cents(sum(balances,'due'))/100,salaryPaid:cents(sum(balances,'paid'))/100,salaryRemaining:cents(sum(balances,'remaining'))/100,
 readyPumps:data.pumps.filter(x=>x.status==='ready').length,servicePumps:data.pumps.filter(x=>x.status==='service').length,totalPumps:data.pumps.length};
}
