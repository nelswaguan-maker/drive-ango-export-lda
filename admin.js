/* ===== ADMIN SECURITY + WHATSAPP INVITES ===== */
let currentAdminUser=null;
const KEY="driveCars", CONTACT_KEY="driveContact";
let cars=[];
let editingImages=[];

const PERMS={publish:"Publicar",edit:"Editar",manageStatus:"Reservar / vender / reabrir",delete:"Eliminar"};
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[m]));
function sb(){return window.driveSupabase;}
function readCars(){
  try{cars=JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){cars=[];}
  return Array.isArray(cars)?cars:[];
}
function saveCars(list=cars){
  cars=Array.isArray(list)?list:cars;
  localStorage.setItem(KEY,JSON.stringify(cars));
}
async function syncCarsFromBackend(){
  if(!window.driveCarsData || !sb()) return false;
  const {data,error}=await window.driveCarsData.fetchCars();
  if(error){console.warn("Catálogo online:",error.message);return false;}
  cars=data;
  localStorage.setItem(KEY,JSON.stringify(cars));
  return true;
}
async function loadCarsFromBackend(){
  if(!window.driveCarsData || !sb()){cars=[];return;}
  const {data,error}=await window.driveCarsData.fetchCars();
  if(error){console.error("Catálogo online:",error.message);cars=[];return;}
  // Supabase é a única fonte de verdade para os anúncios compartilhados.
  cars=Array.isArray(data)?data:[];
  localStorage.setItem(KEY,JSON.stringify(cars));
}
function subscribeCarsRealtime(){
  if(!window.driveCarsData || window.driveCarsRealtime) return;
  window.driveCarsRealtime=window.driveCarsData.subscribe(async ()=>{
    const ok=await syncCarsFromBackend();
    if(ok) draw();
  });
}

function isOwnerEmail(email){return ["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(String(email||"").trim().toLowerCase());}
function isOwner(){
  return ["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes((currentAdminUser?.email||"").trim().toLowerCase());
}
let currentPermissions={};
function has(p){return isOwner()||currentPermissions?.[p]===true;}

async function loadPermissions(){
  currentPermissions={publish:true,edit:true,manageStatus:true,delete:false};
  if(!sb()||!currentAdminUser||isOwner()) return;
  const {data,error}=await sb.from("admin_permissions").select("publish,edit,manage_status,delete").eq("user_id",currentAdminUser.id).maybeSingle();
  if(!error&&data) currentPermissions={publish:!!data.publish,edit:!!data.edit,manageStatus:!!data.manage_status,delete:!!data.delete};
}

function guard(){
  if(!currentAdminUser){ $("loginScreen")?.classList.remove("hidden"); $("panel")?.classList.add("hidden"); return false; }
  $("loginScreen")?.classList.add("hidden"); $("panel")?.classList.remove("hidden"); return true;
}

function updateAdminPricePreview(){
  const el=document.getElementById("priceMznPreview"); const input=document.getElementById("price");
  if(!el||!input)return; const usd=Number(input.value||0);
  const r=window.driveCurrency?.getRate?.()||0;
  el.textContent=r>0?`Câmbio automático: 1 USD ≈ ${r.toLocaleString("pt-MZ",{maximumFractionDigits:2})} MT · ${usd.toLocaleString("en-US")} USD ≈ ${(usd*r).toLocaleString("pt-MZ",{maximumFractionDigits:0})} MT`:'Câmbio automático: a obter…';
}

async function init(){
  if(!guard()) return;
  await loadPermissions();
  await loadCarsFromBackend();
  subscribeCarsRealtime();
  await loadPurchaseOrders();
  subscribePurchaseOrders();
  await loadPromotions();
  subscribePromotions();
  renderUser(); draw(); await drawAdmins(); await drawInvites();
  if($("contactPhone")) $("contactPhone").value=localStorage.getItem(CONTACT_KEY)||"";
  applyPermissions();
}

async function createOwner(){ location.href="index.html?openSignup=1"; }
async function loginAdmin(){
  if(!sb()){ $("loginMsg").textContent="Supabase não configurado."; return; }
  const email=$("adminEmail").value.trim().toLowerCase(), pass=$("adminPass").value;
  if(!email||!pass){$("loginMsg").textContent="Introduz o email e a senha.";return;}
  const {data,error}=await sb().auth.signInWithPassword({email,password:pass});
  if(error){$("loginMsg").textContent="Email ou senha incorretos.";return;}
  currentAdminUser=data.user;
  const signedEmail=String(data.user?.email||"").trim().toLowerCase();
  // O proprietário tem prioridade absoluta: um convite antigo nunca pode bloquear o login.
  if(["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(signedEmail)){
    localStorage.removeItem("drivePendingAdminInvite");
  }else{
    const pending=localStorage.getItem("drivePendingAdminInvite");
    if(pending){
      try{
        const ok=await claimInvite(pending);
        if(!ok){localStorage.removeItem("drivePendingAdminInvite");}
        else alert("Convite aceite. A tua conta agora é administradora.");
      }catch(err){
        localStorage.removeItem("drivePendingAdminInvite");
      }
    }
  }
  await init();
}

async function logoutAdmin(){
  if(sb()) await sb().auth.signOut();
  location.href="index.html";
}

function renderUser(){
  const u=currentAdminUser;
  $("welcome").textContent=u?.user_metadata?.name||u?.email||"Administrador";
  $("roleBadge").textContent=isOwner()?"👑 Proprietário Principal":"🛡️ Administrador";
  $("permissionNote").textContent=isOwner()?"Tens acesso total ao painel.":"As tuas permissões foram definidas pelo Proprietário Principal.";
}
function applyPermissions(){
  const u=currentAdminUser;if(!u)return;
  $("staffSection")?.classList.toggle("hidden",!isOwner());
  $("settingsSection")?.classList.toggle("hidden",true); $("adminSettingsBtn")?.classList.toggle("hidden",!isOwner());
  if(!has("publish")) $("carForm")?.classList.add("hidden");
}

function formatCountdown(until){if(!until)return "48:00:00";const d=Math.max(0,Number(until)-Date.now()),s=Math.floor(d/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,"0")).join(":");}
function getCar(id){return cars.find(c=>c.id===id)}

function draw(){
  if(!currentAdminUser)return;
  const now=Date.now();let changed=false;
  const expired=[];
  cars=cars.map(c=>{
    if(c.status==="reserved"&&c.reservedUntil&&now>=c.reservedUntil){
      const next={...c,status:"available",reservedAt:null,reservedUntil:null};
      changed=true; expired.push(next); return next;
    }
    return {...c,status:c.status||"available"};
  });
  if(changed && window.driveCarsData && currentAdminUser){
    Promise.all(expired.map(c=>window.driveCarsData.upsertCar(c,currentAdminUser.id)))
      .then(()=>syncCarsFromBackend())
      .catch(err=>console.warn("Atualização automática da reserva:",err));
  }
  $("list").innerHTML=cars.map(c=>{
    let status=c.status==="sold"?"🔴 VENDIDO":c.status==="reserved"?`🟠 RESERVADO — ${formatCountdown(c.reservedUntil)}`:"🟢 DISPONÍVEL";
    const pub=c.published!==false;
    return `<div class="admin-item"><div><b>${esc(c.brand)} ${esc(c.model)}</b><small>ID: ${esc(c.id)} · ${driveFormatMoney(c.price)} · ${status} · ${pub?"🌐 NO SITE":"🚫 OCULTO"}</small></div><div class="item-actions">
    ${has("publish")?`<button class="secondary" onclick="togglePublished('${esc(c.id)}')">${pub?"Ocultar do site":"Publicar no site"}</button>`:""}
    ${has("edit")?`<button class="secondary" onclick="editCar('${esc(c.id)}')">Editar</button>`:""}
    ${has("manageStatus")&&c.status==="available"?`<button onclick="reserveCar('${esc(c.id)}')">Reservar 48h</button><button onclick="sellCar('${esc(c.id)}')">Vendido</button>`:""}
    ${has("manageStatus")&&c.status==="reserved"?`<button onclick="sellCar('${esc(c.id)}')">Vendido</button><button class="secondary" onclick="reopenCar('${esc(c.id)}')">Reabrir</button>`:""}
    ${has("manageStatus")&&c.status==="sold"?`<button class="secondary" onclick="reopenCar('${esc(c.id)}')">Reabrir carro</button>`:""}
    ${has("delete")?`<button class="danger" onclick="removeCar('${esc(c.id)}')">Eliminar</button>`:""}</div></div>`;
  }).join("")||"<p>Nenhum carro publicado.</p>";
}


async function uploadCarPhotos(files, carId){
  if(!sb()) throw new Error("Supabase não configurado.");
  if(!files.length) return [];
  if(files.length>10) throw new Error("Podes escolher no máximo 10 fotos.");
  const bucket="car-images";
  const uploaded=[];
  for(let i=0;i<files.length;i++){
    const file=files[i];
    if(!file.type.startsWith("image/")) throw new Error("Todos os ficheiros devem ser imagens.");
    if(file.size>8*1024*1024) throw new Error("Cada foto deve ter no máximo 8 MB.");
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
    const path=`${currentAdminUser.id}/${carId}/${Date.now()}-${i}.${ext}`;
    const {error}=await sb().storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});
    if(error) throw new Error("Erro ao enviar a foto: "+error.message);
    const {data}=sb().storage.from(bucket).getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }
  return uploaded;
}

function renderPhotoPreview(files){
  const box=$("photoPreview");
  if(!box)return;
  const list=Array.from(files||[]).slice(0,10);
  box.innerHTML=list.map((f,i)=>`<div class="photo-thumb"><img src="${URL.createObjectURL(f)}" alt="Foto ${i+1}"><span>${i===0?"Capa":i+1}</span></div>`).join("");
}

$("carPhotos")?.addEventListener("change",e=>{
  const files=Array.from(e.target.files||[]);
  if(files.length>10){
    alert("Podes escolher no máximo 10 fotos.");
    e.target.value="";
    renderPhotoPreview([]);
    return;
  }
  renderPhotoPreview(files);
});

$("carForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!has("publish")&&!$("editId").value)return;
  const id=$("editId").value;
  const baseId=id||("DRV"+Date.now());
  const files=Array.from($("carPhotos")?.files||[]);
  if(files.length>10){alert("Podes escolher no máximo 10 fotos.");return;}
  try{
    let images=editingImages.slice();
    if(files.length) images=await uploadCarPhotos(files,baseId);
    if(!images.length){alert("Escolhe pelo menos 1 foto da galeria.");return;}
    const base={stock:$("stock").value.trim(),brand:$("brand").value.trim(),model:$("model").value.trim(),body:$("body").value,price:+$("price").value,year:+$("year").value,km:+$("km").value,discount:+$("discount").value||0,engine:$("engine").value.trim(),fuel:$("fuel").value,arrivalPort:$("arrivalPort").value.trim(),weight:$("weight").value.trim(),trans:$("trans").value.trim(),drive:$("drive").value.trim(),wheel:$("wheel").value.trim(),color:$("color").value.trim(),location:$("location").value.trim(),seats:$("seats").value.trim(),doors:$("doors").value.trim(),dimensions:$("dimensions").value.trim(),images,image:images[0]||"",published:$("published").checked};
    let target;
    if(id){
      target=getCar(id);
      if(!has("edit")){alert("Sem permissão para editar.");return;}
      if(!target){alert("Carro não encontrado.");return;}
      Object.assign(target,base);
    }else{
      target={id:baseId,...base,status:"available",createdAt:Date.now()};
    }
    const result=await window.driveCarsData.upsertCar(target,currentAdminUser.id);
    if(result.error) throw new Error("Não foi possível sincronizar o anúncio: "+result.error.message);
    await syncCarsFromBackend();
    resetCarForm();draw();alert(id?"Carro atualizado e sincronizado.":"Carro publicado e sincronizado com todos os dispositivos.");
  }catch(err){
    alert(err.message||"Não foi possível enviar as fotos.");
  }
});
function editCar(id){
  if(!has("edit"))return;
  const c=getCar(id);if(!c)return;
  for(const k of ["stock","brand","model","body","price","year","km","discount","engine","fuel","arrivalPort","weight","trans","drive","wheel","color","location","seats","doors","dimensions"])if($(k))$(k).value=c[k]??"";
  if($("published"))$("published").checked=c.published!==false;
  editingImages=Array.isArray(c.images)&&c.images.length?c.images:(c.image?[c.image]:[]);
  if($("carPhotos"))$("carPhotos").value="";
  if($("photoPreview"))$("photoPreview").innerHTML=editingImages.map((src,i)=>`<div class="photo-thumb"><img src="${esc(src)}" alt="Foto ${i+1}"><span>${i===0?"Capa":i+1}</span></div>`).join("");
  $("editId").value=c.id;$("saveCarBtn").textContent="Guardar alterações";window.scrollTo({top:0,behavior:"smooth"});
}
function resetCarForm(){editingImages=[];if($("carPhotos"))$("carPhotos").value="";if($("photoPreview"))$("photoPreview").innerHTML="";$("carForm")?.reset();$("editId").value="";$("saveCarBtn").textContent="Publicar carro";}
async function togglePublished(id){
  if(!has("publish"))return;
  const c=getCar(id);if(!c)return;
  c.published=c.published===false;
  const result=await window.driveCarsData.upsertCar(c,currentAdminUser.id);
  if(result.error){alert("Não foi possível alterar a publicação: "+result.error.message);return;}
  await syncCarsFromBackend();draw();
}
async function updateCarStatus(id,status){
  if(!has("manageStatus"))return;
  const c=getCar(id);if(!c)return;
  c.status=status;
  if(status==="reserved"){
    c.reservedAt=Date.now();c.reservedUntil=Date.now()+48*60*60*1000;
  }else{
    c.reservedAt=null;c.reservedUntil=null;
  }
  const result=await window.driveCarsData.upsertCar(c,currentAdminUser.id);
  if(result.error){alert("Não foi possível atualizar o estado: "+result.error.message);return;}
  await syncCarsFromBackend();draw();
}
function reserveCar(id){updateCarStatus(id,"reserved");}
function sellCar(id){updateCarStatus(id,"sold");}
function reopenCar(id){updateCarStatus(id,"available");}
async function removeCar(id){
  if(!has("delete"))return;
  if(!confirm("Eliminar este anúncio?"))return;
  const {error}=await window.driveCarsData.deleteCar(id);
  if(error){alert("Não foi possível eliminar: "+error.message);return;}
  await syncCarsFromBackend();
  draw();
  alert("Anúncio eliminado. A alteração foi sincronizada com todos os dispositivos.");
}

/* ===== CONVITE PELO WHATSAPP ===== */
function normalizeWhatsApp(phone){return String(phone||"").replace(/[^0-9]/g,"");}
function inviteUrl(token){return new URL("admin.html?invite="+encodeURIComponent(token),location.href).href;}
function makeWhatsAppUrl(phone,token){
  const digits=normalizeWhatsApp(phone);
  const message=`Olá! Foste convidado(a) para ser administrador do Drive Cars.\n\nAceita o convite aqui: ${inviteUrl(token)}\n\nEste convite é pessoal e deve ser usado para criar a tua conta.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

$("inviteForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!isOwner()||!sb()){alert("Apenas o Proprietário Principal pode enviar convites.");return;}
  const phone=$("invitePhone").value.trim();
  const digits=normalizeWhatsApp(phone);
  if(digits.length<9){alert("Introduz um número de WhatsApp válido com indicativo do país.");return;}
  const permissions={publish:$("pPublish").checked,edit:$("pEdit").checked,manageStatus:$("pReserve").checked,delete:$("pDelete").checked};
  const {data,error}=await sb().rpc("create_admin_invite",{p_phone:phone,p_permissions:permissions});
  if(error){console.error(error);alert("Não foi possível criar o convite: "+error.message);return;}
  const token=Array.isArray(data)?data[0]?.token:data?.token;
  if(!token){alert("Convite criado, mas o token não foi devolvido pelo Supabase.");return;}
  const wa=makeWhatsAppUrl(phone,token);
  window.open(wa,"_blank");
  $("inviteForm").reset();$("pPublish").checked=true;$("pEdit").checked=true;$("pReserve").checked=true;
  await drawInvites();
  alert("Convite criado. O WhatsApp foi aberto com a mensagem pronta.");
});

async function drawAdmins(){
  if(!$("adminsList")||!sb())return;
  const {data,error}=await sb().from("profiles").select("id,name,email,role,blocked,created_at").eq("role","admin").order("created_at",{ascending:true});
  if(error){console.error(error);$("adminsList").innerHTML="<p>Não foi possível carregar os administradores.</p>";return;}
  $("adminsList").innerHTML=(data||[]).map(a=>{
    const owner=isOwnerEmail(a.email||"");
    return `<div class="admin-item"><div><b>${esc(a.name||"Administrador")}</b><small>${esc(a.email||"")} · ${owner?"👑 Proprietário Principal":"🛡️ Administrador"}${a.blocked?" · BLOQUEADO":""}</small></div>
    ${owner?`<strong>CONTROLO TOTAL</strong>`:`<div class="item-actions"><button onclick="toggleBlock('${esc(a.id)}',${!a.blocked})">${a.blocked?"Desbloquear":"Bloquear"}</button><button class="danger" onclick="removeAdmin('${esc(a.id)}')">Remover</button></div>`}</div>`;
  }).join("")||"<p>Nenhum administrador.</p>";
}

async function drawInvites(){
  if(!$("invitesList")||!sb()||!isOwner())return;
  const {data,error}=await sb().from("admin_invites").select("id,phone,status,expires_at,created_at").order("created_at",{ascending:false});
  if(error){console.error(error);$("invitesList").innerHTML="<p>Não foi possível carregar os convites.</p>";return;}
  $("invitesList").innerHTML=(data||[]).map(i=>`<div class="invite"><b>WhatsApp: ${esc(i.phone)}</b><span>${esc(i.status)}</span><small>Expira: ${new Date(i.expires_at).toLocaleString("pt-MZ")}</small></div>`).join("")||"<p>Nenhum convite.</p>";
}

async function toggleBlock(id,blocked){
  if(!isOwner())return;
  const {error}=await sb().rpc("set_admin_blocked",{p_user_id:id,p_blocked:blocked});
  if(error)alert("Não foi possível alterar o bloqueio: "+error.message);
  await drawAdmins();
}
async function removeAdmin(id){
  if(!isOwner()||!confirm("Remover este administrador? A conta continuará a existir, mas perderá o acesso ao painel."))return;
  const {error}=await sb().rpc("remove_admin",{p_user_id:id});
  if(error)alert("Não foi possível remover o administrador: "+error.message);
  await drawAdmins();
}

/* ===== ACEITAR CONVITE ===== */
async function acceptInvite(){
  const token=new URLSearchParams(location.search).get("invite");
  const name=$("acceptName").value.trim(),email=$("acceptEmail").value.trim().toLowerCase(),pass=$("acceptPass").value,confirm=$("acceptPassConfirm").value;
  const msg=$("inviteMsg");
  if(!token){if(msg)msg.textContent="Convite não encontrado.";return;}
  if(name.length<2||pass.length<8||pass!==confirm||!email){if(msg)msg.textContent="Preenche nome, email e duas senhas iguais (mínimo 8 caracteres).";return;}
  if(!sb()){if(msg)msg.textContent="Supabase não configurado.";return;}
  const button=document.querySelector("#inviteAccess button");if(button){button.disabled=true;button.textContent="A criar conta...";}
  const {data,error}=await sb().auth.signUp({email,password:pass,options:{data:{name},emailRedirectTo:window.location.origin+"/admin.html?invite="+encodeURIComponent(token)}});
  if(error){
    if(button){button.disabled=false;button.textContent="Aceitar convite e criar conta";}
    msg.textContent=error.message;return;
  }
  localStorage.setItem("drivePendingAdminInvite",token);
  if(data.session){
    const result=await claimInvite(token);
    if(result){history.replaceState({},document.title,"admin.html");location.replace("admin.html");return;}
  }
  if(button){button.disabled=false;button.textContent="Aceitar convite e criar conta";}
  msg.textContent="Conta criada. Se o Supabase pedir confirmação por email, confirma primeiro e depois entra novamente nesta página para concluir o convite.";
  showLoginAfterInvite();
}

async function claimInvite(token){
  const {data,error}=await sb().rpc("accept_admin_invite",{p_token:token});
  if(error){
    const msg=String(error.message||"").toLowerCase();
    // Tokens antigos/aceites/cancelados não devem bloquear o acesso normal.
    if(msg.includes("já foi")||msg.includes("já foi utilizado")||msg.includes("cancelado")||msg.includes("expirou")||msg.includes("inválido")){
      localStorage.removeItem("drivePendingAdminInvite");
      return false;
    }
    console.warn("Convite:",error.message);
    return false;
  }
  localStorage.removeItem("drivePendingAdminInvite");
  return data===true||data?.accepted===true||data==="true";
}
function showLoginAfterInvite(){
  $("setupBox")?.classList.add("hidden");$("inviteAccess")?.classList.add("hidden");$("loginBox")?.classList.remove("hidden");
  $("loginMsg").textContent="Confirma o teu email, se necessário, e entra. O convite será concluído automaticamente.";
}
async function tryPendingInvite(){
  const token=localStorage.getItem("drivePendingAdminInvite");if(!token||!sb())return;
  const {data:{session}}=await sb().auth.getSession();
  if(session){
    const ok=await claimInvite(token);
    if(ok){location.replace("admin.html");return;}
  }
}

/* ===== CONTACTO ===== */
$("contactForm")?.addEventListener("submit",e=>{e.preventDefault();if(!isOwner())return;const n=$("contactPhone").value.trim();localStorage.setItem(CONTACT_KEY,n);alert("Contacto guardado.");});

document.addEventListener("DOMContentLoaded",async()=>{
  const params=new URLSearchParams(location.search);

  // Se o convite já foi usado/criado, nunca voltar a mostrar o formulário.
  // Primeiro tentamos concluir um convite pendente com a sessão atual.
  if(sb()){
    const {data:{session}}=await sb().auth.getSession();
    if(session){
      currentAdminUser=session.user;
      // Se a conta já é administradora, um convite antigo nunca deve
      // voltar a ser processado nem mostrar erro.
      const owner=["nelswaguan@gmail.com","editojosejoaquim812@gmail.com","jojomilagre@gmail.com"].includes(String(session.user.email||"").trim().toLowerCase());
      let alreadyAdmin=owner;
      if(!alreadyAdmin){
        try{
          const {data}=await sb().rpc("is_current_user_admin");
          alreadyAdmin=data===true;
        }catch(e){}
      }
      if(alreadyAdmin){
        localStorage.removeItem("drivePendingAdminInvite");
        await init();
        return;
      }
      const pending=localStorage.getItem("drivePendingAdminInvite");
      if(pending){
        const ok=await claimInvite(pending);
        if(ok){
          history.replaceState({},document.title,"admin.html");
          await init();
          return;
        }
      }
    }
  }

  // Só mostrar o formulário se ainda não houver uma sessão/admin pendente.
  if(params.get("invite")){
    $("loginScreen")?.classList.remove("hidden");
    $("setupBox")?.classList.add("hidden");$("loginBox")?.classList.add("hidden");$("inviteAccess")?.classList.remove("hidden");
    $("inviteInfo").textContent="Este convite foi enviado pelo WhatsApp. Cria a tua conta para receber o acesso de administrador.";
    return;
  }

  currentAdminUser=await window.requireAdmin();
  if(currentAdminUser) await init();
  await tryPendingInvite();
  setInterval(async()=>{if(currentAdminUser){await syncCarsFromBackend();draw();drawAdmins();}},5000);
});

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

window.addEventListener("driveExchangeUpdated",updateAdminPricePreview);
window.addEventListener("driveCurrencyChanged",updateAdminPricePreview);


async function loadPurchaseOrders(){
  if(!isOwner()||!sb()) return;
  const box=$("purchaseOrders"); if(!box) return;
  const {data,error}=await sb().from("purchase_orders").select("*").order("created_at",{ascending:false}).limit(30);
  if(error){box.innerHTML='<p>Não foi possível carregar os pedidos.</p>';return;}
  const orders=data||[]; $("ordersBadge").textContent=orders.filter(o=>o.status==='pending').length?`(${orders.filter(o=>o.status==='pending').length} novos)`:'';
  box.innerHTML=orders.map(o=>{const v=o.vehicle_snapshot||{};return `<div class="admin-item"><div><b>🛒 ${esc(v.brand||'')} ${esc(v.model||'')}</b><small>Cliente: ${esc(o.customer_name||'')} · ${esc(o.customer_phone||'')} · Stock: ${esc(v.stock||o.car_id||'')} · ${esc(v.price||'')} USD</small><small>Pagamento: ${esc(o.payment_method||'—')} · Envio: ${esc(o.shipping_method||'—')} · Destino: ${esc(o.destination||'—')}</small><small>${new Date(o.created_at).toLocaleString('pt-MZ')} · Estado: ${esc(o.status||'pending')}</small></div><div class="item-actions"><button class="secondary" onclick="markOrder('${o.id}','processing')">Em análise</button><button onclick="markOrder('${o.id}','confirmed')">Confirmar</button><button class="danger" onclick="markOrder('${o.id}','cancelled')">Cancelar</button></div></div>`}).join('')||'<p>Nenhum pedido de compra.</p>';
}
async function markOrder(id,status){if(!isOwner()||!sb())return;const {error}=await sb().from('purchase_orders').update({status}).eq('id',id);if(error)alert(error.message);else loadPurchaseOrders();}
function subscribePurchaseOrders(){if(!isOwner()||!sb()||window.driveOrdersRealtime)return;window.driveOrdersRealtime=sb().channel('drive-purchase-orders-live').on('postgres_changes',{event:'*',schema:'public',table:'purchase_orders'},()=>{loadPurchaseOrders();try{if(document.visibilityState==='visible'&&'Notification' in window&&Notification.permission==='granted')new Notification('DRIVE — novo pedido de compra');}catch(e){}}).subscribe();}



/* ===== PROMOÇÕES — UPLOAD DIRETO DE IMAGEM ===== */
async function uploadPromotionImage(file){
  if(!sb()) throw new Error("Supabase não configurado.");
  if(!file) return "";
  if(!file.type.startsWith("image/")) throw new Error("Escolhe um ficheiro de imagem.");
  if(file.size>8*1024*1024) throw new Error("A imagem deve ter no máximo 8 MB.");
  const bucket="car-images";
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=`promotions/${currentAdminUser.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const {error}=await sb().storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});
  if(error) throw new Error("Erro ao enviar a imagem da promoção: "+error.message);
  return sb().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
$("promoImageFile")?.addEventListener("change",e=>{
  const file=e.target.files?.[0], box=$("promoImagePreview");
  if(!box)return;
  if(!file){box.innerHTML="";return;}
  if(!file.type.startsWith("image/")||file.size>8*1024*1024){alert("Escolhe uma imagem até 8 MB.");e.target.value="";box.innerHTML="";return;}
  box.innerHTML=`<div class="photo-thumb"><img src="${URL.createObjectURL(file)}" alt="Pré-visualização da promoção"><span>Capa</span></div>`;
});

async function loadPromotions(){
  if(!isOwner()||!sb())return;
  const box=$("promotionsList"); if(!box)return;
  const {data,error}=await sb().from("drive_promotions").select("*").order("created_at",{ascending:false});
  if(error){box.innerHTML='<p>Não foi possível carregar promoções.</p>';return;}
  box.innerHTML=(data||[]).map(p=>{
    const period=`${p.starts_at?new Date(p.starts_at).toLocaleString("pt-MZ"):""}${p.ends_at?` → ${new Date(p.ends_at).toLocaleString("pt-MZ")}`:""}`;
    return `<div class="admin-item"><div><b>🔥 ${esc(p.title)}</b><small>${esc(p.subtitle||"")} · ${p.discount||0}% · ${p.active?"ATIVA":"INATIVA"}</small><small>${p.old_price?`Antigo: ${esc(p.old_price)} USD · `:""}${p.promo_price?`Promo: ${esc(p.promo_price)} USD`:""}</small><small>${esc(period)}</small></div><div class="item-actions"><button class="secondary" onclick="togglePromotion('${p.id}',${!p.active})">${p.active?'Desativar':'Ativar'}</button><button class="danger" onclick="deletePromotion('${p.id}')">Eliminar</button></div></div>`
  }).join('')||'<p>Nenhuma promoção criada.</p>';
}
async function togglePromotion(id,active){if(!isOwner())return;const {error}=await sb().from('drive_promotions').update({active}).eq('id',id);if(error)alert(error.message);else loadPromotions();}
async function deletePromotion(id){if(!isOwner()||!confirm('Eliminar esta promoção?'))return;const {error}=await sb().from('drive_promotions').delete().eq('id',id);if(error)alert(error.message);else loadPromotions();}
$("promotionForm")?.addEventListener("submit",async e=>{
  e.preventDefault(); if(!isOwner())return;
  const starts=$("promoStartsAt")?.value;
  const ends=$("promoEndsAt")?.value;
  let imageUrl="";
  try{imageUrl=await uploadPromotionImage($("promoImageFile")?.files?.[0]||null);}catch(err){alert(err.message);return;}
  const row={title:$("promoTitle").value.trim(),subtitle:$("promoSubtitle").value.trim(),image_url:imageUrl||null,car_id:$("promoCarId").value.trim()||null,old_price:+$("promoOldPrice").value||null,promo_price:+$("promoPrice").value||null,discount:+$("promoDiscount").value||0,active:$("promoActive").checked,starts_at:starts?new Date(starts).toISOString():new Date().toISOString(),ends_at:ends?new Date(ends).toISOString():null,created_by:currentAdminUser.id};
  const {error}=await sb().from('drive_promotions').insert(row);
  if(error)alert(error.message);else{$("promotionForm").reset();$("promoActive").checked=true;loadPromotions();}
});
function subscribePromotions(){if(!isOwner()||!sb()||window.drivePromotionsRealtime)return;window.drivePromotionsRealtime=sb().channel('drive-promotions-live').on('postgres_changes',{event:'*',schema:'public',table:'drive_promotions'},()=>loadPromotions()).subscribe();}

/* ===== DEFINIÇÕES DO PAINEL ===== */
const ADMIN_THEME_KEY="driveTheme";
function applyAdminTheme(){
  const theme=localStorage.getItem(ADMIN_THEME_KEY)||"system";
  const dark=theme==="dark" || (theme==="system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme=theme;
  document.body.classList.toggle("dark-mode",dark);
}
function setAdminTheme(theme){localStorage.setItem(ADMIN_THEME_KEY,theme);applyAdminTheme();openAdminSettingsTab("theme");}
function toggleAdminSettings(){
  const s=$("settingsSection"); if(!s||!isOwner())return;
  s.classList.toggle("hidden");
  if(!s.classList.contains("hidden"))openAdminSettingsTab("theme");
  s.scrollIntoView({behavior:"smooth",block:"start"});
}
function openAdminSettingsTab(tab){
  const box=$("adminSettingsContent"); if(!box)return;
  const theme=localStorage.getItem(ADMIN_THEME_KEY)||"system";
  if(tab==="contact"){
    box.innerHTML=`<div class="settings-tab"><h3>📱 Contacto e WhatsApp</h3><p>Este número será usado nos botões WhatsApp e Ligar.</p><form id="contactForm"><input id="contactPhone" placeholder="Número com indicativo, ex.: +258 84..." required value="${esc(localStorage.getItem(CONTACT_KEY)||"")}"><button type="submit">Guardar contacto</button></form></div>`;
    $("contactForm")?.addEventListener("submit",e=>{e.preventDefault();localStorage.setItem(CONTACT_KEY,$("contactPhone").value.trim());alert("Contacto guardado.");});
  }else if(tab==="site"){
    box.innerHTML=`<div class="settings-tab"><h3>🌐 Site e partilha</h3><p>Os links dos anúncios usam o formato público <strong>/carro/STOCK</strong>, sem expor <strong>detalhes.html</strong>.</p><p>Exemplo: <code>/carro/DRV1790408224947</code></p></div>`;
  }else{
    box.innerHTML=`<div class="settings-tab"><h3>🎨 Aparência e tema</h3><div class="settings-theme-grid"><button onclick="setAdminTheme('light')" class="${theme==="light"?"selected":""}">☀️ Claro</button><button onclick="setAdminTheme('dark')" class="${theme==="dark"?"selected":""}">🌙 Noturno</button><button onclick="setAdminTheme('system')" class="${theme==="system"?"selected":""}">💻 Sistema</button></div><small>A preferência fica guardada neste dispositivo.</small></div>`;
  }
}
applyAdminTheme();
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if((localStorage.getItem(ADMIN_THEME_KEY)||"system")==="system")applyAdminTheme();});
