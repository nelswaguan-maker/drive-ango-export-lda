const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://shetxacvyexxbyrniyhg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0nfI_Fm2AAjDmlNRCgBnkA_tWrZ3daj';

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function absoluteImage(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  try { const u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; }
}

module.exports = async (req, res) => {
  const id = String(req.query?.id || '').trim();
  const baseHtml = fs.readFileSync(path.join(process.cwd(), 'detalhes.html'), 'utf8');
  if (!id) return res.status(200).setHeader('Content-Type','text/html; charset=utf-8').send(baseHtml);

  let car = null;
  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/drive_cars?select=*&id=eq.${encodeURIComponent(id)}&published=eq.true&limit=1`;
    const r = await fetch(endpoint, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (r.ok) {
      const rows = await r.json();
      car = Array.isArray(rows) ? rows[0] : null;
    }
  } catch (_) {}

  const title = car ? `${car.brand || 'DRIVE'} ${car.model || ''}`.trim() : 'DRIVE Global Car Market';
  const image = absoluteImage(car?.image || (Array.isArray(car?.images) ? car.images[0] : ''));
  const stock = car?.stock || car?.id || '';
  const price = car?.price != null ? ` — ${Number(car.price).toLocaleString('en-US')} USD` : '';
  const description = car ? `${title} — ${car.year || ''}${price} · Stock ${stock}`.trim() : 'Anúncio de veículo na DRIVE Global Car Market';
  const slug = [car?.brand, car?.model, car?.year].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' e ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-+/g,'-') || String(id);
  const publicUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/detalhes.html?id=${encodeURIComponent(String(car.id))}`;

  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)} — DRIVE Global Car Market</title>`);
  html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${esc(description)}">`);
  html = html.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${esc(title)}">`);
  html = html.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${esc(description)}">`);
  html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${esc(publicUrl)}">`);
  if (image) html = html.replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${esc(image)}">`);
  html = html.replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${esc(title)}">`);
  html = html.replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${esc(description)}">`);
  if (image) html = html.replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${esc(image)}">`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.status(200).send(html);
};
