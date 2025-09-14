const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
const CURRENT_KEY='cb_current_user';const REWARD_STAMPS=5;

function currentUserEmail(){return localStorage.getItem(CURRENT_KEY)||null}
function setCurrentUser(e){if(e){localStorage.setItem(CURRENT_KEY,e)}else{localStorage.removeItem(CURRENT_KEY)}}

async function api(path,method='GET',body=null){
  const r=await fetch(`/.netlify/functions/${path}`,{
    method,
    headers:body?{'Content-Type':'application/json'}:undefined,
    body:body?JSON.stringify(body):undefined
  });
  if(!r.ok)throw new Error(await r.text());
  return await r.json()
}

const signupApi=d=>api('signup','POST',d),
      loginApi=(e,p)=>api('login','POST',{email:e,password:p}),
      getUserApi=e=>fetch(`/.netlify/functions/getUser?email=${encodeURIComponent(e)}`).then(r=>r.json()),
      updateVisitsApi=(e,d)=>api('updateVisits','POST',{email:e,delta:d}),
      createBookingApi=(b)=>api('createBooking','POST',b),
      getBookingsApi=(email=null)=>fetch(`/.netlify/functions/getBookings${email?`?email=${encodeURIComponent(email)}`:''}`).then(r=>r.json()),
      updateBookingApi=(id,status)=>api('updateBooking','POST',{id,status});

const routes=['home','services','appointment','confirm','card','rewards','profile','login','admin'];
let route='home';let cachedUser=null;let bookingDraft=null;

async function fetchCurrentUser(){
  const e=currentUserEmail();
  if(!e)return null;
  cachedUser=await getUserApi(e);
  return cachedUser
}

function navTo(r){
  const e=currentUserEmail();
  if(!e&&r!=='login'){r='login'}
  if(!routes.includes(r))r='home';
  route=r;
  window.location.hash=r;
  render()
}

/* Helpers pentru ore */
function pad(n){return n.toString().padStart(2,'0')}
function toTime(h,m){return `${pad(h)}:${pad(m)}`}
function minutesAdd(hm, plus){const [h,m]=hm.split(':').map(Number);const t=h*60+m+plus;return toTime(Math.floor(t/60),t%60)}
function weekdayRange(date){
  const d=new Date(date);
  const day=d.getDay();
  if(day===0) return null; // duminică închis
  if(day===6) return {start:'09:00', end:'17:00'};
  return {start:'09:00', end:'20:00'};
}
function generateSlots(date, duration=45){
  const range=weekdayRange(date);
  if(!range) return [];
  const slots=[];
  let t=range.start;
  while(true){
    const next=minutesAdd(t,duration);
    if(next>range.end) break;
    slots.push(t);
    t=next;
  }
  return slots;
}

/* Pagini */
function Home(u){
  return `<section class='card'><h2>Bine ai venit, ${u?.name||''}</h2></section>`
}
function Services(){
  return `<section class='card'>
    <h2>Servicii</h2>
    <div class="tabs">
      <div class="tab active" data-gender="barbat">Bărbat</div>
      <div class="tab" data-gender="femeie">Femeie</div>
    </div>
    <div id="services-list"></div>
  </section>`
}
function renderServicesList(gender='barbat'){
  const male=[
    {name:'Tuns clasic', dur:45, price:'70 lei'},
    {name:'Fade + Styling', dur:60, price:'90 lei'},
    {name:'Barbă & Contur', dur:30, price:'50 lei'}
  ];
  const female=[
    {name:'Spălat + styling', dur:30, price:'60 lei'},
    {name:'Tuns & coafat', dur:60, price:'120 lei'}
  ];
  const items=gender==='barbat'?male:female;
  return `<div>${items.map(s=>`
    <div class="service-card">
      <div><strong>${s.name}</strong><br><span class="small">${s.dur} min • ${s.price}</span></div>
      <button class="btn primary book-btn" data-name="${s.name}" data-dur="${s.dur}" data-price="${s.price}" data-gender="${gender}">Programează</button>
    </div>`).join('')}</div>`;
}
function Appointment(){
  if(!bookingDraft) return `<section class='card'><h2>Programare</h2><p>Alege întâi un serviciu.</p></section>`;
  const today=new Date();const days=[];
  for(let i=0;i<7;i++){const d=new Date(today);d.setDate(today.getDate()+i);days.push(d);}
  const dayBtns=days.map((d,i)=>`<div class="day ${i===0?'active':''}" data-date="${d.toISOString()}">
    <div>${d.toLocaleDateString('ro-RO',{weekday:'short'})}</div>
    <div>${d.getDate()} ${d.toLocaleDateString('ro-RO',{month:'short'})}</div>
  </div>`).join('');
  const firstSlots=generateSlots(today, bookingDraft.duration);
  return `<section class='card'>
    <h2>Alege ora</h2>
    <div class="days" id="daylist">${dayBtns}</div>
    <div class="slots" id="slotlist">${firstSlots.map(t=>`<div class="slot">${t}</div>`).join('')}</div>
  </section>`;
}
function Confirm(){
  if(!bookingDraft) return `<section class='card'><h2>Confirmă</h2><p>N-ai selectat un slot.</p></section>`;
  const d=new Date(bookingDraft.dateISO);
  const readable=`${d.toLocaleDateString('ro-RO')} • ${bookingDraft.time}`;
  return `<section class='card'>
    <h2>Confirmare</h2>
    <p><strong>${bookingDraft.service}</strong> • ${bookingDraft.duration} min</p>
    <p>${readable}</p>
    <button class="btn primary" id="confirm-booking">Confirmă programarea</button>
  </section>`;
}
function Card(u){
  if(!u)return `<section class='card'><h2>Card</h2><p>Autentifică-te.</p></section>`;
  const pct=Math.min(100,(u.visits%REWARD_STAMPS)/REWARD_STAMPS*100);
  return `<section class='card'><h2>Card membru</h2>
    <div class='progress'><div class='fill' style='width:${pct}%'></div></div></section>`;
}
function Rewards(u){
  return `<section class='card'><h2>Recompense</h2><p>${u?.visits||0} vizite</p></section>`;
}
function Profile(u){
  return `<section class='card'><h2>Profil</h2>
    <p>${u?.name||''}</p><button class='btn' id='btn-logout'>Delogare</button></section>`;
}
function Admin(u,bookings){
  if(!(u?.email==='admin@gmail.com'&&u?.password==='laurcontrastbeauty0000')){
    return `<section class='card'><h2>Admin</h2><p>Acces restricționat.</p></section>`;
  }
  if(!bookings) return `<section class='card'><h2>Admin</h2><p>Se încarcă...</p></section>`;
  return `<section class='card'><h2>Programări</h2>
    ${bookings.map(b=>`
      <div class="admin-booking" data-id="${b.id}">
        <strong>${b.service}</strong> • ${b.date} ${b.time}<br>
        Client: ${b.client_name} (${b.client_email})<br>
        Status: ${b.status}<br>
        <button class="btn" data-action="done">Finalizat</button>
        <button class="btn" data-action="cancel">Anulează</button>
      </div>`).join('')}
  </section>`;
}
function LoginScreen(){
  return `<section class='card auth-card'>
    <h2>Login</h2>
    <input class='input' id='login-email' placeholder='Email'>
    <input class='input' id='login-pass' type='password' placeholder='Parolă'>
    <button class='btn primary' id='login-btn'>Intră</button>
    <p class='small'>Nu ai cont? <a href='#' id='show-signup'>Creează cont</a></p>
    <form id='signup-form' class='hidden'>
      <h2>Creează cont</h2>
      <input class='input' id='su-name' placeholder='Nume'>
      <input class='input' id='su-email' placeholder='Email'>
      <input class='input' id='su-pass' type='password' placeholder='Parolă'>
      <button class='btn primary' id='signup-btn'>Creează cont</button>
    </form></section>`;
}

/* Render */
async function render(){
  const app=$('#app');if(!app)return;
  let html='';const e=currentUserEmail();const u=e?await fetchCurrentUser():null;
  if(route==='home')html=Home(u);
  else if(route==='services')html=Services();
  else if(route==='appointment')html=Appointment();
  else if(route==='confirm')html=Confirm();
  else if(route==='card')html=Card(u);
  else if(route==='rewards')html=Rewards(u);
  else if(route==='profile')html=Profile(u);
  else if(route==='admin'){const bookings=await getBookingsApi();html=Admin(u,bookings);}
  else html=LoginScreen();
  app.innerHTML=html;bindEvents(u)
}

/* Events */
function bindEvents(u){
  $$('.nav-btn').forEach(btn=>{
    btn.onclick=()=>{const r=btn.getAttribute('data-route');navTo(r);
      $$('.nav-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');};
  });

  $$('.tab').forEach(tab=>{
    tab.onclick=()=>{ $$('.tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');
      $('#services-list').innerHTML=renderServicesList(tab.getAttribute('data-gender'));
      $$('.book-btn').forEach(b=>b.onclick=()=>{bookingDraft={service:b.dataset.name,duration:+b.dataset.dur,price:b.dataset.price,gender:b.dataset.gender};navTo('appointment');});
    };
  });
  if($('#services-list')){ $('#services-list').innerHTML=renderServicesList('barbat');
    $$('.book-btn').forEach(b=>b.onclick=()=>{bookingDraft={service:b.dataset.name,duration:+b.dataset.dur,price:b.dataset.price,gender:b.dataset.gender};navTo('appointment');});
  }

  if($('#daylist')){ $$('#daylist .day').forEach(d=>d.onclick=()=>{ $$('#daylist .day').forEach(x=>x.classList.remove('active'));d.classList.add('active');
      const iso=d.dataset.date;const slots=generateSlots(new Date(iso),bookingDraft.duration);
      $('#slotlist').innerHTML=slots.map(t=>`<div class="slot">${t}</div>`).join('');
      $$('#slotlist .slot').forEach(s=>s.onclick=()=>{bookingDraft.dateISO=iso;bookingDraft.time=s.textContent;navTo('confirm');});
  });}

  $('#confirm-booking')?.addEventListener('click',async()=>{
    const body={client_name:u?.name,client_email:u?.email,gender:bookingDraft.gender,service:bookingDraft.service,duration:bookingDraft.duration,price:bookingDraft.price,date:new Date(bookingDraft.dateISO).toISOString().slice(0,10),time:bookingDraft.time,status:'scheduled'};
    await createBookingApi(body);alert('Programare confirmată!');navTo('home');
  });

  $('#login-btn')?.addEventListener('click',async()=>{
    const email=$('#login-email').value;const pass=$('#login-pass').value;
    try{const user=await loginApi(email,pass);setCurrentUser(user.email);navTo('home');}catch(e){alert('Eroare login')}
  });
  $('#show-signup')?.addEventListener('click',e=>{e.preventDefault();$('#signup-form').classList.remove('hidden')});
  $('#signup-btn')?.addEventListener('click',async()=>{
    const name=$('#su-name').value,email=$('#su-email').value,pass=$('#su-pass').value;
    try{const user=await signupApi({name,email,password:pass});setCurrentUser(user.email);navTo('home')}catch(e){alert('Eroare signup')}
  });
  $('#btn-logout')?.addEventListener('click',()=>{setCurrentUser(null);navTo('login')});

  if(route==='admin'){$$('.admin-booking [data-action]').forEach(btn=>btn.onclick=async()=>{await updateBookingApi(btn.closest('.admin-booking').dataset.id,btn.dataset.action==='cancel'?'canceled':'done');alert('Actualizat');navTo('admin');});}
}

/* Splash intro */
window.addEventListener('load',()=>{
  setTimeout(()=>$('#splash').classList.add('run'),900);
  setTimeout(()=>{$('#splash').classList.add('hidden');document.querySelectorAll('.site-header,.site-footer,#app').forEach(el=>el.classList.remove('hidden'));
    const e=currentUserEmail();if(e)navTo('home');else navTo('login');render();},2000)
});
window.addEventListener('hashchange',()=>{const h=location.hash.replace('#','');navTo(h||'home')});
