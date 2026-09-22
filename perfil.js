const supabaseClient = () => window.driveSupabase;

let currentUser = null;
let originalProfile = null;

const $ = (id) => document.getElementById(id);

function show(id) { $(id)?.classList.remove("hidden"); }
function hide(id) { $(id)?.classList.add("hidden"); }

function setMessage(text, type = "info") {
  const box = $("message");
  if (!box) return;
  box.textContent = text;
  box.className = `message ${type}`;
  box.classList.remove("hidden");
}

function clearMessage() {
  $("message")?.classList.add("hidden");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit", month: "long", year: "numeric"
  }).format(date);
}

function setEditing(enabled) {
  $("profileName").disabled = !enabled;
  $("profilePhone").disabled = !enabled;
  $("editActions").classList.toggle("hidden", !enabled);
  $("editBtn").classList.toggle("hidden", enabled);
  if (enabled) $("profileName").focus();
}

function fillProfile(profile, user) {
  const name = profile?.name || user?.user_metadata?.name || "Cliente";
  const phone = profile?.phone || user?.user_metadata?.phone || "";
  const email = user?.email || profile?.email || "";

  $("profileName").value = name;
  $("profilePhone").value = phone;
  $("profileEmail").value = email;
  $("profileCreated").textContent = formatDate(profile?.created_at || user?.created_at);

  $("profileTitle").textContent = name;
  $("profileSubtitle").textContent = email || "Os teus dados pessoais";

  originalProfile = { name, phone, email };
}

async function loadProfile(user) {
  if (!user || !supabaseClient()) return;

  currentUser = user;

  let { data: profile, error } = await supabaseClient()
    .from("profiles")
    .select("id,name,phone,email,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar perfil:", error);
    // Still show the authentication data if the profiles table has a problem.
    fillProfile({
      name: user.user_metadata?.name || "Cliente",
      phone: user.user_metadata?.phone || "",
      email: user.email || "",
      created_at: user.created_at
    }, user);
    setMessage("Não foi possível carregar todos os dados do perfil. Os dados básicos da conta continuam disponíveis.", "error");
  } else {
    if (!profile) {
      const fallback = {
        id: user.id,
        name: user.user_metadata?.name || "Cliente",
        phone: user.user_metadata?.phone || "",
        email: user.email || ""
      };

      const result = await supabaseClient()
        .from("profiles")
        .upsert(fallback, { onConflict: "id" })
        .select("id,name,phone,email,created_at,updated_at")
        .single();

      if (!result.error) profile = result.data;
      else profile = { ...fallback, created_at: user.created_at };
    }

    fillProfile(profile, user);
  }

  hide("loadingState");
  hide("loginState");
  show("profileContent");
}

async function init() {
  if (!supabaseClient()) {
    hide("loadingState");
    show("loginState");
    return;
  }

  const { data, error } = await supabaseClient().auth.getSession();

  if (error || !data?.session?.user) {
    hide("loadingState");
    show("loginState");
    return;
  }

  await loadProfile(data.session.user);

  supabaseClient().auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session?.user) {
      currentUser = null;
      hide("profileContent");
      hide("loadingState");
      show("loginState");
    }
  });
}

$("editBtn")?.addEventListener("click", () => {
  clearMessage();
  setEditing(true);
});

$("cancelBtn")?.addEventListener("click", () => {
  if (originalProfile) {
    $("profileName").value = originalProfile.name;
    $("profilePhone").value = originalProfile.phone;
  }
  clearMessage();
  setEditing(false);
});

$("profileForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !supabaseClient()) return;

  const name = $("profileName").value.trim();
  const phone = $("profilePhone").value.trim();

  if (name.length < 2) {
    setMessage("Introduz um nome válido.", "error");
    return;
  }

  if (phone && phone.length < 7) {
    setMessage("Introduz um número de telefone válido.", "error");
    return;
  }

  const saveBtn = $("saveBtn");
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A guardar...';

  const { data, error } = await supabaseClient()
    .from("profiles")
    .upsert({
      id: currentUser.id,
      name,
      phone,
      email: currentUser.email || originalProfile?.email || ""
    }, { onConflict: "id" })
    .select("id,name,phone,email,created_at,updated_at")
    .single();

  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Guardar alterações';

  if (error) {
    console.error(error);
    setMessage("Não foi possível guardar as alterações. Verifica se a tabela profiles e as políticas do Supabase estão configuradas.", "error");
    return;
  }

  // Keep Auth metadata synchronized with the profile data used by the header.
  await supabaseClient().auth.updateUser({
    data: { name, phone }
  });

  fillProfile(data, currentUser);
  setEditing(false);
  setMessage("Perfil atualizado com sucesso.", "success");
});

$("passwordForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !supabaseClient()) return;

  const password = $("newPassword").value;
  const confirm = $("confirmPassword").value;

  if (password.length < 8) {
    setMessage("A nova palavra-passe deve ter pelo menos 8 caracteres.", "error");
    return;
  }

  if (password !== confirm) {
    setMessage("As palavras-passe não coincidem.", "error");
    return;
  }

  const button = event.submitter;
  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A atualizar...';

  const { error } = await supabaseClient().auth.updateUser({ password });

  button.disabled = false;
  button.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Alterar palavra-passe';

  if (error) {
    setMessage(error.message || "Não foi possível alterar a palavra-passe.", "error");
    return;
  }

  $("passwordForm").reset();
  setMessage("Palavra-passe alterada com sucesso.", "success");
});

document.querySelectorAll(".show-pass").forEach((button) => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.innerHTML = isPassword
      ? '<i class="fa-regular fa-eye-slash"></i>'
      : '<i class="fa-regular fa-eye"></i>';
  });
});

$("logoutBtn")?.addEventListener("click", async () => {
  if (!supabaseClient()) {
    location.href = "index.html";
    return;
  }

  $("logoutBtn").disabled = true;
  const { error } = await supabaseClient().auth.signOut();

  if (error) {
    $("logoutBtn").disabled = false;
    setMessage("Não foi possível terminar a sessão. Tenta novamente.", "error");
    return;
  }

  location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", init);


// ===== ELIMINAR A PRÓPRIA CONTA =====
document.addEventListener("DOMContentLoaded", () => {
  const deleteModal = $("deleteConfirmModal");
  const deleteAccountBtn = $("deleteAccountBtn");
  const confirmDelete = $("confirmDelete");
  const cancelDelete = $("cancelDelete");
  const closeDeleteModal = $("closeDeleteModal");

  function closeDeleteAccountModal() {
    deleteModal?.classList.add("hidden");
  }

  deleteAccountBtn?.addEventListener("click", () => {
    clearMessage();
    deleteModal?.classList.remove("hidden");
  });

  cancelDelete?.addEventListener("click", closeDeleteAccountModal);
  closeDeleteModal?.addEventListener("click", closeDeleteAccountModal);
  deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) closeDeleteAccountModal();
  });

  confirmDelete?.addEventListener("click", async () => {
    if (!currentUser || !supabaseClient()) {
      setMessage("A sessão não está disponível. Entra novamente e tenta outra vez.", "error");
      return;
    }

    confirmDelete.disabled = true;
    confirmDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A eliminar...';

    const { error } = await supabaseClient().rpc("delete_my_account");

    if (error) {
      console.error("Erro ao eliminar conta:", error);
      confirmDelete.disabled = false;
      confirmDelete.innerHTML = '<i class="fa-solid fa-trash"></i> Sim, eliminar';
      closeDeleteAccountModal();
      setMessage("Não foi possível eliminar a conta: " + (error.message || "erro desconhecido"), "error");
      return;
    }

    await supabaseClient().auth.signOut();
    location.replace("index.html");
  });
});
