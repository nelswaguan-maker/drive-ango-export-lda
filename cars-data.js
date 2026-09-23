/* DRIVE CARS — shared Supabase data + realtime */
(function(){
  const TABLE="drive_cars";
  function client(){ return window.driveSupabase; }
  function normalize(c){
    if(!c) return null;
    return {
      id:c.id, brand:c.brand||"", model:c.model||"", body:c.body||"SUV", price:Number(c.price||0),
      year:Number(c.year||0), km:Number(c.km||0), discount:Number(c.discount||0), engine:c.engine||"",
      weight:c.weight||"", trans:c.trans||"", drive:c.drive||"", wheel:c.wheel||"",
      images:Array.isArray(c.images)?c.images:[], image:c.image||((Array.isArray(c.images)&&c.images[0])||""),
      status:c.status||"available", reservedAt:c.reservedAt?Number(c.reservedAt):(c.reserved_at?new Date(c.reserved_at).getTime():null),
      reservedUntil:c.reservedUntil?Number(c.reservedUntil):(c.reserved_until?new Date(c.reserved_until).getTime():null), createdAt:c.createdAt?Number(c.createdAt):(c.created_at?new Date(c.created_at).getTime():null),
      createdBy:c.createdBy||c.created_by||null, updatedAt:c.updatedAt||c.updated_at||null
    };
  }
  function toRow(c, userId){
    const n=normalize(c);
    return {id:n.id,brand:n.brand,model:n.model,body:n.body,price:n.price,year:n.year,km:n.km,discount:n.discount,
      engine:n.engine,weight:n.weight,trans:n.trans,drive:n.drive,wheel:n.wheel,images:n.images,image:n.image,status:n.status,
      reserved_at:n.reservedAt?new Date(n.reservedAt).toISOString():null,
      reserved_until:n.reservedUntil?new Date(n.reservedUntil).toISOString():null,
      created_by:n.createdBy||userId||null,created_at:n.createdAt?new Date(n.createdAt).toISOString():undefined};
  }
  async function fetchCars(){
    if(!client()) return {data:[],error:new Error("Supabase não configurado.")};
    const {data,error}=await client().from(TABLE).select("*").order("created_at",{ascending:false});
    return {data:(data||[]).map(normalize),error};
  }
  async function upsertCars(cars,userId){
    if(!client()) return {error:new Error("Supabase não configurado.")};
    const rows=(cars||[]).map(c=>toRow(c,userId));
    if(!rows.length) return {error:null};
    const {error}=await client().from(TABLE).upsert(rows,{onConflict:"id"});
    return {error};
  }
  async function upsertCar(car,userId){return upsertCars([car],userId);}
  async function deleteCar(id){
    if(!client()) return {error:new Error("Supabase não configurado.")};
    return await client().from(TABLE).delete().eq("id",id);
  }
  function subscribe(callback){
    if(!client()) return null;
    const channel=client().channel("drive-cars-live")
      .on("postgres_changes",{event:"*",schema:"public",table:TABLE},payload=>callback(payload))
      .subscribe();
    return channel;
  }
  window.driveCarsData={TABLE,normalize,fetchCars,upsertCars,upsertCar,deleteCar,subscribe};
})();
