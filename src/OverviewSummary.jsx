import React from 'react';
import {Receipt,Wallet,Database,Users,UserCheck,Coins,ArrowUpRight} from 'lucide-react';
import {overviewTotals} from './overview-domain';
export function OverviewSummary({data,date,t,money,fmt,onNavigate}){
 const s=overviewTotals(data,date);
 const cards=[
  ['salesToday',money(s.todayRevenue),'today',Receipt,'sales'],
  ['totalSales',money(s.revenue),'allThroughToday',Receipt,'sales'],
  ['totalExpenses',money(s.expenseTotal),'allThroughToday',Wallet,'expenses'],
  ['totalInventory',`${fmt(s.stock)} L`,'currentSnapshot',Database,'inventory'],
  ['staffOnDuty',fmt(s.onDuty.length),'onDutyNote',UserCheck,'shifts'],
  ['totalStaff',fmt(s.totalStaff),'currentSnapshot',Users,'staff'],
  ['inventoryValue',money(s.retailValue),'retailValueNote',Coins,'inventory'],
  ['remaining',money(s.salaryRemaining),'currentMonth',Wallet,'staff']
 ];
 return <section className="overview-metrics" aria-label={t('overview')}>{cards.map(([label,value,hint,Icon,page])=><button className="overview-metric" key={label} aria-label={`${t(label)}: ${value}. ${t('viewDetails')}`} onClick={()=>onNavigate(page)}><div><span>{t(label)}</span><Icon size={18}/></div><strong>{value}</strong><small>{t(hint)}{hint==='currentMonth'?` · ${date.slice(0,7)}`:''}</small><ArrowUpRight className="metric-link" size={13}/></button>)}</section>;
}
export function OverviewDetails({data,date,t,money,fmt,onNavigate}){
 const s=overviewTotals(data,date),liters=n=>`${fmt(n)} L`;
 const pair=(label,value)=><div className="overview-stat" key={label}><span>{t(label)}</span><b>{value}</b></div>;
 const heading=(key,page)=><div className="panel-head"><h3>{t(key)}</h3><button className="text-button" onClick={()=>onNavigate(page)} aria-label={`${t(key)} · ${t('viewDetails')}`}><ArrowUpRight size={16}/></button></div>;
 return <div className="overview-details">
 <section className="panel">{heading('financialSummary','reports')}<div className="overview-detail-body">
 {pair('todayExpenses',money(s.todayExpenses))}{pair('generalExpensesTotal',money(s.generalExpenses))}{pair('salaryPaymentsTotal',money(s.salaryExpenses))}{pair('net',money(s.revenueLessExpenses))}
 <p className="muted">{t('netNote')}</p>{pair('deliverySpend',money(s.deliveryCost))}{pair('totalDelivered',liters(s.deliveryLiters))}{pair('recordedSales',fmt(s.salesCount))}
 <p className="muted">{t('expenseNote')}</p></div></section>
 <section className="panel">{heading('teamSummary','staff')}<div className="overview-detail-body"><p className="eyebrow">{t('currentMonth')} · {date.slice(0,7)}</p>
 {pair('due',money(s.salaryDue))}{pair('paid',money(s.salaryPaid))}{pair('remaining',money(s.salaryRemaining))}{pair('openShifts',fmt(s.openShifts))}
 <h4>{t('staffOnDuty')} · {fmt(s.onDuty.length)}</h4><div className="on-duty-list">{s.onDuty.length?s.onDuty.map(staff=><div key={staff.id}><i className="dot"/><span>{staff.name}</span><small>{t(staff.role)}</small></div>):<p className="muted">{t('noOnDuty')}</p>}</div></div></section>
 <section className="panel">{heading('inventorySummary','inventory')}<div className="overview-detail-body">
 {pair('storageCapacity',liters(s.capacity))}{pair('totalInventory',liters(s.stock))}
 <div className="bar"><i style={{width:`${s.capacity?Math.min(100,s.stock/s.capacity*100):0}%`}}/></div><p className="muted">{t('fillLevel')} · {fmt(s.capacity?s.stock/s.capacity*100:0)}%</p>
 {pair('tankCount',fmt(data.tanks.length))}{pair('lowTanks',fmt(s.lowTanks))}{pair('readyPumps',`${fmt(s.readyPumps)} / ${fmt(s.totalPumps)}`)}{pair('servicePumps',fmt(s.servicePumps))}
 </div></section></div>;
}
