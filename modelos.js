/* DRIVE — página de opções de um modelo */
const MODEL_FALLBACK_KEY = "driveModelViews";

function modelEsc(v){return String(v ?? "").replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[m]));}
function modelMoney(n){
  try{
    if(window.driveCurrency && typeof driveCurrency.get === "function" && driveCurrency.get()==="MT" && driveCurrency.getRate()>0)
      return `MT ${driveCurrency.convert(Number(n||0)).toLocaleString("pt-MZ",{maximumFractionDigits:0})}`;
  }catch(_){ }
  return `$${Number(n||0).toLocaleString("en-US")}`;
}
function normalizeModel(v){return String(v||"").trim().toLowerCase().replace(/\s+/g," ");}
function getModelParams(){
  const p=new URLSearchParams(location.search);
  return {brand:p.get("brand")||"",model:p.get("model")||""};
}
function modelStatus(c){
  if(c.status==="sold")return `<span class="model-status sold">VENDIDO</span>`;
  if(c.status==="reserved")return `<span class="model-status reserved">RESERVADO</span>`;
  return `<span class="model-status available">DISPONÍVEL</span>`;
}
function modelCard(c){
  const disabled=c.status==="sold"||c.status==="reserved";
  return `<article class="model-car-card ${disabled?"model-disabled":""}">
    <div class="model-car-image">
      ${modelStatus(c)}
      <img src="${modelEsc(c.image||((c.images||[])[0]||""))}" alt="${modelEsc(c.brand+" "+c.model)}">
      <span class="model-stock">Stock ${modelEsc(c.stock||c.id)}</span>
    </div>
    <div class="model-car-info">
      <div class="model-car-title"><span>${modelEsc(c.brand)}</span><h2>${modelEsc(c.model)}</h2></div>
      <strong class="model-price">${modelMoney(c.price)}</strong>
      <div class="model-specs"><span>${modelEsc(c.year||"—")}</span><span>${Number(c.km||0).toLocaleString("pt-MZ")} km</span><span>${modelEsc(c.engine||"—")}</span><span>${modelEsc(c.trans||"—")}</span></div>
      ${c.discount?`<div class="model-discount">-${modelEsc(c.discount)}% desconto</div>`:""}
      <a class="model-details-btn ${disabled?"disabled-model-link":""}" href="${disabled?"#":"detalhes.html?id="+encodeURIComponent(c.id)}" onclick="${disabled?'return false;':''}">Ver detalhes <i class="fa-solid fa-arrow-right"></i></a>
    </div>
  </article>`;
}
async function loadModelPage(){
  const {brand,model}=getModelParams();
  const title=document.getElementById("modelTitle"), subtitle=document.getElementById("modelSubtitle"), grid=document.getElementById("modelCarsGrid"), empty=document.getElementById("modelEmpty");
  if(!brand||!model){title.textContent="Modelo não especificado";subtitle.textContent="Volta ao início e pesquisa um modelo.";grid.innerHTML="";return;}
  title.textContent=model.toUpperCase();
  subtitle.textContent=`${brand} ${model} — todas as opções disponíveis no catálogo`;
  let cars=[];
  if(window.driveCarsData && window.driveSupabase){
    const {data,error}=await window.driveCarsData.fetchCars({publicOnly:true});
    if(!error)cars=data||[];
  }
  if(!cars.length){
    try{cars=JSON.parse(localStorage.getItem("driveCars")||"[]");}catch(_){cars=[];}
  }
  const b=normalizeModel(brand),m=normalizeModel(model);
  const matches=cars.filter(c=>normalizeModel(c.brand)===b&&normalizeModel(c.model)===m);
  document.getElementById("modelCount").textContent=matches.length;
  if(!matches.length){grid.innerHTML="";empty.style.display="block";return;}
  empty.style.display="none";
  grid.innerHTML=matches.map(modelCard).join("");
}
document.addEventListener("DOMContentLoaded",loadModelPage);
