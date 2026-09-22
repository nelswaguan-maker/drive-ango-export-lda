// Configuração pública do Supabase para o Drive Cars.
// NÃO coloque aqui nenhuma sb_secret_ / Service Role Key.
const SUPABASE_URL = "https://shetxacvyexxbyrniyhg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0nfI_Fm2AAjDmlNRCgBnkA_tWrZ3daj";

if (window.supabase && SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) {
  window.driveSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
