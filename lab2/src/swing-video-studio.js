const $=id=>document.getElementById(id);
const sessions={a:{url:null,lines:[],start:null},b:{url:null,lines:[],start:null}};
function canvasSetup(key){const canvas=$('draw-'+key),rect=canvas.getBoundingClientRect();const ratio=window.devicePixelRatio||1;canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);return {ctx,width:rect.width,height:rect.height}}
function draw(key){const {ctx,width,height}=canvasSetup(key);ctx.clearRect(0,0,width,height);ctx.strokeStyle='#c7f43b';ctx.lineWidth=2.5;ctx.lineCap='round';for(const [a,b] of [...sessions[key].lines,...(sessions[key].start?[sessions[key].start]:[])]){if(!b)continue;ctx.beginPath();ctx.moveTo(a.x*width,a.y*height);ctx.lineTo(b.x*width,b.y*height);ctx.stroke()}}
function point(event,key){const r=$('draw-'+key).getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))}}
for(const key of ['a','b']){
 const file=$('video-file-'+key),video=$('swing-video-'+key),canvas=$('draw-'+key),status=$('video-status-'+key);
 file.addEventListener('change',()=>{
  const selected=file.files?.[0];if(!selected)return;
  if(!selected.type.startsWith('video/')){status.textContent='Please choose a video file.';file.value='';return}
  video.pause();if(sessions[key].url)URL.revokeObjectURL(sessions[key].url);
  sessions[key].url=URL.createObjectURL(selected);video.src=sessions[key].url;video.load();sessions[key].lines=[];sessions[key].start=null;draw(key);
  status.textContent=selected.name+' — loading…';
 });
 video.addEventListener('loadedmetadata',()=>{status.textContent=(Number.isFinite(video.duration)?video.duration.toFixed(1)+'s · ':'')+'Ready to review.'});
 video.addEventListener('error',()=>{status.textContent='This browser cannot play the selected video format.'});
 $('speed-'+key).addEventListener('change',e=>{video.playbackRate=Number(e.target.value)});
 canvas.addEventListener('pointerdown',e=>{if($('draw-tool').value==='none'||!video.src)return;canvas.setPointerCapture(e.pointerId);sessions[key].start=[point(e,key),null]});
 canvas.addEventListener('pointermove',e=>{if(!sessions[key].start)return;sessions[key].start[1]=point(e,key);draw(key)});
 canvas.addEventListener('pointerup',e=>{if(!sessions[key].start)return;sessions[key].start[1]=point(e,key);const [a,b]=sessions[key].start;if(Math.hypot(a.x-b.x,a.y-b.y)>.01)sessions[key].lines.push([a,b]);sessions[key].start=null;draw(key)});
 canvas.addEventListener('pointercancel',()=>{sessions[key].start=null;draw(key)});
 const observer=new ResizeObserver(()=>draw(key));observer.observe(canvas);
}
document.querySelectorAll('[data-video][data-action]').forEach(button=>button.addEventListener('click',()=>{
 const video=$('swing-video-'+button.dataset.video);if(!video.src||!video.readyState)return;
 const action=button.dataset.action;
 if(action==='play'){if(video.paused)video.play().catch(()=>{});else video.pause()}
 else{video.pause();video.currentTime=Math.max(0,Math.min(Number.isFinite(video.duration)?video.duration:Infinity,video.currentTime+(action==='next'?1:-1)/30))}
}));
$('clear-lines').addEventListener('click',()=>{for(const key of ['a','b']){sessions[key].lines=[];sessions[key].start=null;draw(key)}});
$('sync-videos').addEventListener('click',()=>{const a=$('swing-video-a'),b=$('swing-video-b');if(!a.readyState||!b.readyState)return;a.pause();b.pause();a.currentTime=0;b.currentTime=0});
$('draw-tool').addEventListener('change',e=>{for(const key of ['a','b'])$('draw-'+key).style.pointerEvents=e.target.value==='none'?'none':'auto'});
window.addEventListener('pagehide',()=>{for(const key of ['a','b'])if(sessions[key].url)URL.revokeObjectURL(sessions[key].url)});

function clock(t){if(!Number.isFinite(t)||t<0)return '0:00';const n=Math.floor(t);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
for(const key of ['a','b']){
 const video=$('swing-video-'+key),scrub=$('scrub-'+key),label=$('time-'+key);
 const update=()=>{const duration=Number.isFinite(video.duration)?video.duration:0;scrub.value=duration?String(Math.round(1000*video.currentTime/duration)):'0';scrub.disabled=!duration;label.textContent=clock(video.currentTime)+' / '+clock(duration)};
 video.addEventListener('timeupdate',update);video.addEventListener('loadedmetadata',update);video.addEventListener('durationchange',update);
 scrub.addEventListener('input',()=>{if(Number.isFinite(video.duration)&&video.duration>0){video.currentTime=video.duration*Number(scrub.value)/1000;update()}});
 update();
}

const comparisonToggle=$('toggle-comparison'),comparisonBay=$('comparison-bay');
comparisonToggle.addEventListener('click',()=>{
 const opening=comparisonBay.hidden;
 comparisonBay.hidden=!opening;
 comparisonToggle.setAttribute('aria-expanded',String(opening));
 comparisonToggle.textContent=opening?'− Hide comparison':'+ Compare another swing';
 requestAnimationFrame(()=>{draw('a');if(opening)draw('b')});
});
