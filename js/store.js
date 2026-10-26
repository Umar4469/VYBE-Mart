"use strict";

const CART_STORAGE_KEY = "shopeasy_cart_v1";
const NEWSLETTER_STORAGE_KEY = "shopeasy_newsletter_demo_v1";
const FREE_SHIPPING_THRESHOLD = 75;
const STANDARD_SHIPPING = 6.95;
let allProducts = [];
let visibleProducts = [];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function normalizeProductList(records) {
  if (!Array.isArray(records)) {
    throw new Error("The product data must be a list.");
  }
  const usedIds = new Set();
  return records.filter((record) => {
    if (!record || typeof record !== "object") return false;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const category = typeof record.category === "string" ? record.category.trim() : "";
    const description = typeof record.description === "string" ? record.description.trim() : "";
    const price = record.price;
    const image = typeof record.image === "string" ? record.image.trim() : "";
    if (!id || !name || !category || !description || !image || typeof price !== "number" || !Number.isFinite(price) || price < 0 || usedIds.has(id)) return false;
    usedIds.add(id);
    return true;
  }).map((record) => ({
    id: record.id.trim(),
    name: record.name.trim(),
    category: record.category.trim(),
    price: Number(record.price),
    image: record.image.trim(),
    description: record.description.trim()
  }));
}

async function loadProducts() {
  try {
    const response = await fetch("data/products.json", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Product data request failed (${response.status}).`);
    allProducts = normalizeProductList(await response.json());
    if (!allProducts.length) throw new Error("No valid products were found in the product data.");
    visibleProducts = allProducts.slice();
    return allProducts;
  } catch (error) {
    console.error("Unable to load VYBEMART products:", error);
    allProducts = [];
    visibleProducts = [];
    throw error;
  }
}

function buildProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";
  image.dataset.fallback = "true";
  const info = document.createElement("div");
  info.className = "product-info";
  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.category;
  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.name;
  const description = document.createElement("p");
  description.className = "product-description";
  description.textContent = product.description;
  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = formatCurrency(product.price);
  const actions = document.createElement("div");
  actions.className = "product-actions";
  const button = document.createElement("button");
  button.className = "add-to-cart";
  button.type = "button";
  button.dataset.addToCart = product.id;
  button.textContent = "Add to bag";
  button.setAttribute("aria-label", `Add ${product.name} to bag`);
  imageWrap.append(image);
  actions.append(button);
  info.append(category, name, description, price, actions);
  article.append(imageWrap, info);
  return article;
}

function displayProducts(products, target) {
  const container = target || document.querySelector("[data-product-grid]");
  if (!container) return;
  container.replaceChildren();
  if (!products.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const heading = document.createElement("h2");
    heading.textContent = "No products found";
    const message = document.createElement("p");
    message.textContent = "Try a different search or category.";
    empty.append(heading, message);
    container.append(empty);
    return;
  }
  products.forEach((product) => container.append(buildProductCard(product)));
}

function filterProducts(category) {
  const selected = category || document.querySelector("#category-filter")?.value || "all";
  const searched = searchProducts(document.querySelector("#product-search")?.value || "", allProducts);
  visibleProducts = selected === "all" ? searched : searched.filter((product) => product.category.toLowerCase() === selected.toLowerCase());
  sortProducts(document.querySelector("#price-sort")?.value || "featured");
  return visibleProducts;
}

function sortProducts(order) {
  const selectedOrder = order || document.querySelector("#price-sort")?.value || "featured";
  const originalOrder = new Map(allProducts.map((product, index) => [product.id, index]));
  if (selectedOrder === "ascending") visibleProducts.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  if (selectedOrder === "descending") visibleProducts.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
  if (selectedOrder === "featured") visibleProducts.sort((a, b) => originalOrder.get(a.id) - originalOrder.get(b.id));
  displayProducts(visibleProducts);
  const count = document.querySelector("[data-product-count]");
  if (count) count.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"} to explore`;
  return visibleProducts;
}

function searchProducts(query, products) {
  const source = Array.isArray(products) ? products : allProducts;
  const term = String(query || "").trim().toLowerCase();
  return source.filter((product) => !term || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term));
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(stored)) throw new Error("Cart data is not a list.");
    const validProducts = new Map(allProducts.map((product) => [product.id, product]));
    const unique = new Map();
    stored.forEach((entry) => {
      if (!entry || typeof entry.id !== "string" || !Number.isSafeInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 99) return;
      if (!validProducts.has(entry.id)) return;
      unique.set(entry.id, Math.min(99, (unique.get(entry.id) || 0) + entry.quantity));
    });
    return Array.from(unique, ([id, quantity]) => ({ id, quantity }));
  } catch (error) {
    console.error("Unable to read VYBEMART cart from browser storage:", error);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
    return true;
  } catch (error) {
    console.error("Unable to save VYBEMART cart to browser storage:", error);
    showNotification("Your browser could not save the bag. Check storage permissions.", "error");
    return false;
  }
}

function updateCartCount() {
  const cart = readCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((badge) => { badge.textContent = String(count); });
  document.querySelectorAll(".cart-button").forEach((link) => {
    link.setAttribute("aria-label", `Shopping cart, ${count} ${count === 1 ? "item" : "items"}`);
  });
  return count;
}

function addToCart(productId) {
  const id = typeof productId === "string" ? productId : productId?.id;
  const product = allProducts.find((item) => item.id === id);
  if (!product) {
    showNotification("That product is not available right now.", "error");
    return false;
  }
  const cart = readCart();
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    if (existing.quantity >= 99) {
      showNotification("A maximum of 99 of each item can be added.", "error");
      return false;
    }
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }
  if (!saveCart(cart)) return false;
  renderCart();
  showNotification(`${product.name} added to your bag.`, "success");
  return true;
}

function removeFromCart(productId) {
  const id = typeof productId === "string" ? productId : "";
  const nextCart = readCart().filter((item) => item.id !== id);
  saveCart(nextCart);
  renderCart();
}

function updateQuantity(productId, change) {
  const id = typeof productId === "string" ? productId : "";
  const delta = Number(change);
  if (!Number.isInteger(delta) || ![-1, 1].includes(delta)) return;
  const cart = readCart();
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(99, item.quantity + delta));
  if (saveCart(cart)) renderCart();
}

function calculateTotal(cart) {
  const currentCart = Array.isArray(cart) ? cart : readCart();
  const productMap = new Map(allProducts.map((product) => [product.id, product]));
  const subtotal = currentCart.reduce((sum, item) => {
    const product = productMap.get(item.id);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  return { subtotal, shipping, total: subtotal + shipping };
}

function renderCart() {
  const container = document.querySelector("[data-cart-items]");
  if (!container) return;
  const cart = readCart();
  const emptyState = document.querySelector("[data-empty-cart]");
  const checkoutForm = document.querySelector("[data-checkout-form]");
  container.replaceChildren();
  if (emptyState) emptyState.hidden = cart.length !== 0;
  if (checkoutForm) checkoutForm.hidden = cart.length === 0;
  cart.forEach((item) => {
    const product = allProducts.find((entry) => entry.id === item.id);
    if (!product) return;
    const article = document.createElement("article");
    article.className = "cart-item";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.dataset.fallback = "true";
    const main = document.createElement("div");
    main.className = "cart-item-main";
    const title = document.createElement("h3");
    title.textContent = product.name;
    const unitPrice = document.createElement("p");
    unitPrice.textContent = `${formatCurrency(product.price)} each`;
    const controls = document.createElement("div");
    controls.className = "cart-item-controls";
    const quantity = document.createElement("div");
    quantity.className = "quantity-controls";
    quantity.setAttribute("aria-label", `Quantity for ${product.name}`);
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.dataset.quantityChange = "-1";
    decrease.dataset.productId = product.id;
    decrease.setAttribute("aria-label", `Decrease ${product.name} quantity`);
    decrease.textContent = "−";
    const quantityText = document.createElement("span");
    quantityText.textContent = String(item.quantity);
    const increase = document.createElement("button");
    increase.type = "button";
    increase.dataset.quantityChange = "1";
    increase.dataset.productId = product.id;
    increase.setAttribute("aria-label", `Increase ${product.name} quantity`);
    increase.textContent = "+";
    const lineTotal = document.createElement("strong");
    lineTotal.textContent = formatCurrency(product.price * item.quantity);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.dataset.removeProduct = product.id;
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${product.name} from bag`);
    quantity.append(decrease, quantityText, increase);
    controls.append(quantity, lineTotal, remove);
    main.append(title, unitPrice, controls);
    article.append(image, main);
    container.append(article);
  });
  const totals = calculateTotal(cart);
  const subtotal = document.querySelector("[data-subtotal]");
  const shipping = document.querySelector("[data-shipping]");
  const total = document.querySelector("[data-total]");
  if (subtotal) subtotal.textContent = formatCurrency(totals.subtotal);
  if (shipping) shipping.textContent = totals.shipping === 0 && totals.subtotal > 0 ? "Free" : formatCurrency(totals.shipping);
  if (total) total.textContent = formatCurrency(totals.total);
  const shippingNote = document.querySelector("[data-shipping-note]");
  if (shippingNote) {
    shippingNote.textContent = totals.subtotal >= FREE_SHIPPING_THRESHOLD
      ? "Your order qualifies for free shipping."
      : `Standard shipping is ${formatCurrency(STANDARD_SHIPPING)}; free on orders of ${formatCurrency(FREE_SHIPPING_THRESHOLD)} or more.`;
  }
  updateCartCount();
}

function validateForm(form) {
  if (!form) return false;
  const fields = Array.from(form.querySelectorAll("input[required], textarea[required], select[required]"));
  let firstInvalid = null;
  fields.forEach((field) => {
    const value = field.value.trim();
    let message = "";
    if (!value) message = "Please complete this field.";
    else if (field.name === "name" && value.length < 2) message = "Enter a name with at least 2 characters.";
    else if (field.name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) message = "Enter a valid email address.";
    else if (field.name === "phone" && (!/^\+?[0-9\s().-]+$/.test(value) || (value.match(/\d/g) || []).length < 7 || (value.match(/\d/g) || []).length > 15)) message = "Enter a valid phone number with 7–15 digits.";
    else if (field.name === "address" && value.length < 5) message = "Enter a complete delivery address.";
    else if (field.name === "postal" && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,14}[A-Za-z0-9]$/.test(value)) message = "Enter a valid postal code.";
    const error = document.getElementById(`error-${field.name}`);
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (message && !firstInvalid) firstInvalid = field;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

function showNotification(message, type) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  toast.textContent = String(message);
  toast.className = `toast ${type === "error" ? "error" : "success"}`;
  if (window.jQuery) {
    window.jQuery(toast).stop(true, true).hide().prop("hidden", false).fadeIn(160);
    window.jQuery(toast).delay(2600).fadeOut(250, function () { this.hidden = true; });
  } else {
    toast.hidden = false;
    window.setTimeout(() => { toast.hidden = true; }, 2800);
  }
}
