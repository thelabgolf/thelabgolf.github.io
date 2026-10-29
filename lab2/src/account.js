function savedPlansPanel(){let plans=[];try{const v=JSON.parse(localStorage.getItem('thelab-weekly-plans-v1')||'[]');if(Array.isArray(v))plans=v.filter(p=>p&&Array.isArray(p.sessions))}catch{}const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return '<section class="member-saved-plans" style="margin:22px 0;padding:20px;border:1px solid #454b4f;border-radius:16px;background:#262a2d"><h2>Saved practice plans</h2>'+(plans.length?'<p>'+plans.length+' plan'+(plans.length===1?'':'s')+' saved on this device</p>'+plans.map(p=>{const sessions=p.sessions||[];const completed=sessions.filter(x=>x.done).length;const next=sessions.find(x=>!x.done);const percent=sessions.length?Math.round(completed/sessions.length*100):0;return '<article style="border-top:1px solid #454b4f;padding:16px 0"><strong>'+esc(p.goal||'Weekly practice')+'</strong><p>'+completed+' of '+sessions.length+' sessions complete · '+percent+'%</p><div role="progressbar" aria-label="Weekly practice progress" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" style="height:8px;background:#454b4f;border-radius:99px;overflow:hidden"><div style="height:100%;width:'+percent+'%;background:#c7f43b"></div></div><p>'+(next?'Next: '+esc(next.drill||next.skill||'Practice'):'All sessions complete — nice work!')+'</p><a href="./programs.html">Open, edit and track plan →</a></article>'}).join(''):'<p>No saved plans yet. Build one using the Practice Planner.</p>')+'<a href="./planner.html">Create a practice plan →</a></section>'}
import {supabase} from './supabase.js';
const app=document.querySelector('#account-app');
const redirect=new URL('./account.html',location.href).href;
const recoveryRedirect=new URL('./account.html?password_reset=1',location.href).href;
let mode='login';
function message(s){document.querySelector('#message').textContent=s;}
function loggedOut(){
 app.innerHTML=`<h1>Your game. Your progress.</h1><p>Free golfer accounts. Sign in or create yours below.</p><section class="auth-panel"><div class="auth-tabs"><button id="login">Sign in</button><button id="signup">Create account</button></div><form id="auth-form"><label>Email<input name="email" type="email" autocomplete="email" required></label><label id="pass-label">Password<input name="password" type="password" minlength="12" autocomplete="current-password" required></label><p class="signin-help">Stay signed in on this device. Your browser can offer to save your password securely.</p><button type="button" id="forgot-password" class="forgot-link">Forgot password?</button><button type="submit" id="submit-auth">Sign in</button></form><p id="message" role="status" aria-live="polite"></p><p>Existing browser-saved practice and programs remain local until cloud migration is ready.</p></section>`;
 const pass=document.querySelector('#pass-label'),submit=document.querySelector('#submit-auth');document.querySelector('#login').classList.add('active');
 const forgot=document.querySelector('#forgot-password');const tabs=document.querySelector('.auth-tabs');const intro=app.querySelector('p');
function setMode(name){mode=name;for(const tab of ['login','signup'])document.querySelector('#'+tab).classList.toggle('active',tab===name);tabs.hidden=name==='reset';pass.hidden=name==='reset';pass.querySelector('input').required=name!=='reset';forgot.textContent=name==='reset'?'← Back to sign in':'Forgot password?';forgot.classList.toggle('back-link',name==='reset');forgot.hidden=name==='signup';const help=document.querySelector('.signin-help');if(help)help.hidden=name==='reset';submit.textContent=name==='login'?'Sign in':name==='signup'?'Create free account':'Send password reset email';intro.textContent=name==='reset'?'Enter your email and we’ll send you a secure password reset link.':'Free golfer accounts. Sign in or create yours below.';message('');}
for(const name of ['login','signup'])document.querySelector('#'+name).onclick=()=>setMode(name);
forgot.onclick=()=>setMode(mode==='reset'?'login':'reset');
setMode('login');
 document.querySelector('#auth-form').onsubmit=async e=>{e.preventDefault();if(!supabase)return message('Account service is not configured yet.');const form=new FormData(e.target),email=form.get('email'),password=form.get('password');submit.disabled=true;try{let r;if(mode==='signup')r=await supabase.auth.signUp({email,password,options:{emailRedirectTo:redirect}});else if(mode==='reset')r=await supabase.auth.resetPasswordForEmail(email,{redirectTo:recoveryRedirect});else r=await supabase.auth.signInWithPassword({email,password});if(r.error)throw r.error;if(mode==='signup')message('Check your inbox to confirm your email.');else if(mode==='reset')message('If this account exists, a reset email will arrive.');else window.location.replace(new URL('./index.html',location.href).href);}catch(err){message(err.message||'Unable to complete request.');}finally{submit.disabled=false;}};
}
async function loadAccountTraining(user){
 const plans=document.querySelector('#cloud-plans');
 if(!plans)return;
 const [programResult,sessionResult]=await Promise.all([
  supabase.from('golfer_programs').select('programs').eq('user_id',user.id).maybeSingle(),
  supabase.from('practice_sessions').select('drill_title,practiced_on,attempts,successes,created_at',{count:'exact'}).eq('user_id',user.id).order('created_at',{ascending:false}).limit(5)
 ]);
 if(!plans.isConnected)return;
 const count=document.querySelector('#metric-practice-sessions');
 if(count)count.textContent=sessionResult.error?'—':String(sessionResult.count??0);
 if(programResult.error){plans.innerHTML='<h2>Saved training programs</h2><p>Unable to load your programs right now.</p><a href="./programs.html">Open My Programs</a>';return;}
 const items=Array.isArray(programResult.data?.programs)?programResult.data.programs:[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const recent=document.querySelector('#recent-practice');
 if(recent){
  if(sessionResult.error)recent.innerHTML='<h2>Recent practice</h2><p>Practice history could not load. Try again later.</p>';
  else {
   const sessions=sessionResult.data||[];
   recent.innerHTML='<h2>Recent practice</h2>'+(sessions.length?'<div>'+sessions.map(x=>'<article style="padding:12px 0;border-top:1px solid #454b4f"><strong>'+esc(x.drill_title||'Practice session')+'</strong><p>'+esc(x.practiced_on||'')+' · '+Number(x.successes||0)+' / '+Number(x.attempts||0)+' successful attempts</p></article>').join('')+'</div>':'<p>No practice sessions saved to your account yet.</p>')+'<a href="./practice.html">Go to Practice Center →</a>';
  }
 }
 plans.innerHTML='<h2>Saved training programs</h2><p>'+items.length+' program'+(items.length===1?'':'s')+' saved to your account</p>'+items.slice(0,5).map(p=>'<article style="padding:12px 0;border-top:1px solid #454b4f"><strong>'+esc(p.name||p.title||'Training program')+'</strong><p>'+esc(p.status||'Ready')+'</p></article>').join('')+'<a href="./programs.html">Open, edit and track programs →</a>';
}
function loggedIn(user){
 const safeEmail=document.createElement('span');safeEmail.textContent=user.email||'Golfer';
 app.innerHTML=`<section class="member-dashboard"><div class="member-heading"><div><div class="member-eyebrow">YOUR PERSONAL GOLF HEADQUARTERS</div><h1>My Golf Lab</h1><p class="member-email"></p></div><div class="member-avatar" aria-hidden="true">⛳</div></div><div class="member-metrics"><div><strong id="metric-handicap">—</strong><span>Handicap</span></div><div><strong id="metric-average">—</strong><span>Average score</span></div><div><strong id="metric-rounds">—</strong><span>Rounds logged</span></div><div><strong id="metric-practice-sessions">—</strong><span>Practice sessions</span></div></div><h2>My tools</h2><div class="member-tools"><a href="./round-tracker.html"><span class="tool-symbol">⚑</span><span><strong>Round Tracker</strong><small>Record scores and on-course statistics</small></span><span class="tool-arrow">›</span></a><a href="./swing-lab.html"><span class="tool-symbol">◉</span><span><strong>Swing Lab</strong><small>Keep notes on your swing and recurring misses</small></span><span class="tool-arrow">›</span></a><a href="./performance.html"><span class="tool-symbol">▥</span><span><strong>My Performance</strong><small>Review training and performance</small></span><span class="tool-arrow">›</span></a><a href="./programs.html"><span class="tool-symbol">▤</span><span><strong>My Training Programs</strong><small>Build and manage practice plans</small></span><span class="tool-arrow">›</span></a></div><section class="member-saved-plans" id="cloud-plans" style="margin:22px 0;padding:20px;border:1px solid #454b4f;border-radius:16px;background:#262a2d"><h2>Saved training programs</h2><p>Loading your account programs…</p></section><section class="member-saved-plans" id="recent-practice" style="margin:22px 0;padding:20px;border:1px solid #454b4f;border-radius:16px;background:#262a2d"><h2>Recent practice</h2><p>Loading recent sessions…</p></section><div class="member-account-actions"><p>Training records are not yet synced to your account. Round Tracker and Swing Lab are being introduced as personal tools; do not rely on browser storage as a backup.</p><button id="member-change-password" type="button">Change password</button><button id="member-signout" type="button">Sign out</button></div></section>`;
 app.querySelector('.member-email').textContent='Signed in as '+safeEmail.textContent;
 loadAccountTraining(user).catch(()=>{const panel=document.querySelector('#cloud-plans');if(panel)panel.innerHTML='<h2>Saved training programs</h2><p>Unable to load account training right now.</p><a href="./programs.html">Open My Programs</a>';});
 supabase.from('golf_rounds').select('score,holes').eq('user_id',user.id).then(({data,error})=>{if(error||!data)return;app.querySelector('#metric-rounds').textContent=String(data.length);const rounds=data.filter(x=>x.holes===18);if(rounds.length)app.querySelector('#metric-average').textContent=(rounds.reduce((a,x)=>a+x.score,0)/rounds.length).toFixed(1);});
 app.querySelector('#member-change-password').onclick=()=>showRecovery();
 app.querySelector('#member-signout').onclick=async()=>{const {error}=await supabase.auth.signOut();if(error)alert(error.message);else loggedOut();};
}

function isRecoveryLink(){const query=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));return query.get('password_reset')==='1'||query.has('code')&&location.pathname.endsWith('/account.html')||query.get('type')==='recovery'||hash.get('type')==='recovery'||query.has('token_hash')&&query.get('type')==='recovery'||sessionStorage.getItem('thelab-recovery-pending')==='1';}
function showRecovery(){sessionStorage.setItem('thelab-recovery-pending','1');app.innerHTML='<h1>Choose a new password</h1><p>Enter a new password for your Lab account.</p><form id="recover"><label for="new-password">New password</label><input id="new-password" name="password" type="password" minlength="12" autocomplete="new-password" required><label for="confirm-password">Confirm new password</label><input id="confirm-password" name="confirm" type="password" minlength="12" autocomplete="new-password" required><button type="submit">Update password</button></form><p id="message" role="status" aria-live="polite"></p>';document.querySelector('#recover').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.target),password=String(form.get('password')||''),confirm=String(form.get('confirm')||'');if(password!==confirm)return message('Passwords do not match.');const button=e.target.querySelector('button');button.disabled=true;try{const {error}=await supabase.auth.updateUser({password});if(error)throw error;sessionStorage.removeItem('thelab-recovery-pending');history.replaceState(null,'',location.pathname);app.innerHTML='<h1>Password updated</h1><p>Your new password is saved. You can continue to your account.</p><a class="action" href="./account.html">Go to My Golf Lab</a>';}catch(err){message(err.message||'Unable to update password. Please request a new reset link.');}finally{button.disabled=false;}};}
async function start(){
 if(!supabase){app.innerHTML='<h1>Accounts are not configured</h1>';return;}
 const recovery=isRecoveryLink();
 if(recovery)showRecovery();
 supabase.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){showRecovery();return;}
  if(event==='SIGNED_OUT'){sessionStorage.removeItem('thelab-recovery-pending');loggedOut();return;}
  if(event==='SIGNED_IN'&&session?.user){
   if(isRecoveryLink())showRecovery();
   else loggedIn(session.user);
  }
 });
 const {data,error}=await supabase.auth.getSession();
 if(error){if(recovery)message('Reset link could not be verified. Request a fresh link.');else loggedOut();return;}
 if(recovery){
  if(data.session?.user)showRecovery();
  else message('Verifying your reset link… If it has expired, request a fresh one.');
  return;
 }
 if(data.session?.user)loggedIn(data.session.user);else loggedOut();
}
start().catch(()=>{app.textContent='Accounts are temporarily unavailable. Your local data has not been changed.';});
