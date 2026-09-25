const id=new URLSearchParams(location.search).get("id");
let cars=[];
let car=null;
let currentImageIndex=0;
const contact=localStorage.getItem("driveContact")||"";
const phone=contact.replace(/\D/g,"");
function status(){if(car.status==="sold")return '<span class="detail-status sold">VENDIDO</span>';if(car.status==="reserved")return `<span class="detail-status reserved">RESERVADO — ${countdown(car.reservedUntil)}</span>`;return '<span class="detail-status available">DISPONÍVEL</span>';}
function countdown(until){if(!until)return "48:00:00";let s=Math.max(0,Math.floor((Number(until)-Date.now())/1000));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,"0")).join(":");}
function wa(){if(!phone)return "#";return `https://wa.me/${phone}?text=${encodeURIComponent(`Olá, tenho interesse no ${car.brand} ${car.model} (${car.id}).`)}`;}
function call(){return phone?`tel:+${phone}`:"#";}
function escHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]||m));}
function safeImageUrl(v){const u=String(v||"").trim();if(!u)return "";try{const x=new URL(u,location.href);return x.protocol==="https:"?x.href:"";}catch(_){return "";}}
function gallery(){return Array.isArray(car.images)&&car.images.length?car.images:(car.image?[car.image]:[]);}
function renderImage(){
  const imgs=gallery(); if(!imgs.length)return;
  currentImageIndex=Math.max(0,Math.min(currentImageIndex,imgs.length-1));
  const main=document.getElementById("mainCarImage"); if(main)main.src=safeImageUrl(imgs[currentImageIndex]);
  document.querySelectorAll(".gallery-thumb").forEach((b,i)=>b.classList.toggle("active",i===currentImageIndex));
  const counter=document.querySelector(".gallery-counter"); if(counter)counter.textContent=`${currentImageIndex+1}/${imgs.length}`;
}
function selectCarImage(index){currentImageIndex=index;renderImage();}
function previousCarImage(){const imgs=gallery();if(imgs.length>1){currentImageIndex=(currentImageIndex-1+imgs.length)%imgs.length;renderImage();}}
function nextCarImage(){const imgs=gallery();if(imgs.length>1){currentImageIndex=(currentImageIndex+1)%imgs.length;renderImage();}}
function render(){
  const imgs=gallery().map(safeImageUrl).filter(Boolean);
  const brand=escHtml(car.brand);
  const model=escHtml(car.model);
  const stock=escHtml(car.stock||car.id);
  const idEsc=escHtml(car.id);
  document.getElementById("detail").innerHTML=`<div class="gallery"><img id="mainCarImage" src="${imgs[0]||""}" alt="${brand} ${model}"><span class="gallery-stock">Stock ${stock}</span><button class="gallery-arrow gallery-prev" type="button" onclick="previousCarImage()" aria-label="Imagem anterior">◀</button><button class="gallery-arrow gallery-next" type="button" onclick="nextCarImage()" aria-label="Próxima imagem">▶</button><div class="gallery-thumbs">${imgs.map((img,i)=>`<button type="button" class="gallery-thumb ${i===0?"active":""}" onclick="selectCarImage(${i})"><img src="${img}" alt="Foto ${i+1}"></button>`).join("")}</div><div class="gallery-counter">1/${imgs.length||1}</div></div><div class="info"><div>${status()}</div><small>${escHtml(car.year)} · ${brand} · Stock ${idEsc}</small><h1>${model}</h1><div class="price">${driveFormatMoney(car.price)}</div><div class="detail-exchange" data-drive-rate>1 USD ≈ — MT</div>${car.discount?`<p class="discount">-${escHtml(car.discount)}% de desconto</p>`:""}<div class="detail-buy-wrap"><a class="cta buy-now buy-now-large" href="${car.status==='available'?`compra.html?id=${encodeURIComponent(car.id)}`:'#'}" onclick="${car.status==='available'?'':'return false;'}"><i class="fa-solid fa-cart-shopping"></i> BUY NOW</a></div><div class="specs"><div>KM<br><b>${Number(car.km).toLocaleString()}</b></div><div>Motor<br><b>${escHtml(car.engine||"—")}</b></div><div>Combustível<br><b>${escHtml(car.fuel||"—")}</b></div><div>Porto de chegada<br><b>${escHtml(car.arrivalPort||"—")}</b></div><div>Peso<br><b>${escHtml(car.weight||"—")}</b></div><div>Transmissão<br><b>${escHtml(car.trans||"—")}</b></div><div>Tração<br><b>${escHtml(car.drive||"—")}</b></div><div>Volante<br><b>${escHtml(car.wheel||"—")}</b></div><div>Cor<br><b>${escHtml(car.color||"—")}</b></div><div>Localização<br><b>${escHtml(car.location||"—")}</b></div><div>Assentos<br><b>${escHtml(car.seats||"—")}</b></div><div>Portas<br><b>${escHtml(car.doors||"—")}</b></div><div>Dimensão<br><b>${escHtml(car.dimensions||"—")}</b></div><div>Ano<br><b>${escHtml(car.year)}</b></div><div>Carroceria<br><b>${escHtml(car.body||"—")}</b></div></div><div class="detail-actions"><a class="cta" href="${car.status==='available'?wa(): '#'}" target="_blank" rel="noopener noreferrer" onclick="${car.status==='available'?'':'return false;'}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a><a class="cta secondary-cta" href="${car.status==='available'?call(): '#'}" onclick="${car.status==='available'?'':'return false;'}"><i class="fa-solid fa-phone"></i> Ligar</a></div></div>`;
  renderImage();
}

async function initDetails(){
  if(!window.driveCarsData || !window.driveSupabase){
    document.getElementById("detail").innerHTML='<div class="info"><h1>Catálogo indisponível.</h1><a class="cta" href="index.html">Voltar aos anúncios</a></div>';
    return;
  }
  const refresh=async()=>{
    try{
      const {data,error}=await window.driveCarsData.fetchCars({publicOnly:true});
      if(error) throw error;
      cars=Array.isArray(data)?data:[];
      car=cars.find(x=>x.id===id)||null;
      if(car){ render(); try{ await window.driveSupabase.rpc("increment_car_view",{p_car_id:car.id}); }catch(e){ console.warn("Visualização:",e); } }
      else document.getElementById("detail").innerHTML='<div class="info"><h1>Este anúncio já não está disponível.</h1><a class="cta" href="index.html">Voltar aos anúncios</a></div>';
    }catch(e){
      console.warn("Detalhes do catálogo:",e);
      document.getElementById("detail").innerHTML='<div class="info"><h1>Não foi possível carregar este anúncio.</h1><a class="cta" href="index.html">Voltar aos anúncios</a></div>';
    }
  };
  await refresh();
  window.driveCarsData.subscribe(refresh);
}

document.addEventListener("DOMContentLoaded",initDetails);
setInterval(()=>{if(car.status==="reserved"){const el=document.querySelector(".detail-status");if(el)el.textContent=`RESERVADO — ${countdown(car.reservedUntil)}`;}},1000);

window.addEventListener("driveCurrencyChanged",()=>{if(car)render();});
window.addEventListener("driveExchangeUpdated",()=>{if(car)render();});
