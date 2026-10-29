import {supabase} from './supabase.js';
const $=id=>document.getElementById(id),form=$('club-form'),fields=form.elements;
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let userId=null,clubs=[],editId=null,generation=0,busy=false;
const status=t=>$('status').textContent=t;
function reset(){form.reset();editId=null;$('form-heading').textContent='Add a club';$('submit').textContent='Save club';$('cancel').hidden=true}
function linkFor(club){const query=club.club_type==='Driver'?'driver':club.club_type==='Putter'?'putting':club.club_type==='Wedge'?'chipping':club.club_type==='Fairway Wood'?'wood':club.club_type==='Hybrid'?'hybrid':'iron';return './practice.html?search='+encodeURIComponent(query)}
function render(){
 const list=[...clubs],sort=$('sort').value;
 list.sort((a,b)=>sort==='name'?a.club_name.localeCompare(b.club_name):sort==='type'?a.club_type.localeCompare(b.club_type):Number(b.carry_yards||0)-Number(a.carry_yards||0));
 $('count').textContent='('+list.length+')';
 $('clubs').innerHTML=list.length?list.map(c=>'<article class="club"><div class="eyebrow">'+escapeHTML(c.club_type)+'</div><h3>'+escapeHTML(c.club_name)+'</h3><div class="stats"><span>Carry <strong>'+(c.carry_yards??'—')+'</strong> yd</span><span>Total <strong>'+(c.total_yards??'—')+'</strong> yd</span><span>Loft <strong>'+(c.loft_degrees??'—')+'</strong>°</span></div>'+(c.notes?'<p class="muted">'+escapeHTML(c.notes)+'</p>':'')+'<div class="actions"><button class="secondary" data-edit="'+c.id+'">Edit</button><button class="secondary" data-delete="'+c.id+'">Remove</button><a href="'+linkFor(c)+'">Related drills</a></div></article>').join(''):'<div class="panel">No clubs saved yet. Add your first club above.</div>';
 const rec=[],dist=clubs.filter(c=>c.carry_yards!==null).sort((a,b)=>Number(b.carry_yards)-Number(a.carry_yards));
 if(!clubs.length)rec.push('Add your clubs to unlock distance-gap and equipment-specific recommendations.');
 else{
  for(const c of clubs){if(c.carry_yards===null)rec.push('Record a carry distance for '+c.club_name+' to help identify yardage gaps.')}
  for(let i=0;i<dist.length-1;i++){const gap=Number(dist[i].carry_yards)-Number(dist[i+1].carry_yards);if(gap>=25)rec.push('Practice distance control between '+dist[i].club_name+' and '+dist[i+1].club_name+' ('+Math.round(gap)+'-yard carry gap).')}
  if(clubs.some(c=>c.club_type==='Driver'))rec.push('Use your driver carry distance as a baseline for controlled tee-shot accuracy drills.');
  if(clubs.some(c=>c.club_type==='Wedge'))rec.push('Build wedge carry-distance checkpoints with a landing-spot ladder drill.');
  if(!rec.length)rec.push('Your carry gaps look fairly close. Practice hitting consistent distances and record results over time.');
 }
 const chart=[...clubs].filter(c=>c.carry_yards!==null).sort((a,b)=>Number(b.carry_yards)-Number(a.carry_yards));
 $('yardage-rows').innerHTML=chart.length?chart.map((c,i)=>'<tr style="border-top:1px solid #454b4f"><td style="padding:12px 8px">'+escapeHTML(c.club_name)+'</td><td>'+Number(c.carry_yards)+' yd</td><td>'+(c.total_yards===null?'—':Number(c.total_yards)+' yd')+'</td><td>'+(i===0?'—':(Number(chart[i-1].carry_yards)-Number(c.carry_yards)).toFixed(1).replace(/\\.0$/,'')+' yd')+'</td></tr>').join(''):'<tr><td colspan="4" style="padding:14px">Add carry distances to see your yardage chart.</td></tr>';
 const target=Number($('target-distance').value);
 const candidates=chart.filter(c=>Number.isFinite(Number(c.carry_yards)));
 const nearest=Number.isFinite(target)&&target>0?[...candidates].sort((a,b)=>Math.abs(Number(a.carry_yards)-target)-Math.abs(Number(b.carry_yards)-target)).slice(0,3):[];
 $('club-selector-result').innerHTML=nearest.length?nearest.map((c,i)=>'<div class="recommendation"><strong>'+(i===0?'Closest: ':'Alternative: ')+escapeHTML(c.club_name)+'</strong> · '+Number(c.carry_yards)+' yd carry · '+Math.abs(Number(c.carry_yards)-target).toFixed(1).replace(/\\.0$/,'')+' yd '+(Number(c.carry_yards)===target?'exact':Number(c.carry_yards)<target?'short':'long')+'</div>').join(''):'<p class="muted">Enter a target distance and add clubs with carry distances to see recommendations.</p>';
 $('recommendations').innerHTML=rec.slice(0,12).map(x=>'<div class="recommendation">'+escapeHTML(x)+' <a href="./practice.html">Practice Center</a></div>').join('');
}
async function refresh(){
 const token=++generation;userId=null;clubs=[];reset();render();
 if(!supabase){status('Club Locker cloud connection is unavailable.');return}
 const {data:{user},error}=await supabase.auth.getUser();
 if(token!==generation)return;
 if(error||!user){status('Sign in through Account to manage your private Club Locker.');return}
 userId=user.id;status('Loading your clubs…');
 const result=await supabase.from('golfer_clubs').select('id,club_name,club_type,carry_yards,total_yards,loft_degrees,notes').eq('user_id',user.id).order('created_at',{ascending:true});
 if(token!==generation)return;
 if(result.error){status('Could not load clubs: '+result.error.message);return}
 clubs=result.data||[];status('Club Locker synced to your account.');render();
}
function numberOrNull(name){const raw=fields[name].value.trim();return raw===''?null:Number(raw)}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 if(!userId||!supabase){status('Sign in before saving clubs.');return}
 const token=generation,owner=userId;
 const payload={club_name:fields.club_name.value.trim(),club_type:fields.club_type.value,carry_yards:numberOrNull('carry_yards'),total_yards:numberOrNull('total_yards'),loft_degrees:numberOrNull('loft_degrees'),notes:fields.notes.value.trim(),updated_at:new Date().toISOString()};
 if(!payload.club_name){status('Enter a club name.');return}
 if(payload.carry_yards!==null&&payload.total_yards!==null&&payload.total_yards<payload.carry_yards){status('Total distance should be at least the carry distance.');return}
 busy=true;$('submit').disabled=true;status('Saving club…');
 const {data:{user}}=await supabase.auth.getUser();
 if(token!==generation||user?.id!==owner){busy=false;$('submit').disabled=false;status('Account changed. Reload before saving.');return}
 const result=editId?await supabase.from('golfer_clubs').update(payload).eq('user_id',owner).eq('id',editId).select().single():await supabase.from('golfer_clubs').insert({...payload,user_id:owner}).select().single();
 busy=false;$('submit').disabled=false;
 if(token!==generation)return;
 if(result.error){status('Save failed: '+result.error.message);return}
 if(editId)clubs=clubs.map(c=>c.id===editId?result.data:c);else clubs.push(result.data);
 reset();render();status('Club saved to your account.');
});
$('clubs').addEventListener('click',async e=>{
 const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(edit){const c=clubs.find(x=>x.id===edit.dataset.edit);if(!c)return;editId=c.id;for(const key of ['club_name','club_type','carry_yards','total_yards','loft_degrees','notes'])fields[key].value=c[key]??'';$('form-heading').textContent='Edit '+c.club_name;$('submit').textContent='Save changes';$('cancel').hidden=false;form.scrollIntoView({behavior:'smooth'});return}
 if(del){const c=clubs.find(x=>x.id===del.dataset.delete);if(!c||!userId||!confirm('Remove '+c.club_name+' from your locker?'))return;const owner=userId,token=generation;status('Removing club…');const {error}=await supabase.from('golfer_clubs').delete().eq('user_id',owner).eq('id',c.id);if(token!==generation)return;if(error){status('Could not remove club: '+error.message);return}clubs=clubs.filter(x=>x.id!==c.id);if(editId===c.id)reset();render();status('Club removed.')}
});
$('cancel').onclick=reset;$('sort').onchange=render;$('target-distance').addEventListener('input',render);
if(supabase)supabase.auth.onAuthStateChange(()=>{Promise.resolve().then(refresh)});refresh();
