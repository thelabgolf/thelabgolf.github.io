/* Practice Center 2.0 enhancement; existing drill IDs and library remain unchanged. */
(function(){
const issues={
 'Slice':['Driving','face','path','slice'],
 'Hook':['Driving','face','path','hook'],
 'Topped shots':['Iron contact','low point','top','contact'],
 'Chunked shots':['Iron contact','low point','turf','contact'],
 'Thin shots':['Iron contact','strike','low point','contact'],
 'Short-game mistakes':['Chipping','Pitching & wedges','landing','distance','chip']
};
const $id=id=>document.getElementById(id);
const all=typeof drills!=='undefined'?drills:[];
if(!all.length||!$id('drills'))return;
let favorites=new Set(),weaknesses=[],userId=null,client=null,version=0,writeQueue=Promise.resolve(),saveTimer=null;
const section=$id('drills').closest('section');
const tools=document.createElement('div');tools.className='panel';tools.id='practice-2-tools';
tools.innerHTML='<h2>Practice Center 2.0</h2><p>Find drills that fit your training goals and save favorites to your account.</p><div class="row"><label>Training environment<select id="pc-environment"><option value="all">All environments</option><option value="Simulator">Simulator</option><option value="winter">Winter / indoor</option></select></label><label>Drill view<select id="pc-view"><option value="all">All drills</option><option value="favorites">My favorites</option><option value="recommended">Recommended for me</option></select></label></div><label>Weakness to improve<select id="pc-weakness"><option value="">Choose a weakness</option>'+Object.keys(issues).map(x=>'<option>'+x+'</option>').join('')+'</select></label><div class="row"><button id="pc-save-weakness" type="button">Save weakness</button><button id="pc-clear-weakness" class="secondary" type="button">Clear weaknesses</button></div><p id="pc-status" role="status">Checking account…</p><h3>Shot Troubleshooter</h3><div class="row" id="pc-troubleshooter">'+Object.keys(issues).map((x,i)=>'<button type="button" class="secondary" data-issue="'+i+'">'+x+'</button>').join('')+'</div><p id="pc-tip" aria-live="polite"></p>';
section.parentNode.insertBefore(tools,section);
const note=msg=>$id('pc-status').textContent=msg;
const matchesIssue=(d,issue)=>{const terms=issues[issue]||[];const text=(d.skill+' '+d.title+' '+d.goal).toLowerCase();return terms.some(t=>text.includes(t.toLowerCase()))};
function chosen(){return $id('pc-weakness').value||weaknesses[0]||''}
function passes(d){
 const env=$id('pc-environment').value;
 const m=metadata[all.indexOf(d)];
 const places=(m?.[1]||'').split('|');
 const environment=env==='all'||env==='Simulator'&&places.includes('Simulator')||env==='winter'&&(places.includes('Simulator')||places.includes('Putting green')||places.includes('Home practice'));
 if(!environment)return false;
 const view=$id('pc-view').value;
 return view==='all'||view==='favorites'&&favorites.has(d.id)||view==='recommended'&&weaknesses.some(w=>matchesIssue(d,w));
}
const original=renderDrills;
renderDrills=function(){
 original();
 const cards=[...$id('drills').querySelectorAll('.card')];
 cards.forEach(card=>{
  const open=card.querySelector('button[data-id]');
  if(!open)return;
  const id=open.dataset.id,d=all.find(x=>x.id===id);
  if(!d)return;
  const favorite=document.createElement('button');favorite.type='button';favorite.className='secondary';favorite.style.marginLeft='8px';
  favorite.textContent=favorites.has(id)?'★ Favorited':'☆ Favorite';
  favorite.setAttribute('aria-pressed',String(favorites.has(id)));
  favorite.onclick=()=>{if(!userId){note('Sign in through Account to save favorites.');return}favorites.has(id)?favorites.delete(id):favorites.add(id);queueSave();renderDrills()};
  open.after(favorite);
  card.hidden=!passes(d);
 });
 const count=cards.filter(c=>!c.hidden).length;
 $id('count').textContent=count+' drills match your filters';
};
function queueSave(){
 if(!client||!userId)return;
 version++;note('Saving preferences…');
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{const expected=userId,rev=version,record={user_id:expected,favorites:[...favorites],weaknesses:[...weaknesses],updated_at:new Date().toISOString()};
 writeQueue=writeQueue.catch(()=>{}).then(async()=>{if(expected!==userId)return;const {data:{user}}=await client.auth.getUser();if(user?.id!==expected)return;const {error}=await client.from('practice_preferences').upsert(record,{onConflict:'user_id'});if(expected===userId){if(error)note('Could not save preferences: '+error.message);else if(rev===version)note('Favorites and weaknesses saved to your account.')}})
 },350);
}
$id('pc-environment').onchange=renderDrills;$id('pc-view').onchange=renderDrills;
$id('pc-save-weakness').onclick=()=>{const w=$id('pc-weakness').value;if(!w)return;if(!userId){note('Sign in to save weaknesses.');return}if(!weaknesses.includes(w))weaknesses.push(w);$id('pc-view').value='recommended';queueSave();renderDrills()};
$id('pc-clear-weakness').onclick=()=>{if(!userId){note('Sign in to edit weaknesses.');return}weaknesses=[];queueSave();renderDrills()};
$id('pc-troubleshooter').onclick=e=>{const b=e.target.closest('button[data-issue]');if(!b)return;const issue=Object.keys(issues)[Number(b.dataset.issue)];$id('pc-weakness').value=issue;$id('pc-view').value='all';$id('search').value='';$id('difficulty').value='all';$id('location').value='all';$id('equipment').value='all';$id('status').value='all';category='all';renderCategories();renderDrills();const cards=[...$id('drills').querySelectorAll('.card')];cards.forEach(c=>{const d=all.find(x=>x.id===c.querySelector('button[data-id]')?.dataset.id);c.hidden=!d||!matchesIssue(d,issue)});$id('count').textContent=cards.filter(c=>!c.hidden).length+' suggested drills for '+issue.toLowerCase();$id('pc-tip').textContent='Start with a controlled setup and consistent contact. Select a suggested drill, track your attempts, and reassess after practice.';section.scrollIntoView({behavior:'smooth',block:'start'})};
async function sync(){
 const token=++version;
 if(!client){note('Cloud preferences unavailable.');return}
 const {data:{user}}=await client.auth.getUser();
 if(token!==version)return;
 userId=user?.id||null;favorites=new Set();weaknesses=[];
 if(!userId){note('Sign in to save favorites and personalized recommendations.');renderDrills();return}
 const {data,error}=await client.from('practice_preferences').select('favorites,weaknesses').eq('user_id',userId).maybeSingle();
 if(token!==version)return;
 if(error){note('Unable to load preferences: '+error.message);return}
 favorites=new Set((Array.isArray(data?.favorites)?data.favorites:[]).filter(id=>all.some(d=>d.id===id)));
 weaknesses=(Array.isArray(data?.weaknesses)?data.weaknesses:[]).filter(w=>issues[w]);
 note('Preferences connected to your account.');renderDrills();
}
import('./src/supabase.js').then(({supabase})=>{client=supabase;if(!client){note('Cloud preferences unavailable.');return}client.auth.onAuthStateChange(()=>{setTimeout(sync,0)});sync()}).catch(()=>note('Cloud preferences unavailable.'));
renderDrills();
})();
