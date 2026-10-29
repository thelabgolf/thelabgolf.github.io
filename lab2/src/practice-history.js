import {supabase} from './supabase.js';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let rows=[],shown=20,loadToken=0;
const dateOf=r=>r.practiced_on||String(r.created_at||'').slice(0,10);
const percent=r=>Number(r.attempts)>0?Math.round(100*Math.max(0,Number(r.successes)||0)/Number(r.attempts)):null;
const prettyDate=d=>{if(!d)return 'Date unavailable';const x=new Date(d+'T12:00:00');return Number.isNaN(x.getTime())?d:x.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})};
function filtered(){
 const query=$('search').value.trim().toLowerCase(),days=$('period').value;
 const cutoff=new Date();cutoff.setHours(0,0,0,0);if(days!=='all')cutoff.setDate(cutoff.getDate()-Number(days)+1);
 const items=rows.filter(r=>(!query||String(r.drill_title||r.drill_id||'').toLowerCase().includes(query))&&(days==='all'||new Date(dateOf(r)+'T12:00:00')>=cutoff));
 const sort=$('sort').value;
 items.sort((a,b)=>sort==='accuracy'?(percent(b)??-1)-(percent(a)??-1):sort==='old'?dateOf(a).localeCompare(dateOf(b)):dateOf(b).localeCompare(dateOf(a)));
 return items;
}
function render(){
 const items=filtered(),attempts=items.reduce((n,r)=>n+Math.max(0,Number(r.attempts)||0),0),successes=items.reduce((n,r)=>n+Math.max(0,Number(r.successes)||0),0);
 $('total').textContent=items.length.toLocaleString();$('attempts').textContent=attempts.toLocaleString();$('successes').textContent=successes.toLocaleString();$('accuracy').textContent=attempts?Math.round(successes/attempts*100)+'%':'—';
 $('matches').textContent='('+items.length+')';
 $('sessions').innerHTML=items.length?items.slice(0,shown).map(r=>'<article class="session"><div class="session-head"><strong>'+esc(r.drill_title||r.drill_id||'Practice session')+'</strong><span class="pill">'+(percent(r)===null?'No attempts':percent(r)+'% accuracy')+'</span></div><p>'+esc(prettyDate(dateOf(r)))+' · '+Math.max(0,Number(r.attempts)||0)+' attempts · '+Math.max(0,Number(r.successes)||0)+' successes</p>'+(r.notes?'<p>'+esc(r.notes)+'</p>':'')+'</article>').join(''):'<div class="empty panel">No sessions match these filters. <a href="./practice.html">Practice a drill</a> to start tracking.</div>';
 $('page-info').textContent=items.length?'Showing '+Math.min(shown,items.length)+' of '+items.length+' sessions':'';
 $('more').hidden=shown>=items.length;
 const weeks=new Map();
 for(const r of items){const d=new Date(dateOf(r)+'T12:00:00');if(Number.isNaN(d.getTime()))continue;const day=d.getDay();d.setDate(d.getDate()-((day+6)%7));const key=d.toISOString().slice(0,10);const v=weeks.get(key)||{a:0,s:0};v.a+=Math.max(0,Number(r.attempts)||0);v.s+=Math.max(0,Number(r.successes)||0);weeks.set(key,v)}
 const data=[...weeks.entries()].filter(([,v])=>v.a>0).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8);
 $('trend').innerHTML=data.length?data.map(([week,v])=>{const pct=Math.round(100*v.s/v.a);return '<div class="bar-group" title="'+esc(prettyDate(week))+': '+pct+'%"><strong>'+pct+'%</strong><div class="bar" style="height:'+Math.max(3,pct)+'px"></div><small>'+esc(week.slice(5))+'</small></div>'}).join(''):'<p class="muted">Log practice attempts to see your weekly accuracy trend.</p>';
 $('trend').setAttribute('aria-label',data.length?'Weekly accuracy: '+data.map(([w,v])=>w+' '+Math.round(100*v.s/v.a)+'%').join(', '):'No weekly accuracy data yet');
}
async function load(){
 const token=++loadToken;rows=[];shown=20;
 if(!supabase){$('status').textContent='Practice History is temporarily unavailable.';render();return}
 $('status').textContent='Loading your practice history…';
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(token!==loadToken)return;
 if(authError||!user){$('status').innerHTML='Sign in to see your private practice history. <a href="./account.html">Go to Account</a>';render();return}
 let offset=0;
 while(true){
  const {data,error}=await supabase.from('practice_sessions').select('id,drill_id,drill_title,practiced_on,attempts,successes,notes,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).range(offset,offset+499);
  if(token!==loadToken)return;
  if(error){$('status').textContent='Could not load practice history: '+error.message;render();return}
  rows.push(...(data||[]));
  if(!data||data.length<500)break;
  offset+=500;
 }
 $('status').textContent=rows.length?'History synced to your account.':'No saved practice sessions yet.';
 render();
}
for(const id of ['search','period','sort'])$(id).addEventListener(id==='search'?'input':'change',()=>{shown=20;render()});
$('reset').addEventListener('click',()=>{$('search').value='';$('period').value='all';$('sort').value='new';shown=20;render()});
$('more').addEventListener('click',()=>{shown+=20;render()});
if(supabase)supabase.auth.onAuthStateChange(()=>{load()});
else load();
