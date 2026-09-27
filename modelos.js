(function(){
  const params=new URLSearchParams(location.search);
  const brandRaw=(params.get('brand')||'').trim();
  const brandAliases={"mercedes-benz":"Mercedes","mercedes benz":"Mercedes","citroen":"Citroën","vw":"Volkswagen","landrover":"Land Rover"};
  const brand=brandAliases[brandRaw.toLowerCase()] || brandRaw;
  const model=(params.get('model')||'').trim();
  const title=document.getElementById('modelTitle');
  const subtitle=document.getElementById('modelSubtitle');
  const list=document.getElementById('modelCars');
  const normalizeModel=(b,m)=>{
    if(window.driveCarsData && typeof window.driveCarsData.normalizeModel==='function') return window.driveCarsData.normalizeModel(b,m);
    return String(m||'').trim();
  };
  const key=(b,m)=>`${String(b||'').trim()}|${normalizeModel(b,m)}`.toLowerCase();
  const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const money=v=>{
    try{
      if(window.driveCurrency && typeof driveCurrency.format==='function') return driveCurrency.format(Number(v||0));
    }catch(e){}
    return `MT ${Number(v||0).toLocaleString('pt-MZ')}`;
  };
  function render(cars){
    const wantedBrand=String(brand||'').trim().toLowerCase();
    const wantedModel=String(model||'').trim().toLowerCase();
    const matches=cars.filter(c=>{
      if(c.published===false) return false;
      const resolved=(window.driveCarsData && typeof window.driveCarsData.inferBrand==='function')
        ? window.driveCarsData.inferBrand(c.brand,c.model)
        : c.brand;
      const cbRaw=String(resolved||'').trim().toLowerCase();
      const cb=brandAliases[cbRaw] ? brandAliases[cbRaw].toLowerCase() : cbRaw;
      const cm=String(c.modelGroup||normalizeModel(brand,c.model)).trim().toLowerCase();
      if(cb!==wantedBrand) return false;
      return cm===normalizeModel(brand,model).toLowerCase();
    });
    const label=`${brand} ${model}`.trim();
    document.title=`${label} — DRIVE Global Car Market`;
    title.textContent=label || 'Modelo';
    subtitle.textContent=`${matches.length} veículo${matches.length===1?'':'s'} disponível${matches.length===1?'':'eis'} neste modelo.`;
    if(!matches.length){list.innerHTML='<div class="model-empty">Nenhum veículo encontrado para este modelo.</div>';return;}
    list.innerHTML=matches.map(c=>{
      const image=c.image || (Array.isArray(c.images)?c.images[0]:'') || '';
      const status=c.status==='sold'?'VENDIDO':c.status==='reserved'?'RESERVADO':'DISPONÍVEL';
      const statusClass=c.status==='sold'?'sold':c.status==='reserved'?'reserved':'available';
      return `<article class="model-car-card ${c.status==='reserved'?'is-reserved':''}">
        <a class="model-car-image" href="detalhes.html?id=${encodeURIComponent(c.id)}">
          <img src="${esc(image)}" alt="${esc(c.brand+' '+c.model)}" loading="lazy">
          <span class="model-status ${statusClass}">${status}</span>
          <span class="model-stock">Stock ${esc(c.stock||c.id)}</span>
        </a>
        <div class="model-car-info">
          <div class="model-car-meta">${esc(c.year||'')} · ${esc(c.brand||'')}</div>
          <h2>${esc(c.model||'')}</h2>
          <div class="model-car-price">${money(c.price)}</div>
          <div class="model-car-specs">${Number(c.km||0).toLocaleString('pt-MZ')} km · ${esc(c.engine||'—')} · ${esc(c.weight||'—')}</div>
          ${c.discount?`<span class="model-discount">-${esc(c.discount)}%</span>`:''}
          <a class="model-details-btn" href="detalhes.html?id=${encodeURIComponent(c.id)}">Ver detalhes</a>
        </div>
      </article>`;
    }).join('');
  }
  async function load(){
    if(!brand || !model){
      title.textContent='Modelo não especificado';
      subtitle.textContent='Volte à página inicial e escolha um modelo.';
      return;
    }
    if(window.driveCarsData && window.driveSupabase){
      const {data,error}=await window.driveCarsData.fetchCars({publicOnly:true});
      if(!error){
        const online=Array.isArray(data)?data:[];
        let cached=[]; try{cached=JSON.parse(localStorage.getItem('driveCars')||'[]');}catch(e){}
        render(online.length?online:cached);
        return;
      }
    }
    try{render(JSON.parse(localStorage.getItem('driveCars')||'[]'));}catch(e){render([]);}
  }
  load();
})();
