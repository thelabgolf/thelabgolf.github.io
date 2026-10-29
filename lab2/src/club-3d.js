import * as THREE from 'https://esm.sh/three@0.170.0';
const dialog=document.getElementById('club-3d-dialog'),host=document.getElementById('club-3d-canvas');
let renderer,scene,camera,club,frame,down=false,lastX=0,lastY=0;
const metal=new THREE.MeshStandardMaterial({color:0xc7cfd0,metalness:.85,roughness:.26});
const dark=new THREE.MeshStandardMaterial({color:0x242b2b,metalness:.48,roughness:.4});
const grip=new THREE.MeshStandardMaterial({color:0x121617,roughness:.83});
const lime=new THREE.MeshStandardMaterial({color:0xb8e841,metalness:.28,roughness:.36});
function mesh(geometry,material,parent,pos=[0,0,0],rotation=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.position.set(...pos);m.rotation.set(...rotation);parent.add(m);return m}
function makeClub(type){
 const group=new THREE.Group();
 // Shaft is intentionally shortened slightly to make the head visible in the interactive preview.
 mesh(new THREE.CylinderGeometry(.018,.026,3.3,14),metal,group,[0,1.38,0],[0,0,-.13]);
 mesh(new THREE.CylinderGeometry(.042,.036,.72,16),grip,group,[-.17,2.7,0],[0,0,-.13]);
 mesh(new THREE.TorusGeometry(.042,.009,8,28),lime,group,[-.22,3.03,0],[Math.PI/2,0,0]);
 if(type==='Driver'||type==='Fairway Wood'||type==='Hybrid'){
  const scale=type==='Driver'?1:type==='Fairway Wood'?.83:.7;
  mesh(new THREE.SphereGeometry(1,32,22),dark,group,[.16,-.32,0]).scale.set(.63*scale,.29*scale,.43*scale);
  mesh(new THREE.BoxGeometry(.76*scale,.25*scale,.07),metal,group,[.28,-.36,.36*scale],[0,0,-.08]);
  mesh(new THREE.SphereGeometry(.8,24,16),lime,group,[.11,-.15,0]).scale.set(.32*scale,.055,.22*scale);
 }else if(type==='Putter'){
  mesh(new THREE.BoxGeometry(.85,.15,.3),metal,group,[.28,-.4,0]);
  mesh(new THREE.BoxGeometry(.65,.025,.04),lime,group,[.3,-.31,.1]);
 }else{
  const wedge=type==='Wedge';
  const head=mesh(new THREE.BoxGeometry(.66,.48,.11),metal,group,[.23,-.38,0],[0,0,wedge?-.32:-.16]);
  mesh(new THREE.BoxGeometry(.57,.035,.018),dark,group,[.24,-.21,.066],[0,0,wedge?-.32:-.16]);
  for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(.48,.009,.006),dark,group,[.23,-.33-i*.05,.063],[0,0,wedge?-.32:-.16]);
  mesh(new THREE.BoxGeometry(.22,.1,.025),lime,group,[.27,-.49,-.067]);
 }
 group.position.y=-1.1;return group;
}
function makeBag(){
 const g=new THREE.Group();
 const leather=new THREE.MeshStandardMaterial({color:0x17221d,roughness:.78,metalness:.08});
 const panel=new THREE.MeshStandardMaterial({color:0x354d39,roughness:.72});
 const trim=new THREE.MeshStandardMaterial({color:0xc4ed4b,metalness:.25,roughness:.35});
 // Tapered fabric body, bottom foot, top cuff, side pockets and carrying strap.
 mesh(new THREE.CylinderGeometry(.46,.69,2.25,32,1),leather,g,[0,-.35,0]);
 mesh(new THREE.CylinderGeometry(.49,.48,.2,32),trim,g,[0,.83,0]);
 mesh(new THREE.CylinderGeometry(.68,.7,.16,32),dark,g,[0,-1.55,0]);
 mesh(new THREE.BoxGeometry(.44,1.05,.12),panel,g,[0,-.36,.58]);
 mesh(new THREE.BoxGeometry(.5,.035,.14),trim,g,[0,.12,.65]);
 mesh(new THREE.BoxGeometry(.48,.38,.15),panel,g,[0,-1.07,.59]);
 mesh(new THREE.TorusGeometry(.47,.035,10,32,Math.PI),trim,g,[.49,.08,0],[0,Math.PI/2,.18]);
 const names=['Driver','Fairway Wood','Hybrid','Iron','Iron','Wedge','Putter'];
 const saved=window.labLockerBagClubs||[];
 const types=saved.length?saved.slice(0,14).map(c=>c.club_type):names;
 const slots=types.length;
 types.forEach((type,i)=>{
   const c=makeClub(type);c.scale.setScalar(.51);
   const angle=i*2.39996;
   const radius=.12+Math.sqrt(i/Math.max(1,slots))*.28;
   c.position.set(Math.cos(angle)*radius,1.17+(i%3)*.035,Math.sin(angle)*radius);
   c.rotation.z=(Math.cos(angle))*.15;c.rotation.x=(Math.sin(angle))*.12;
   g.add(c);
 });
 g.position.y=-.15;
 return g;
}
function setup(){
 if(renderer)return;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(4.6,2.1,6.3);camera.lookAt(0,.4,0);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xe9f9e8,0x25372c,2.3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,7,6);scene.add(light);const rim=new THREE.DirectionalLight(0xb9ed60,2);rim.position.set(-5,2,-4);scene.add(rim);
 renderer.domElement.addEventListener('pointerdown',e=>{down=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
 renderer.domElement.addEventListener('pointerup',()=>down=false);renderer.domElement.addEventListener('pointercancel',()=>down=false);
 renderer.domElement.addEventListener('pointermove',e=>{if(!down||!club)return;club.rotation.y+=(e.clientX-lastX)*.012;club.rotation.x=Math.max(-.7,Math.min(.7,club.rotation.x+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY});
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.position.multiplyScalar(e.deltaY>0?1.07:.93);camera.position.clampLength(3.4,13)},{passive:false});
}
function resize(){if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(){if(!dialog.open)return;frame=requestAnimationFrame(animate);if(club&&!down)club.rotation.y+=.002;renderer.render(scene,camera)}
window.addEventListener('lab-view-bag-3d',e=>{setup();if(club)scene.remove(club);window.labLockerBagClubs=e.detail.clubs||[];club=makeBag();scene.add(club);document.getElementById('club-3d-title').textContent='My Golf Bag · 3D showroom';dialog.showModal();resize();cancelAnimationFrame(frame);animate()});
window.addEventListener('lab-view-club-3d',e=>{setup();if(club)scene.remove(club);club=makeClub(e.detail.type);scene.add(club);document.getElementById('club-3d-title').textContent=e.detail.name+' · 3D view';dialog.showModal();resize();cancelAnimationFrame(frame);animate()});
document.getElementById('close-3d').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);down=false});
window.addEventListener('resize',resize);
