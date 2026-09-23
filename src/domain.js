export function applyEntry(data,type,entry){
 const next=structuredClone(data);
 if(['sales','deliveries'].includes(type)){
  const tank=next.tanks.find(t=>t.id===entry.fuel);
  if(!tank||!Number.isFinite(entry.liters)||entry.liters<=0||!Number.isFinite(entry.price)||entry.price<=0)throw Error('invalid');
  if(type==='sales'&&entry.liters>tank.stock)throw Error('insufficient');
  if(type==='deliveries'&&entry.liters+tank.stock>tank.capacity)throw Error('capacityError');
  tank.stock=Number((tank.stock+(type==='sales'?-entry.liters:entry.liters)).toFixed(2));
  entry={...entry,amount:Number((entry.liters*entry.price).toFixed(2))};
 }
 if(type==='expenses'&&(!Number.isFinite(entry.amount)||entry.amount<=0))throw Error('invalid');
 next[type].unshift(entry);return next;
}
export function inPeriod(date,period,now){
 if(period==='allTime')return date<=now;
 const end=new Date(now+'T00:00:00Z');const start=new Date(end);
 if(period==='weekly')start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
 if(period==='monthly')start.setUTCDate(1);
 return date>=start.toISOString().slice(0,10)&&date<=now;
}
