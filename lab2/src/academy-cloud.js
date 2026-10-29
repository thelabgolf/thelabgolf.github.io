import {supabase} from './supabase.js';
const $=id=>document.getElementById(id);
const valid=new Set(lessons.map(x=>x.id));
let owner=null,epoch=0,queue=Promise.resolve(),timer=null,revision=0;
const status=document.createElement('p');status.id='academy-cloud-status';status.setAttribute('role','status');status.className='muted';status.style.margin='12px 0';$('progress').after(status);
const bar=document.createElement('div');bar.style.cssText='height:9px;background:#3b4840;border-radius:8px;overflow:hidden;margin:10px 0';bar.innerHTML='<div id="academy-progress-fill" style="height:100%;width:0;background:#baff39;transition:width .2s"></div>';$('progress').after(bar);
function paint(){const n=lessons.filter(l=>done[l.id]).length;$('academy-progress-fill').style.width=Math.round(100*n/lessons.length)+'%';$('progress').textContent=n+' of '+lessons.length+' lessons completed ('+Math.round(100*n/lessons.length)+'%)';$('mobile-lesson-progress').textContent=$('progress').textContent}
function message(t){status.textContent=t}
async function load(){
 const generation=++epoch;clearTimeout(timer);revision++;owner=null;done={};draw();paint();
 if(!supabase){message('Account syncing is unavailable.');return}
 const {data:{user},error}=await supabase.auth.getUser();
 if(generation!==epoch)return;
 if(error||!user){message('Sign in to save Academy completion across devices.');return}
 owner=user.id;message('Loading your Academy progress…');
 const {data,error:readError}=await supabase.from('academy_progress').select('completed').eq('user_id',owner).maybeSingle();
 if(generation!==epoch)return;
 if(readError){message('Unable to load Academy progress: '+readError.message);return}
 done=Object.fromEntries(Object.entries(data?.completed||{}).filter(([id,value])=>valid.has(id)&&value===true));
 draw();paint();message('Academy progress synced to your account.');
}
function save(){
 if(!owner){message('Sign in to save your completed lessons.');return}
 const account=owner,generation=epoch,rev=++revision;
 clearTimeout(timer);message('Saving Academy progress…');
 timer=setTimeout(()=>{const snapshot={...done};
 queue=queue.catch(()=>{}).then(async()=>{
  if(account!==owner||generation!==epoch)return;
  const {data:{user}}=await supabase.auth.getUser();
  if(user?.id!==account)return;
  const {error}=await supabase.from('academy_progress').upsert({user_id:account,completed:snapshot,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(account!==owner||generation!==epoch)return;
  if(error)message('Academy save failed: '+error.message);
  else if(rev===revision)message('Academy progress saved to your account.');
 });
 },300);
}
window.addEventListener('lab-academy-complete',e=>{if(!valid.has(e.detail?.id))return;if(!owner){done[e.detail.id]=false;message('Sign in to record lesson completion.');return}done[e.detail.id]=true;paint();save()});
if(supabase){supabase.auth.onAuthStateChange(()=>{Promise.resolve().then(load)});load()}else load();
