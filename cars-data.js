/* DRIVE CARS — fonte única Supabase + realtime */
(function(){
  const TABLE="drive_cars";
  function client(){ return window.driveSupabase; }
  const BRAND_PREFIXES=[
    ["Mercedes-Benz","Mercedes"],["Land Rover","Land Rover"],["Volkswagen","Volkswagen"],["Citroën","Citroën"],
    ["Toyota","Toyota"],["Honda","Honda"],["Nissan","Nissan"],["Mazda","Mazda"],["Suzuki","Suzuki"],
    ["Mitsubishi","Mitsubishi"],["Daihatsu","Daihatsu"],["Subaru","Subaru"],["Hino","Hino"],["BMW","BMW"],
    ["Isuzu","Isuzu"],["Lexus","Lexus"],["Audi","Audi"],["Volvo","Volvo"],["Ford","Ford"],
    ["Peugeot","Peugeot"],["Jeep","Jeep"],["Jaguar","Jaguar"],["Hyundai","Hyundai"],["Kia","Kia"]
  ];
  function cleanText(v){return String(v??"").trim();}
  function inferBrand(brand,model){
    const b=cleanText(brand), m=cleanText(model);
    const n=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[-_]+/g," ").replace(/\s+/g," ").trim();
    const nb=n(b);
    // Alguns anúncios antigos começam pelo ano/data, por exemplo:
    // "2009/3 TOYOTA HIACE VAN DX". Removemos esse prefixo antes de
    // procurar a marca, para que Toyota/Honda/Mazda etc. sejam reconhecidas.
    const nm=n(m).replace(/^(?:19|20)\d{2}(?:\s*[\/.-]\s*\d{1,2})?\s+/,'');
    // Se o nome do modelo começa pelo fabricante, esse prefixo é a fonte mais confiável.
    // Isto também corrige anúncios antigos em que a marca ficou vazia ou foi gravada incorretamente.
    for(const [prefix,canonical] of BRAND_PREFIXES){
      const np=n(prefix);
      if(nm===np || nm.startsWith(np+" ") || nm.startsWith(np+"/")) return canonical;
    }
    // Alguns anúncios antigos têm a marca vazia, errada ou misturada no próprio
    // campo brand. Nesse caso procuramos o fabricante no texto combinado.
    const combined = (nb + " " + nm).replace(/\s+/g," ").trim();
    for(const [prefix,canonical] of BRAND_PREFIXES){
      const np=n(prefix);
      const re=new RegExp("(?:^|\\s)"+np.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?:\\s|$)","i");
      if(re.test(combined)) return canonical;
    }
    // Mantém a marca informada quando não há evidência melhor.
    return b;
  }
  // Normaliza nomes de modelos para agrupar versões, anos e acabamentos do mesmo modelo.
  const MODEL_FAMILIES={
    Toyota:[
      ["Land Cruiser Prado",[/\bland\s*cruiser\s+prado\b/i]],["Land Cruiser",[/\bland\s*cruiser\b/i]],
      ["Corolla Fielder",[/\bcorolla\s+fielder\b/i]],["Corolla Axio",[/\bcorolla\s+axio\b/i]],["Corolla",[/\bcorolla\b/i]],
      ["Hiace Van",[/\bhiace\s+van\b/i]],["Hiace",[/\bhiace\b/i]],["Harrier",[/\bharrier\b/i]],["Hilux",[/\bhilux\b/i]],
      ["RAV4",[/\brav[-\s]?4\b/i]],["Dyna",[/\bdyna\b/i]],["Noah",[/\bnoah\b/i]],["Voxy",[/\bvoxy\b/i]],
      ["Sienta",[/\bsienta\b/i]],["Wish",[/\bwish\b/i]],["Ractis",[/\bractis\b/i]],["Aqua",[/\baqua\b/i]],["Prius",[/\bprius\b/i]],
      ["Yaris",[/\byaris\b/i]],["Vitz",[/\bvitz\b/i]],["C-HR",[/\bc[-\s]?hr\b/i]],["Alphard",[/\balphard\b/i]],["Vellfire",[/\bvellfire\b/i]],["Crown",[/\bcrown\b/i]],["Mark X",[/\bmark\s*x\b/i]]
    ],
    Honda:[["Fit",[/\bfit\b/i]],["Civic",[/\bcivic\b/i]],["CR-V",[/\bcr[-\s]?v\b/i]],["HR-V",[/\bhr[-\s]?v\b/i]],["Freed",[/\bfreed\b/i]],["Vezel",[/\bvezel\b/i]],["Stepwgn",[/\bstep\s*wgn\b/i]],["N-Box",[/\bn[-\s]?box\b/i]],["Odyssey",[/\bodyssey\b/i]],["Stream",[/\bstream\b/i]],["Shuttle",[/\bshuttle\b/i]],["Grace",[/\bgrace\b/i]]],
    Nissan:[["Serena",[/\bserena\b/i]],["Note",[/\bnote\b/i]],["X-Trail",[/\bx[-\s]?trail\b/i]],["Qashqai",[/\bqashqai\b/i]],["Juke",[/\bjuke\b/i]],["Elgrand",[/\belgrand\b/i]],["Navara",[/\bnavara\b/i]],["Caravan",[/\bcaravan\b/i]],["AD Van",[/\bad\s+van\b/i]],["March",[/\bmarch\b/i]]],
    Mazda:[["Bongo",[/\bbongo\b/i]],["Demio",[/\bdemio\b/i]],["CX-5",[/\bcx[-\s]?5\b/i]],["CX-3",[/\bcx[-\s]?3\b/i]],["CX-30",[/\bcx[-\s]?30\b/i]],["Atenza",[/\batenza\b/i]],["Axela",[/\baxela\b/i]],["Premacy",[/\bpremacy\b/i]],["Familia",[/\bfamilia\b/i]]],
    Suzuki:[["Jimny",[/\bjimny\b/i]],["Swift",[/\bswift\b/i]],["Every",[/\bevery\b/i]],["Wagon R",[/\bwagon\s*r\b/i]],["Alto",[/\balto\b/i]],["Solio",[/\bsolio\b/i]]],
    Mitsubishi:[["Canter",[/\bcanter\b/i]],["Pajero",[/\bpajero\b/i]],["Outlander",[/\boutlander\b/i]],["Delica",[/\bdelica\b/i]],["Lancer",[/\blancer\b/i]],["RVR",[/\brvr\b/i]]],
    Subaru:[["Forester",[/\bforester\b/i]],["Impreza",[/\bimpreza\b/i]],["XV",[/\bxv\b/i]],["Legacy",[/\blegacy\b/i]],["Levorg",[/\blevorg\b/i]]],
    Daihatsu:[["Mira",[/\bmira\b/i]],["Move",[/\bmove\b/i]],["Tanto",[/\btanto\b/i]],["Hijet",[/\bhijet\b/i]],["Terios",[/\bterios\b/i]]],
    Hino:[["Dutro",[/\bdutro\b/i]],["Ranger",[/\branger\b/i]],["Profia",[/\bprofia\b/i]]],
    Isuzu:[["Elf",[/\belf\b/i]],["Forward",[/\bforward\b/i]],["Giga",[/\bgiga\b/i]],["D-Max",[/\bd[-\s]?max\b/i]]],
    Volkswagen:[["Golf",[/\bgolf\b/i]],["Polo",[/\bpolo\b/i]],["Passat",[/\bpassat\b/i]],["Tiguan",[/\btiguan\b/i]],["Transporter",[/\btransporter\b/i]]],
    BMW:[["Série 3",[/\b(?:serie|série)\s*3\b/i]],["Série 5",[/\b(?:serie|série)\s*5\b/i]],["X1",[/\bx1\b/i]],["X3",[/\bx3\b/i]],["X5",[/\bx5\b/i]],["X6",[/\bx6\b/i]]],
    Mercedes:[["GLC",[/\bglc\b/i]],["Classe C",[/\bclasse\s*c\b/i]],["Classe E",[/\bclasse\s*e\b/i]],["Sprinter",[/\bsprinter\b/i]],["Vito",[/\bvito\b/i]]],
    Hyundai:[["Tucson",[/\btucson\b/i]],["Santa Fe",[/\bsanta\s*fe\b/i]],["i30",[/\bi30\b/i]],["i10",[/\bi10\b/i]],["H-1",[/\bh[-\s]?1\b/i]]],
    Kia:[["Sportage",[/\bsportage\b/i]],["Sorento",[/\bsorento\b/i]],["Picanto",[/\bpicanto\b/i]],["Carnival",[/\bcarnival\b/i]]]
  };
  function titleCaseModel(v){
    return String(v||'').trim().split(/\s+/).map(w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
  }
  function normalizeModel(brand,model){
    const b=cleanText(inferBrand(brand,model));
    let raw=cleanText(model).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(!raw) return '';
    const simpleNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim();
    const brandNames=[b,...BRAND_PREFIXES.filter(x=>simpleNorm(x[1])===simpleNorm(b)).map(x=>x[0])];
    const escaped=brandNames.filter(Boolean).map(x=>String(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    if(escaped.length) raw=raw.replace(new RegExp('^\\s*(?:'+escaped.join('|')+')\\s+','i'),'');
    raw=raw.replace(/^\s*(?:19|20)\d{2}(?:\s*[/.-]\s*\d{1,2})?\s*/,'');
    raw=raw.replace(/^\s*\d{4}\s*[/.-]\s*\d{1,2}\s*/,'');
    const families=MODEL_FAMILIES[b] || [];
    for(const [label,patterns] of families){ if(patterns.some(re=>re.test(raw))) return label; }
    raw=raw.replace(/\b(?:19|20)\d{2}(?:[/.-]\d{1,2})?\b/g,' ');
    raw=raw.replace(/\b(?:dx|super\s*gl|gl|g|just\s*selection|selection|plus|limited|premium|deluxe|standard|custom|sport|luxury|executive|hybrid|diesel|petrol|gasoline|automatic|manual|4wd|2wd|rhd|lhd)\b/gi,' ');
    raw=raw.replace(/\b\d+(?:\.\d+)?(?:t|cc|l|k)?\b/gi,' ');
    raw=raw.replace(/\b(?:flat\s*body|high\s*roof|low\s*roof|long|short|van|truck|wagon|sedan|suv|pickup|pick\s*up)\b/gi,' ');
    raw=raw.replace(/[^A-Za-z0-9À-ÿ\s-]/g,' ').replace(/\s+/g,' ').trim();
    if(!raw) return cleanText(model);
    return titleCaseModel(raw.split(' ').slice(0,3).join(' '));
  }

  function normalize(c){
    if(!c) return null;
    const rawModel=c.model||"";
    const resolvedBrand=inferBrand(c.brand,rawModel);
    return {
      id:c.id, stock:c.stock||"", brand:resolvedBrand, model:rawModel, body:c.body||"SUV", price:Number(c.price||0),
      year:Number(c.year||0), km:Number(c.km||0), discount:Number(c.discount||0), engine:c.engine||"", fuel:c.fuel||"", arrivalPort:c.arrival_port||c.arrivalPort||"",
      weight:c.weight||"", trans:c.trans||"", drive:c.drive||"", wheel:c.wheel||"", color:c.color||"", location:c.location||"", seats:c.seats||"", doors:c.doors||"", dimensions:c.dimensions||"",
      images:Array.isArray(c.images)?c.images:[], image:c.image||((Array.isArray(c.images)&&c.images[0])||""),
      status:c.status||"available", published:c.published!==false,
      reservedAt:c.reservedAt?Number(c.reservedAt):(c.reserved_at?new Date(c.reserved_at).getTime():null),
      reservedUntil:c.reservedUntil?Number(c.reservedUntil):(c.reserved_until?new Date(c.reserved_until).getTime():null),
      brandGroup:c.brand_group||c.brandGroup||"", modelGroup:c.model_group||c.modelGroup||"",
      createdAt:c.createdAt?Number(c.createdAt):(c.created_at?new Date(c.created_at).getTime():null),
      createdBy:c.createdBy||c.created_by||null,
      publisherPhone:c.publisherPhone||c.publisher_phone||"",
      views:Number(c.views||0), updatedAt:c.updatedAt||c.updated_at||null
    };
  }
  function toRow(c,userId){
    const n=normalize(c);
    return {
      id:n.id,stock:n.stock,brand:n.brand,model:n.model,body:n.body,price:n.price,year:n.year,km:n.km,discount:n.discount,
      engine:n.engine,fuel:n.fuel,arrival_port:n.arrivalPort||"",weight:n.weight,trans:n.trans,drive:n.drive,wheel:n.wheel,color:n.color,location:n.location,seats:n.seats,doors:n.doors,dimensions:n.dimensions,images:n.images,image:n.image,
      status:n.status, published:n.published!==false,
      brand_group:n.brandGroup||"", model_group:n.modelGroup||"",
      reserved_at:n.reservedAt?new Date(n.reservedAt).toISOString():null,
      reserved_until:n.reservedUntil?new Date(n.reservedUntil).toISOString():null,
      created_by:n.createdBy||userId||null,
      publisher_phone:n.publisherPhone||"",
      created_at:n.createdAt?new Date(n.createdAt).toISOString():undefined
    };
  }
  async function fetchCars(options={}){
    if(!client()) return {data:[],error:new Error("Supabase não configurado.")};
    let query=client().from(TABLE).select("*");
    if(options.publicOnly) query=query.eq("published",true);
    const {data,error}=await query.order("created_at",{ascending:false});
    return {data:(data||[]).map(normalize),error};
  }
  async function upsertCar(car,userId){
    if(!client()) return {data:null,error:new Error("Supabase não configurado.")};
    const row=toRow(car,userId);
    return await client().from(TABLE).upsert(row,{onConflict:"id"}).select().single();
  }
  async function upsertCars(cars,userId){
    if(!client()) return {error:new Error("Supabase não configurado.")};
    const rows=(cars||[]).map(c=>toRow(c,userId));
    if(!rows.length) return {error:null};
    return await client().from(TABLE).upsert(rows,{onConflict:"id"});
  }
  async function deleteCar(id){
    if(!client()) return {error:new Error("Supabase não configurado.")};
    return await client().from(TABLE).delete().eq("id",id);
  }
  function subscribe(callback){
    if(!client()) return null;
    const name="drive-cars-live-"+Math.random().toString(36).slice(2);
    const channel=client().channel(name)
      .on("postgres_changes",{event:"*",schema:"public",table:TABLE},payload=>callback(payload))
      .subscribe(status=>{
        if(status!=="SUBSCRIBED") console.warn("Realtime Drive Cars:",status);
      });
    return channel;
  }
  window.driveCarsData={TABLE,normalize,inferBrand,normalizeModel,fetchCars,upsertCars,upsertCar,deleteCar,subscribe};
})();
