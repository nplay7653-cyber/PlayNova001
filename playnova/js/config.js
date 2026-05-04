// ── CONFIG ──
const SB = 'https://kyqzsnugnvnucxfymrwu.supabase.co/rest/v1';
const KEY = 'sb_publishable_04dv96Cr06MtNRxSObmpHQ_HwZkIdYZ';
const WA = '51924606154';
const H = { 'Content-Type': 'application/json', apikey: KEY, Authorization: 'Bearer ' + KEY, Prefer: 'return=representation' };
const HG = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// ── SESSION ──
function saveS(u) { try { localStorage.setItem('pn_s', JSON.stringify(u)); } catch (e) { } }
function loadS() { try { const s = localStorage.getItem('pn_s'); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function clearS() { try { localStorage.removeItem('pn_s'); } catch (e) { } }

// ── UTILS ──
function genCode(u) { return 'NP' + u.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) + Math.random().toString(36).slice(2, 5).toUpperCase(); }

function toggleEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}
