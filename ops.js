/* Lamu Port Track: port operations layer (sample data, simulated).
   Practices modelled on world-class terminals such as Singapore: berth windows, just-in-time arrival,
   truck appointments, remote yard planning and risk-based single-window clearance. */
(()=>{
const H=72,CR=26,CAP=60,CL=['acc','info','warn','ok'];
const rnd=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const f1=x=>(+x).toFixed(1),T=h=>fmt(new Date(Date.now()+h*36e5)),mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const K=(l,v)=>`<div class="kpi"><span>${l}</span><b>${v}</b></div>`;
const st={mult:1.5,sb:3};
/* EDIT HERE: inbound vessels [name, line, containers/units, ETA in hours from now, priority 1=reefer/pharma] */
const INB=[['MV Kilindini Star','IRISL',4200,2,0],['MSC Feeder 01','MSC',1800,3,0],['CMA CGM Feeder 02','CMA CGM',2600,4,0],['IRISL Feeder 07 (reefer)','IRISL',1200,6,1],['MV Lamu Pride','Lamu Shipping',900,7,0],['MSC Feeder 03','MSC',2100,12,0],['Grimaldi RoRo 5','Grimaldi',1100,16,0],['CMA CGM Feeder 05','CMA CGM',1600,30,0]].map(a=>({n:a[0],l:a[1],u:a[2],eta:a[3],pri:a[4]}));
const BF=[0,18,2],OCC=[[1,'MV Hamouna',18],[2,'MV Grande Florida Palermo',2]];   // hours until each berth is free
const crn=u=>u>3000?4:3,svc=u=>Math.ceil(u/(crn(u)*CR));

/* Berth allocation. FCFS = first come first served. Smart = priority cargo first, then shortest job first among waiting vessels, with ageing so long jobs are not starved. */
function plan(vs,smart,B,hz,f0){
 const free=Array.from({length:B},(_,i)=>f0[i]||0),left=vs.map(v=>({...v})),list=[];
 while(left.length){
  const b=free.indexOf(Math.min(...free)),t=Math.max(free[b],Math.min(...left.map(v=>v.eta)));
  const pool=left.filter(v=>v.eta<=t).sort(smart?(x,y)=>y.pri-x.pri||(svc(x.u)-.5*(t-x.eta))-(svc(y.u)-.5*(t-y.eta)):(x,y)=>x.eta-y.eta),v=pool[0];
  left.splice(left.indexOf(v),1);const s=Math.max(free[b],v.eta);free[b]=s+svc(v.u);list.push({v,b,s,e:free[b],w:s-v.eta});
 }
 const busy=list.reduce((a,o)=>a+Math.max(0,Math.min(o.e,hz)-Math.min(o.s,hz)),0)+f0.reduce((a,x)=>a+Math.min(x,hz),0);
 return{list,avg:mean(list.map(o=>o.w)),max:Math.max(0,...list.map(o=>o.w)),sum:list.reduce((a,o)=>a+o.w,0),util:busy/(B*hz)};
}
/* Truck appointment gate: demand per hour vs capacity. Smart = excess trucks are moved to quieter slots within 6 hours. */
const base=h=>{const x=(new Date().getHours()+h)%24;return 18+34*Math.exp(-(((x-9)/2.2)**2))+30*Math.exp(-(((x-16)/2.4)**2))};
function gate(d0,cap,smart){const d=[...d0];
 if(smart)for(let h=0;h<d.length;h++){let ex=d[h]-cap;for(let k=1;k<=6&&ex>0;k++)for(const j of[h-k,h+k]){if(ex<=0||j<0||j>=d.length)continue;const m=Math.min(ex,Math.max(0,cap*.95-d[j]));d[j]+=m;d[h]-=m;ex-=m}}
 let bl=0;return{d,w:d.map(x=>{bl=Math.max(0,bl+x-cap);return 6+bl/cap*60})}}
const bk=Array(24).fill(0),BKS={};
const dem=()=>Array.from({length:24},(_,h)=>Math.round(base(h)*st.mult)+bk[h]);
function book(id){const g=gate(dem(),CAP,true).d;let h=1;while(h<23&&g[h]+1>CAP*.9)h++;bk[h]++;BKS[id]=h}
const risk=s=>10+(s.seal=='tamper'?60:0)+(/Pharma|Medical/.test(s.cargo)?10:0)+(/Vehicles/.test(s.cargo)?15:0)+(s.dest=='nadapal'||s.dest=='moyale'?15:0)+(s.line=='To be confirmed'?20:0);
const chan=s=>{const r=risk(s);return r<30?['Green · auto-release','ok']:r<55?['Yellow · document check','warn']:['Red · inspection','bad']};
const peak=g=>Math.max(...g.w),pk=(g)=>Math.round(peak(g));

const bl=(s,e,n,c)=>`<div class="gb ${c}" style="left:${s/H*100}%;width:${Math.max(0,Math.min(e,H)-s)/H*100}%" title="${n}: ${T(s)} to ${T(e)}">${n}</div>`;
function gantt(p,B){let h='<div class="gt">';for(let b=0;b<B;b++){const o=OCC.find(x=>x[0]==b);
 h+=`<div class="gr"><span>Berth ${b+1}</span><div class="gl">${o?bl(0,o[2],o[1],'occ'):''}${p.list.filter(x=>x.b==b).map(x=>bl(x.s,x.e,x.v.n,'c-'+CL[x.v.n.length%4])).join('')}</div></div>`}
 return h+'<div class="ax">'+[0,12,24,36,48,60,72].map(x=>`<span>+${x}h</span>`).join('')+'</div></div>'}

function berths(){const sm=plan(INB,true,3,H,BF),fc=plan(INB,false,3,H,BF);
 return`<div class="kpis">${K('Avg vessel wait (smart)',f1(sm.avg)+' h')}${K('Avg wait, first-come-first-served',f1(fc.avg)+' h')}${K('Waiting hours saved',f1(fc.sum-sm.sum)+' h')}${K('Anchorage CO₂ avoided (est.)','≈ '+Math.round(sm.sum)+' t')}</div>
<div class="tools"><button class="btn ghost" data-k="delay">Delay next arrival +6 h</button><button class="btn ghost" data-k="add">Add arriving vessel</button><span class="note">The plan rebuilds itself after every change.</span></div>
<div class="card"><h2>Berth plan, next 72 hours<span>${crn(5000)} cranes on big ships, ${CR} moves per crane-hour</span></h2>${gantt(sm,3)}</div>
<div class="card gap"><h2>Just-in-time arrival advisory<span>Ships slow down at sea instead of queuing at anchorage</span></h2><div class="wrap"><table><thead><tr><th>Vessel</th><th>ETA</th><th>Units</th><th>Cranes</th><th>Berth window</th><th>Advice to master</th></tr></thead><tbody>${sm.list.sort((a,b)=>a.s-b.s).map(o=>`<tr style="cursor:default"><td><b>${o.v.n}</b> ${o.v.pri?'<span class="chip c-warn">Priority</span>':''}<br><small style="color:var(--mute)">${o.v.l}</small></td><td>${T(o.v.eta)}</td><td>${o.v.u.toLocaleString()}</td><td>${crn(o.v.u)}</td><td>Berth ${o.b+1}<br><small style="color:var(--mute)">${T(o.s)} to ${T(o.e)}</small></td><td>${o.w>.5?`<span class="chip c-info">Slow steam, arrive ${T(o.s-.5)}</span>`:'<span class="chip c-ok">Proceed at ETA</span>'}</td></tr>`).join('')}</tbody></table></div></div>`}

function gateV(){const d=dem(),a=gate(d,CAP,false),b=gate(d,CAP,true),mx=Math.max(...d,CAP)*1.15,hr=h=>(new Date().getHours()+h)%24;
 const wt=S.filter(s=>s.stage<3);
 return`<div class="kpis">${K('Gate capacity','4 lanes · '+CAP+'/h')}${K('Trucks expected, 24 h',d.reduce((x,y)=>x+y,0))}${K('Peak wait, no appointments',pk(a)+' min')}${K('Peak wait, smart slots',pk(b)+' min')}</div>
<div class="card"><h2>Truck gate, next 24 hours<span>Grey = demand if everyone arrives when they like · Teal = after smart slot balancing</span></h2>
<div class="ctl"><label>Expected traffic <select id="gm">${[1,1.5,2,3].map(m=>`<option value="${m}"${m==st.mult?' selected':''}>${m}× normal</option>`).join('')}</select></label><span class="note" style="padding:0">Dashed line = gate capacity</span></div>
<div class="cw"><div class="capl" style="bottom:${CAP/mx*100}%"></div><div class="cols">${d.map((v,h)=>`<div title="${hr(h)}:00 · ${v} trucks requested, ${Math.round(b.d[h])} after balancing"><i style="height:${v/mx*100}%;left:0;right:52%;background:var(--line)"></i><i style="height:${b.d[h]/mx*100}%;left:52%;right:0;background:var(--acc)"></i></div>`).join('')}</div></div>
<div class="lb">${d.map((_,h)=>`<span>${h%3?'&nbsp;':hr(h)}</span>`).join('')}</div></div>
<div class="card gap"><h2>Book gate slots<span>${wt.length} containers waiting at port</span></h2><div class="wrap"><table><thead><tr><th>Shipment</th><th>Cargo</th><th>Clearance</th><th>Gate slot</th><th></th></tr></thead><tbody>${wt.map(s=>{const[t,c]=chan(s);return`<tr style="cursor:default"><td><b>${s.id}</b><br><small style="color:var(--mute)">${s.cont}</small></td><td>${s.cargo}</td><td><span class="chip c-${c}">${t}</span></td><td>${BKS[s.id]!=null?'<b>'+T(BKS[s.id])+'</b>':'Not booked'}</td><td>${BKS[s.id]!=null?'':`<button class="btn" data-k="book" data-s="${s.id}">Book earliest slot</button>`}</td></tr>`}).join('')||'<tr><td colspan="5">No containers waiting.</td></tr>'}</tbody></table></div></div>`}

const yard=()=>'ABCDEF'.split('').map((c,i)=>[c,Math.max(20,Math.min(99,[78,64,91,55,83,47][i]+Math.round(3*Math.sin(tk/5+i))))]);
function ops(){const sm=plan(INB,true,3,H,BF),fc=plan(INB,false,3,H,BF),d=dem(),a=gate(d,CAP,false),b=gate(d,CAP,true),y=yard(),yu=Math.round(mean(y.map(x=>x[1]))),hot=y.filter(x=>x[1]>85);
 const cnt={ok:0,warn:0,bad:0};S.filter(s=>s.stage<5).forEach(s=>cnt[chan(s)[1]]++);
 return`<div class="kpis">${K('Berth occupancy, 72 h',Math.round(sm.util*100)+'%')}${K('Avg vessel wait (first-come: '+f1(fc.avg)+' h)',f1(sm.avg)+' h')}${K('Peak gate wait (no slots: '+pk(a)+' min)',pk(b)+' min')}${K('Yard utilisation',yu+'%')}</div>
<div class="grid"><div class="card"><h2>Container yard<span>${yu}% full · 6 blocks</span></h2><div class="yard">${y.map(x=>`<div class="yb c-${x[1]>85?'bad':x[1]>70?'warn':'ok'}"><b>${x[1]}%</b><span>Block ${x[0]}</span></div>`).join('')}</div>
<p class="note">${hot.length?'Block '+hot.map(x=>x[0]).join(', ')+' is above 85%. Move long-dwell containers to a remote block or inland depot before trucks start to queue.':'All blocks are below 85%. Yard flow is healthy.'}</p></div>
<div class="card"><h2>Quay cranes<span>Target 30 moves per hour</span></h2><div class="pad">${[1,2,3,4].map(i=>{const v=Math.round(26+7*Math.sin(tk/3+i*1.7));return`<div style="margin:8px 0"><div style="display:flex;justify-content:space-between"><b>QC${i}</b><span>${v} moves/h ${chip(v>=30?'On target':'Below target',v>=30?'ok':'warn')}</span></div><div class="bar"><i style="width:${v/40*100}%"></i></div></div>`}).join('')}</div></div></div>
<div class="card gap"><h2>Single-window clearance<span>Risk-based channels, like Singapore's TradeNet</span></h2><div class="pad"><span class="chip c-ok">${cnt.ok} green · auto-release</span> <span class="chip c-warn">${cnt.warn} yellow · document check</span> <span class="chip c-bad">${cnt.bad} red · physical inspection</span><p class="note" style="padding:10px 0 0">Low-risk cargo is released without a physical check, so inspectors focus on the few risky boxes. Risk comes from cargo type, destination, e-seal status and whether the shipping line is confirmed.</p></div></div>`}

function simOut(){const B=st.sb,r=rnd(7),n=Math.round(14*st.mult),vs=[];let t=0;
 for(let i=0;i<n*2&&vs.length<n;i++){t+=r()*(168/n)*1.6;if(t>168)break;vs.push({n:'V'+(i+1),l:'',u:Math.round(600+r()*r()*4800),eta:t,pri:r()<.15?1:0})}
 const a=plan(vs,false,B,168,[]),b=plan(vs,true,B,168,[]),d=Array.from({length:24},(_,h)=>Math.round(base(h)*st.mult)),g=gate(d,CAP,false),s=gate(d,CAP,true);
 const rows=[['Vessels arriving this week',vs.length,vs.length,0],['Average vessel wait (h)',a.avg,b.avg,1],['Longest vessel wait (h)',a.max,b.max,1],['Berth utilisation (%)',a.util*100,b.util*100,0],['Peak gate wait (min)',peak(g),peak(s),1],['Average gate wait (min)',mean(g.w),mean(s.w),1]];
 const dl=(x,y,lo)=>x<1e-9||x==y?'':`<span class="chip c-${(y<x)==!!lo?'ok':'warn'}">${y<x?'−':'+'}${Math.abs(Math.round((1-y/x)*100))}%</span>`;
 const over=b.avg>24||peak(s)>60;
 return`<div class="card gap"><h2>Result<span>Same traffic, two ways of running the port</span></h2><div class="wrap"><table><thead><tr><th>Measure</th><th>First-come-first-served</th><th>Lamu Port Track smart planning</th><th>Change</th></tr></thead><tbody>${rows.map(x=>`<tr style="cursor:default"><td>${x[0]}</td><td>${f1(x[1])}</td><td><b>${f1(x[2])}</b></td><td>${dl(x[1],x[2],x[3])}</td></tr>`).join('')}</tbody></table></div>
<p class="pad">${over?'<span class="chip c-bad">Capacity limit reached</span> Even smart planning cannot clear this traffic. Add berths, extend gate hours or open more lanes.':'<span class="chip c-ok">Handled</span> Smart planning keeps queues short at this traffic level.'}</p></div>`}
function sim(){return`<div class="card"><h2>Surge simulator<span>What happens when traffic grows?</span></h2><div class="ctl"><label>Traffic <input type="range" id="sm" min="1" max="3" step="0.5" value="${st.mult}"> <b id="smv">${st.mult}×</b></label><label>Berths <select id="sb">${[3,6].map(b=>`<option${b==st.sb?' selected':''}>${b}</option>`).join('')}</select></label></div></div><div id="simout">${simOut()}</div>`}

window.OPS={ops,berths,gate:gateV,sim};
document.addEventListener('click',e=>{const k=e.target.closest('[data-k]');if(!k)return;const a=k.dataset.k;
 if(a=='delay'){const f=[...INB].sort((x,y)=>x.eta-y.eta)[0];f.eta+=6}
 if(a=='add'){INB.push({n:'MV Surge '+(INB.length+1),l:'MSC',u:1000+Math.floor(Math.random()*3000),eta:Math.max(...INB.map(v=>v.eta))+6,pri:0})}
 if(a=='book')book(k.dataset.s);render()});
document.addEventListener('change',e=>{if(e.target.id=='gm'){st.mult=+e.target.value;render()}});
document.addEventListener('input',e=>{if(e.target.id=='sm'||e.target.id=='sb'){st.mult=+$('#sm').value;st.sb=+$('#sb').value;$('#smv').textContent=st.mult+'×';$('#simout').innerHTML=simOut()}});
})();
