// ── LUCIDE ICON HELPER ──
// We load Lucide from CDN in each HTML page.
// This helper renders an icon by name inline.
function icon(name, size = 16, attrs = '') {
  return `<i data-lucide="${name}" width="${size}" height="${size}" ${attrs} style="display:inline-block;vertical-align:middle;"></i>`;
}

// ── SHARED STATE ──
const Store = {
  _data: {},

  set(key, value) {
    this._data[key] = value;
    try { sessionStorage.setItem('checkout_' + key, JSON.stringify(value)); } catch(e){}
  },

  get(key) {
    if (this._data[key] !== undefined) return this._data[key];
    try {
      const v = sessionStorage.getItem('checkout_' + key);
      return v ? JSON.parse(v) : null;
    } catch(e) { return null; }
  },

  getAll() {
    const keys = ['cart', 'personal', 'address', 'payment'];
    const result = {};
    keys.forEach(k => { result[k] = this.get(k); });
    return result;
  },

  clear() {
    try { sessionStorage.clear(); } catch(e){}
    this._data = {};
  }
};

// Default cart data — items use Lucide icon names instead of emojis
if (!Store.get('cart')) {
  Store.set('cart', {
    items: [
      { id: 1, name: 'Merino Wool Coat', variant: 'Camel / Size M', price: 289.00, qty: 1, lucideIcon: 'shirt' },
      { id: 2, name: 'Leather Ankle Boots', variant: 'Black / EU 39', price: 195.00, qty: 1, lucideIcon: 'footprints' },
      { id: 3, name: 'Silk Scarf', variant: 'Ivory / 90×90cm', price: 68.00, qty: 2, lucideIcon: 'wind' },
    ],
    shippingMethod: 'standard',
    discount: 0
  });
}

// ── FREE SHIPPING THRESHOLD ──
const FREE_SHIPPING_THRESHOLD = 200;
const SHIPPING_COSTS = { standard: 12, express: 24, overnight: 38 };

// ── VALIDATION ──
const Validators = {
  required: (v) => v.trim().length > 0 ? null : 'This field is required.',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Please enter a valid email address.',
  phone: (v) => /^[\+]?[\d\s\-\(\)]{7,15}$/.test(v.trim()) ? null : 'Please enter a valid phone number.',
  minLen: (n) => (v) => v.trim().length >= n ? null : `Must be at least ${n} characters.`,
  cardNumber: (v) => {
    const digits = v.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(digits)) return 'Please enter a valid card number.';
    return luhn(digits) ? null : 'Card number is invalid.';
  },
  expiry: (v) => {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return 'Use MM/YY format.';
    const month = parseInt(m[1]);
    const year = 2000 + parseInt(m[2]);
    if (month < 1 || month > 12) return 'Invalid month.';
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
      return 'This card has expired.';
    return null;
  },
  cvv: (v) => /^\d{3,4}$/.test(v.trim()) ? null : 'CVV must be 3–4 digits.',
  zip: (v) => /^[\d\w\s\-]{3,10}$/.test(v.trim()) ? null : 'Enter a valid postal code.',
  name: (v) => {
    if (!v.trim()) return 'This field is required.';
    if (v.trim().split(/\s+/).length < 2) return 'Please enter your full name.';
    return null;
  }
};

function luhn(n) {
  let sum = 0, alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

// ── FORM HELPERS ──
function setupField(inputEl, validator) {
  const field = inputEl.closest('.field');
  const errorEl = field.querySelector('.field-error');
  let dirty = false;

  function validate() {
    const err = validator(inputEl.value);
    if (err) {
      inputEl.classList.remove('success');
      inputEl.classList.add('error');
      if (errorEl) { errorEl.textContent = err; errorEl.classList.add('visible'); }
      return false;
    } else {
      inputEl.classList.remove('error');
      if (inputEl.value.trim()) inputEl.classList.add('success');
      if (errorEl) errorEl.classList.remove('visible');
      return true;
    }
  }

  inputEl.addEventListener('blur', () => { dirty = true; validate(); });
  inputEl.addEventListener('input', () => { if (dirty) validate(); });

  return { validate, el: inputEl };
}

function validateAll(fields) {
  return fields.map(f => f.validate()).every(Boolean);
}

// ── CARD FORMATTING ──
function formatCardNumber(input) {
  input.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g,'').substring(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = v;
  });
}

function formatExpiry(input) {
  input.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g,'').substring(0, 4);
    if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
    e.target.value = v;
  });
}

// ── CART TOTALS (with free shipping logic) ──
function getCartTotals() {
  const cart = Store.get('cart');
  if (!cart) return { subtotal: 0, shipping: 0, shippingFree: false, tax: 0, total: 0, discount: 0, discountPct: 0 };

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

  // discount can be { type: 'pct', value: 20 } or { type: 'flat', value: 15 } or legacy number
  let discountAmount = 0;
  let discountPct = 0;
  const d = cart.discount;
  if (d && typeof d === 'object') {
    if (d.type === 'pct') {
      discountPct = d.value;
      discountAmount = subtotal * (d.value / 100);
    } else {
      discountAmount = d.value;
    }
  } else if (typeof d === 'number') {
    discountAmount = d; // legacy flat
  }

  discountAmount = Math.min(discountAmount, subtotal); // never negative
  const discountedSubtotal = subtotal - discountAmount;
  const shippingFree = discountedSubtotal >= FREE_SHIPPING_THRESHOLD;
  const baseShipping = SHIPPING_COSTS[cart.shippingMethod || 'standard'] || 12;
  const shipping = shippingFree ? 0 : baseShipping;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    shippingFree,
    baseShipping,
    tax,
    total,
    discount: discountAmount,
    discountPct,
  };
}

// ── ORDER SUMMARY RENDERER ──
function renderOrderSummary(containerEl) {
  const cart = Store.get('cart');
  const totals = getCartTotals();
  if (!cart || !containerEl) return;

  const shippingDisplay = totals.shippingFree
    ? `<span class="free-shipping-badge"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Free</span>`
    : `$${totals.shipping.toFixed(2)}`;

  containerEl.innerHTML = `
    <p class="summary-title">Order Summary</p>
    <div class="order-items">
      ${cart.items.map(item => `
        <div class="order-item">
          <div class="item-thumb">
            <i data-lucide="${item.lucideIcon || 'package'}" width="22" height="22"></i>
            <span class="item-badge">${item.qty}</span>
          </div>
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-variant">${item.variant}</div>
          </div>
          <div class="item-price">$${(item.price * item.qty).toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
    <div class="summary-divider"></div>
    <div class="summary-line"><span>Subtotal</span><span>$${totals.subtotal.toFixed(2)}</span></div>
    ${totals.discount > 0 ? `<div class="summary-line" style="color:#4ade80"><span>Discount${totals.discountPct ? ` (${totals.discountPct}%)` : ''}</span><span>−$${totals.discount.toFixed(2)}</span></div>` : ''}
    <div class="summary-line ${totals.shippingFree ? 'free-shipping' : ''}">
      <span>Shipping</span>
      <span>${shippingDisplay}</span>
    </div>
    ${totals.shippingFree ? `<div style="font-size:11px;color:#666;margin-bottom:10px;margin-top:-4px">✓ You qualify for free shipping</div>` : `<div style="font-size:11px;color:#666;margin-bottom:10px;margin-top:-4px">Free shipping on orders $200+</div>`}
    <div class="summary-line"><span>Tax (8%)</span><span>$${totals.tax.toFixed(2)}</span></div>
    <div class="summary-divider"></div>
    <div class="summary-total">
      <span class="label">Total</span>
      <span class="amount">$${totals.total.toFixed(2)}</span>
    </div>
    <div class="secure-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      256-bit SSL encrypted checkout
    </div>
  `;

  // Init Lucide icons inside the summary
  if (window.lucide) lucide.createIcons();
}

// ── TOAST ──
function showToast(msg, type = 'error') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const iconName = type === 'error' ? 'alert-circle' : 'check-circle';
  const t = document.createElement('div');
  t.className = `toast ${type}-toast`;
  t.innerHTML = `<i data-lucide="${iconName}" width="16" height="16"></i> ${msg}`;
  document.body.appendChild(t);

  if (window.lucide) lucide.createIcons();
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 4000);
}

// ── SUMMARY TOGGLE (tablet/mobile) ──
function initSummaryToggle() {
  const btn = document.getElementById('summaryToggleBtn');
  const drawer = document.getElementById('summaryDrawer');
  if (!btn || !drawer) return;

  // Render summary inside the drawer
  renderOrderSummary(drawer);

  // Update the amount shown on the button
  function updateBtnAmount() {
    const totals = getCartTotals();
    const amountEl = btn.querySelector('.toggle-btn-amount');
    if (amountEl) amountEl.textContent = '$' + totals.total.toFixed(2);
  }
  updateBtnAmount();

  btn.addEventListener('click', () => {
    const isOpen = btn.classList.contains('open');
    btn.classList.toggle('open', !isOpen);
    drawer.classList.toggle('open', !isOpen);
    const label = btn.querySelector('.toggle-btn-label');
    if (label) label.textContent = isOpen ? 'Show order summary' : 'Hide order summary';
    if (window.lucide) lucide.createIcons();
  });
}
