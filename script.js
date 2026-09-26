const KEY="driveCars";
const FAV_KEY="driveFavs";
const CONTACT_KEY="driveContact";

const seedCars=[
{id:"DRV001",brand:"Toyota",model:"RAV4",body:"SUV",price:18500,year:2022,km:23500,discount:8,engine:"2,000cc",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV002",brand:"BMW",model:"Série 3",body:"Sedan",price:21400,year:2021,km:31200,discount:12,engine:"2,000cc",trans:"AT",drive:"2WD",wheel:"LHD",image:"https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV003",brand:"Mercedes-Benz",model:"GLC",body:"SUV",price:29500,year:2023,km:11000,discount:18,engine:"2,000cc",trans:"AT",drive:"4WD",wheel:"LHD",image:"https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV004",brand:"Honda",model:"Civic",body:"Sedan",price:12900,year:2020,km:45500,discount:5,engine:"1,500cc",trans:"AT",drive:"2WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV005",brand:"Toyota",model:"Hilux",body:"Pick up",price:24900,year:2022,km:28000,discount:20,engine:"2,800cc",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV006",brand:"Nissan",model:"X-Trail",body:"SUV",price:15700,year:2021,km:39000,discount:10,engine:"2,000cc",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV007",brand:"Volkswagen",model:"Golf",body:"Hatchback",price:10900,year:2019,km:62000,discount:7,engine:"1,400cc",trans:"AT",drive:"2WD",wheel:"LHD",image:"https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV008",brand:"Subaru",model:"Forester",body:"SUV",price:16800,year:2020,km:48000,discount:15,engine:"2,000cc",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV009",brand:"Suzuki",model:"Jimny",body:"SUV",price:21210,year:2025,km:2355,discount:4,engine:"1,500cc",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1537984822441-cff330075342?auto=format&fit=crop&w=900&q=80",status:"available",views:0,stock:""},
{id:"DRV010",brand:"Mazda",model:"CX-5",body:"SUV",price:17900,year:2021,km:33000,discount:9,engine:"2,000cc",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80",status:"available"}
];

let filter={brand:"",body:"",minPrice:0,maxPrice:Infinity,minYear:0,maxYear:9999,minKm:0,maxKm:Infinity,discount:0,search:""};
const brands=["Toyota","Honda","Nissan","Mazda","Suzuki","Mitsubishi","Daihatsu","Subaru","Hino","Volkswagen"];
const brandImgs=["https://cdn.simpleicons.org/toyota","https://cdn.simpleicons.org/honda","https://cdn.simpleicons.org/nissan","https://cdn.simpleicons.org/mazda","https://cdn.simpleicons.org/suzuki","https://cdn.simpleicons.org/mitsubishi","https://cdn.simpleicons.org/daihatsu","https://cdn.simpleicons.org/subaru","https://cdn.simpleicons.org/hino","https://cdn.simpleicons.org/volkswagen"];
const bodies=["Sedan","Coupe","Hatchback","Station Wagon","SUV","Pick up","Truck","Van"];

function loadCars(){
  let stored=JSON.parse(localStorage.getItem(KEY)||"null");
  if(!Array.isArray(stored)){stored=seedCars.map(c=>({...c}));localStorage.setItem(KEY,JSON.stringify(stored));}
  let changed=false; const now=Date.now();
  stored=stored.map(c=>{if(c.status==="reserved"&&c.reservedUntil&&now>=c.reservedUntil){changed=true;return {...c,status:"available",reservedAt:null,reservedUntil:null};}return {...c,status:c.status||"available"};});
  if(changed)localStorage.setItem(KEY,JSON.stringify(stored));
  return stored;
}
function saveCars(list){localStorage.setItem(KEY,JSON.stringify(list));}
let cars=loadCars();

async function loadPublicCars(){
  if(window.driveCarsData && window.driveSupabase){
    try{
      const {data,error}=await window.driveCarsData.fetchCars({publicOnly:true});
      if(!error){cars=Array.isArray(data)?data:[];localStorage.setItem(KEY,JSON.stringify(cars));return;}
      console.warn("Catálogo online:",error.message);
    }catch(e){console.warn("Catálogo online:",e);}
  }
  // Não mostrar anúncios antigos de um único telefone quando o catálogo online falha.
  cars=[];
}
function subscribePublicCars(){
  if(!window.driveCarsData || window.publicCarsRealtime) return;
  window.publicCarsRealtime=window.driveCarsData.subscribe(async()=>{
    const previousIds=new Set(cars.map(c=>String(c.id)));
    const {data,error}=await window.driveCarsData.fetchCars({publicOnly:true});
    if(error)return;
    cars=data;localStorage.setItem(KEY,JSON.stringify(cars));
    const added=cars.filter(c=>!previousIds.has(String(c.id)));
    added.forEach(c=>addNotification("Novo carro publicado",`${c.brand||''} ${c.model||''} está agora disponível.`,"car",`car:${c.id}`));
    renderBrands();renderBodies();renderPopular();renderRecent();renderResults(filtered());updateFavCount();
  });
}

function esc(v){return String(v??"").replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[m]));}
function statusHTML(c){
  if(c.status==="sold") return '<span class="status-badge sold">VENDIDO</span>';
  if(c.status==="reserved") return `<span class="status-badge reserved">RESERVADO · <span class="countdown" data-until="${c.reservedUntil}">48:00:00</span></span>`;
  return '<span class="status-badge available">DISPONÍVEL</span>';
}
function contactNumber(){return localStorage.getItem(CONTACT_KEY)||"";}
function whatsappHref(c){const n=contactNumber().replace(/\D/g,"");return n?`https://wa.me/${n}?text=${encodeURIComponent(`Olá, tenho interesse no ${c.brand} ${c.model} (${c.id}).`)}`:"#";}
function callHref(){const n=contactNumber().replace(/\D/g,"");return n?`tel:+${n}`:"#";}

function renderBrands(){brandGrid.innerHTML=brands.map((b,i)=>`<button class="brand-card" onclick="setBrand('${b}')"><img src="${brandImgs[i]}" onerror="this.style.display='none'"><div>${b}<br><small>(${(72188-i*4300).toLocaleString("en-US")})</small></div></button>`).join("");}
function renderBodies(){bodyGrid.innerHTML=bodies.map((b,i)=>`<button class="body-card" onclick="setBody('${b}')"><b>${b}</b><br><small>(${(56112-i*4200).toLocaleString("en-US")})</small></button>`).join("");}
function getModelKey(brand,model){return `${String(brand||"").trim()}|${String(model||"").trim()}`.toLowerCase();}
function openModel(brand,model){
  filter={brand:String(brand||""),body:"",minPrice:0,maxPrice:Infinity,minYear:0,maxYear:9999,minKm:0,maxKm:Infinity,discount:0,search:""};
  if(document.getElementById("quickSearch")) quickSearch.value=`${brand} ${model}`;
  const matches=cars.filter(c=>getModelKey(c.brand,c.model)===getModelKey(brand,model));
  const section=document.getElementById("results");
  section?.classList.remove("hidden-home-results");
  if(section){const h=section.querySelector(".results-head h2");if(h)h.textContent=`${brand} ${model} — ${matches.length} opções`;}
  renderResults(matches);
  section?.scrollIntoView({behavior:"smooth"});
}
function showModelMore(brand,model){openModel(brand,model);}
function renderPopular(){
  const grouped={};
  cars.forEach(c=>{
    if(!c?.model || c.published===false) return;
    const brand=String(c.brand||"").trim(), model=String(c.model||"").trim();
    const key=getModelKey(brand,model);
    if(!grouped[key]) grouped[key]={brand,model,views:0,cars:[]};
    grouped[key].views+=Number(c.views||0);
    grouped[key].cars.push(c);
  });
  const popular=Object.values(grouped).sort((a,b)=>b.views-a.views).slice(0,5);
  popularModels.innerHTML=popular.length?popular.map(x=>{
    const preview=x.cars.slice(0,2);
    return `<article class="popular-model-block">
      <button class="popular-model-title" onclick="openModel('${esc(x.brand).replace(/'/g,"&#39;")}','${esc(x.model).replace(/'/g,"&#39;")}')">
        <span>${esc(x.brand)} ${esc(x.model)}</span><b>(${Number(x.views).toLocaleString()})</b>
      </button>
      <div class="popular-model-cars">${preview.map(c=>`<a class="popular-mini-car" href="detalhes.html?id=${encodeURIComponent(c.id)}"><img src="${esc(c.image||"")}" alt="${esc(c.brand+' '+c.model)}"><span>${esc(c.model)}${c.stock?` · Stock ${esc(c.stock)}`:""}</span></a>`).join("")}</div>
      <button class="model-more-btn" onclick="showModelMore('${esc(x.brand).replace(/'/g,"&#39;")}','${esc(x.model).replace(/'/g,"&#39;")}')">Ver mais <i class="fa-solid fa-chevron-down"></i></button>
    </article>`;
  }).join(""):`<p>Ainda não há modelos visualizados.</p>`;
}
function renderRecent(){const c=cars[8]||cars[0];if(!c){recentCars.innerHTML="";return;}recentCars.innerHTML=`<div class="recent-card"><img src="${c.image||""}"><div class="recent-info"><h3>2025/12 ${esc(String(c.brand||"").toUpperCase())} ${esc(String(c.model||"").toUpperCase())}</h3><p class="price">${driveFormatMoney(c.price)}</p><div class="specs"><span>☷ ${Number(c.km).toLocaleString()}km</span><span>⚙ ${esc(c.engine||"—")}</span><span>⚙ ${esc(c.trans||"—")}</span><span>◉ ${esc(c.drive||"—")}</span><span>⚖ ${esc(c.weight||"—")}</span><span>◌ ${esc(c.wheel||"—")}</span></div><a class="estimate" href="detalhes.html?id=${encodeURIComponent(c.id)}">Ver detalhes</a></div></div>`;}
function filtered(){return cars.filter(c=>(!filter.brand||c.brand===filter.brand)&&(!filter.body||c.body===filter.body)&&Number(c.price)>=filter.minPrice&&Number(c.price)<=filter.maxPrice&&Number(c.year)>=filter.minYear&&Number(c.year)<=filter.maxYear&&Number(c.km)>=filter.minKm&&Number(c.km)<=filter.maxKm&&Number(c.discount||0)>=filter.discount&&(!filter.search||`${c.brand} ${c.model} ${c.id} ${c.body} ${c.engine}`.toLowerCase().includes(filter.search.toLowerCase())));}
function renderResults(list){
  resultsGrid.innerHTML=list.length?list.map(c=>{
    const reserved=c.status==="reserved";
    const sold=c.status==="sold";
    const disabled=reserved||sold;
    return `<article class="car-card ${reserved?'is-reserved':''} ${sold?'is-sold':''}">
      <div class="card-status">${statusHTML(c)}</div>
      <div class="car-image-wrap"><a class="car-image-link" href="detalhes.html?id=${encodeURIComponent(c.id)}"><img src="${esc(c.image)}" alt="${esc(c.brand+' '+c.model)}"><span class="stock-label">Stock ${esc(c.stock||c.id)}</span></a><button type="button" class="heart image-heart" onclick="toggleFav('${esc(c.id)}',this)" aria-label="Adicionar aos favoritos"><i class="${isFav(c.id)?'fa-solid':'fa-regular'} fa-heart"></i></button></div>
      <div class="info"><small>${esc(c.year)} · ${esc(c.brand)}</small><h3>${esc(c.model)}</h3><div class="price">${driveFormatMoney(c.price)}</div><small>${Number(c.km).toLocaleString()} km · ${esc(c.engine||'—')} · ${esc(c.weight||'—')}</small>${c.discount?`<div class="discount">-${esc(c.discount)}%</div>`:''}
      <div class="card-actions"><a class="details-btn" href="detalhes.html?id=${encodeURIComponent(c.id)}">Ver detalhes</a><a class="wa-btn ${disabled?'disabled-link':''}" href="${disabled?'#':whatsappHref(c)}" target="_blank" rel="noopener noreferrer" onclick="${disabled?'return false;':''}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a><a class="call-btn ${disabled?'disabled-link':''}" href="${disabled?'#':callHref()}" onclick="${disabled?'return false;':''}"><i class="fa-solid fa-phone"></i> Ligar</a></div></div></article>`;
  }).join(""):`<p>Nenhum carro encontrado com estes filtros.</p>`;
  updateCountdowns();
}
function applyFilters(){document.getElementById("results")?.classList.remove("hidden-home-results");renderResults(filtered());results.scrollIntoView({behavior:"smooth"});}
function clearFilters(){filter={brand:"",body:"",minPrice:0,maxPrice:Infinity,minYear:0,maxYear:9999,minKm:0,maxKm:Infinity,discount:0,search:""};document.querySelectorAll(".filter-row span").forEach((e,i)=>e.textContent=["Selecione uma marca e modelo","Selecione o tipo de carroceria","Selecione faixa de preço do veículo","Selecione faixa de ano","Selecione Quilometragem (km)"][i]);if(document.getElementById("quickSearch"))quickSearch.value="";renderResults(cars);}
function setBrand(b){filter.brand=b;brandText.textContent=b;applyFilters()}
function setBody(b){filter.body=b;bodyText.textContent=b;applyFilters()}
function setPrice(a,b){filter.minPrice=a;filter.maxPrice=b;updatePriceFilterText(a,b);applyFilters()}
function updatePriceFilterText(a=filter.minPrice,b=filter.maxPrice){if(!priceText)return;const mt=driveCurrency.get()==="MT";const fmt=n=>mt&&driveCurrency.getRate()>0?`MT ${driveCurrency.convert(n).toLocaleString("pt-MZ",{maximumFractionDigits:0})}`:`${mt?"MT":"$"}${n.toLocaleString("en-US")}`;priceText.textContent=b>=9999999?`Acima de ${fmt(a)}`:`${fmt(a)} - ${fmt(b)}`;}
function setDiscount(n){filter.discount=n;applyFilters()}
function tagSearch(t){filter.search=t;if(document.getElementById("quickSearch"))quickSearch.value=t;applyFilters()}
function doQuickSearch(){filter.search=document.getElementById("quickSearch").value.trim();document.getElementById("results")?.classList.remove("hidden-home-results");applyFilters()}
function setYear(a,b){filter.minYear=a;filter.maxYear=b;yearText.textContent=`${a} - ${b}`;applyFilters()}
function setKm(a,b){filter.minKm=a;filter.maxKm=b;kmText.textContent=b===Infinity?`Acima de ${a.toLocaleString()} km`:`${a.toLocaleString()} - ${b.toLocaleString()} km`;applyFilters()}
function openFilter(type){filterModal.style.display="block";const titles={brand:"Escolha marca e modelo",body:"Escolha a carroceria",price:"Escolha faixa de preço",year:"Escolha faixa de ano",km:"Escolha quilometragem"};modalTitle.textContent=titles[type];let html="";if(type==="brand")html=brands.map(x=>`<button class="option" onclick="setBrand('${x}');closeFilter()">${x}</button>`).join("");if(type==="body")html=bodies.map(x=>`<button class="option" onclick="setBody('${x}');closeFilter()">${x}</button>`).join("");if(type==="price")html=[[0,1000,"Abaixo de $1,000"],[1001,2000,"$1,001 - $2,000"],[2001,3000,"$2,001 - $3,000"],[3001,4000,"$3,001 - $4,000"],[4001,5000,"$4,001 - $5,000"],[5001,9999999,"Acima de $5,001"]].map(x=>`<button class="option" onclick="setPrice(${x[0]},${x[1]});closeFilter()">${x[2]}</button>`).join("");if(type==="year")html=[[2018,2020],[2021,2022],[2023,2024],[2025,2026]].map(x=>`<button class="option" onclick="setYear(${x[0]},${x[1]});closeFilter()">${x[0]} - ${x[1]}</button>`).join("");if(type==="km")html=[[0,10000],[10001,30000],[30001,60000],[60001,Infinity]].map(x=>`<button class="option" onclick="setKm(${x[0]},${x[1]});closeFilter()">${x[1]===Infinity?'Acima de ':''}${x[0].toLocaleString()} km${x[1]!==Infinity?' - '+x[1].toLocaleString()+' km':''}</button>`).join("");modalContent.innerHTML=html;}
function closeFilter(){filterModal.style.display="none"}
function toggleMenu(){mobileMenu.style.display=mobileMenu.style.display==="block"?"none":"block"}

/* ===== DEFINIÇÕES / TEMA / IDIOMA ===== */
const THEME_KEY="driveTheme";
const LANG_KEY="driveLanguage";
function applySavedTheme(){
  const theme=localStorage.getItem(THEME_KEY)||"system";
  document.documentElement.dataset.theme=theme;
  document.body.classList.toggle("dark-mode",theme==="dark" || (theme==="system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches));
}
function setTheme(theme){localStorage.setItem(THEME_KEY,theme);applySavedTheme();openSettingsSection("theme");}
function setLanguage(lang){localStorage.setItem(LANG_KEY,lang);document.documentElement.lang=lang;openSettingsSection("language");}
function openSettings(){
  const m=document.getElementById("settingsModal");if(!m)return;
  m.style.display="block";openSettingsSection("main");
}
function closeSettings(){const m=document.getElementById("settingsModal");if(m)m.style.display="none";}
function openSettingsSection(section){
  const box=document.getElementById("settingsSubpanel");if(!box)return;
  const lang=localStorage.getItem(LANG_KEY)||"pt";
  const theme=localStorage.getItem(THEME_KEY)||"system";
  if(section==="language")box.innerHTML=`<div class="subpanel-title">Idioma</div><div class="settings-options"><button onclick="setLanguage('pt')" class="${lang==='pt'?'selected':''}">🇲🇿 Português</button><button onclick="setLanguage('en')" class="${lang==='en'?'selected':''}">🇬🇧 English</button></div><small>A preferência fica guardada neste dispositivo.</small>`;
  else if(section==="theme")box.innerHTML=`<div class="subpanel-title">Tema</div><div class="settings-options"><button onclick="setTheme('light')" class="${theme==='light'?'selected':''}">☀️ Claro</button><button onclick="setTheme('dark')" class="${theme==='dark'?'selected':''}">🌙 Noturno</button><button onclick="setTheme('system')" class="${theme==='system'?'selected':''}">💻 Sistema</button></div>`;
  else if(section==="about")box.innerHTML=`<div class="subpanel-title">Sobre nós</div><p>DRIVE — Global Car Market é uma plataforma local para pesquisar, conhecer e solicitar veículos selecionados para exportação.</p><p><strong>Importante:</strong> não somos a SBT Japan. Somos uma facilitadora local independente. Recebemos o seu pedido e entramos em contacto com a SBT Japan para tratar da consulta e confirmar as condições disponíveis.</p><p class="copyright-inline">© Angó Global Cars 2026 LTD</p>`;
  else box.innerHTML="";
}
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if((localStorage.getItem(THEME_KEY)||"system")==="system")applySavedTheme();});

/* ===== NOTIFICAÇÕES ===== */
const NOTIF_KEY="driveNotifications";
function getNotifications(){try{return JSON.parse(localStorage.getItem(NOTIF_KEY)||"[]")}catch(_){return []}}
function saveNotifications(list){localStorage.setItem(NOTIF_KEY,JSON.stringify(list.slice(0,30)));updateNotificationCount();}
function addNotification(title,text,type="info",key=""){
  const list=getNotifications();
  if(key && list.some(n=>n.key===key))return;
  list.unshift({id:Date.now()+Math.random(),title,text,type,key,read:false,createdAt:new Date().toISOString()});
  saveNotifications(list);
}
function updateNotificationCount(){const el=document.getElementById("notificationCount");if(!el)return;const n=getNotifications().filter(x=>!x.read).length;el.textContent=n;el.style.display=n?"block":"none";}
function openNotifications(){
  const m=document.getElementById("notificationsModal");if(!m)return;m.style.display="block";renderNotifications();
}
function closeNotifications(){const m=document.getElementById("notificationsModal");if(m)m.style.display="none";}
function renderNotifications(){
  const box=document.getElementById("notificationsList");if(!box)return;
  const list=getNotifications();
  box.innerHTML=list.length?list.map(n=>`<button class="notification-item ${n.read?'read':''}" onclick="readNotification('${n.id}')"><span class="notification-icon ${esc(n.type)}"><i class="fa-${n.type==='promo'?'solid':'regular'} fa-${n.type==='promo'?'tag':'bell'}"></i></span><span><strong>${esc(n.title)}</strong><small>${esc(n.text)}</small><em>${new Date(n.createdAt).toLocaleString('pt-MZ')}</em></span></button>`).join(""):"<div class='empty-notifications'><i class='fa-regular fa-bell-slash'></i><p>Não tens notificações novas.</p></div>";
}
function readNotification(id){const list=getNotifications().map(n=>String(n.id)===String(id)?{...n,read:true}:n);saveNotifications(list);renderNotifications();}
function clearNotifications(){saveNotifications(getNotifications().map(n=>({...n,read:true})));renderNotifications();}

let brandsExpanded=false;
function showMore(type){
  if(type!=="brands") return;
  brandsExpanded=!brandsExpanded;
  const grid=document.getElementById("brandGrid");
  if(grid){grid.style.maxHeight=brandsExpanded?"none":"180px";}
  const btn=document.querySelector("#marcas .show-more");
  if(btn)btn.innerHTML=brandsExpanded?'Mostrar menos <i class="fa-solid fa-chevron-up"></i>':'Mostrar mais <i class="fa-solid fa-chevron-down"></i>';
}
function isFav(id){return JSON.parse(localStorage.getItem(FAV_KEY)||"[]").includes(id)}
function toggleFav(id,btn){let a=JSON.parse(localStorage.getItem(FAV_KEY)||"[]");a=isFav(id)?a.filter(x=>x!==id):[...a,id];localStorage.setItem(FAV_KEY,JSON.stringify(a));btn.innerHTML=`<i class="${isFav(id)?'fa-solid':'fa-regular'} fa-heart"></i>`;updateFavCount()}
function updateFavCount(){const el=document.getElementById("favCount");if(el)el.textContent=JSON.parse(localStorage.getItem(FAV_KEY)||"[]").length}
function updateCountdowns(){
  const now=Date.now();let changed=false;
  cars=cars.map(c=>{if(c.status==="reserved"&&c.reservedUntil&&now>=Number(c.reservedUntil)){changed=true;return {...c,status:"available",reservedAt:null,reservedUntil:null};}return c;});
  if(changed){saveCars(cars);renderResults(filtered());return;}
  document.querySelectorAll(".countdown").forEach(el=>{const diff=Math.max(0,Number(el.dataset.until)-now);const s=Math.floor(diff/1000);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;el.textContent=[h,m,sec].map((v,i)=>i===0?String(v).padStart(2,"0"):String(v).padStart(2,"0")).join(":");});
}
let currentClientUser=null;
let currentClientIsAdmin=false;
let currentClientProfile=null;

function openClientModal(){
  document.getElementById("clientModal").style.display="block";
  if(currentClientUser) showClientAccount(currentClientProfile);
  else if(window.location.hash.includes("type=recovery") || new URLSearchParams(location.search).get("reset")==="1") showClientReset();
  else showClientLogin();
}
function closeClientModal(){document.getElementById("clientModal").style.display="none";}
function handleClientHeaderClick(event){event.preventDefault();if(currentClientUser){location.href="perfil.html";}else{openClientModal();}}

function hideClientViews(){
  ["clientLoginView","clientSignupView","clientForgotView","clientResetView","clientAccountView"].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display="none";
  });
}
function showClientLogin(){hideClientViews();document.getElementById("clientLoginView").style.display="block";}
function showClientSignup(){hideClientViews();document.getElementById("clientSignupView").style.display="block";}
function showForgotPassword(){
  hideClientViews();
  const email=document.getElementById("loginEmail")?.value?.trim();
  const forgot=document.getElementById("forgotEmail");
  if(forgot && email) forgot.value=email;
  document.getElementById("clientForgotView").style.display="block";
}
function showClientReset(){hideClientViews();document.getElementById("clientResetView").style.display="block";}

function showClientAccount(profile){
  hideClientViews();
  document.getElementById("clientAccountView").style.display="block";
  const el=document.getElementById("clientAccountInfo");
  if(el)el.textContent=`Conta ativa: ${profile?.name||"Cliente"}${profile?.phone?" · "+profile.phone:""}`;
  const adminLink=document.getElementById("adminAccountLink");
  if(adminLink)adminLink.style.display=currentClientIsAdmin?"inline-flex":"none";
}
async function clientLogout(){
  if(window.driveSupabase)await window.driveSupabase.auth.signOut();
  currentClientUser=null;currentClientProfile=null;currentClientIsAdmin=false;
  updateClientHeader(null);showClientLogin();updateAdminVisibility();
}
function updateFooterContact(){
  const el=document.getElementById("footerContact");if(!el)return;
  const n=contactNumber();el.textContent=n?`WhatsApp / Ligar: ${n}`:"WhatsApp / Ligar: configure o contacto no painel Admin.";
}
function updateClientHeader(user){currentClientUser=user||null;const el=document.getElementById("clientLabel");if(el)el.textContent=user?(user.user_metadata?.name||user.email||"Meu perfil"):"Conecte-se";}

async function getClientProfile(user){
  if(!user)return null;
  const {data,error}=await window.driveSupabase.from("profiles").select("id,name,phone,email,created_at,role").eq("id",user.id).maybeSingle();
  if(error){console.warn("Perfil:",error.message);return {id:user.id,name:user.user_metadata?.name||"Cliente",phone:user.user_metadata?.phone||"",email:user.email||"",role:"client"};}
  return data||{id:user.id,name:user.user_metadata?.name||"Cliente",phone:user.user_metadata?.phone||"",email:user.email||"",role:"client"};
}
async function refreshAdminState(user){
  currentClientIsAdmin=false;
  const adminLinks=document.querySelectorAll("[data-admin-only],.admin-only,#adminLink,#adminMenu");
  const accountLink=document.getElementById("adminAccountLink");
  if(!user||!window.driveSupabase){adminLinks.forEach(e=>e.style.display="none");if(accountLink)accountLink.style.display="none";return false;}
  const email=String(user.email||"").trim().toLowerCase();
  const isOwner=["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(String(email||"").trim().toLowerCase());
  let rpcAdmin=false;
  try{const {data,error}=await window.driveSupabase.rpc("is_current_user_admin");rpcAdmin=!error&&data===true;}catch(e){console.warn("Verificação de administrador:",e);}
  currentClientIsAdmin=isOwner||rpcAdmin;
  adminLinks.forEach(e=>e.style.display=currentClientIsAdmin?"":"none");
  if(accountLink)accountLink.style.display=currentClientIsAdmin?"inline-flex":"none";
  return currentClientIsAdmin;
}
async function claimPendingAdminInvite(){
  const token=localStorage.getItem("drivePendingAdminInvite");
  if(!token||!window.driveSupabase)return false;
  const {data,error}=await window.driveSupabase.rpc("accept_admin_invite",{p_token:token});
  if(error){
    const msg=String(error.message||"").toLowerCase();
    // Limpa apenas tokens claramente inválidos/expirados/aceites.
    if(msg.includes("já foi")||msg.includes("já foi utilizado")||msg.includes("cancelado")||msg.includes("expirou")||msg.includes("inválido"))
      localStorage.removeItem("drivePendingAdminInvite");
    console.warn("Convite:",error.message);
    return false;
  }
  const ok=data===true||data?.accepted===true||data==="true";
  if(ok)localStorage.removeItem("drivePendingAdminInvite");
  return ok;
}

async function requireLegalConsent(user){
  if(!user||!window.driveSupabase)return true;
  const {data}=await window.driveSupabase.from("profiles").select("privacy_accepted_at,terms_accepted_at").eq("id",user.id).maybeSingle();
  if(data?.privacy_accepted_at&&data?.terms_accepted_at)return true;
  return await showLegalConsentGate();
}
function showLegalConsentGate(){
  return new Promise(resolve=>{
    if(document.getElementById("legalGate"))return;
    const wrap=document.createElement("div");wrap.id="legalGate";wrap.className="legal-gate";
    wrap.innerHTML=`<div class="legal-gate-box"><h2>Antes de continuar</h2><p>Para usar o Drive ANGO Export, confirma que leste e aceitas a Política de Privacidade e os Termos de Uso.</p><label class="legal-check"><input id="gateConsent" type="checkbox"> <span>Aceito a <a href="politica-privacidade.html" target="_blank" rel="noopener noreferrer" rel="noopener noreferrer">Política de Privacidade</a> e os <a href="termos.html" target="_blank">Termos de Uso</a>.</span></label><button id="gateAccept" disabled>Continuar</button></div>`;
    document.body.appendChild(wrap);
    const check=wrap.querySelector("#gateConsent"),btn=wrap.querySelector("#gateAccept");
    check.onchange=()=>btn.disabled=!check.checked;
    btn.onclick=async()=>{
      const user=currentClientUser;
      if(!user){wrap.remove();resolve(false);return;}
      const now=new Date().toISOString();
      const {error}=await window.driveSupabase.from("profiles").upsert({id:user.id,email:user.email||"",privacy_accepted_at:now,terms_accepted_at:now},{onConflict:"id"});
      if(error){alert("Não foi possível guardar a aceitação. Tenta novamente.");return;}
      wrap.remove();resolve(true);
    };
  });
}

async function clientSignup(e){
  e.preventDefault();
  if(!window.driveSupabase){alert("O cadastro online ainda não foi configurado.");return;}
  const form=e.currentTarget;if(form.dataset.busy==="1")return;
  const name=document.getElementById("clientName").value.trim(),phone=document.getElementById("clientPhone").value.trim(),email=document.getElementById("clientEmail").value.trim().toLowerCase(),pass=document.getElementById("clientPass").value,confirm=document.getElementById("clientPassConfirm").value;
  if(!document.getElementById("signupLegalConsent")?.checked){alert("É necessário aceitar a Política de Privacidade e os Termos de Uso.");return;}
  if(name.length<2){alert("Introduza o seu nome completo.");return;}if(phone.length<7){alert("Introduza um número de telefone válido.");return;}if(pass.length<8){alert("A senha deve ter pelo menos 8 caracteres.");return;}if(pass!==confirm){alert("As senhas não coincidem.");return;}
  form.dataset.busy="1";const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent="A criar conta...";}
  const pendingInvite=localStorage.getItem("drivePendingAdminInvite");
  const emailRedirectTo=window.location.origin+(pendingInvite?"/admin.html?invite="+encodeURIComponent(pendingInvite):"/index.html?openLogin=1");
  const {data,error}=await window.driveSupabase.auth.signUp({email,password:pass,options:{data:{name,phone},emailRedirectTo}});
  form.dataset.busy="0";if(button){button.disabled=false;button.textContent="Criar conta";}
  if(error){const msg=(error.message||"").toLowerCase();if(msg.includes("rate limit")||msg.includes("email rate limit"))alert("O Supabase atingiu temporariamente o limite de emails. Não repitas a tentativa agora; aguarda o limite ser renovado e tenta novamente uma vez.");else alert(error.message);return;}
  if(data.session){
    currentClientUser=data.user;
    await claimPendingAdminInvite();
    const now=new Date().toISOString();
    await window.driveSupabase.from("profiles").upsert({id:data.user.id,name,phone,email,privacy_accepted_at:now,terms_accepted_at:now},{onConflict:"id"});
    currentClientUser=data.user;
  await claimPendingAdminInvite();
  const accepted=await requireLegalConsent(data.user);
  if(!accepted)return;
  const acceptedInvite=await claimPendingAdminInvite();
  const profile=await getClientProfile(data.user);currentClientProfile=profile;updateClientHeader(data.user);await refreshAdminState(data.user);
  if(acceptedInvite){ localStorage.removeItem("drivePendingAdminInvite"); location.replace("admin.html"); return; }
  showClientAccount(profile);closeClientModal();
  alert(currentClientIsAdmin?"Conta criada com sucesso! O teu acesso de Administração foi ativado.":"Conta criada com sucesso!");
  }
  else{
    showClientLogin();
    alert(pendingInvite?"Conta criada! Confirma o email. Depois volta ao Drive e entra com a mesma conta; o convite de administrador será ativado automaticamente.":"Conta criada! Verifica o teu email para confirmar a conta e depois entra no Drive Cars.");
  }
}
async function clientLogin(e){
  e.preventDefault();if(!window.driveSupabase){alert("O login online ainda não foi configurado.");return;}
  const email=document.getElementById("loginEmail").value.trim().toLowerCase(),pass=document.getElementById("loginPass").value;
  const {data,error}=await window.driveSupabase.auth.signInWithPassword({email,password:pass});
  if(error){alert("Email ou senha incorretos.");return;}
  // O proprietário nunca deve ficar preso a um convite antigo.
  if(["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(String(data.user?.email||"").trim().toLowerCase()))
    localStorage.removeItem("drivePendingAdminInvite");
  const profile=await getClientProfile(data.user);currentClientProfile=profile;updateClientHeader(data.user);await refreshAdminState(data.user);showClientAccount(profile);closeClientModal();
}

async function loginWithGoogle(){
  if(!document.getElementById("googleLegalConsent")?.checked){alert("Aceita primeiro a Política de Privacidade e os Termos de Uso.");return;}
  localStorage.setItem("driveLegalConsentIntent","1");
  if(!window.driveSupabase){alert("O login online ainda não foi configurado.");return;}
  const pendingInvite=localStorage.getItem("drivePendingAdminInvite");
  const redirectTo=window.location.origin+(pendingInvite?"/admin.html?invite="+encodeURIComponent(pendingInvite):"/index.html?openLogin=1");
  const {error}=await window.driveSupabase.auth.signInWithOAuth({
    provider:"google",
    options:{redirectTo}
  });
  if(error)alert("Não foi possível entrar com Google: "+error.message);
}

async function sendPasswordReset(e){
  e.preventDefault();if(!window.driveSupabase){alert("O login online ainda não foi configurado.");return;}
  const email=document.getElementById("forgotEmail").value.trim().toLowerCase();if(!email)return;
  const button=e.currentTarget.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent="A enviar...";}
  const {error}=await window.driveSupabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/index.html?reset=1"});
  if(button){button.disabled=false;button.textContent="Enviar link de recuperação";}
  if(error){alert("Não foi possível enviar o link: "+error.message);return;}
  alert("Se esse email estiver registado, receberás um link para redefinir a senha. Verifica também o spam.");
  showClientLogin();
}

async function updateRecoveredPassword(e){
  e.preventDefault();if(!window.driveSupabase)return;
  const pass=document.getElementById("newResetPass").value,confirm=document.getElementById("confirmResetPass").value;
  if(pass.length<8){alert("A nova senha deve ter pelo menos 8 caracteres.");return;}
  if(pass!==confirm){alert("As senhas não coincidem.");return;}
  const button=e.currentTarget.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent="A guardar...";}
  const {error}=await window.driveSupabase.auth.updateUser({password:pass});
  if(button){button.disabled=false;button.textContent="Guardar nova senha";}
  if(error){alert("Não foi possível atualizar a senha: "+error.message);return;}
  history.replaceState({},document.title,"index.html?openLogin=1");
  showClientLogin();
  alert("Senha alterada com sucesso. Agora podes entrar com a nova senha.");
}

async function initClientModal(){
  const login=document.getElementById("clientLoginForm"),signup=document.getElementById("clientSignupForm"),forgot=document.getElementById("forgotPasswordForm"),reset=document.getElementById("resetPasswordForm");
  if(login)login.onsubmit=clientLogin;if(signup)signup.onsubmit=clientSignup;if(forgot)forgot.onsubmit=sendPasswordReset;if(reset)reset.onsubmit=updateRecoveredPassword;
  const googleConsent=document.getElementById("googleLegalConsent");
  const googleBtn=document.getElementById("googleLoginBtn");
  if(googleConsent&&googleBtn)googleConsent.addEventListener("change",()=>googleBtn.disabled=!googleConsent.checked);
  const adminInvite=new URLSearchParams(location.search).get("adminInvite");
  if(adminInvite){
    localStorage.setItem("drivePendingAdminInvite",adminInvite);
    // Convites de administrador não devem cair na página inicial.
    location.replace("admin.html?invite="+encodeURIComponent(adminInvite));
    return;
  }
  if(!window.driveSupabase){updateClientHeader(null);return;}
  const {data:{session}}=await window.driveSupabase.auth.getSession();
  const recovery=new URLSearchParams(location.search).get("reset")==="1" || window.location.hash.includes("type=recovery");
  if(recovery && session){showClientReset();}
  else if(session){
    currentClientUser=session.user;
    const isOwner=["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(String(session.user.email||"").trim().toLowerCase());
    if(isOwner) localStorage.removeItem("drivePendingAdminInvite");
    else await claimPendingAdminInvite();
    const accepted=await requireLegalConsent(session.user);
    if(accepted){const profile=await getClientProfile(session.user);currentClientProfile=profile;updateClientHeader(session.user);await refreshAdminState(session.user);showClientAccount(profile);}
  }
  else{updateClientHeader(null);await refreshAdminState(null);}
  window.driveSupabase.auth.onAuthStateChange(async (event,session)=>{
    if(event==="PASSWORD_RECOVERY"){showClientReset();return;}
    if(session){
      currentClientUser=session.user;
      const isOwner=["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(String(session.user.email||"").trim().toLowerCase());
      if(isOwner) localStorage.removeItem("drivePendingAdminInvite");
      else await claimPendingAdminInvite();
      const accepted=await requireLegalConsent(session.user);
      if(accepted){const profile=await getClientProfile(session.user);currentClientProfile=profile;updateClientHeader(session.user);await refreshAdminState(session.user);if(!recovery)showClientAccount(profile);}
    }
    else{currentClientUser=null;currentClientProfile=null;currentClientIsAdmin=false;updateClientHeader(null);await refreshAdminState(null);showClientLogin();}
  });
}


document.addEventListener("DOMContentLoaded",async()=>{
  applySavedTheme();updateNotificationCount();
  await loadPublicCars();
  subscribePublicCars();
  renderBrands();renderBodies();renderPopular();renderRecent();renderResults(cars);updateFavCount();await initClientModal();updateFooterContact();
  const params=new URLSearchParams(location.search);
  if(params.get("openLogin")==="1") openClientModal();
  if(params.get("openSignup")==="1"){openClientModal();showClientSignup();}
  setInterval(updateCountdowns,1000);
});
window.addEventListener("scroll",()=>{const b=document.getElementById("backTop");if(b)b.style.display=scrollY>500?"block":"none"});


/* ===== ADMIN MENU / ACCESS ===== */
async function updateAdminVisibility(){
  if(!window.driveSupabase){await refreshAdminState(null);return;}
  const {data:{session}}=await window.driveSupabase.auth.getSession();
  await refreshAdminState(session?.user||null);
}

document.addEventListener('DOMContentLoaded', updateAdminVisibility);

// Mostrar/ocultar senhas
document.addEventListener("click", (event) => {
  const button = event.target.closest(".show-pass");
  if (!button) return;
  const input = document.getElementById(button.dataset.target);
  if (!input) return;
  const showing = input.type === "password";
  input.type = showing ? "text" : "password";
  button.textContent = showing ? "🙈" : "👁";
  button.setAttribute("aria-label", showing ? "Ocultar senha" : "Mostrar senha");
});

window.addEventListener("driveCurrencyChanged",()=>{updatePriceFilterText();renderPopular();renderRecent();renderResults(filtered());});
window.addEventListener("driveExchangeUpdated",()=>{updatePriceFilterText();renderRecent();renderResults(filtered());});

async function loadPublicPromotions(){
  if(!window.driveSupabase)return;
  const box=document.getElementById('promoBanner'); if(!box)return;
  const {data,error}=await window.driveSupabase.from('drive_promotions').select('*').eq('active',true).order('created_at',{ascending:false}).limit(6);
  if(error||!data?.length)return;
  const now=Date.now();
  const promos=data.filter(p=>new Date(p.starts_at).getTime()<=now&&(!p.ends_at||new Date(p.ends_at).getTime()>=now));
  if(!promos.length)return;
  promos.forEach(p=>addNotification('Nova promoção',p.title||'Há uma nova oferta disponível.','promo',`promo:${p.id}`));
  box.innerHTML=promos.map((p,i)=>`<div class="promo ${i%2?'dark':''}" style="${p.image_url?`background-image:linear-gradient(#0005,#0005),url('${String(p.image_url).replace(/'/g,"%27")}');background-size:cover;background-position:center;color:#fff`:''}"><b>${esc(p.title)}</b><strong>${p.discount?` -${esc(p.discount)}%`:''}</strong><small>${esc(p.subtitle||'')}</small>${p.car_id?`<a href="detalhes.html?id=${encodeURIComponent(p.car_id)}" style="color:inherit">Ver oferta →</a>`:''}</div>`).join('');
}

document.addEventListener("DOMContentLoaded",loadPublicPromotions);
