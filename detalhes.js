const id=new URLSearchParams(location.search).get("id");
let cars=JSON.parse(localStorage.getItem("driveCars")||"[]");
const fallback=[{id:"DRV001",brand:"Toyota",model:"RAV4",body:"SUV",price:18500,year:2022,km:23500,engine:"2,000cc",weight:"—",trans:"AT",drive:"4WD",wheel:"RHD",image:"https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80",status:"available"}];
let car=cars.find(x=>x.id===id)||(cars[0]||fallback[0]);
let currentImageIndex=0;
const contact=localStorage.getItem("driveContact")||"";
const phone=contact.replace(/\D/g,"");
function status(){if(car.status==="sold")return '<span class="detail-status sold">VENDIDO</span>';if(car.status==="reserved")return `<span class="detail-status reserved">RESERVADO — ${countdown(car.reservedUntil)}</span>`;return '<span class="detail-status available">DISPONÍVEL</span>';}
function countdown(until){if(!until)return "48:00:00";let s=Math.max(0,Math.floor((Number(until)-Date.now())/1000));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,"0")).join(":");}
function wa(){if(!phone)return "#";return `https://wa.me/${phone}?text=${encodeURIComponent(`Olá, tenho interesse no ${car.brand} ${car.model} (${car.id}).`)}`;}
function call(){return phone?`tel:+${phone}`:"#";}
function gallery(){return Array.isArray(car.images)&&car.images.length?car.images:(car.image?[car.image]:[]);}
function renderImage(){
  const imgs=gallery(); if(!imgs.length)return;
  currentImageIndex=Math.max(0,Math.min(currentImageIndex,imgs.length-1));
  const main=document.getElementById("mainCarImage"); if(main)main.src=imgs[currentImageIndex];
  document.querySelectorAll(".gallery-thumb").forEach((b,i)=>b.classList.toggle("active",i===currentImageIndex));
  const counter=document.querySelector(".gallery-counter"); if(counter)counter.textContent=`${currentImageIndex+1}/${imgs.length}`;
}
function selectCarImage(index){currentImageIndex=index;renderImage();}
function previousCarImage(){const imgs=gallery();if(imgs.length>1){currentImageIndex=(currentImageIndex-1+imgs.length)%imgs.length;renderImage();}}
function nextCarImage(){const imgs=gallery();if(imgs.length>1){currentImageIndex=(currentImageIndex+1)%imgs.length;renderImage();}}
function render(){
  const imgs=gallery();
  document.getElementById("detail").innerHTML=`<div class="gallery"><img id="mainCarImage" src="${imgs[0]||""}" alt="${car.brand} ${car.model}"><button class="gallery-arrow gallery-prev" type="button" onclick="previousCarImage()" aria-label="Imagem anterior">◀</button><button class="gallery-arrow gallery-next" type="button" onclick="nextCarImage()" aria-label="Próxima imagem">▶</button><div class="gallery-thumbs">${imgs.map((img,i)=>`<button type="button" class="gallery-thumb ${i===0?"active":""}" onclick="selectCarImage(${i})"><img src="${img}" alt="Foto ${i+1}"></button>`).join("")}</div><div class="gallery-counter">1/${imgs.length||1}</div></div><div class="info"><div>${status()}</div><small>${car.year} · ${car.brand} · Stock ${car.id}</small><h1>${car.model}</h1><div class="price">USD ${Number(car.price).toLocaleString()}</div>${car.discount?`<p class="discount">-${car.discount}% de desconto</p>`:""}<div class="specs"><div>KM<br><b>${Number(car.km).toLocaleString()}</b></div><div>Motor<br><b>${car.engine||"—"}</b></div><div>Peso<br><b>${car.weight||"—"}</b></div><div>Transmissão<br><b>${car.trans||"—"}</b></div><div>Tração<br><b>${car.drive||"—"}</b></div><div>Volante<br><b>${car.wheel||"—"}</b></div><div>Ano<br><b>${car.year}</b></div><div>Carroceria<br><b>${car.body||"—"}</b></div></div><div class="detail-actions"><a class="cta" href="${car.status==='available'?wa():'#'}" target="_blank" onclick="${car.status==='available'?'':'return false;'}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a><a class="cta secondary-cta" href="${car.status==='available'?call():'#'}" onclick="${car.status==='available'?'':'return false;'}"><i class="fa-solid fa-phone"></i> Ligar</a></div></div>`;
  renderImage();
}
async function initDetails(){
  if(window.driveCarsData){
    try{const {data,error}=await window.driveCarsData.fetchCars();if(!error&&data.length){cars=data;car=cars.find(x=>x.id===id)||cars[0]||fallback[0];localStorage.setItem("driveCars",JSON.stringify(cars));}}catch(e){console.warn(e);}
  }
  render();
  if(window.driveCarsData){window.driveCarsData.subscribe(async()=>{const {data,error}=await window.driveCarsData.fetchCars();if(!error&&data.length){cars=data;car=cars.find(x=>x.id===id)||car;localStorage.setItem("driveCars",JSON.stringify(cars));render();}});}
}
document.addEventListener("DOMContentLoaded",initDetails);
setInterval(()=>{if(car.status==="reserved"){const el=document.querySelector(".detail-status");if(el)el.textContent=`RESERVADO — ${countdown(car.reservedUntil)}`;}},1000);
