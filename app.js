const $=(s,c=document)=>c.querySelector(s);
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
      updateVisitsApi=(e,d)=>api('updateVisits','POST',{email:e,delta:d});

const routes=['home','services','card','rewards','profile','login'];
let route='home';let cachedUser=null;

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

function Home(u){
  return `<section class='card'><h2>Bine ai venit, ${u?.name||''}</h2></section>`
}
function Services(){
  return `<section class='card'><h2>Servicii</h2></section>`
}
function Card(u){
  if(!u)return `<section class='card'><h2>Card</h2><p>Autentifică-te.</p></section>`;
  const pct=Math.min(100,(u.visits%REWARD_STAMPS)/REWARD_STAMPS*100);
  let adminSection='';
  if(u.email==='admin@gmail.com'&&u.password==='laurcontrastbeauty0000'){
    adminSection=`<div class='card'><h3>Gestionează vizite</h3>
      <input class='input' id='adm-email' placeholder='Email'>
      <div class='row'>
        <button class='btn primary' id='adm-add'>+1</button>
        <button class='btn' id='adm-sub'>-1</button>
      </div></div>`
  }
  return `<section class='card'>
    <h2>Card membru</h2>
    <div class='progress'><div class='fill' style='width:${pct}%'></div></div>
    ${adminSection}
  </section>`
}
function Rewards(u){
  return `<section class='card'><h2>Recompense</h2><p>${u?.visits||0} vizite</p></section>`
}
function Profile(u){
  return `<section class='card'><h2>Profil</h2>
    <p>${u?.name||''}</p>
    <button class='btn' id='btn-logout'>Delogare</button>
  </section>`
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
      <textarea class='input' id='su-about' placeholder='Despre tine (opțional)'></textarea>
      <button class='btn primary' id='signup-btn'>Creează cont</button>
    </form>
  </section>`
}

async function render(){
  const app=$('#app');if(!app)return;
  let html='';
  const e=currentUserEmail();
  const u=e?await fetchCurrentUser():null;
  switch(route){
    case'home':html=Home(u);break;
    case'services':html=Services();break;
    case'card':html=Card(u);break;
    case'rewards':html=Rewards(u);break;
    case'profile':html=Profile(u);break;
    case'login':default:html=LoginScreen()
  }
  app.innerHTML=html;
  bindEvents(u)
}

function bindEvents(u){
  $('#login-btn')?.addEventListener('click',async()=>{
    const email=$('#login-email').value;
    const pass=$('#login-pass').value;
    try{
      const user=await loginApi(email,pass);
      setCurrentUser(user.email);
      navTo('home')
    }catch(e){alert('Eroare login')}
  });
  $('#show-signup')?.addEventListener('click',e=>{
    e.preventDefault();
    $('#signup-form').classList.remove('hidden')
  });
  $('#signup-btn')?.addEventListener('click',async()=>{
    const name=$('#su-name').value;
    const email=$('#su-email').value;
    const pass=$('#su-pass').value;
    const about=$('#su-about').value;
    try{
      const user=await signupApi({name,email,password:pass,about});
      setCurrentUser(user.email);
      navTo('home')
    }catch(e){alert('Eroare signup')}
  });
  $('#btn-logout')?.addEventListener('click',()=>{
    setCurrentUser(null);
    navTo('login')
  });
  $('#adm-add')?.addEventListener('click',async()=>{
    const em=$('#adm-email').value;
    await updateVisitsApi(em,1);
    alert('+1')
  });
  $('#adm-sub')?.addEventListener('click',async()=>{
    const em=$('#adm-email').value;
    await updateVisitsApi(em,-1);
    alert('-1')
  })
}

// ✅ Fix la splash + intro
window.addEventListener('load',()=>{
  setTimeout(()=>$('#splash').classList.add('run'),900);
  setTimeout(()=>{
    $('#splash').classList.add('hidden');
    // Afișăm UI după intro
    document.querySelectorAll('.site-header, .site-footer, #app')
      .forEach(el=>el.classList.remove('hidden'));
    // Navighează în funcție de login
    const e=currentUserEmail();
    if(e) navTo('home'); else navTo('login');
    render();
  },2000)
});

window.addEventListener('hashchange',()=>{
  const h=location.hash.replace('#','');
  navTo(h||'home')
});
