/**
 * LKWD Café Solna — Admin JS (v4)
 * - Inloggning via backend (JWT) — lösenord valideras server-side
 * - All data sparas i localStorage — varje besökare har sitt eget tillstånd
 * - Ingen global påverkan mellan besökare
 */

document.getElementById('yr').textContent = new Date().getFullYear();

// ── CONFIG ────────────────────────────────────────────────────────────────
const API_BASE  = 'https://lkwd-backend-production.up.railway.app';
const TOKEN_KEY = 'lkwd_admin_token';

// ── TOKEN HELPERS ─────────────────────────────────────────────────────────
function getToken()   { return sessionStorage.getItem(TOKEN_KEY); }
function setToken(t)  { sessionStorage.setItem(TOKEN_KEY, t); }
function clearToken() { sessionStorage.removeItem(TOKEN_KEY); }

async function apiLogin(password) {
  const res = await fetch(API_BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) throw new Error('Fel lösenord');
  return res.json();
}

// ── LOCALSTORAGE KEYS ─────────────────────────────────────────────────────
const LS_LUNCH   = 'cafe_solna_lunch';
const LS_REVIEWS = 'cafe_solna_reviews';
const LS_BADGES  = 'cafe_solna_badges';

// ── DEFAULT DATA ──────────────────────────────────────────────────────────
const DEFAULT_LUNCH = {
  description: 'Grillad lax med örtcrème fraiche, pressad potatis och sallad',
  price: '125:-'
};
const DEFAULT_REVIEWS = [
  { text: 'Bästa cafét i Solna! Fantastiskt kaffe och otroligt goda bakverk. Personalen är alltid så trevlig.', name: 'Maria, Solna', title: 'Återkommande gäst' },
  { text: 'Älskar deras veckas lunch! God mat till bra pris. Perfekt för en lunchdejt.', name: 'Johan, Stockholm', title: 'Lunchgäst' },
  { text: 'Mysigaste cafét. Bra arbetsplats, god fika och härlig atmosfär. Rekommenderas varmt!', name: 'Anna, Sundbyberg', title: 'Jobbar på distans' }
];
const DEFAULT_BADGES = {
  'Bryggkaffe':      { type: 'popular',    id: 'pop1' },
  'Cappuccino':      { type: 'bestseller', id: 'pop2' },
  'Kardemummabulle': { type: 'popular',    id: 'pop3' },
  'Dagens soppa':    { type: 'bestseller', id: 'pop4' }
};

// ── LOCALSTORAGE KEYS ─────────────────────────────────────────────────────
const LS_LUNCH       = 'cafe_solna_lunch';
const LS_REVIEWS     = 'cafe_solna_reviews';
const LS_BADGES      = 'cafe_solna_badges';

// ── DEFAULT DATA ───────────────────────────────────────────────────────────
const DEFAULT_LUNCH = {
  description: 'Grillad lax med örtcrème fraiche, pressad potatis och sallad',
  price: '125:-'
};

const DEFAULT_REVIEWS = [
  { text: 'Bästa cafét i Solna! Fantastiskt kaffe och otroligt goda bakverk. Personalen är alltid så trevlig.', name: 'Maria, Solna', title: 'Återkommande gäst' },
  { text: 'Älskar deras veckas lunch! God mat till bra pris. Perfekt för en lunchdejt.', name: 'Johan, Stockholm', title: 'Lunchgäst' },
  { text: 'Mysigaste cafét. Bra arbetsplats, god fika och härlig atmosfär. Rekommenderas varmt!', name: 'Anna, Sundbyberg', title: 'Jobbar på distans' }
];

const DEFAULT_BADGES = {
  'Bryggkaffe':      { type: 'popular',    id: 'pop1' },
  'Cappuccino':      { type: 'bestseller', id: 'pop2' },
  'Kardemummabulle': { type: 'popular',    id: 'pop3' },
  'Dagens soppa':    { type: 'bestseller', id: 'pop4' }
};

// ── LOAD / SAVE HELPERS ────────────────────────────────────────────────────
function loadLunch() {
  try { return JSON.parse(localStorage.getItem(LS_LUNCH)) || DEFAULT_LUNCH; }
  catch { return DEFAULT_LUNCH; }
}
function saveLunch(data) { localStorage.setItem(LS_LUNCH, JSON.stringify(data)); }

function loadReviews() {
  try { return JSON.parse(localStorage.getItem(LS_REVIEWS)) || DEFAULT_REVIEWS; }
  catch { return DEFAULT_REVIEWS; }
}
function saveReviews(data) { localStorage.setItem(LS_REVIEWS, JSON.stringify(data)); }

function loadBadges() {
  try { return JSON.parse(localStorage.getItem(LS_BADGES)) || DEFAULT_BADGES; }
  catch { return DEFAULT_BADGES; }
}
function saveBadges(data) { localStorage.setItem(LS_BADGES, JSON.stringify(data)); }

// ── APPLY DATA TO DOM ──────────────────────────────────────────────────────
function applyLunch(lunch) {
  const ld = document.getElementById('lunchDesc');
  const lp = document.getElementById('lunchPrice');
  if (ld) ld.innerText = lunch.description;
  if (lp) lp.innerText = lunch.price;
}

function applyReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  grid.innerHTML = reviews.map(r =>
    `<div class="review-card">
      <div class="review-stars">★★★★★</div>
      <div class="review-text">"${r.text}"</div>
      <div class="review-name">– ${r.name}</div>
      <div class="review-title">${r.title}</div>
    </div>`
  ).join('');
}

// ── INITIALISE DATA ────────────────────────────────────────────────────────
applyLunch(loadLunch());
applyReviews(loadReviews());

// ── MOBILE MENU ────────────────────────────────────────────────────────────
const menuBtn    = document.getElementById('mobileMenuBtn');
const navLinksEl = document.getElementById('navLinks');
if (menuBtn) menuBtn.addEventListener('click', () => navLinksEl.classList.toggle('active'));
if (navLinksEl) navLinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinksEl.classList.remove('active')));

// ── CONTACT FORM ──────────────────────────────────────────────────────────
const cafeForm    = document.querySelector('.contact-form form');
const cafeSuccess = document.getElementById('formSuccess');
if (cafeForm && cafeSuccess) {
  cafeForm.addEventListener('submit', e => {
    e.preventDefault();
    cafeSuccess.style.display = 'block';
    cafeForm.reset();
    setTimeout(() => { cafeSuccess.style.display = 'none'; }, 5000);
  });
}

// ── BADGE SYSTEM ──────────────────────────────────────────────────────────
let isAdmin = false;
let badges  = loadBadges();

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

function persistBadges() { saveBadges(badges); }

function removeBadge(p) {
  if (!badges[p]) return;
  delete badges[p];
  persistBadges();
  renderAllBadges();
}

function addBadge(p, type, id) {
  badges[p] = { type, id: id || `badge-${Date.now()}` };
  persistBadges();
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
        closePopup(); document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }, 10);
}

function showBadgePopup(badgeEl, curProduct, curType, badgeId) {
  if (!isAdmin) return;
  closePopup();
  const cat     = getProductCategory(curProduct);
  const sameCat = cat ? categoryProducts[cat] : [];
  let html = `<div class="title">✏️ Ändra märkning</div>
    <button data-action="change-type" data-type="popular">🏷️ Populärast</button>
    <button data-action="change-type" data-type="bestseller">🏆 Bästsäljare</button>
    <hr><div class="title">📦 Flytta inom ${categoryNames[cat] || 'kategorin'}</div>`;
  for (const p of sameCat) if (p !== curProduct) html += `<button data-action="move" data-product="${p}">→ ${p}</button>`;
  html += `<hr><button data-action="delete" style="color:#c0392b;">🗑️ Ta bort</button>`;
  const popup = document.createElement('div');
  popup.className = 'badge-popup'; popup.innerHTML = html;
  positionPopup(popup, badgeEl);
  document.body.appendChild(popup); activePopup = popup;
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
  popup.className = 'badge-popup'; popup.innerHTML = html;
  positionPopup(popup, addBtn);
  document.body.appendChild(popup); activePopup = popup;
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

renderAllBadges();

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
  if (window.location.hash === '#admin' || window.location.search.includes('admin')) showAdmin();
  else hideAdmin();
}
checkAdminUrl();
window.addEventListener('hashchange', checkAdminUrl);

function loadSettingsIntoForm() {
  const lunch = loadLunch();
  document.getElementById('editLunchDesc').value  = lunch.description;
  document.getElementById('editLunchPrice').value = lunch.price;
  const reviews = loadReviews();
  if (reviews[0]) document.getElementById('editReview1Text').value = reviews[0].text;
  if (reviews[1]) document.getElementById('editReview2Text').value = reviews[1].text;
  if (reviews[2]) document.getElementById('editReview3Text').value = reviews[2].text;
}

// LOGIN — valideras via backend, token sparas i sessionStorage
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
    } finally {
      lBtn.disabled    = false;
      lBtn.textContent = 'Logga in';
    }
  });
  const pwField = document.getElementById('adminPassword');
  if (pwField) pwField.addEventListener('keydown', e => { if (e.key === 'Enter') lBtn.click(); });
}

// SAVE — localStorage only
if (sBtn) {
  sBtn.addEventListener('click', () => {
    const lunchDesc  = document.getElementById('editLunchDesc').value.trim();
    const lunchPrice = document.getElementById('editLunchPrice').value.trim();
    const names  = ['Maria, Solna', 'Johan, Stockholm', 'Anna, Sundbyberg'];
    const titles = ['Återkommande gäst', 'Lunchgäst', 'Jobbar på distans'];
    const texts  = [
      document.getElementById('editReview1Text').value.trim(),
      document.getElementById('editReview2Text').value.trim(),
      document.getElementById('editReview3Text').value.trim()
    ];

    // Save to localStorage
    saveLunch({ description: lunchDesc, price: lunchPrice });
    saveReviews(texts.map((t, i) => ({ text: t, name: names[i], title: titles[i] })));

    // Update DOM
    applyLunch({ description: lunchDesc, price: lunchPrice });
    applyReviews(texts.map((t, i) => ({ text: t, name: names[i], title: titles[i] })));

    alert('✅ Ändringar sparade! (Syns bara för dig i den här webbläsaren)');

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
