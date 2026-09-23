export async function mockStation(page){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const data={settings:{name:'Northline',address:'Kabul, Afghanistan',theme:'light'},tanks:[{id:'regular',name:'regular',capacity:12000,stock:8420,price:75}],sales:[],expenses:[],deliveries:[],staff:[{id:'s1',name:'Ahmad Rahimi',role:'operator',salary:20000,date:today,phone:''}],shifts:[],pumps:[{id:'P01',fuel:'regular',status:'ready'}]};
 let row={data,version:0};
 const user={id:'11111111-1111-1111-1111-111111111111',email:'test@example.com',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
 await page.route('https://station-test.supabase.co/**',async route=>{
  const url=route.request().url(),method=route.request().method();let body;
  if(url.includes('/auth/v1/token'))body={access_token:'test-token',refresh_token:'test-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
  else if(url.includes('/auth/v1/user'))body=user;
  else if(url.includes('/auth/v1/logout'))body={};
  else if(url.includes('/rest/v1/station_workspaces')){
   if(method==='PATCH'){const payload=route.request().postDataJSON();row={...row,...payload};body=[{version:row.version}];}
   else body=[row];
  }else return route.abort();
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 return ()=>row;
}
export async function signIn(page){await page.goto('/');await page.getByLabel('Email address',{exact:true}).fill('test@example.com');await page.getByLabel('Password',{exact:true}).fill('test-password');await page.getByRole('button',{name:'Sign in to your station',exact:true}).click();}
