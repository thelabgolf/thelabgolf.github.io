import {supabase} from './supabase.js';
const $=id=>document.getElementById(id),form=$('entry-form'),fields=form.elements;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
let owner=null,entries=[],editId=null,generation=0,busy=false;
const notify=s=>$('tool-status').textContent=s;
const drillMap={
 Slice:[['Driver slice fixes','driver'],['Clubface and alignment drills','alignment']],
 Hook:[['Hook control drills','hook'],['Alignment practice','alignment']],
 Push:[['Start-line practice','alignment'],['Face control drills','clubface']],
 Pull:[['Alignment and start line','alignment'],['Swing path drills','path']],
 Top:[['Stop topping the ball','topping'],['Solid iron contact','iron']],
 Chunk:[['Stop hitting behind the ball','chunk'],['Low-point control','iron']],
 Thin:[['Improve strike consistency','thin'],['Iron contact drills','iron']],
 Shank:[['Center-face contact','contact'],['Iron fundamentals','iron']],
 'Sky ball':[['Driver tee-height and setup','driver'],['Driver contact','contact']],
 'Inconsistent contact':[['Contact fundamentals','contact'],['Iron practice','iron']],
 Other:[['Browse swing fundamentals','fundamentals']]
};
function reset(){form.reset();fields.recorded_on.value=today();editId=null;$('form-heading').textContent='Log a swing session';$('save-entry').textContent='Save swing entry';$('cancel-edit').hidden=true}
function render(){
 $('session-count').textContent=entries.length;
 const misses=entries.map(e=>e.miss).filter(m=>m&&m!=='None');const counts={};for(const m of misses)counts[m]=(counts[m]||0)+1;
 const common=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
 $('common-miss').textContent=common;
 $('last-checkpoint').textContent=entries[0]?.checkpoint||'—';
 const chosen=fields.miss.value!=='None'?fields.miss.value:common;
 const drills=drillMap[chosen]||[['Browse all practice drills','']];
 $('drills').innerHTML=drills.map(([label,q])=>'<a class="drill" href="./practice.html'+(q?'?search='+encodeURIComponent(q):'')+'">'+esc(label)+' →</a>').join('');
 $('entries').innerHTML=entries.length?entries.map(e=>'<article class="entry"><small class="muted">'+esc(e.recorded_on)+'</small><h3>'+esc(e.club)+'</h3><div class="tags"><span class="tag">'+esc(e.miss||'None')+'</span><span class="tag">'+esc(e.checkpoint||'Setup')+'</span></div>'+(e.observation?'<p>'+esc(e.observation)+'</p>':'')+(e.focus?'<p><strong>Next focus:</strong> '+esc(e.focus)+'</p>':'')+(e.video_url?'<p><a target="_blank" rel="noopener noreferrer" href="'+esc(e.video_url)+'">Open swing video reference ↗</a></p>':'')+'<div class="actions"><button type="button" class="secondary" data-edit="'+esc(e.id)+'">Edit</button><button type="button" class="secondary" data-delete="'+esc(e.id)+'">Delete</button></div></article>').join(''):'<div class="empty"><h3>No swing sessions yet</h3><p class="muted">Record your first session to start spotting patterns over time.</p></div>';
}
async function refresh(){
 const token=++generation;owner=null;entries=[];reset();render();
 if(!supabase){notify('Swing Lab cloud connection is unavailable.');return}
 const {data:{user},error}=await supabase.auth.getUser();if(token!==generation)return;
 if(error||!user){$('loading').textContent='Sign in through Account to use your private Swing Lab.';notify('Sign in required.');return}
 owner=user.id;$('loading').hidden=true;form.hidden=false;notify('Loading your swing journal…');
 const result=await supabase.from('swing_journal').select('id,recorded_on,club,miss,checkpoint,observation,focus,video_url').eq('user_id',owner).order('recorded_on',{ascending:false}).order('created_at',{ascending:false}).limit(200);
 if(token!==generation)return;
 if(result.error){notify('Could not load swing journal: '+result.error.message);return}
 entries=result.data||[];render();notify('Your swing journal is synced to your account.');
}
form.addEventListener('change',e=>{if(e.target.name==='miss')render()});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!owner||!supabase)return;
 const token=generation,userId=owner;
 const payload={recorded_on:fields.recorded_on.value,club:fields.club.value.trim(),miss:fields.miss.value,checkpoint:fields.checkpoint.value,observation:fields.observation.value.trim(),focus:fields.focus.value.trim(),video_url:fields.video_url.value.trim()||null,updated_at:new Date().toISOString()};
 if(!payload.club){notify('Enter a club.');return}
 if(payload.video_url){try{const u=new URL(payload.video_url);if(!['https:','http:'].includes(u.protocol))throw Error('Invalid');}catch{notify('Enter a valid HTTP or HTTPS video link.');return}}
 busy=true;$('save-entry').disabled=true;notify('Saving swing entry…');
 const {data:{user}}=await supabase.auth.getUser();if(token!==generation||user?.id!==userId){busy=false;$('save-entry').disabled=false;notify('Account changed. Please reload.');return}
 const result=editId?await supabase.from('swing_journal').update(payload).eq('id',editId).eq('user_id',userId).select().single():await supabase.from('swing_journal').insert({...payload,user_id:userId}).select().single();
 busy=false;$('save-entry').disabled=false;if(token!==generation)return;
 if(result.error){notify('Save failed: '+result.error.message);return}
 reset();notify('Swing entry saved.');await refresh();
});
$('entries').addEventListener('click',async e=>{
 const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(edit){const item=entries.find(x=>x.id===edit.dataset.edit);if(!item)return;editId=item.id;for(const key of ['recorded_on','club','miss','checkpoint','observation','focus','video_url'])fields[key].value=item[key]??'';$('form-heading').textContent='Edit swing entry';$('save-entry').textContent='Save changes';$('cancel-edit').hidden=false;form.scrollIntoView({behavior:'smooth'});render();return}
 if(del){const item=entries.find(x=>x.id===del.dataset.delete);if(!item||!owner||!confirm('Delete this swing entry?'))return;const token=generation,userId=owner;notify('Deleting…');const {error}=await supabase.from('swing_journal').delete().eq('user_id',userId).eq('id',item.id);if(token!==generation)return;if(error){notify('Delete failed: '+error.message);return}entries=entries.filter(x=>x.id!==item.id);render();notify('Swing entry deleted.')}
});
$('cancel-edit').onclick=()=>{reset();render()};
if(supabase)supabase.auth.onAuthStateChange(()=>{Promise.resolve().then(refresh())});refresh();
