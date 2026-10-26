# VYBEMART

VYBEMART is a responsive, frontend-only storefront project by ResultSmashers in Lahore, Pakistan. It includes a bold homepage, a JSON-driven catalog, a persistent shopping bag, and simulated checkout. No real orders, payments, or remote newsletter subscriptions are made.

## Features

- Three linked pages: home, products, and bag/checkout.
- Product records loaded from `data/products.json`, with duplicate and malformed records ignored.
- Category filtering, product search, and ascending/descending price sorting.
- Product cards and catalog empty/error states, plus a local fallback image.
- LocalStorage shopping bag with quantity controls, remove/clear actions, item count, subtotal, shipping, and total.
- Standard shipping is $6.95 below $75; orders of $75 or more ship free.
- Client-side checkout validation. Checkout details are never saved.
- Newsletter form with client-side email validation and an explicitly local-only demonstration list in LocalStorage.
- Customer-support guidance identifies this as a demo and links to the project guide; no live support is connected.
- Semantic landmarks, labeled fields, keyboard focus styles, status messages, and reduced-motion support.
- jQuery delegated event handling when the CDN is available, with native event handling as a fallback so core shopping features keep working offline.
- A high-contrast VYBEMART visual theme with animated collection and product cards; animations respect reduced-motion preferences.
- A high-contrast VYBEMART identity with electric-lime accents, expressive homepage, and ResultSmashers contact details in every page footer.
- A homepage review section with clearly labeled sample testimonials (not verified customer reviews).

## Technology

HTML5, CSS3, vanilla JavaScript, JSON, browser LocalStorage, and jQuery 3.7.1 loaded from the official jQuery CDN when available. The complete stylesheet is at `css/style.css`.

Google Fonts, jQuery, and product photographs use external services and need an internet connection. Core catalog and shopping interactions also work if jQuery is unavailable; failed images use `assets/images/fallback.svg`.

## Folder structure

```text
VYBEMART/
├── index.html
├── products.html
├── cart.html
├── css/
│   └── style.css
├── js/
│   ├── store.js
│   └── ui.js
├── data/
│   └── products.json
├── assets/
│   └── images/
│       └── fallback.svg
└── README.md
```

## Prerequisites and setup

- Windows 10/11 with PowerShell and Python 3 installed.
- A modern browser.
- Internet access for jQuery, Google Fonts, and remote product photographs (core data and fallback image are local).

From PowerShell, change to the extracted project folder and start Python's local HTTP server:

```powershell
Set-Location "C:\path\to\VYBEMART"
python -m http.server 8000
```

Then open `http://localhost:8000/` in a browser. Keep the server running while using the site; press Ctrl+C in that PowerShell window to stop it.

### Why a local HTTP server?

The product list is read with `fetch("data/products.json")`. Browsers commonly block `fetch` from pages opened directly via the `file://` protocol, so use the local HTTP server instead.

## Try each page

1. Open the home page; use the collection tiles, navigation, featured products, and newsletter form.
2. Select **Products**; try each category, a search term, and both price sort orders.
3. Add several items and use **Bag** in the navigation. Reload the page to verify the bag persists.
4. Increase and decrease quantities, remove one item, and inspect the subtotal, shipping, and total.
5. Try clear bag and confirm the prompt. Add an item again to test checkout.
6. Submit the checkout empty, then submit incomplete/invalid details; errors should be announced and invalid fields identified.
7. Submit valid details to see a successful simulated order and an emptied bag.
8. Turn off the network or use browser developer tools to inspect the product-data error and image fallback behavior.
9. Test narrow and wide viewports (around 360, 768, 1024, and 1440 CSS pixels).

## Data and browser storage

Edit `data/products.json` to change products. Each item needs a unique string `id`, non-empty `name`, `category`, `description`, and `image`, plus a finite non-negative `price`. The runtime skips duplicate IDs and malformed entries. Use an image URL or add an image beneath `assets/images/`; if a displayed image fails, the local SVG fallback is used.

Cart storage key: `shopeasy_cart_v1` (kept unchanged so existing bags are preserved across the VYBEMART rebrand). Only validated product IDs and integer quantities are stored; current names and prices always come from the JSON data. Removing the key from browser storage resets the bag. Newsletter demo signups use `shopeasy_newsletter_demo_v1` and remain in the current browser only. The checkout never saves name, email, phone, address, city, postal code, or payment selection.

## Simulated features and limitations

- Checkout validates the form in the browser, shows a confirmation, and clears the bag. There is no server, order record, payment processing, delivery, or customer account.
- Newsletter addresses are saved only in this browser for demonstration; they are not transmitted or subscribed remotely.
- Browser-side validation and LocalStorage are not secure authentication, payment, or order systems. Users can inspect or modify local data. Do not enter real payment or personal details.
- Clearing or blocking browser storage prevents persistence. CDN and Unsplash resources need internet access. Product image layout uses a fallback when an image cannot load.
- This project does not implement inventory, taxes, shipping providers, privacy consent, or server-side validation.

## Assignment requirement map

| Requirement | Implementation |
| --- | --- |
| Semantic three-page storefront and navigation | `index.html`, `products.html`, `cart.html` |
| Responsive styling, visual system, reduced motion | `style.css`, `css/style.css` |
| JSON product catalog and fallback image | `data/products.json`, `assets/images/fallback.svg`, `js/store.js` |
| Search, categories, sorting, count, empty/error state | `products.html`, `js/store.js`, `js/ui.js` |
| Persistent cart, quantities, totals, clear/remove | `cart.html`, `js/store.js`, `js/ui.js` |
| Client-side checkout and no sensitive-data storage | `cart.html`, `js/store.js`, `js/ui.js` |
| jQuery event delegation, notifications, smooth scroll | `js/ui.js`, `js/store.js` |
| Local demo newsletter and honest status | `index.html`, `js/ui.js` |
| Setup, limitations, manual testing guidance | `README.md` |

## Manual test checklist

- [ ] Home, products, and cart navigation works.
- [ ] At least 10 products load from JSON; try category, search, both price orders, and no-results search.
- [ ] Add items, reload, change quantities, remove items, and clear the bag.
- [ ] Check shipping: $6.95 below $75, free at/above $75; total equals subtotal plus shipping.
- [ ] Checkout rejects blank fields, malformed email, and phone numbers outside 7–15 digits.
- [ ] Valid simulated checkout confirms and clears the cart without retaining form details.
- [ ] Newsletter accepts a valid address and reports its browser-only behavior.
- [ ] Block jQuery and confirm catalog filters and bag controls still work through the native fallback; block an image and confirm fallback; block JSON and confirm the failure state and retry button.
- [ ] Check layout at phone, tablet, laptop, and desktop widths, keyboard focus, and reduced motion.
