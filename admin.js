/* ===== ADMIN SECURITY + WHATSAPP INVITES ===== */
let currentAdminUser=null;
const KEY="driveCars", CONTACT_KEY="driveContact";
let cars=[];

const PERMS={publish:"Publicar",edit:"Editar",manageStatus:"Reservar / vender / reabrir",delete:"Eliminar"};
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>'"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[m]));
function sb(){return window.driveSupabase;}
function readCars(){cars=JSON.parse(localStorage.getItem(KEY)||"[]");}
function saveCars(){localStorage.setItem(KEY,JSON.stringify(cars));}

function isOwner(){
  return (currentAdminUser?.email||"").toLowerCase()==="nelswaguan@gmail.com";
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

async function init(){
  if(!guard()) return;
  await loadPermissions();
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
  const pending=localStorage.getItem("drivePendingAdminInvite");
  if(pending){
    try{
      const ok=await claimInvite(pending);
      if(!ok)return;
      alert("Convite aceite. A tua conta agora é administradora.");
    }catch(err){$("loginMsg").textContent=err.message||"Não foi possível concluir o convite.";return;}
  }
  currentAdminUser=data.user;
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
  $("settingsSection")?.classList.toggle("hidden",!isOwner());
  if(!has("publish")) $("carForm")?.classList.add("hidden");
}

function formatCountdown(until){if(!until)return "48:00:00";const d=Math.max(0,Number(until)-Date.now()),s=Math.floor(d/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(x=>String(x).padStart(2,"0")).join(":");}
function getCar(id){return cars.find(c=>c.id===id)}

function draw(){
  readCars();if(!currentAdminUser)return;
  const now=Date.now();let changed=false;
  cars=cars.map(c=>{if(c.status==="reserved"&&c.reservedUntil&&now>=c.reservedUntil){changed=true;return {...c,status:"available",reservedAt:null,reservedUntil:null};}return {...c,status:c.status||"available"};});
  if(changed)saveCars();
  $("list").innerHTML=cars.map(c=>{
    let status=c.status==="sold"?"🔴 VENDIDO":c.status==="reserved"?`🟠 RESERVADO — ${formatCountdown(c.reservedUntil)}`:"🟢 DISPONÍVEL";
    return `<div class="admin-item"><div><b>${esc(c.brand)} ${esc(c.model)}</b><small>ID: ${esc(c.id)} · USD ${Number(c.price).toLocaleString()} · ${status}</small></div><div class="item-actions">
    ${has("edit")?`<button class="secondary" onclick="editCar('${esc(c.id)}')">Editar</button>`:""}
    ${has("manageStatus")&&c.status==="available"?`<button onclick="reserveCar('${esc(c.id)}')">Reservar 48h</button><button onclick="sellCar('${esc(c.id)}')">Vendido</button>`:""}
    ${has("manageStatus")&&c.status==="reserved"?`<button onclick="sellCar('${esc(c.id)}')">Vendido</button><button class="secondary" onclick="reopenCar('${esc(c.id)}')">Reabrir</button>`:""}
    ${has("manageStatus")&&c.status==="sold"?`<button class="secondary" onclick="reopenCar('${esc(c.id)}')">Reabrir carro</button>`:""}
    ${has("delete")?`<button class="danger" onclick="removeCar('${esc(c.id)}')">Eliminar</button>`:""}</div></div>`;
  }).join("")||"<p>Nenhum carro publicado.</p>";
}

$("carForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!has("publish")&&!$("editId").value)return;
  readCars();const id=$("editId").value;
  const base={brand:$("brand").value.trim(),model:$("model").value.trim(),body:$("body").value,price:+$("price").value,year:+$("year").value,km:+$("km").value,discount:+$("discount").value||0,engine:$("engine").value.trim(),trans:$("trans").value.trim(),drive:$("drive").value.trim(),wheel:$("wheel").value.trim(),image:$("image").value.trim()};
  if(id){const old=getCar(id);if(!has("edit")){alert("Sem permissão para editar.");return;}Object.assign(old,base);}
  else cars.unshift({id:"DRV"+Date.now(),...base,status:"available",createdAt:Date.now()});
  saveCars();resetCarForm();draw();alert(id?"Carro atualizado.":"Carro publicado.");
});
function editCar(id){if(!has("edit"))return;const c=getCar(id);if(!c)return;for(const k of ["brand","model","body","price","year","km","discount","engine","trans","drive","wheel","image"])if($(k))$(k).value=c[k]??"";$("editId").value=c.id;$("saveCarBtn").textContent="Guardar alterações";window.scrollTo({top:0,behavior:"smooth"});}
function resetCarForm(){$("carForm")?.reset();$("editId").value="";$("saveCarBtn").textContent="Publicar carro";}
function reserveCar(id){if(!has("manageStatus"))return;readCars();const c=getCar(id);if(!c)return;c.status="reserved";c.reservedAt=Date.now();c.reservedUntil=Date.now()+48*60*60*1000;saveCars();draw();}
function sellCar(id){if(!has("manageStatus"))return;readCars();const c=getCar(id);if(!c)return;c.status="sold";c.reservedAt=null;c.reservedUntil=null;saveCars();draw();}
function reopenCar(id){if(!has("manageStatus"))return;readCars();const c=getCar(id);if(!c)return;c.status="available";c.reservedAt=null;c.reservedUntil=null;saveCars();draw();}
function removeCar(id){if(!has("delete"))return;if(!confirm("Eliminar este anúncio?"))return;readCars();cars=cars.filter(c=>c.id!==id);saveCars();draw();}

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
    const owner=(a.email||"").toLowerCase()==="nelswaguan@gmail.com";
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
  const {data,error}=await sb().auth.signUp({email,password:pass,options:{data:{name}}});
  if(error){
    if(button){button.disabled=false;button.textContent="Aceitar convite e criar conta";}
    msg.textContent=error.message;return;
  }
  localStorage.setItem("drivePendingAdminInvite",token);
  if(data.session){
    const result=await claimInvite(token);
    if(result){location.replace("admin.html");return;}
  }
  if(button){button.disabled=false;button.textContent="Aceitar convite e criar conta";}
  msg.textContent="Conta criada. Se o Supabase pedir confirmação por email, confirma primeiro e depois entra novamente nesta página para concluir o convite.";
  showLoginAfterInvite();
}

async function claimInvite(token){
  const {data,error}=await sb().rpc("accept_admin_invite",{p_token:token});
  if(error){alert("Não foi possível concluir o convite: "+error.message);return false;}
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
  if(params.get("invite")){
    $("loginScreen")?.classList.remove("hidden");
    $("setupBox")?.classList.add("hidden");$("loginBox")?.classList.add("hidden");$("inviteAccess")?.classList.remove("hidden");
    $("inviteInfo").textContent="Este convite foi enviado pelo WhatsApp. Cria a tua conta para receber o acesso de administrador.";
    return;
  }
  currentAdminUser=await window.requireAdmin();
  if(currentAdminUser) await init();
  await tryPendingInvite();
  setInterval(()=>{if(currentAdminUser){draw();drawAdmins();}},5000);
});
