// ── CLIENT STATE ──
let me = null, cats = [], clientProds = [], curCSvc = 'netflix';

// REWARDS ya no es un array estático — se carga desde pn_rewards

// ── SIDEBAR ──
function openSidebar() {
  document.getElementById('cSidebar').classList.add('open');
  document.getElementById('cSidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('cSidebar').classList.remove('open');
  document.getElementById('cSidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function syncSidebar(tab) {
  document.querySelectorAll('.csb-item[id^="csb-"]').forEach(el => el.classList.remove('on'));
  const el = document.getElementById('csb-' + tab);
  if (el) el.classList.add('on');
}

// ── TABS ──
function setCTab(tab) {
  document.querySelectorAll('.client-panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.cnav-item').forEach(i => i.classList.remove('on'));
  document.getElementById('cp-' + tab).classList.add('on');
  const navEl = document.querySelector(`.cnav-item[data-tab="${tab}"]`);
  if (navEl) navEl.classList.add('on');
  syncSidebar(tab);
  if (tab === 'servicios' && clientProds.length) renderClientSvc(curCSvc);
}

// ── LOAD CATEGORIES ──
async function loadCats() {
  try {
    const r = await fetch(`${SB}/pn_categories?select=*&order=name`, { headers: HG });
    if (r.ok) { cats = await r.json(); }
    else { cats = []; }
  } catch (e) { cats = []; }
}

// ── LOAD SERVICES ──
async function loadClientSvcs() {
  const r = await fetch(`${SB}/pn_products?active=eq.true&select=*&order=category,name`, { headers: HG });
  if (!r.ok) return;
  clientProds = await r.json();
  const groups = {};
  clientProds.forEach(p => { if (!groups[p.category]) groups[p.category] = []; groups[p.category].push(p); });
  const tabsEl = document.getElementById('cSvcTabs'); if (!tabsEl) return;
  tabsEl.innerHTML = '';
  const catKeys = Object.keys(groups);
  catKeys.forEach((cat, i) => {
    const catObj = cats.find(c => c.slug === cat);
    const label = catObj ? `${catObj.emoji || ''}${catObj.name}` : (cat.charAt(0).toUpperCase() + cat.slice(1));
    const tab = document.createElement('div');
    tab.className = 'stab' + (i === 0 ? ' on' : '');
    tab.setAttribute('data-cs', cat);
    tab.textContent = label;
    tab.onclick = () => { setCTab('servicios'); renderClientSvc(cat); };
    tabsEl.appendChild(tab);
  });
  if (catKeys.length) renderClientSvc(catKeys[0]);
}

function renderClientSvc(cat) {
  document.querySelectorAll('#cSvcTabs .stab').forEach(t => { t.classList.toggle('on', t.getAttribute('data-cs') === cat); });
  curCSvc = cat;
  const catProds = clientProds.filter(p => p.category === cat);
  const catObj = cats.find(c => c.slug === cat);
  const color = catObj ? (catObj.color || 'var(--ac)') : 'var(--ac)';
  const grid = document.getElementById('cSvcGrid');
  grid.innerHTML = catProds.map(c => `
    <div class="pcard" data-s="${cat}">
      <span class="pbadge" style="background:${color}22;color:${color}">${catObj ? (catObj.emoji || '') + catObj.name : cat}</span>
      <div class="pname">${c.name}</div>
      <div class="pdesc">${c.description || ''}</div>
      <div class="pprice"><span class="cy">S/</span><span class="am">${Number(c.sale_price).toFixed(2)}</span><span class="pe">/mes</span></div>
      <div class="ppts">Gana ${Math.round(c.sale_price)} puntos</div>
      <a href="https://wa.me/${WA}?text=Hola%2C%20soy%20${encodeURIComponent(me ? me.username : 'cliente')}%2C%20quiero%20${encodeURIComponent(c.name)}%20S%2F${Number(c.sale_price).toFixed(2)}" target="_blank" class="pbuy">Comprar por WhatsApp</a>
    </div>`).join('') || '<div style="color:var(--mu);font-size:.85rem;padding:1rem">Sin productos en esta categoría.</div>';
}

// ── REWARDS (dinámico desde pn_rewards) ──
async function loadAndRenderRewards() {
  const grid = document.getElementById('cRewardGrid');
  const pts = me.points || 0;

  // Skeleton mientras carga
  grid.innerHTML = `
    <div style="color:var(--mu);font-size:.82rem;padding:.5rem 0;grid-column:1/-1">Cargando premios...</div>
  `;

  try {
    const r = await fetch(`${SB}/pn_rewards?active=eq.true&select=*&order=points_required`, { headers: HG });

    if (!r.ok) throw new Error('fetch');
    const rewards = await r.json();

    if (!rewards.length) {
      grid.innerHTML = `<div style="color:var(--mu);font-size:.82rem;grid-column:1/-1;padding:.5rem 0">No hay premios disponibles por ahora.</div>`;
      return;
    }

    grid.innerHTML = rewards.map(rw => {
      const color = rw.color  || 'var(--go)';
      const emoji = rw.emoji  || '🎁';
      const ok    = pts >= rw.points_required;
      const diff  = rw.points_required - pts;
      return `
        <div class="rcard${ok ? ' can' : ''}">
          <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.25rem">
            <span style="font-size:1.1rem">${emoji}</span>
            <div class="rcard-name" style="color:${color}">${rw.name}</div>
          </div>
          ${rw.description ? `<div style="font-size:.72rem;color:var(--mu);margin-bottom:.3rem">${rw.description}</div>` : ''}
          <div class="rcard-pts" style="color:${color}">${rw.points_required} <small>pts</small></div>
          <div class="rcard-status ${ok ? 'ok' : 'no'}">
            ${ok
              ? '✓ ¡Puedes canjear!'
              : `Faltan ${diff} pts`
            }
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    // Fallback al array estático si falla la DB
    const REWARDS_FALLBACK = [
      { name: 'Crunchyroll Perfil', points_required: 50,  color: 'var(--cr)', emoji: '🍊' },
      { name: 'HBO Max Perfil',     points_required: 50,  color: 'var(--hb)', emoji: '🟣' },
      { name: 'Disney+ Perfil',     points_required: 60,  color: 'var(--ds)', emoji: '🔵' },
      { name: 'Netflix Perfil',     points_required: 100, color: 'var(--nf)', emoji: '🔴' },
      { name: 'Spotify Individual', points_required: 150, color: 'var(--sp)', emoji: '🎵' },
      { name: 'ChatGPT Go',         points_required: 200, color: 'var(--gp)', emoji: '🤖' },
    ];
    grid.innerHTML = REWARDS_FALLBACK.map(rw => {
      const ok   = pts >= rw.points_required;
      const diff = rw.points_required - pts;
      return `
        <div class="rcard${ok ? ' can' : ''}">
          <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.25rem">
            <span style="font-size:1.1rem">${rw.emoji || '🎁'}</span>
            <div class="rcard-name" style="color:${rw.color}">${rw.name}</div>
          </div>
          <div class="rcard-pts" style="color:${rw.color}">${rw.points_required} <small>pts</small></div>
          <div class="rcard-status ${ok ? 'ok' : 'no'}">${ok ? '✓ ¡Puedes canjear!' : 'Faltan ' + diff + ' pts'}</div>
        </div>`;
    }).join('');
  }
}

// ── HISTORY ──
async function loadCHist() {
  const r = await fetch(`${SB}/pn_sales?client_username=eq.${encodeURIComponent(me.username)}&select=*&order=created_at.desc`, { headers: HG });
  const hist = await r.json();
  document.getElementById('cHistBody').innerHTML = hist.length ? hist.map(h => `<tr><td style="color:var(--mu);font-size:.78rem">${new Date(h.created_at).toLocaleDateString('es-PE')}</td><td>${h.service_name}</td><td><span class="tag tag-y">+${h.points_given} pts</span></td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--mu);padding:2rem">Sin historial aún</td></tr>';
}

// ── COPY CODE ──
function copyCode() {
  const code = document.getElementById('cRefCode').textContent;
  if (code === '—') return;
  navigator.clipboard.writeText(code).then(() => {
    const el = document.getElementById('cRefCode'), orig = el.textContent;
    el.textContent = '¡Copiado!'; setTimeout(() => el.textContent = orig, 1500);
  });
}

// ── LOGOUT ──
function closeDash() {
  clearS();
  window.location.href = 'index.html';
}

// ── INIT ──
window.addEventListener('DOMContentLoaded', async () => {
  const saved = loadS();
  if (!saved || saved.isAdmin) { window.location.href = 'index.html'; return; }
  try {
    const r = await fetch(`${SB}/pn_users?id=eq.${saved.id}&select=*`, { headers: HG });
    const d = await r.json();
    if (!d.length) { clearS(); window.location.href = 'index.html'; return; }
    me = d[0]; saveS(me);
  } catch (e) { clearS(); window.location.href = 'index.html'; return; }

  // Fill UI
  document.getElementById('clientUsername').textContent = me.username;
  document.getElementById('clientPts').textContent = me.points || 0;
  document.getElementById('cPtsBig').textContent = me.points || 0;
  document.getElementById('cRefCode').textContent = me.referral_code || '—';
  document.getElementById('canjearLink').href = `https://wa.me/${WA}?text=Hola%2C%20soy%20${encodeURIComponent(me.username)}%20y%20quiero%20canjear%20mis%20puntos%20(tengo%20${me.points || 0}%20pts)`;
  const initials = (me.username || '?').charAt(0).toUpperCase();
  document.getElementById('csbAvatar').textContent = initials;
  document.getElementById('csbUsername').textContent = me.username;
  document.getElementById('csbPts').textContent = me.points || 0;
  syncSidebar('puntos');

  // Carga en paralelo
  await Promise.all([
    loadAndRenderRewards(),
    loadCats().then(() => loadClientSvcs()),
    loadCHist()
  ]);
});
