import React from 'react';
import {inPeriod} from './domain';
import {payroll} from './management-domain';
export default function ReportDetails({data,period,now,t,money}){
 const sections=[
  ['inventory',['name','capacity','available','price'],data.tanks.map(x=>[t(x.name),`${x.capacity} L`,`${x.stock} L`,money(x.price)])],
  ['deliveries',['date','fuel','liters','amount'],data.deliveries.filter(x=>inPeriod(x.date,period,now)).map(x=>[x.date,t(x.fuel),x.liters,money(x.amount)])],
  ['staff',['name','salary','paid','remaining'],data.staff.map(x=>{const p=payroll(data,x.id,now.slice(0,7));return [x.name,money(p.due),money(p.paid),money(p.remaining)];})],
  ['shifts',['date','name','status'],data.shifts.filter(x=>inPeriod(x.date,period,now)).map(x=>[x.date,x.name,t(x.status)])],
  ['pumps',['name','fuel','status'],data.pumps.map(x=>[x.id,t(x.fuel),t(x.status)])]
 ];
 return <>{sections.map(([name,columns,rows])=><section className="panel mt-5" key={name}><div className="panel-head"><h3>{t(name)}</h3></div><div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{t(c)}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="empty">{t('empty')}</p>}</div></section>)}</>;
}
