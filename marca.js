(function(){
  const params=new URLSearchParams(location.search);
  const brand=(params.get('brand')||'').trim();
  const title=document.getElementById('brandTitle');
  const subtitle=document.getElementById('brandSubtitle');
  const letters=document.getElementById('brandLetters');
  const container=document.getElementById('brandModels');

  const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const norm=v=>String(v??'').trim().toLowerCase();
  const modelKey=(b,m)=>`${norm(b)}|${norm(m)}`;
  const modelHref=(b,m)=>`modelos.html?${new URLSearchParams({brand:String(b),model:String(m)}).toString()}`;

  function render(cars){
    const wanted=norm(brand);
    const matches=cars.filter(c=>c && c.published!==false && norm(c.brand)===wanted && String(c.model||'').trim());
    const grouped={};
    matches.forEach(c=>{
      const model=String(c.model||'').trim();
      const key=modelKey(brand,model);
      if(!grouped[key]) grouped[key]={model,count:0,photo:''};
      grouped[key].count++;
      if(!grouped[key].photo){ grouped[key].photo=c.image || (Array.isArray(c.images)?c.images[0]:'') || ''; }
    });

    const models=Object.values(grouped).sort((a,b)=>a.model.localeCompare(b.model,'pt',{sensitivity:'base',numeric:true}));
    title.textContent=brand ? `Modelos da ${brand}` : 'Modelos da marca';
    subtitle.textContent=`${models.length} modelo${models.length===1?'':'s'} disponível${models.length===1?'':'eis'}${brand?' na '+brand:''}.`;
    document.title=`${brand||'Marca'} — DRIVE Global Car Market`;

    if(!models.length){
      letters.innerHTML='';
      container.innerHTML='<div class="brand-empty">Nenhum modelo encontrado para esta marca.</div>';
      return;
    }

    const byLetter={};
    models.forEach(x=>{
      const first=(x.model.trim().charAt(0)||'#').toUpperCase();
      const letter=/[A-ZÀ-ÖØ-Ý]/.test(first) ? first : '#';
      (byLetter[letter] ||= []).push(x);
    });
    const orderedLetters=Object.keys(byLetter).sort((a,b)=>a==='#'?1:b==='#'?-1:a.localeCompare(b,'pt'));

    letters.innerHTML=orderedLetters.map(l=>`<a href="#letter-${encodeURIComponent(l)}">${esc(l)}</a>`).join('');
    container.innerHTML=orderedLetters.map(letter=>`
      <section class="brand-model-group" id="letter-${encodeURIComponent(letter)}">
        <h2 class="brand-model-letter">${esc(letter)}</h2>
        <div class="brand-model-grid">
          ${byLetter[letter].map(x=>`
            <a class="brand-model-card" href="${esc(modelHref(brand,x.model))}">
              <img class="brand-model-photo" src="${esc(x.photo)}" alt="${esc(brand+' '+x.model)}" loading="lazy" onerror="this.style.background='#eee';this.removeAttribute('src')">
              <div class="brand-model-info">
                <strong>${esc(x.model)}</strong>
                <small>${x.count} carro${x.count===1?'':'s'}</small>
                <i class="fa-solid fa-chevron-right"></i>
              </div>
            </a>`).join('')}
        </div>
      </section>`).join('');
  }

  async function load(){
    if(!brand){
      title.textContent='Marca não especificada';
      subtitle.textContent='Volte à página inicial e escolha uma marca.';
      return;
    }
    if(window.driveCarsData && window.driveSupabase){
      try{
        const {data,error}=await window.driveCarsData.fetchCars({publicOnly:true});
        if(!error){render(Array.isArray(data)?data:[]);return;}
      }catch(e){}
    }
    try{render(JSON.parse(localStorage.getItem('driveCars')||'[]'));}catch(e){render([]);}
  }
  load();
})();
