// ── ADMIN STATE ──
let prods = [], cats = [];

// ── SIDEBAR MOBILE ──
function openAdminSidebar() {
  document.getElementById('adminAside').classList.add('open');
  document.getElementById('adminSidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAdminSidebar() {
  document.getElementById('adminAside').classList.remove('open');
  document.getElementById('adminSidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── TABS ──
function setAdminTab(tab) {
  document.querySelectorAll('.apanel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.amitem').forEach(i => i.classList.remove('on'));
  document.getElementById('ap-' + tab).classList.add('on');
  const activeMenu = document.querySelector(`.amitem[data-tab="${tab}"]`);
  if (activeMenu) activeMenu.classList.add('on');
  const titles = {
    resumen: 'Resumen', venta: 'Registrar Venta', historial: 'Historial de Ventas',
    productos: 'Catálogo de Productos', addprod: 'Agregar Producto',
    clientes: 'Clientes', categorias: 'Gestión de Categorías',
    canjes: 'Premios & Canjes de Puntos'
  };
  document.getElementById('adminTabTitle').textContent = titles[tab] || tab;
  if (tab === 'historial') loadHistory();
  if (tab === 'productos') loadProductsTable();
  if (tab === 'clientes') loadClients();
  if (tab === 'resumen') loadStats();
  if (tab === 'categorias') loadCats();
  if (tab === 'canjes') loadRewards();
}

// ── STATS ──
async function loadStats() {
  try {
    const [sR, cR] = await Promise.all([
      fetch(`${SB}/pn_sales?select=*&order=created_at.desc`, { headers: HG }),
      fetch(`${SB}/pn_users?role=eq.client&select=id`, { headers: HG })
    ]);
    if (!sR.ok || !cR.ok) throw new Error('fetch error');
    const sales = await sR.json(), clients = await cR.json();
    let inc = 0, cost = 0, pts = 0;
    sales.forEach(s => { inc += Number(s.sale_price) || 0; cost += Number(s.cost_price) || 0; pts += Number(s.points_given) || 0; });
    document.getElementById('stIncome').textContent = 'S/ ' + inc.toFixed(2);
    document.getElementById('stCost').textContent = 'S/ ' + cost.toFixed(2);
    document.getElementById('stProfit').textContent = 'S/ ' + (inc - cost).toFixed(2);
    document.getElementById('stClients').textContent = clients.length;
    document.getElementById('stSales').textContent = sales.length;
    document.getElementById('stPts').textContent = pts;
    document.getElementById('stPtsVal').textContent = 'S/ ' + (pts * 0.1).toFixed(2);
    const rb = document.getElementById('recentSales');
    rb.innerHTML = sales.slice(0, 10).map(s => {
      const profit = (Number(s.sale_price) - Number(s.cost_price)).toFixed(2);
      return `<tr><td style="color:var(--mu);font-size:.78rem">${new Date(s.created_at).toLocaleDateString('es-PE')}</td><td><strong>${s.client_username}</strong></td><td>${s.service_name}</td><td style="color:var(--sp)">S/ ${Number(s.sale_price).toFixed(2)}</td><td style="color:var(--go)">S/ ${profit}</td><td><span class="tag tag-y">+${s.points_given}</span></td></tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--mu);padding:1.5rem">Sin ventas aún</td></tr>';
  } catch (e) {
    console.error('loadStats error:', e);
    document.getElementById('recentSales').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1.5rem"><span style="color:#ff6b6b">Error al cargar datos.</span> <button onclick="loadStats()" style="background:var(--ac);color:#fff;border:none;padding:.35rem .8rem;border-radius:6px;cursor:pointer;margin-left:.5rem">Reintentar</button></td></tr>';
  }
}

async function loadHistory() {
  const r = await fetch(`${SB}/pn_sales?select=*&order=created_at.desc`, { headers: HG });
  const sales = await r.json();
  const b = document.getElementById('salesBody');
  b.innerHTML = sales.length ? sales.map(s => {
    const profit = (Number(s.sale_price) - Number(s.cost_price)).toFixed(2);
    return `<tr><td style="color:var(--mu);font-size:.78rem">${new Date(s.created_at).toLocaleDateString('es-PE')}</td><td><strong>${s.client_username}</strong></td><td>${s.service_name}</td><td style="color:var(--sp)">S/ ${Number(s.sale_price).toFixed(2)}</td><td style="color:var(--mu)">S/ ${Number(s.cost_price).toFixed(2)}</td><td style="color:var(--go)">S/ ${profit}</td><td><span class="tag tag-y">+${s.points_given}</span></td><td style="color:var(--mu);font-size:.78rem">${s.notes || ''}</td></tr>`;
  }).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--mu);padding:2rem">Sin ventas</td></tr>';
}

async function loadClients() {
  const r = await fetch(`${SB}/pn_users?role=eq.client&select=*&order=created_at.desc`, { headers: HG });
  const cls = await r.json();
  const b = document.getElementById('clientsBody');
  b.innerHTML = cls.length ? cls.map(c => `<tr><td><strong>${c.username}</strong></td><td style="color:var(--mu)">${c.phone || '—'}</td><td><span class="tag tag-y">★ ${c.points}</span></td><td style="color:var(--mu);font-size:.78rem">${c.referred_by ? '✓ Sí' : '—'}</td><td style="font-family:monospace;font-size:.78rem;color:var(--go)">${c.referral_code || '—'}</td><td style="color:var(--mu);font-size:.78rem">${new Date(c.created_at).toLocaleDateString('es-PE')}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--mu);padding:2rem">Sin clientes</td></tr>';
}

// ── PRODUCTS ──
async function loadProdsDropdown() {
  const r = await fetch(`${SB}/pn_products?active=eq.true&select=*&order=category,name`, { headers: HG });
  if (!r.ok) return;
  prods = await r.json();
  const sel = document.getElementById('apProduct');
  if (!sel) return;
  const groups = {};
  prods.forEach(p => { if (!groups[p.category]) groups[p.category] = []; groups[p.category].push(p); });
  sel.innerHTML = '<option value="">— Selecciona servicio —</option>';
  Object.keys(groups).forEach(cat => {
    const og = document.createElement('optgroup');
    const catObj = cats.find(c => c.slug === cat);
    og.label = catObj ? catObj.name : (cat.charAt(0).toUpperCase() + cat.slice(1));
    groups[cat].forEach(p => { const op = document.createElement('option'); op.value = p.id; op.textContent = `${p.name} — S/ ${Number(p.sale_price).toFixed(2)}`; og.appendChild(op); });
    sel.appendChild(og);
  });
  updateProdCatSelect();
}

function fillProduct() {
  const p = prods.find(x => x.id === document.getElementById('apProduct').value);
  if (!p) { ['apSale', 'apCost', 'apProfit'].forEach(id => document.getElementById(id).value = ''); return; }
  document.getElementById('apSale').value = Number(p.sale_price).toFixed(2);
  document.getElementById('apCost').value = Number(p.cost_price).toFixed(2);
  document.getElementById('apProfit').value = 'S/ ' + (p.sale_price - p.cost_price).toFixed(2);
}

function updateProdCatSelect() {
  const sel = document.getElementById('prodCat'); if (!sel) return;
  const cur = sel.value;
  const defaults = [{ slug: 'netflix', name: 'Netflix' }, { slug: 'hbo', name: 'HBO Max' }, { slug: 'disney', name: 'Disney+' }, { slug: 'chatgpt', name: 'ChatGPT' }, { slug: 'canva', name: 'Canva' }, { slug: 'spotify', name: 'Spotify' }, { slug: 'directv', name: 'DirecTV' }, { slug: 'crunchyroll', name: 'Crunchyroll' }, { slug: 'combo', name: 'Combo' }];
  const allCats = cats.length ? cats : defaults;
  sel.innerHTML = allCats.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  if (cur) sel.value = cur;
}

async function loadProductsTable() {
  const r = await fetch(`${SB}/pn_products?select=*&order=category,name`, { headers: HG });
  if (!r.ok) return;
  const ps = await r.json();
  const b = document.getElementById('prodBody');
  b.innerHTML = ps.length ? ps.map(p => {
    const prof = (p.sale_price - p.cost_price).toFixed(2);
    const esc = JSON.stringify(p).replace(/"/g, '&quot;');
    return `<tr><td><span class="tag" style="background:rgba(255,255,255,.05);color:var(--mu)">${p.category}</span></td><td><strong>${p.name}</strong><div style="font-size:.72rem;color:var(--mu)">${p.description || ''}</div></td><td style="color:var(--sp)">S/ ${Number(p.sale_price).toFixed(2)}</td><td style="color:var(--mu)">S/ ${Number(p.cost_price).toFixed(2)}</td><td style="color:var(--go)"><strong>S/ ${prof}</strong></td><td><span class="tag tag-y">${Math.round(p.sale_price)}</span></td><td style="white-space:nowrap"><button class="btn btn-out btn-sm" style="margin-right:.3rem" onclick='editProd(${esc})'>Editar</button><button class="btn btn-sm" style="background:${p.active ? 'rgba(230,51,41,.15)' : 'rgba(29,185,84,.15)'};color:${p.active ? '#ff6b6b' : '#1DB954'};border:none" onclick="toggleProd('${p.id}',${p.active})">${p.active ? 'Desactivar' : 'Activar'}</button></td></tr>`;
  }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--mu);padding:2rem">Sin productos</td></tr>';
}

function editProd(p) {
  setAdminTab('addprod');
  document.getElementById('prodFormTitle').textContent = 'Editar Producto';
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodCat').value = p.category;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodDesc').value = p.description || '';
  document.getElementById('prodSale').value = p.sale_price;
  document.getElementById('prodCost').value = p.cost_price;
  calcPP();
}

function resetProdForm() {
  document.getElementById('prodId').value = '';
  document.getElementById('prodFormTitle').textContent = 'Agregar Producto';
  ['prodName', 'prodDesc', 'prodSale', 'prodCost'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prodMsg').textContent = ''; calcPP();
  setAdminTab('productos');
}

function calcPP() {
  const s = parseFloat(document.getElementById('prodSale').value) || 0;
  const c = parseFloat(document.getElementById('prodCost').value) || 0;
  const pr = s - c, mg = s > 0 ? ((pr / s) * 100).toFixed(1) : 0;
  document.getElementById('ppProfit').textContent = 'S/ ' + pr.toFixed(2);
  document.getElementById('ppMargin').textContent = mg + '%';
}

async function saveProduct() {
  const id = document.getElementById('prodId').value;
  const body = { category: document.getElementById('prodCat').value, name: document.getElementById('prodName').value.trim(), description: document.getElementById('prodDesc').value.trim(), sale_price: parseFloat(document.getElementById('prodSale').value), cost_price: parseFloat(document.getElementById('prodCost').value), active: true };
  const mE = document.getElementById('prodMsg'); mE.textContent = '';
  if (!body.name || isNaN(body.sale_price) || isNaN(body.cost_price)) { mE.textContent = 'Completa todos los campos'; return; }
  const res = id ? await fetch(`${SB}/pn_products?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) }) : await fetch(`${SB}/pn_products`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (res.ok) { resetProdForm(); await loadProdsDropdown(); }
  else { const e = await res.json(); mE.textContent = 'Error: ' + (e.message || 'intenta de nuevo'); }
}

async function toggleProd(id, active) {
  await fetch(`${SB}/pn_products?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ active: !active }) });
  await Promise.all([loadProdsDropdown(), loadProductsTable()]);
}

// ── CATEGORIES ──
async function loadCats() {
  try {
    const r = await fetch(`${SB}/pn_categories?select=*&order=name`, { headers: HG });
    if (r.ok) { cats = await r.json(); }
    else { cats = getDefaultCats(); }
  } catch (e) { cats = getDefaultCats(); }
  renderCatGrid();
  updateProdCatSelect();
}

function getDefaultCats() {
  return [
    { id: 'netflix', slug: 'netflix', name: 'Netflix', emoji: '🔴', color: '#e50914' },
    { id: 'hbo', slug: 'hbo', name: 'HBO Max', emoji: '🟣', color: '#8B00FF' },
    { id: 'disney', slug: 'disney', name: 'Disney+', emoji: '🔵', color: '#0099e5' },
    { id: 'chatgpt', slug: 'chatgpt', name: 'ChatGPT', emoji: '🤖', color: '#74aa9c' },
    { id: 'canva', slug: 'canva', name: 'Canva', emoji: '🎨', color: '#7D2AE8' },
    { id: 'spotify', slug: 'spotify', name: 'Spotify', emoji: '🎵', color: '#1DB954' },
    { id: 'directv', slug: 'directv', name: 'DirecTV', emoji: '📡', color: '#0099d8' },
    { id: 'crunchyroll', slug: 'crunchyroll', name: 'Crunchyroll', emoji: '🍊', color: '#f47521' },
    { id: 'combo', slug: 'combo', name: 'Combo', emoji: '🔥', color: '#f5a623' }
  ];
}

function renderCatGrid() {
  const g = document.getElementById('catGrid'); if (!g) return;
  if (!cats.length) { g.innerHTML = '<div style="color:var(--mu);font-size:.85rem">No hay categorías.</div>'; return; }
  g.innerHTML = cats.map(c => `
    <div class="cat-card">
      <div class="cat-card-name"><span style="font-size:1.2rem">${c.emoji || '📦'}</span><span style="color:${c.color || 'var(--tx)'}">${c.name}</span><span style="font-size:.68rem;color:var(--mu);font-weight:400">${c.slug}</span></div>
      <div class="cat-card-actions">
        <button class="btn btn-out btn-sm" onclick='editCat(${JSON.stringify(c).replace(/'/g, "&#39;")})'>✏️</button>
        <button class="btn btn-sm" style="background:rgba(230,51,41,.15);color:#ff6b6b;border:none" onclick="deleteCat('${c.id}','${c.name}')">🗑</button>
      </div>
    </div>`).join('');
}

function editCat(c) {
  document.getElementById('catFormTitle').textContent = 'Editar Categoría';
  document.getElementById('catId').value = c.id;
  document.getElementById('catName').value = c.name;
  document.getElementById('catSlug').value = c.slug;
  document.getElementById('catEmoji').value = c.emoji || '';
  document.getElementById('catColor').value = c.color || '';
}
function resetCatForm() {
  document.getElementById('catFormTitle').textContent = 'Nueva Categoría';
  document.getElementById('catId').value = '';
  ['catName', 'catSlug', 'catEmoji', 'catColor'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('catMsg').textContent = '';
}
async function saveCat() {
  const id = document.getElementById('catId').value;
  const name = document.getElementById('catName').value.trim();
  const slug = document.getElementById('catSlug').value.trim().toLowerCase().replace(/\s+/g, '_');
  const emoji = document.getElementById('catEmoji').value.trim();
  const color = document.getElementById('catColor').value.trim();
  const mE = document.getElementById('catMsg'); mE.textContent = '';
  if (!name || !slug) { mE.textContent = 'Nombre y slug son requeridos'; return; }
  const body = { name, slug, emoji: emoji || null, color: color || null };
  try {
    const res = id ? await fetch(`${SB}/pn_categories?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) }) : await fetch(`${SB}/pn_categories`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    if (res.ok) { resetCatForm(); await loadCats(); await loadProdsDropdown(); }
    else { if (id) { const i = cats.findIndex(c => c.id === id); if (i > -1) cats[i] = { ...cats[i], ...body }; } else { cats.push({ id: slug, slug, ...body }); } renderCatGrid(); updateProdCatSelect(); resetCatForm(); }
  } catch (e) { mE.textContent = 'Error al guardar'; }
}
async function deleteCat(id, name) {
  if (!confirm(`¿Eliminar categoría "${name}"?`)) return;
  try {
    await fetch(`${SB}/pn_categories?id=eq.${id}`, { method: 'DELETE', headers: H });
  } catch (e) { }
  cats = cats.filter(c => c.id !== id);
  renderCatGrid(); updateProdCatSelect();
}

// ══════════════════════════════════════════
// ── REWARDS / CANJES CRUD ──
// ══════════════════════════════════════════

// Live preview en el formulario
function liveRewardPreview() {
  const name  = document.getElementById('rewardName').value  || 'Nombre del premio';
  const desc  = document.getElementById('rewardDesc').value  || 'Descripción';
  const pts   = document.getElementById('rewardPts').value   || '0';
  const color = document.getElementById('rewardColor').value || 'var(--go)';
  const emoji = document.getElementById('rewardEmoji').value || '🎁';
  document.getElementById('rpEmoji').textContent   = emoji;
  document.getElementById('rpName').textContent    = name;
  document.getElementById('rpName').style.color    = color;
  document.getElementById('rpDescPrev').textContent = desc;
  document.getElementById('rpPts').innerHTML = `<span style="color:${color}">${pts}</span> <small style="font-size:.65rem;font-family:'Exo 2',sans-serif;color:var(--mu);font-weight:400">pts</small>`;
}

function showRewardForm() {
  resetRewardForm();
  document.getElementById('rewardFormWrap').style.display = 'block';
  document.getElementById('rewardFormWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetRewardForm() {
  document.getElementById('rewardFormTitle').textContent = 'Nuevo Premio';
  document.getElementById('rewardId').value = '';
  document.getElementById('rewardName').value  = '';
  document.getElementById('rewardDesc').value  = '';
  document.getElementById('rewardPts').value   = '';
  document.getElementById('rewardColor').value = '';
  document.getElementById('rewardEmoji').value = '';
  document.getElementById('rewardActive').value = 'true';
  document.getElementById('rewardMsg').textContent = '';
  document.getElementById('rewardFormWrap').style.display = 'none';
  liveRewardPreview();
}

function editReward(r) {
  document.getElementById('rewardFormTitle').textContent = 'Editar Premio';
  document.getElementById('rewardId').value    = r.id;
  document.getElementById('rewardName').value  = r.name    || '';
  document.getElementById('rewardDesc').value  = r.description || '';
  document.getElementById('rewardPts').value   = r.points_required || '';
  document.getElementById('rewardColor').value = r.color   || '';
  document.getElementById('rewardEmoji').value = r.emoji   || '';
  document.getElementById('rewardActive').value = r.active ? 'true' : 'false';
  document.getElementById('rewardMsg').textContent = '';
  document.getElementById('rewardFormWrap').style.display = 'block';
  document.getElementById('rewardFormWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  liveRewardPreview();
}

async function saveReward() {
  const id     = document.getElementById('rewardId').value;
  const name   = document.getElementById('rewardName').value.trim();
  const desc   = document.getElementById('rewardDesc').value.trim();
  const pts    = parseInt(document.getElementById('rewardPts').value);
  const color  = document.getElementById('rewardColor').value.trim();
  const emoji  = document.getElementById('rewardEmoji').value.trim();
  const active = document.getElementById('rewardActive').value === 'true';
  const mE     = document.getElementById('rewardMsg');
  mE.textContent = '';

  if (!name)        { mE.textContent = 'El nombre es requerido'; return; }
  if (isNaN(pts) || pts < 1) { mE.textContent = 'Los puntos deben ser un número mayor a 0'; return; }

  const body = {
    name,
    description: desc || null,
    points_required: pts,
    color: color || null,
    emoji: emoji || null,
    active
  };

  try {
    const res = id
      ? await fetch(`${SB}/pn_rewards?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) })
      : await fetch(`${SB}/pn_rewards`,              { method: 'POST',  headers: H, body: JSON.stringify(body) });

    if (res.ok) {
      resetRewardForm();
      await loadRewards();
    } else {
      const e = await res.json();
      mE.textContent = 'Error: ' + (e.message || 'intenta de nuevo');
    }
  } catch (e) {
    mE.textContent = 'Error de conexión';
  }
}

async function toggleReward(id, active) {
  await fetch(`${SB}/pn_rewards?id=eq.${id}`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ active: !active })
  });
  await loadRewards();
}

async function deleteReward(id, name) {
  if (!confirm(`¿Eliminar el premio "${name}"?\nEsta acción no se puede deshacer.`)) return;
  try {
    await fetch(`${SB}/pn_rewards?id=eq.${id}`, { method: 'DELETE', headers: H });
  } catch (e) { }
  await loadRewards();
}

async function loadRewards() {
  const b = document.getElementById('rewardsBody');
  b.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mu);padding:1.5rem">Cargando...</td></tr>';
  try {
    const r = await fetch(`${SB}/pn_rewards?select=*&order=points_required`, { headers: HG });
    if (!r.ok) throw new Error('fetch');
    const rewards = await r.json();

    if (!rewards.length) {
      b.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mu);padding:2rem">No hay premios todavía. ¡Agrega el primero!</td></tr>';
      return;
    }

    b.innerHTML = rewards.map(rw => {
      const color  = rw.color  || 'var(--go)';
      const emoji  = rw.emoji  || '🎁';
      const active = rw.active !== false; // default true si no existe
      const esc    = JSON.stringify(rw).replace(/"/g, '&quot;');
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:.55rem">
              <span style="font-size:1.2rem">${emoji}</span>
              <strong style="color:${color}">${rw.name}</strong>
            </div>
          </td>
          <td style="color:var(--mu);font-size:.78rem">${rw.description || '—'}</td>
          <td>
            <span style="font-family:'Rajdhani',sans-serif;font-size:1.15rem;font-weight:700;color:${color}">${rw.points_required}</span>
            <span style="font-size:.68rem;color:var(--mu)"> pts</span>
          </td>
          <td>
            <span class="tag ${active ? 'tag-g' : 'tag-r'}">${active ? 'Activo' : 'Inactivo'}</span>
          </td>
          <td style="white-space:nowrap">
            <button class="btn btn-out btn-sm" style="margin-right:.3rem" onclick='editReward(${esc})'>✏️ Editar</button>
            <button class="btn btn-sm" style="background:${active ? 'rgba(230,51,41,.12)' : 'rgba(29,185,84,.12)'};color:${active ? '#ff6b6b' : '#1DB954'};border:none;margin-right:.3rem" onclick="toggleReward('${rw.id}',${active})">${active ? 'Desactivar' : 'Activar'}</button>
            <button class="btn btn-sm" style="background:rgba(230,51,41,.15);color:#ff6b6b;border:none" onclick="deleteReward('${rw.id}','${rw.name.replace(/'/g,"\\'")}')">🗑</button>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    b.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem">
      <span style="color:#ff6b6b">Error al cargar premios.</span>
      <button onclick="loadRewards()" style="background:var(--ac);color:#fff;border:none;padding:.35rem .8rem;border-radius:6px;cursor:pointer;margin-left:.5rem">Reintentar</button>
    </td></tr>`;
  }
}

// ── ADD POINTS ──
async function addPoints() {
  const user = document.getElementById('apUser').value.trim();
  const pid  = document.getElementById('apProduct').value;
  const sale = parseFloat(document.getElementById('apSale').value);
  const cost = parseFloat(document.getElementById('apCost').value);
  const mE   = document.getElementById('apMsg');
  mE.style.color = '#ff6b6b'; mE.textContent = '';

  if (!user || !pid || isNaN(sale) || isNaN(cost)) {
    mE.textContent = 'Selecciona usuario y servicio'; return;
  }

  const prod = prods.find(x => x.id === pid);

  // Buscar cliente
  const cR  = await fetch(`${SB}/pn_users?username=eq.${encodeURIComponent(user)}&select=*`, { headers: HG });
  const cls = await cR.json();
  if (!cls.length) { mE.textContent = 'Cliente no encontrado'; return; }
  const client = cls[0];

  // ── AUTO-DETECTAR si es primera compra ──
  const prevR  = await fetch(`${SB}/pn_sales?client_username=eq.${encodeURIComponent(user)}&select=id&limit=1`, { headers: HG });
  const prev   = await prevR.json();
  const isFirst = prev.length === 0;

  const buyPts = Math.round(sale);
  let bonusPts = 0, notes = '', refMsg = '';

  if (isFirst) {
    bonusPts = 30;
    notes    = 'Primera compra · +30 bienvenida';
    if (client.referred_by) {
      const rR   = await fetch(`${SB}/pn_users?id=eq.${client.referred_by}&select=id,points,username`, { headers: HG });
      const refs = await rR.json();
      if (refs.length) {
        const ref = refs[0];
        await fetch(`${SB}/pn_users?id=eq.${ref.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ points: (ref.points || 0) + 15 }) });
        await fetch(`${SB}/pn_sales`, { method: 'POST', headers: H, body: JSON.stringify({ client_username: ref.username, service_name: 'Bono referido · ' + user, sale_price: 0, cost_price: 0, points_given: 15, notes: 'Referido activado' }) });
        refMsg = ` · ${ref.username} +15pts`;
      }
    }
  }

  const total = (client.points || 0) + buyPts + bonusPts;
  await fetch(`${SB}/pn_users?id=eq.${client.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ points: total }) });
  await fetch(`${SB}/pn_sales`, { method: 'POST', headers: H, body: JSON.stringify({ client_username: user, service_name: prod ? prod.name : 'Servicio', sale_price: sale, cost_price: cost, points_given: buyPts + bonusPts, notes }) });

  mE.style.color = 'var(--sp)';
  mE.textContent = `✓ ${user} tiene ${total} pts (+${buyPts}${bonusPts ? ' +30 bienvenida🎉' : ''})${refMsg}`;

  // Reset form
  document.getElementById('apUser').value    = '';
  document.getElementById('apProduct').value = '';
  ['apSale','apCost','apProfit'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('apFirstBadge').textContent = '—';
  document.getElementById('apFirstBadge').style.color = 'var(--mu)';
  await loadStats();
}

// ── LOGOUT ──
function closeDash() {
  clearS();
  window.location.href = 'index.html';
}

// ── INIT ──
window.addEventListener('DOMContentLoaded', async () => {
  const saved = loadS();
  if (!saved || !saved.isAdmin) { window.location.href = 'index.html'; return; }
  document.getElementById('dashDate').textContent = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // bind live preview inputs
  ['rewardName','rewardDesc','rewardPts','rewardColor','rewardEmoji'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', liveRewardPreview);
  });

  await loadCats();
  await loadStats();
  await loadProdsDropdown();
});

async function checkFirstPurchase() {
  const user  = document.getElementById('apUser').value.trim();
  const badge = document.getElementById('apFirstBadge');
  if (!user) { badge.textContent = '—'; badge.style.color = 'var(--mu)'; return; }
  const r    = await fetch(`${SB}/pn_sales?client_username=eq.${encodeURIComponent(user)}&select=id&limit=1`, { headers: HG });
  const data = await r.json();
  if (data.length === 0) {
    badge.textContent = '🎉 1ra compra';
    badge.style.color = 'var(--go)';
  } else {
    badge.textContent = '✓ Recurrente';
    badge.style.color = 'var(--sp)';
  }
}


// ══════════════════════════════════════════════════════
// PATCH v2: Paleta de colores + image_url en categorías
// Pega este bloque al FINAL de tu admin.js
// ══════════════════════════════════════════════════════

const BRAND_COLORS = [
  { hex: '#e50914', label: 'Netflix' },
  { hex: '#8B00FF', label: 'HBO' },
  { hex: '#0099e5', label: 'Disney+' },
  { hex: '#1DB954', label: 'Spotify' },
  { hex: '#74aa9c', label: 'ChatGPT' },
  { hex: '#7D2AE8', label: 'Canva' },
  { hex: '#0099d8', label: 'DirecTV' },
  { hex: '#f47521', label: 'Crunch' },
  { hex: '#f5a623', label: 'Combo' },
];
const EXTRA_COLORS = [
  '#e63329','#ff6b6b','#ff4500','#ff8c00',
  '#ffd700','#adff2f','#00fa9a','#00ced1',
  '#1e90ff','#7b68ee','#da70d6','#ff69b4',
  '#ffffff','#cccccc','#888888','#333333',
];

function injectPatchCSS() {
  if (document.getElementById('cp-patch-styles')) return;
  const s = document.createElement('style');
  s.id = 'cp-patch-styles';
  s.textContent = `
    .cp-wrap{background:var(--s2);border:1px solid var(--b1);border-radius:8px;padding:.6rem .75rem;margin-top:.35rem;}
    .cp-section-label{font-size:.6rem;text-transform:uppercase;letter-spacing:1px;color:var(--mu);font-weight:700;margin-bottom:.35rem;}
    .cp-row{display:flex;flex-wrap:wrap;gap:.35rem;}
    .cp-swatch{width:54px;height:28px;border-radius:5px;cursor:pointer;position:relative;flex-shrink:0;transition:transform .12s;}
    .cp-swatch:hover{transform:scale(1.1);outline:2px solid rgba(255,255,255,.5);}
    .cp-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.48rem;font-weight:700;color:rgba(255,255,255,.9);text-shadow:0 1px 3px rgba(0,0,0,.8);pointer-events:none;text-align:center;padding:0 2px;}
    .cp-swatch.sm{width:22px;height:22px;}
    .cp-preview-row{display:flex;align-items:center;gap:.5rem;margin-top:.5rem;}
    .cp-preview-box{width:24px;height:24px;border-radius:4px;border:1px solid rgba(255,255,255,.15);flex-shrink:0;}
    .cp-hex-text{font-size:.72rem;color:var(--mu);}
    .img-url-row{margin-top:.35rem;}
    .img-url-row .fi{width:100%;font-size:.8rem;}
    .img-preview-wrap{margin-top:.45rem;display:none;align-items:center;gap:.65rem;background:var(--s2);border:1px solid var(--b1);border-radius:7px;padding:.5rem .75rem;}
    .img-preview-wrap img{width:40px;height:40px;object-fit:contain;border-radius:5px;background:rgba(255,255,255,.06);}
    .img-hint{font-size:.72rem;color:var(--mu);line-height:1.5;}
    .img-err{font-size:.72rem;color:#ff6b6b;margin-top:.3rem;}
    .cat-card-img{width:22px;height:22px;object-fit:contain;border-radius:3px;}
  `;
  document.head.appendChild(s);
}

// ── PALETA ────────────────────────────────────────────
function buildPalette(targetId) {
  if (document.getElementById('palette_' + targetId)) return;
  const brands = BRAND_COLORS.map(c =>
    `<div class="cp-swatch" title="${c.label}" style="background:${c.hex}" onclick="pickColor('${c.hex}','${targetId}')"><span class="cp-label">${c.label}</span></div>`
  ).join('');
  const extras = EXTRA_COLORS.map(c =>
    `<div class="cp-swatch sm" title="${c}" style="background:${c};${c==='#ffffff'?'border:1px solid #666':''}" onclick="pickColor('${c}','${targetId}')"></div>`
  ).join('');
  const html = `<div class="cp-wrap" id="palette_${targetId}">
    <div class="cp-section-label">Marcas</div>
    <div class="cp-row">${brands}</div>
    <div class="cp-section-label" style="margin-top:.5rem">Más colores</div>
    <div class="cp-row">${extras}</div>
    <div class="cp-preview-row">
      <div class="cp-preview-box" id="cpbox_${targetId}"></div>
      <span class="cp-hex-text">Clic en un color · o escribe el hex arriba</span>
    </div>
  </div>`;
  const inp = document.getElementById(targetId);
  if (!inp) return;
  inp.insertAdjacentHTML('afterend', html);
  inp.addEventListener('input', () => updatePreviewBox(targetId));
}

function pickColor(hex, targetId) {
  const inp = document.getElementById(targetId);
  if (inp) { inp.value = hex; inp.dispatchEvent(new Event('input')); }
  updatePreviewBox(targetId);
  if (targetId === 'rewardColor') liveRewardPreview();
}

function updatePreviewBox(targetId) {
  const val = (document.getElementById(targetId) || {}).value || '';
  const box = document.getElementById('cpbox_' + targetId);
  if (box && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) box.style.background = val;
}

// ── CAMPO IMAGE URL para categorías ──────────────────
function buildCatImageField() {
  if (document.getElementById('cat_imgfield')) return;
  const html = `<div id="cat_imgfield" style="margin-top:.75rem;grid-column:1/-1">
    <label class="fl">Imagen / Logo URL</label>
    <input class="fi" id="catImageUrl" placeholder="https://cdn.worldvectorlogo.com/logos/netflix-4.svg" oninput="previewCatImg()">
    <div class="img-preview-wrap" id="catImgPreview">
      <img id="catImgThumb" src="" alt="preview" onerror="catImgError()">
      <div class="img-hint">Vista previa · esta imagen aparecerá en las tabs de servicios</div>
    </div>
    <div class="img-err" id="catImgErr"></div>
  </div>`;

  // Insertar dentro del grid de campos de categoría
  const grid = document.querySelector('#ap-categorias > div > div[style*="grid"]');
  if (grid) grid.insertAdjacentHTML('beforeend', html);
}

function previewCatImg() {
  const url = (document.getElementById('catImageUrl') || {}).value || '';
  const wrap = document.getElementById('catImgPreview');
  const thumb = document.getElementById('catImgThumb');
  const err = document.getElementById('catImgErr');
  if (err) err.textContent = '';
  if (!url) { if (wrap) wrap.style.display = 'none'; return; }
  thumb.src = url;
  wrap.style.display = 'flex';
}

function catImgError() {
  const wrap = document.getElementById('catImgPreview');
  const err = document.getElementById('catImgErr');
  if (wrap) wrap.style.display = 'none';
  if (err) err.textContent = 'No se pudo cargar la imagen. Verifica la URL.';
}

// ── CAMPO IMAGE URL para premios ──────────────────────
function buildRewardImageField() {
  if (document.getElementById('reward_imgfield')) return;
  const html = `<div id="reward_imgfield" style="margin-top:.45rem">
    <div class="cp-section-label">Vista previa de imagen (pega URL)</div>
    <div class="img-url-row">
      <input class="fi" id="rewardImgUrl" placeholder="https://cdn.worldvectorlogo.com/logos/netflix-4.svg" oninput="previewRewardImg()">
    </div>
    <div class="img-preview-wrap" id="rewardImgPreview">
      <img id="rewardImgThumb" src="" alt="preview" onerror="rewardImgError()">
      <div class="img-hint">Vista previa · escribe el emoji arriba 👆</div>
    </div>
    <div class="img-err" id="rewardImgErr"></div>
  </div>`;
  const inp = document.getElementById('rewardEmoji');
  if (!inp) return;
  const parent = inp.closest('.fg');
  if (parent) parent.insertAdjacentHTML('afterend', html);
}

function previewRewardImg() {
  const url = (document.getElementById('rewardImgUrl') || {}).value || '';
  const wrap = document.getElementById('rewardImgPreview');
  const thumb = document.getElementById('rewardImgThumb');
  const err = document.getElementById('rewardImgErr');
  if (err) err.textContent = '';
  if (!url) { if (wrap) wrap.style.display = 'none'; return; }
  thumb.src = url;
  wrap.style.display = 'flex';
}

function rewardImgError() {
  const wrap = document.getElementById('rewardImgPreview');
  const err = document.getElementById('rewardImgErr');
  if (wrap) wrap.style.display = 'none';
  if (err) err.textContent = 'No se pudo cargar la imagen. Verifica la URL.';
}

// ── OVERRIDE saveCat para guardar image_url ───────────
// Reemplaza la función saveCat original
window.saveCat = async function() {
  const id    = document.getElementById('catId').value;
  const name  = document.getElementById('catName').value.trim();
  const slug  = document.getElementById('catSlug').value.trim().toLowerCase().replace(/\s+/g,'_');
  const emoji = document.getElementById('catEmoji').value.trim();
  const color = document.getElementById('catColor').value.trim();
  const imageUrl = (document.getElementById('catImageUrl') || {}).value.trim() || null;
  const mE   = document.getElementById('catMsg'); mE.textContent = '';

  if (!name || !slug) { mE.textContent = 'Nombre y slug son requeridos'; return; }

  const body = { name, slug, emoji: emoji || null, color: color || null, image_url: imageUrl };

  try {
    const res = id
      ? await fetch(`${SB}/pn_categories?id=eq.${id}`, { method: 'PATCH', headers: H, body: JSON.stringify(body) })
      : await fetch(`${SB}/pn_categories`,              { method: 'POST',  headers: H, body: JSON.stringify(body) });

    if (res.ok) {
      resetCatForm();
      await loadCats();
      await loadProdsDropdown();
    } else {
      // fallback local
      if (id) { const i = cats.findIndex(c => c.id === id); if (i > -1) cats[i] = { ...cats[i], ...body }; }
      else { cats.push({ id: slug, slug, ...body }); }
      renderCatGrid(); updateProdCatSelect(); resetCatForm();
    }
  } catch (e) { mE.textContent = 'Error al guardar'; }
};

// ── OVERRIDE editCat para cargar image_url ────────────
window.editCat = function(c) {
  document.getElementById('catFormTitle').textContent = 'Editar Categoría';
  document.getElementById('catId').value    = c.id;
  document.getElementById('catName').value  = c.name;
  document.getElementById('catSlug').value  = c.slug;
  document.getElementById('catEmoji').value = c.emoji || '';
  document.getElementById('catColor').value = c.color || '';
  updatePreviewBox('catColor');
  // Cargar image_url si existe
  const imgInp = document.getElementById('catImageUrl');
  if (imgInp) {
    imgInp.value = c.image_url || '';
    if (c.image_url) previewCatImg();
  }
};

// ── OVERRIDE resetCatForm para limpiar image_url ──────
const _origResetCatForm = window.resetCatForm;
window.resetCatForm = function() {
  _origResetCatForm();
  const imgInp = document.getElementById('catImageUrl');
  if (imgInp) imgInp.value = '';
  const wrap = document.getElementById('catImgPreview');
  if (wrap) wrap.style.display = 'none';
};

// ── OVERRIDE renderCatGrid para mostrar imagen ────────
window.renderCatGrid = function() {
  const g = document.getElementById('catGrid'); if (!g) return;
  if (!cats.length) { g.innerHTML = '<div style="color:var(--mu);font-size:.85rem">No hay categorías.</div>'; return; }
  g.innerHTML = cats.map(c => `
    <div class="cat-card">
      <div class="cat-card-name">
        ${c.image_url
          ? `<img src="${c.image_url}" class="cat-card-img" alt="${c.name}" onerror="this.style.display='none'">`
          : `<span style="font-size:1.2rem">${c.emoji || '📦'}</span>`
        }
        <span style="color:${c.color || 'var(--tx)'}">${c.name}</span>
        <span style="font-size:.68rem;color:var(--mu);font-weight:400">${c.slug}</span>
      </div>
      <div class="cat-card-actions">
        <button class="btn btn-out btn-sm" onclick='editCat(${JSON.stringify(c).replace(/'/g,"&#39;")})'>✏️</button>
        <button class="btn btn-sm" style="background:rgba(230,51,41,.15);color:#ff6b6b;border:none" onclick="deleteCat('${c.id}','${c.name}')">🗑</button>
      </div>
    </div>`).join('');
};

// ── INYECTAR EXTRAS ───────────────────────────────────
function injectCatExtras() {
  injectPatchCSS();
  buildPalette('catColor');
  buildCatImageField();
}

function injectRewardExtras() {
  injectPatchCSS();
  buildPalette('rewardColor');
  buildRewardImageField();
}

(function() {
  const _tab = window.setAdminTab;
  window.setAdminTab = function(tab) {
    _tab(tab);
    if (tab === 'categorias') setTimeout(injectCatExtras, 60);
    if (tab === 'canjes')     setTimeout(injectRewardExtras, 60);
  };
  const _show = window.showRewardForm;
  window.showRewardForm = function() {
    _show();
    setTimeout(injectRewardExtras, 60);
  };
})();
