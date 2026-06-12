/**
 * LKWD Café Solna — Admin JS (v2)
 * Kopplar frontend mot lkwd-backend via JWT-autentisering.
 *
 * Ersätter <script>-blocket i cafe-solna-demo/index.html
 *
 * API_BASE pekar mot din Railway/Render-URL i produktion.
 * I development: kör servern lokalt på port 3000.
 */

document.getElementById('yr').textContent = new Date().getFullYear();

// ── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = 'https://lkwd-backend-production.up.railway.app'; // byt vid ny deploy

// ── TOKEN STORAGE ─────────────────────────────────────────────────────────
const TOKEN_KEY = 'lkwd_admin_token';

function getToken()            { return sessionStorage.getItem(TOKEN_KEY); }
function setToken(t)           { sessionStorage.setItem(TOKEN_KEY, t); }
function clearToken()          { sessionStorage.removeItem(TOKEN_KEY); }
function isLoggedIn()          { return !!getToken(); }

// ── AUTH HEADERS ─────────────────────────────────────────────────────────
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

// ── API HELPERS ───────────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body)
  });
  if (res.status === 401) { clearToken(); showAdminLogin(); throw new Error('Session utgången'); }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `PUT ${path} → ${res.status}`); }
  return res.json();
}

async function apiLogin(password) {
  const res = await fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) throw new Error('Fel lösenord');
  return res.json();
}

// ── LOAD DATA FROM API ────────────────────────────────────────────────────
async function apiLoad() {
  try {
    const data = await apiGet('/api/cafe');
    if (data.lunch) {
      const ld = document.getElementById('lunchDesc');
      const lp = document.getElementById('lunchPrice');
      if (ld) ld.innerText = data.lunch.description;
      if (lp) lp.innerText = data.lunch.price;
    }
    if (data.reviews) updateReviews(data.reviews);
    if (data.badges) { badges = data.badges; renderAllBadges(); }
  } catch (e) {
    console.info('API ej tillgängligt, använder localStorage:', e.message);
    // Fallback: badges från localStorage laddas av initBadges()
  }
}

// ── DOM HELPERS ────────────────────────────────────────────────────────────
function updateReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid || !reviews) return;
  grid.innerHTML = reviews.map(r =>
    `<div class="review-card">
      <div class="review-stars">★★★★★</div>
      <div class="review-text">"${r.text}"</div>
      <div class="review-name">– ${r.name}</div>
      <div class="review-title">${r.title}</div>
    </div>`
  ).join('');
}

// ── MOBILE MENU ────────────────────────────────────────────────────────────
const menuBtn    = document.getElementById('mobileMenuBtn');
const navLinksEl = document.getElementById('navLinks');
if (menuBtn) menuBtn.addEventListener('click', () => navLinksEl.classList.toggle('active'));
if (navLinksEl) navLinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinksEl.classList.remove('active')));

// ── CONTACT FORM ──────────────────────────────────────────────────────────
const cafeForm    = document.querySelector('.contact-form form');
const cafeSuccess = document.getElementById('formSuccess');
if (cafeForm && cafeSuccess) {
  cafeForm.addEventListener('submit', () => {
    setTimeout(() => {
      cafeSuccess.style.display = 'block';
      cafeForm.reset();
      setTimeout(() => { cafeSuccess.style.display = 'none'; }, 5000);
    }, 500);
  });
}

// ── BADGE SYSTEM ──────────────────────────────────────────────────────────
let isAdmin = false;
let badges  = JSON.parse(localStorage.getItem('cafe_badges') || '{}');

function setAdminMode(val) {
  isAdmin = val;
  document.body.classList.toggle('is-admin', val);
}

const categoryProducts = {
  drinks:   ['Bryggkaffe','Kaffe Latte','Cappuccino','Chai Latte','Matcha Latte'],
  pastries: ['Kanelbulle','Kardemummabulle','Kladdkaka','Croissant'],
  lunch:    ['Dagens soppa','Toast Skagen','Sallad med halloumi']
};
const categoryNames = { drinks:'☕ Kaffe & dryck', pastries:'🥐 Bakverk', lunch:'🍽️ Lunch' };
const badgeTypes    = {
  popular:    { class:'badge-popular',    icon:'🏷️', text:'Populärast' },
  bestseller: { class:'badge-bestseller', icon:'🏆', text:'Bästsäljare' }
};

function getProductCategory(p) {
  for (const [cat, list] of Object.entries(categoryProducts)) if (list.includes(p)) return cat;
  return null;
}

function renderAllBadges() {
  document.querySelectorAll('.badge').forEach(b => b.remove());
  for (const [productId, badgeInfo] of Object.entries(badges)) {
    const div = document.querySelector(`.menu-item[data-product="${productId}"]`);
    if (!div) continue;
    const h4 = div.querySelector('h4');
    if (h4 && !h4.querySelector('.badge')) {
      const type = badgeTypes[badgeInfo.type];
      if (type) {
        const span = document.createElement('span');
        span.className = `badge ${type.class}`;
        span.setAttribute('data-badge-id', badgeInfo.id || badgeInfo.type);
        span.setAttribute('data-product', productId);
        span.innerHTML = `${type.icon} ${type.text}`;
        h4.appendChild(span);
      }
    }
  }
  // Add admin (+) buttons
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.querySelector('.admin-add-btn')) return;
    const product = item.dataset.product;
    const btn = document.createElement('button');
    btn.className = 'admin-add-btn';
    btn.title = `Märk ${product}`;
    btn.setAttribute('aria-label', `Lägg till märkning på ${product}`);
    btn.textContent = '+';
    btn.addEventListener('click', e => {
      if (!isAdmin) return;
      e.stopPropagation();
      showAddPopup(btn, product);
    });
    const h4 = item.querySelector('h4');
    if (h4) h4.appendChild(btn);
  });
  attachBadgeListeners();
}

async function saveBadges() {
  localStorage.setItem('cafe_badges', JSON.stringify(badges));
  if (!isLoggedIn()) return;
  try {
    await apiPut('/api/cafe/badges', { badges });
  } catch (e) {
    console.warn('Badge-sparning misslyckades:', e.message);
  }
}

function removeBadge(p) {
  if (!badges[p]) return;
  delete badges[p];
  saveBadges();
  renderAllBadges();
}

function addBadge(p, type, id) {
  badges[p] = { type, id: id || `badge-${Date.now()}` };
  saveBadges();
  renderAllBadges();
}

// ── BADGE POPUPS ───────────────────────────────────────────────────────────
let activePopup = null;
function closePopup() { if (activePopup) { activePopup.remove(); activePopup = null; } }

function positionPopup(popup, anchor) {
  const rect = anchor.getBoundingClientRect();
  let left = rect.left, top = rect.bottom + 5;
  if (top + 400 > window.innerHeight) top = rect.top - 400;
  if (left + 280 > window.innerWidth)  left = window.innerWidth - 290;
  popup.style.left = Math.max(10, left) + 'px';
  popup.style.top  = Math.max(10, top)  + 'px';
}

function attachCloseListener(popup, anchor) {
  setTimeout(() => {
    const close = e => {
      if (popup && !popup.contains(e.target) && !anchor.contains(e.target)) {
        closePopup();
        document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }, 10);
}

function showBadgePopup(badgeEl, curProduct, curType, badgeId) {
  if (!isAdmin) return;
  closePopup();
  const cat    = getProductCategory(curProduct);
  const sameCat = cat ? categoryProducts[cat] : [];
  let html = `<div class="title">✏️ Ändra märkning</div>
    <button data-action="change-type" data-type="popular">🏷️ Populärast</button>
    <button data-action="change-type" data-type="bestseller">🏆 Bästsäljare</button>
    <hr><div class="title">📦 Flytta inom ${categoryNames[cat] || 'kategorin'}</div>`;
  for (const p of sameCat) if (p !== curProduct) html += `<button data-action="move" data-product="${p}">→ ${p}</button>`;
  html += `<hr><button data-action="delete" style="color:#c0392b;">🗑️ Ta bort</button>`;
  const popup = document.createElement('div');
  popup.className = 'badge-popup';
  popup.innerHTML = html;
  positionPopup(popup, badgeEl);
  document.body.appendChild(popup);
  activePopup = popup;
  popup.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'change-type') { addBadge(curProduct, btn.dataset.type, badgeId); closePopup(); }
    else if (action === 'move')   { addBadge(btn.dataset.product, curType, badgeId); closePopup(); }
    else if (action === 'delete') { removeBadge(curProduct); closePopup(); }
  });
  attachCloseListener(popup, badgeEl);
}

function showAddPopup(addBtn, product) {
  closePopup();
  let html = `<div class="title">➕ Märk "${product}"</div>
    <button data-action="add" data-type="popular">🏷️ Populärast</button>
    <button data-action="add" data-type="bestseller">🏆 Bästsäljare</button>`;
  if (badges[product]) html += `<hr><button data-action="remove" style="color:#c0392b;">🗑️ Ta bort märkning</button>`;
  const popup = document.createElement('div');
  popup.className = 'badge-popup';
  popup.innerHTML = html;
  positionPopup(popup, addBtn);
  document.body.appendChild(popup);
  activePopup = popup;
  popup.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    if (btn.dataset.action === 'add')    { addBadge(product, btn.dataset.type); closePopup(); }
    if (btn.dataset.action === 'remove') { removeBadge(product); closePopup(); }
  });
  attachCloseListener(popup, addBtn);
}

function attachBadgeListeners() {
  document.querySelectorAll('.badge').forEach(b => {
    b.removeEventListener('click', b._l);
    b._l = e => {
      if (!isAdmin) return;
      e.stopPropagation();
      const p = b.dataset.product, info = badges[p];
      if (info) showBadgePopup(b, p, info.type, info.id);
    };
    b.addEventListener('click', b._l);
  });
}

// Default badges
function initBadges() {
  if (Object.keys(badges).length === 0) {
    badges = {
      'Bryggkaffe':      { type: 'popular',    id: 'pop1' },
      'Cappuccino':      { type: 'bestseller', id: 'pop2' },
      'Kardemummabulle': { type: 'popular',    id: 'pop3' },
      'Dagens soppa':    { type: 'bestseller', id: 'pop4' }
    };
    localStorage.setItem('cafe_badges', JSON.stringify(badges));
  }
  renderAllBadges();
}
initBadges();

// ── ADMIN PANEL ────────────────────────────────────────────────────────────
const aLogin   = document.getElementById('adminLogin');
const aContent = document.getElementById('adminContent');
const lBtn     = document.getElementById('loginBtn');
const sBtn     = document.getElementById('saveSettingsBtn');
const cBtn     = document.getElementById('cancelAdminBtn');

function showAdmin()  { const s = document.getElementById('adminSection'); if (s) s.style.display = 'block'; }
function hideAdmin()  {
  const s = document.getElementById('adminSection'); if (!s) return;
  s.style.display = 'none';
  setAdminMode(false);
  if (aLogin)   aLogin.style.display   = 'block';
  if (aContent) aContent.style.display = 'none';
  const pw = document.getElementById('adminPassword'); if (pw) pw.value = '';
}

function checkAdminUrl() {
  if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
    showAdmin();
  } else {
    hideAdmin();
  }
}
checkAdminUrl();
window.addEventListener('hashchange', checkAdminUrl);

function loadSettingsIntoForm() {
  document.getElementById('editLunchDesc').value  = document.getElementById('lunchDesc').innerText;
  document.getElementById('editLunchPrice').value = document.getElementById('lunchPrice').innerText;
  const revs = document.querySelectorAll('.review-card');
  if (revs[0]) document.getElementById('editReview1Text').value = revs[0].querySelector('.review-text')?.innerText.trim().replace(/^[""]|[""]$/g,'') || '';
  if (revs[1]) document.getElementById('editReview2Text').value = revs[1].querySelector('.review-text')?.innerText.trim().replace(/^[""]|[""]$/g,'') || '';
  if (revs[2]) document.getElementById('editReview3Text').value = revs[2].querySelector('.review-text')?.innerText.trim().replace(/^[""]|[""]$/g,'') || '';
}

// LOGIN
if (lBtn) {
  lBtn.addEventListener('click', async () => {
    const pw    = document.getElementById('adminPassword').value;
    const errEl = document.getElementById('adminLoginError');
    lBtn.disabled    = true;
    lBtn.textContent = 'Loggar in…';
    try {
      const { token } = await apiLogin(pw);
      setToken(token);
      if (aLogin)   aLogin.style.display   = 'none';
      if (aContent) aContent.style.display = 'block';
      loadSettingsIntoForm();
      setAdminMode(true);
      if (errEl) errEl.style.display = 'none';
    } catch {
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Fel lösenord.'; }
      else alert('Fel lösenord.');
    } finally {
      lBtn.disabled    = false;
      lBtn.textContent = 'Logga in';
    }
  });

  // Allow Enter key in password field
  const pwField = document.getElementById('adminPassword');
  if (pwField) pwField.addEventListener('keydown', e => { if (e.key === 'Enter') lBtn.click(); });
}

// SAVE
if (sBtn) {
  sBtn.addEventListener('click', async () => {
    const lunchDesc  = document.getElementById('editLunchDesc').value.trim();
    const lunchPrice = document.getElementById('editLunchPrice').value.trim();
    const names  = ['Maria, Solna', 'Johan, Stockholm', 'Anna, Sundbyberg'];
    const titles = ['Återkommande gäst', 'Lunchgäst', 'Jobbar på distans'];
    const texts  = [
      document.getElementById('editReview1Text').value.trim(),
      document.getElementById('editReview2Text').value.trim(),
      document.getElementById('editReview3Text').value.trim()
    ];

    // Update DOM immediately
    document.getElementById('lunchDesc').innerText  = lunchDesc;
    document.getElementById('lunchPrice').innerText = lunchPrice;
    updateReviews(texts.map((t, i) => ({ text: t, name: names[i], title: titles[i] })));

    sBtn.disabled    = true;
    sBtn.textContent = 'Sparar…';

    try {
      await apiPut('/api/cafe/settings', {
        lunch:   { description: lunchDesc, price: lunchPrice },
        reviews: texts.map((t, i) => ({ text: t, name: names[i], title: titles[i] }))
      });
      alert('✅ Sparad på servern!');
    } catch (e) {
      alert(`⚠️ Serverfel: ${e.message}\nÄndringarna syns lokalt men sparades inte permanent.`);
    } finally {
      sBtn.disabled    = false;
      sBtn.textContent = '💾 Spara ändringar';
    }

    // Close panel
    if (aLogin)   aLogin.style.display   = 'block';
    if (aContent) aContent.style.display = 'none';
    document.getElementById('adminPassword').value = '';
    setAdminMode(false);
  });
}

// CANCEL
if (cBtn) {
  cBtn.addEventListener('click', () => {
    if (aLogin)   aLogin.style.display   = 'block';
    if (aContent) aContent.style.display = 'none';
    document.getElementById('adminPassword').value = '';
    setAdminMode(false);
  });
}

// ── LOAD DATA ─────────────────────────────────────────────────────────────
apiLoad();
