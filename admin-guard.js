window.requireAdmin = async function(){
  const sb = window.driveSupabase;
  if(!sb){
    alert("O acesso online ainda não foi configurado.");
    return null;
  }
  const {data:{session}} = await sb.auth.getSession();
  const user = session?.user;
  if(!user){
    alert("Inicia sessão para entrar na Administração.");
    return null;
  }

  const email = String(user.email||"").trim().toLowerCase();
  const isOwner = email === "nelswaguan@gmail.com";
  if(isOwner) return user;

  const {data:allowed,error:rpcError}=await sb.rpc("is_current_user_admin");
  if(rpcError || allowed!==true){
    alert("Esta conta não tem acesso ao painel de Administração.");
    return null;
  }
  return user;
};
window.isAdminUser=async function(){ return !!(await window.requireAdmin()); };
