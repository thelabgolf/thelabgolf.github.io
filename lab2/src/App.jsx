import React,{useState,useEffect} from 'react';
import {supabase} from './supabase.js';
import officialLogo from '../327826cb-f4ad-42a0-9422-3d88d56b6c20.png';
import {House,BookOpen,Target,CalendarDays,ChartNoAxesCombined,ArrowUpRight,ChevronRight,Clock3,Flag,UserRound,Menu,X,CheckCircle2,Sun,TrendingUp,Play,Activity,Trophy} from 'lucide-react';
const links=[{name:'Home',icon:House,href:'#home'},{name:'Academy',icon:BookOpen,href:'./academy.html'},{name:'Practice',icon:Target,href:'./practice.html'},{name:'Programs',icon:CalendarDays,href:'./programs.html'},{name:'Account',icon:UserRound,href:'./account.html'}];
const skills=[{name:'Driving',note:'Off the tee',icon:Flag,href:'./practice.html?skill=Driving'},{name:'Iron Play',note:'Solid contact',icon:Target,href:'./practice.html?skill=Iron%20Play'},{name:'Short Game',note:'Inside 100 yards',icon:Trophy,href:'./practice.html?skill=Short%20Game'},{name:'Putting',note:'On the green',icon:Activity,href:'./practice.html?skill=Putting'}];
function Brand(){return <><a className="brand brand-image" href="#home" aria-label="The Lab home"><img src={officialLogo} alt="The Lab Golf" /></a><svg aria-hidden="true" width="0" height="0" style={{position:'absolute',overflow:'hidden'}}><defs><filter id="lab-black-key" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0.75 0.75 0.75 0 -0.09"/></filter></defs></svg></>}
function Header(){const[open,setOpen]=useState(false);return <header className="topbar"><div className="top-inner"><Brand/><nav className="desktop-nav" aria-label="Desktop navigation">{links.map(({name,href})=><a href={href} key={name}>{name}</a>)}</nav><button className="menu-button" type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button></div>{open&&<nav className="mobile-menu" aria-label="Additional navigation">{links.map(({name,href})=><a key={name} href={href} onClick={()=>setOpen(false)}>{name}</a>)}</nav>}</header>}
function Nav(){return <nav className="bottom-nav" aria-label="Primary navigation">{links.map(({name,icon:Icon,href},i)=><a key={name} href={href} aria-current={i===0?'page':undefined}><Icon size={22} strokeWidth={i===0?2.6:2}/><span>{name}</span></a>)}</nav>}
function SkillCard({name,note,icon:Icon,href}){return <a className="skill-tile" href={href}><span className="skill-icon"><Icon size={24}/></span><strong>{name}</strong><small>{note}</small><ArrowUpRight className="skill-arrow" size={17}/></a>}
function SectionHeading({eyebrow,title,href,label}){return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{href&&<a href={href}>{label}<ChevronRight size={16}/></a>}</div>}
function readTraining(){try{const plans=JSON.parse(localStorage.getItem('thelab-programs-v1')||'[]');const weekly=JSON.parse(localStorage.getItem('thelab-weekly-plans-v1')||'[]');const list=Array.isArray(plans)?plans:[];const w=Array.isArray(weekly)?weekly:[];const active=list.find(p=>p.primary&&p.status!=='archived')||list.find(p=>p.status==='active')||list.find(p=>p.status!=='archived');const selected=active||w.find(p=>p.status!=='archived');if(!selected)return null;const sessions=Array.isArray(selected.weeklySessions)?selected.weeklySessions:Array.isArray(selected.sessions)?selected.sessions:[];const done=sessions.filter(s=>s.done||s.completed).length;const next=sessions.find(s=>!s.done&&!s.completed);return {name:selected.name||selected.displayName||selected.goal||'Weekly training plan',sessions:sessions.length,done,next,weeklySessions:sessions,startedAt:selected.startedAt,days:selected.frequency||selected.days||sessions.length,goal:selected.goal||'',totalPlans:list.length||w.length}}catch{return null}}
function summarizeCloud(programs){
 const list=Array.isArray(programs)?programs.filter(p=>p&&typeof p==='object'):[];
 const active=list.find(p=>p.primary&&p.status!=='archived')||list.find(p=>p.status==='active')||list.find(p=>p.status!=='archived');
 if(!active)return null;
 const sessions=Array.isArray(active.weeklySessions)?active.weeklySessions:Array.isArray(active.sessions)?active.sessions:[];
 const total=sessions.length||Math.max(0,Number(active.weeks||0)*Number(active.frequency||0));
 const done=sessions.length?sessions.filter(x=>x.done||x.completed).length:Math.min(total,Math.max(0,Number(active.completed)||0));
 return {name:active.name||active.title||'Training program',sessions:total,done,next:sessions.find(x=>!x.done&&!x.completed),weeklySessions:sessions,startedAt:active.startedAt,days:active.frequency||active.days||sessions.length,goal:active.goal||'',totalPlans:list.length};
}

const memberTabs=[{name:'Home',icon:House,href:'./index.html'},{name:'Train',icon:Target,href:'./practice.html'},{name:'Programs',icon:CalendarDays,href:'./programs.html'},{name:'Progress',icon:ChartNoAxesCombined,href:'./performance.html'},{name:'More',icon:Menu,href:'./account.html'}];

function completedProgramSummaries(programs){
 const list=Array.isArray(programs)?programs:[];
 return list.filter(p=>p&&typeof p==='object').map(p=>{
  const sessions=Array.isArray(p.weeklySessions)?p.weeklySessions:Array.isArray(p.sessions)?p.sessions:[];
  const completed=sessions.filter(s=>s.done||s.completed);
  const total=sessions.length||Math.max(0,Number(p.weeks||0)*Number(p.frequency||0));
  const done=sessions.length?completed.length:Math.min(total,Math.max(0,Number(p.completed)||0));
  if(!total||done!==total)return null;
  const measured=completed.filter(s=>Number(s.attempts)>0&&Number.isFinite(Number(s.successes))&&Number(s.successes)>=0&&Number(s.successes)<=Number(s.attempts));
  const attempts=measured.reduce((n,s)=>n+Number(s.attempts),0);
  const successes=measured.reduce((n,s)=>n+Number(s.successes),0);
  const bySkill={};
  measured.forEach(s=>{const key=String(s.skill||s.drill||'General practice');const item=bySkill[key]||(bySkill[key]={skill:key,attempts:0,successes:0});item.attempts+=Number(s.attempts);item.successes+=Number(s.successes)});
  const weakest=Object.values(bySkill).filter(x=>x.attempts>=5).sort((a,b)=>a.successes/a.attempts-b.successes/b.attempts)[0];
  const lower=(weakest?.skill||'').toLowerCase();
  const recommendation=/putt|chip|pitch|bunker|wedge/.test(lower)?{title:'Short Game Mastery',reason:'Your lowest measured success rate was in '+weakest.skill+'.'}:/driver|wood|iron|contact|slice/.test(lower)?{title:'Better Ball Striking',reason:'Your lowest measured success rate was in '+weakest.skill+'.'}:measured.length?{title:'Build Your Next Program',reason:'Choose a new goal based on your latest measured results.'}:{title:'Start a Measured Program',reason:'This program is complete, but it has no scored practice results yet.'};
  return {id:p.id,name:p.name||p.title||'Training program',total,done,measured:measured.length,attempts,successes,accuracy:attempts?Math.round(successes/attempts*100):null,recommendation,completedAt:completed.map(s=>s.completedAt).filter(Boolean).sort().at(-1)||p.completedAt||null};
 }).filter(Boolean).sort((a,b)=>String(b.completedAt||'').localeCompare(String(a.completedAt||'')));
}
function CompletedProgramCard({programs}){
 const completed=completedProgramSummaries(programs);
 const [expanded,setExpanded]=useState(false);
 if(!completed.length)return null;
 const current=completed[0],more=completed.length-1;
 return <section className="lab-member-section lab-completed-program" aria-label="Completed training programs">
  <div className="lab-member-section-heading"><h2><Trophy size={23} style={{verticalAlign:'middle',marginRight:8}}/>Program complete</h2><a href="./performance.html">My progress <ChevronRight size={17}/></a></div>
  <p className="eyebrow">TRAINING MILESTONE · {current.total} OF {current.total} SESSIONS</p>
  <h3 style={{margin:'6px 0 10px',fontSize:'1.4rem'}}>{current.name}</h3>
  <div role="progressbar" aria-label="Completed program progress" aria-valuemin={0} aria-valuemax={current.total} aria-valuenow={current.done} style={{height:9,background:'#33433a',borderRadius:12,overflow:'hidden',margin:'14px 0'}}><span style={{display:'block',width:'100%',height:'100%',background:'#c7f43b'}}/></div>
  <div className="lab-completed-stats" style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,margin:'12px 0 18px'}}>
   <div style={{background:'#17251d',borderRadius:12,padding:13}}><strong style={{display:'block',fontSize:23}}>{current.done}</strong><small>Sessions completed</small></div>
   <div style={{background:'#17251d',borderRadius:12,padding:13}}><strong style={{display:'block',fontSize:23}}>{current.accuracy===null?'—':current.accuracy+'%'}</strong><small>{current.accuracy===null?'No scored sessions':'Scored rep success'}</small></div>
  </div>
  <p>{current.measured?current.measured+' sessions include measurable results. Accuracy reflects successful reps across those sessions, not an official golf skill rating.':'Sessions are marked complete, but no scored results were found. Training completion is not the same as verified skill improvement.'}</p>
  <div style={{border:'1px solid #435d47',borderRadius:13,padding:14,margin:'15px 0'}}>
   <strong style={{color:'#c7f43b'}}>RECOMMENDED NEXT</strong>
   <h3 style={{margin:'8px 0'}}>{current.recommendation.title}</h3>
   <p style={{margin:'4px 0 12px'}}>{current.recommendation.reason}</p>
   <a className="lab-completed-action" href="./programs.html#lab-discover" style={{display:'inline-flex',minHeight:44,alignItems:'center',padding:'10px 14px',background:'#c7f43b',color:'#101710',borderRadius:10,fontWeight:800,textDecoration:'none'}}>Explore next program <ChevronRight size={17}/></a>
  </div>
  <button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} style={{background:'transparent',border:'1px solid #526a58',color:'#f1f5ed',borderRadius:10,padding:'12px 14px',minHeight:44,width:'100%',fontWeight:700}}>{expanded?'Hide completed programs':'View completed programs'+(more?' ('+completed.length+')':'')}</button>
  {expanded&&<div style={{marginTop:12}}>{completed.map(p=><div key={p.id||p.name} style={{padding:'12px 0',borderBottom:'1px solid #415047'}}><strong>{p.name}</strong><p style={{margin:'4px 0'}}>{p.done}/{p.total} sessions · {p.accuracy===null?'No measured accuracy':p.accuracy+'% scored rep success'}</p></div>)}</div>}
 </section>;
}
function MemberHome({user,training,practiceStats,programs}){
 const [today,setToday]=useState(()=>new Date());
 const [profile,setProfile]=useState(null);
 const [rounds,setRounds]=useState([]);
 useEffect(()=>{
  if(!supabase||!user)return;
  let alive=true;
  Promise.all([supabase.from('golf_profiles').select('*').eq('user_id',user.id).maybeSingle(),supabase.from('golf_rounds').select('score,holes').eq('user_id',user.id).limit(100)]).then(([p,r])=>{if(!alive)return;if(!p.error)setProfile(p.data);if(!r.error)setRounds(r.data||[])}).catch(()=>{});
  return()=>{alive=false};
 },[user.id]);
 const weekday=today.toLocaleDateString(undefined,{weekday:'long'});
 const date=today.toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});
 const name=profile?.display_name||profile?.full_name||user.user_metadata?.full_name||user.email?.split('@')[0]||'Golfer';
 const handicap=profile?.handicap_index??profile?.handicap??null;
 const validRounds=rounds.filter(r=>Number.isFinite(Number(r.score))&&Number(r.score)>0);
 const best=validRounds.length?Math.min(...validRounds.map(r=>Number(r.score))):null;
 const allSessions=training?.weeklySessions||[];
 const hasWeekdayAssignments=allSessions.some(s=>s.weekday);
 const start=training?.startedAt?new Date(training.startedAt):null;
 const startDay=start&&!Number.isNaN(start.getTime())?new Date(start.getFullYear(),start.getMonth(),start.getDate()):null;
 const selectedDay=new Date(today.getFullYear(),today.getMonth(),today.getDate());
 const weekNumber=startDay?Math.max(1,Math.floor((selectedDay-startDay)/604800000)+1):1;
 const scheduled=allSessions.filter(s=>s.weekday===weekday&&(!s.week||s.week===weekNumber));
 const next=scheduled[0]||(!hasWeekdayAssignments?training?.next:null);
 const needsScheduling=Boolean(training&&!hasWeekdayAssignments);
 const sessionTitle=next?.title||next?.name||next?.drill||next?.skill||(training?(needsScheduling?'Your training program is ready':'Rest day — no workout scheduled'):'Create your first training program');
 const shift=amount=>setToday(d=>{const n=new Date(d);n.setDate(n.getDate()+amount);return n});
 return <div className="lab-member-root"><Header/><main className="lab-member-shell">
 <div className="lab-member-intro"><div><p className="eyebrow">THE LAB / PLAYER DASHBOARD</p><h1>Welcome back, {name}.</h1><p>Your golf performance and training, all in one place.</p></div><a className="lab-member-settings" href="./account.html" aria-label="Account and settings"><Menu size={23}/></a></div>
 <section className="lab-player-card" aria-label="Player profile"><div className="lab-player-top"><span>THE LAB GOLF</span><span className="lab-player-rating">—<small>LAB RATING</small></span></div><div className="lab-player-identity"><UserRound size={62} strokeWidth={1.2}/><h2>{name}</h2><span>PLAYER PROFILE</span></div><div className="lab-player-metrics"><div><strong>{handicap??'—'}</strong><small>HANDICAP</small></div><div><strong>{best??'—'}</strong><small>BEST SCORE</small></div><div><strong>{practiceStats?.count??'—'}</strong><small>PRACTICES</small></div></div></section>
 <CompletedProgramCard programs={programs}/>
 <section className="lab-member-section"><div className="lab-member-section-heading"><h2>Build your Lab Rating</h2><a href="./performance.html">My progress <ChevronRight size={17}/></a></div><p>Complete training and record rounds to build your performance history. A Lab Rating will appear once a scoring system is established.</p><div className="lab-member-steps"><a href="./programs.html"><CheckCircle2 size={19}/> Choose your program <ChevronRight size={17}/></a><a href="./practice.html"><Target size={19}/> Log a practice session <ChevronRight size={17}/></a><a href="./round-tracker.html"><Flag size={19}/> Record a round <ChevronRight size={17}/></a></div></section>
 <section className="lab-member-section"><div className="lab-member-section-heading"><h2>Training Schedule</h2><a href="./programs.html">My Programs <ChevronRight size={17}/></a></div><div className="lab-day-switch"><button type="button" onClick={()=>shift(-1)} aria-label="Previous day">‹</button><div><strong>{weekday.toUpperCase()}</strong><span>{date}</span></div><button type="button" onClick={()=>shift(1)} aria-label="Next day">›</button></div><div className="lab-daily-card"><span>{training?(scheduled.length?'SCHEDULED WORKOUT':needsScheduling?'YOUR ACTIVE PROGRAM':'REST / UNSCHEDULED DAY'):'GET STARTED'}</span><h3>{training?sessionTitle:'Create your first training program'}</h3><p>{training?(scheduled.length?(scheduled.length+' session(s) · '+(scheduled.every(s=>s.done||s.completed)?'Completed':'Ready to train')+' · '+training.name+' · Week '+weekNumber):needsScheduling?(training.name+' · '+training.done+' of '+training.sessions+' sessions complete. Assign weekdays in My Programs to see daily workouts.'):'No workout assigned to this day.'):'Set up your training schedule in My Programs to see your next session here.'}</p><a href={training?'./programs.html':'./planner.html'}>{training?'Review sessions in Programs':'Build my program'} <ArrowUpRight size={17}/></a></div><p className="lab-day-note">Your saved program stays available even before you assign weekdays in My Programs.</p></section>
 <section className="lab-member-section"><div className="lab-member-section-heading"><h2>Your Training Tools</h2></div><div className="lab-member-tools"><a href="./academy.html"><BookOpen/>Academy</a><a href="./practice.html"><Target/>Practice</a><a href="./swing-lab.html"><Activity/>Swing Lab</a><a href="./club-locker.html"><Flag/>Club Locker</a></div></section>
 </main><nav className="lab-member-nav" aria-label="Member navigation">{memberTabs.map((t,i)=><a key={t.name} href={t.href} aria-current={i===0?'page':undefined}><t.icon size={21}/><span>{t.name}</span></a>)}</nav></div>;
}

function App(){
 const[days,setDays]=useState(3);
 const[user,setUser]=useState(null);
 const[authChecked,setAuthChecked]=useState(false);
 const[training,setTraining]=useState(null);
 const[programs,setPrograms]=useState([]);
 const[cloudState,setCloudState]=useState(supabase?'loading':'unavailable');
 const[practiceStats,setPracticeStats]=useState(null);
 useEffect(()=>{
  if(!supabase){setCloudState('unavailable');setAuthChecked(true);return;}
  let mounted=true,sequence=0;
  const refresh=async()=>{
   const seq=++sequence;
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(!mounted||seq!==sequence)return;
   setUser(authError?null:user||null);setAuthChecked(true);
   if(authError||!user){setTraining(null);setPrograms([]);setPracticeStats(null);setCloudState('signed-out');return;}
   const [p,r]=await Promise.all([
    supabase.from('golfer_programs').select('programs').eq('user_id',user.id).maybeSingle(),
    supabase.from('practice_sessions').select('attempts,successes',{count:'exact'}).eq('user_id',user.id).order('created_at',{ascending:false}).limit(100)
   ]);
   if(!mounted||seq!==sequence)return;
   if(p.error){setTraining(null);setPrograms([]);setCloudState('error');}
   else{const saved=Array.isArray(p.data?.programs)?p.data.programs:[];setPrograms(saved);setTraining(summarizeCloud(saved));setCloudState('ready');}
   if(r.error)setPracticeStats(null);
   else{
    const rows=r.data||[];
    const attempts=rows.reduce((n,x)=>n+Math.max(0,Number(x.attempts)||0),0);
    const successes=rows.reduce((n,x)=>n+Math.max(0,Number(x.successes)||0),0);
    setPracticeStats({count:r.count??rows.length,accuracy:attempts?Math.round(successes/attempts*100):null});
   }
  };
  const onFocus=()=>{if(!document.hidden)refresh()};
  const {data:listener}=supabase.auth.onAuthStateChange(()=>{Promise.resolve().then(()=>{if(mounted)refresh()})});
  refresh();
  window.addEventListener('focus',onFocus);window.addEventListener('pageshow',onFocus);
  return()=>{mounted=false;sequence++;listener?.subscription?.unsubscribe();window.removeEventListener('focus',onFocus);window.removeEventListener('pageshow',onFocus)};
 },[]);
 const weeklyPlan=training;
 if(!authChecked)return <div className="lab-auth-loading" role="status" aria-live="polite"><img src={officialLogo} alt="The Lab Golf"/><span>Loading your dashboard…</span></div>;
 if(user)return <MemberHome user={user} training={training} practiceStats={practiceStats} programs={programs}/>;
 return <><Header/><main id="home" className="shell lab2-home"><section className="welcome"><div><p className="welcome-kicker"><Sun size={16}/> YOUR GOLF TRAINING HUB</p><h1>Better every <em>round.</em></h1><p className="welcome-sub">Your next breakthrough starts with today's practice.</p></div><div className="welcome-avatar" aria-label="Member profile preview"><UserRound size={24}/></div></section>
<section className="featured-hero" aria-labelledby="daily-title"><div className="featured-image" role="img" aria-label="Golfer practicing on a green golf course"/><div className="featured-shade"/><div className="featured-content"><span className="feature-tag"><span className="pulse"/> TODAY'S FOCUS</span><p className="feature-overline">PRACTICE WITH PURPOSE</p><h2 id="daily-title">Make your<br/>irons <em>click.</em></h2><p className="feature-description">Build more consistent contact and a confident swing.</p><div className="feature-meta"><span><Clock3 size={15}/> 20 MIN</span><span><Target size={15}/> IRON PLAY</span></div><a className="feature-button" href="./practice.html"><Play size={17} fill="currentColor"/> Start practicing <ArrowUpRight size={18}/></a></div></section>
<section className="home-stats" aria-label="Platform statistics"><div><span className="stat-symbol"><Target size={17}/></span><strong>262</strong><small>Drills</small></div><div><span className="stat-symbol"><BookOpen size={17}/></span><strong>20</strong><small>Lessons</small></div><div><span className="stat-symbol"><CalendarDays size={17}/></span><strong>21</strong><small>Week goal</small></div></section>
<section className="section skills-section"><SectionHeading eyebrow="PICK YOUR FOCUS" title="Train your skills" href="./practice.html" label="All drills"/><div className="skills-grid">{skills.map(s=><SkillCard key={s.name} {...s}/>)}</div></section>
<section className="section"><SectionHeading eyebrow="FEATURED TRAINING" title="Build your foundation"/><a className="training-feature" href="./academy.html"><div className="training-image" role="img" aria-label="Golf ball on a putting green"/><div className="training-info"><span className="training-tag"><BookOpen size={15}/> THE ACADEMY</span><h3>Fundamentals that stick.</h3><p>Learn the basics, build consistency, and bring more confidence to the course.</p><span className="training-link">Explore 20 Academy lessons <ArrowUpRight size={18}/></span></div></a></section>
<section className="section" aria-label="Account practice statistics"><div className="training-dashboard"><div className="training-dashboard-head"><span className="weekly-label"><Activity size={16}/> MY PRACTICE ACTIVITY</span><a href="./account.html">My Golf Lab <ArrowUpRight size={16}/></a></div><p className="training-dashboard-sub">{practiceStats?practiceStats.count+' saved practice sessions · '+(practiceStats.accuracy===null?'Log attempts to track accuracy':practiceStats.accuracy+'% accuracy over latest 100 sessions'):cloudState==='loading'?'Loading account activity…':cloudState==='signed-out'?'Sign in to see your practice across devices.':'No cloud practice statistics available yet.'}</p></div></section>
<section className="section"><SectionHeading eyebrow="YOUR TRAINING" title="Training dashboard" href="./programs.html" label="My Programs"/>{training?<div className="training-dashboard"><div className="training-dashboard-head"><span className="weekly-label"><CalendarDays size={16}/> ACTIVE TRAINING PLAN</span><span className="training-dashboard-count">{training.totalPlans} saved {training.totalPlans===1?'plan':'plans'}</span></div><h3>{training.name}</h3><p className="training-dashboard-sub">{training.days} practice {training.days===1?'day':'days'} per week{training.goal?' · '+training.goal:''}</p>{training.sessions>0?<><div className="training-dashboard-metrics"><strong>{training.done}<small> / {training.sessions}</small></strong><span>sessions complete</span><b>{Math.round(training.done/training.sessions*100)}%</b></div><div className="training-dashboard-bar" role="progressbar" aria-label="Training sessions completed" aria-valuenow={training.done} aria-valuemin={0} aria-valuemax={training.sessions}><span style={{width:Math.round(training.done/training.sessions*100)+'%'}}/></div><div className="training-dashboard-next"><span>{training.next?'NEXT UP':'PLAN COMPLETE'}</span><strong>{training.next?(training.next.drill||training.next.skill||'Practice session'):'All sessions completed — great work!'}</strong>{training.next?.location&&<small>{training.next.location}</small>}</div></>:<p className="training-dashboard-sub">Open My Programs to review your training schedule and progress.</p>}<div className="training-dashboard-actions"><a href="./programs.html">Open my plan <ArrowUpRight size={17}/></a><a href="./practice.html">Practice Center <Target size={17}/></a></div></div>:<div className="progress-panel"><div className="progress-top"><span><TrendingUp size={18}/> Training activity</span><span className="progress-period">READY WHEN YOU ARE</span></div><div className="progress-empty"><div className="progress-rings"><ChartNoAxesCombined size={32}/></div><h3>Start your training journey.</h3><p>{cloudState==='loading'?'Loading your saved programs…':cloudState==='signed-out'?'Sign in to see saved programs and progress across devices.':cloudState==='error'?'Unable to load programs right now. Your account data is unchanged.':'Create a weekly practice plan to see your next session and completion progress here.'}</p><a href="./planner.html">Create a training plan <ArrowUpRight size={17}/></a></div></div>}</section>
<section className="section"><SectionHeading eyebrow="MAKE A PLAN" title="Your weekly routine"/><div className="weekly-panel"><div className="weekly-copy"><span className="weekly-label"><CalendarDays size={16}/> PRACTICE PLANNER</span>{weeklyPlan&&<div className="weekly-saved"><p>Saved plan: {weeklyPlan.days} days / week{weeklyPlan.goal?` · ${weeklyPlan.goal}`:""}</p>{weeklyPlan.next&&<p>Next session: {weeklyPlan.next.skill} — {weeklyPlan.next.drill}</p>}</div>}<h3>Consistency wins.</h3><p>How many days a week can you commit to improving your game?</p></div><div className="days-control"><button type="button" onClick={()=>setDays(d=>Math.max(1,d-1))} aria-label="Decrease practice days" disabled={days===1}>−</button><output aria-live="polite"><strong>{String(days).padStart(2,'0')}</strong><span>days / week</span></output><button type="button" onClick={()=>setDays(d=>Math.min(7,d+1))} aria-label="Increase practice days" disabled={days===7}>+</button></div><div className="day-progress" role="img" aria-label={days+' out of seven practice days selected'}>{Array.from({length:7},(_,i)=><span key={i} className={i<days?'active':''}/>)}</div><a className="weekly-button" href="./planner.html">{training?"Build another training plan":"Build my training program"} <ArrowUpRight size={18}/></a></div></section></main><footer className="site-footer"><div className="footer-brand"><img className="footer-logo" src={officialLogo} alt="The Lab Golf" /></div><div className="footer-tag">TRAIN. TRACK. IMPROVE.</div><p>Built for everyday golfers who want to practice with purpose, build confidence, and play better golf.</p><nav aria-label="Footer links"><a href="./contact.html">Contact</a><a href="./help.html">Help &amp; Support</a><a href="./privacy.html">Privacy Policy</a><a href="./terms.html">Terms of Service</a></nav><div className="footer-copy">© 2026 The Lab Golf. All rights reserved.</div></footer><Nav/></>}
export default App;