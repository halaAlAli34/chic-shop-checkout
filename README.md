# Chic Shop — Frontend Checkout Flow

A complete, multi-page checkout experience built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools — just open and run.

---

## 📁 Project Structure

```
checkout-flow/
├── css/
│   └── global.css          # All shared styles, design tokens, responsive rules
├── js/
│   └── shared.js           # State management, validators, utilities
├── pages/
│   ├── summary.html        # Step 1 — Cart summary + promo codes
│   ├── personal.html       # Step 2 — Personal & contact information
│   ├── address.html        # Step 3 — Billing + shipping address
│   ├── payment.html        # Step 4 — Payment details
│   ├── confirm.html        # Step 5 — Order review + place order
│   ├── success.html        # Success state
│   └── failure.html        # Failure state
└── README.md
```

---

## 🚀 Running Locally

### Option A — No install required (Python)

```bash
# Navigate into the project
cd checkout-flow

# Python 3
python3 -m http.server 8080

# Then open:
# http://localhost:8080/pages/summary.html
```

### Option B — Node.js (npx serve)

```bash
cd checkout-flow
npx serve .
# Open: http://localhost:3000/pages/summary.html
```

### Option C — VS Code Live Server

Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `pages/summary.html`, and select **Open with Live Server**.

> ⚠️ Do **not** open HTML files directly via `file://` — sessionStorage and relative paths require a local server.

---

## ✨ Features

### Functional
- **5-step checkout flow**: Summary → Personal → Address → Payment → Confirm
- **Cart management**: Quantity controls, item removal, running totals
- **Promo codes**: Try `chic20`, `ship15`, or `WELCOME10`
- **Form validation**: Real-time inline errors on blur, full validation on submit
- **Luhn algorithm**: Card number validity check
- **Expiry validation**: Rejects past dates
- **State persistence**: `sessionStorage` preserves data across pages
- **Pre-fill on back**: Returning to a step restores your previous input
- **3 payment methods**: Card, PayPal, Apple Pay tabs
- **Shipping methods**: Standard / Express / Overnight with live price update
- **Animated processing state**: Staged loading steps before redirect
- **Success & failure states**: 80/20 split for demo (configurable in `confirm.html`)
- **Card preview widget**: Live-updating card art as you type

### UX / Design
- **Responsive**: Works on mobile (380px+), tablet, and desktop
- **Accessible**: Labels, `autocomplete` attributes, keyboard navigable
- **Animations**: Staggered page-load reveals, micro-interactions
- **Error handling**: Toast notifications + inline field errors
- **Split layout**: Main content + sticky order summary panel

---

## 🎨 Design Decisions

### Aesthetic Direction
**Luxury editorial** — dark ink tones, warm paper backgrounds, Cormorant Garamond for display text, DM Mono for numbers and metadata, Jost for UI text. The palette is intentionally restrained: off-white, charcoal, and a single warm gold accent.

### State Management
Vanilla `sessionStorage` via a thin `Store` wrapper (`js/shared.js`). No framework needed for a linear checkout flow — state moves forward through the funnel and is read back on each page load.

### Validation Strategy
- **On-blur**: Errors surface when the user leaves a field (not while typing)
- **On-input after blur**: Errors clear immediately once corrected
- **On-submit**: Full validation pass with scroll-to-first-error
- Card number uses the Luhn algorithm; expiry checks against today's date

### Split-screen Layout
Desktop uses a CSS Grid two-column layout: form on the left, sticky order summary on the right. On mobile, the summary is collapsed (visible only if needed) to keep the form focused.

### No Build Step
The entire project runs from static files. This was intentional — the assignment evaluates frontend fundamentals, and introducing Webpack/Vite would obscure the code structure.

---

## 🧪 Testing the Flow

| Scenario | How |
|----------|-----|
| Successful payment | Complete all 5 steps normally (~80% chance) |
| Failed payment | Keep retrying from Confirm page (~20% chance) |
| Promo code | Enter `SUMMER20` on the Summary page |
| Validation errors | Submit any form with empty/invalid fields |
| Different shipping | Select Express or Overnight on Address page |
| Back navigation | Use "← Back" buttons — your data is preserved |

---

## 📦 No Dependencies

Pure HTML + CSS + JavaScript. Google Fonts are loaded from CDN (requires internet). Everything else is self-contained.
