"use strict";

let nativeInteractionsBound = false;

function installImageFallbacks(root) {
  const images = (root || document).querySelectorAll("img[data-fallback]");
  images.forEach((image) => {
    if (image.dataset.fallbackReady) return;
    image.dataset.fallbackReady = "true";
    image.addEventListener("error", () => {
      if (image.dataset.fallbackUsed) return;
      image.dataset.fallbackUsed = "true";
      image.src = "assets/images/fallback.svg";
    });
  });
}

function populateCategories() {
  const select = document.querySelector("#category-filter");
  if (!select) return;
  const categories = [...new Set(allProducts.map((product) => product.category))].sort((a, b) => a.localeCompare(b));
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });
  const requested = new URLSearchParams(window.location.search).get("category");
  if (requested && categories.some((category) => category.toLowerCase() === requested.toLowerCase())) {
    select.value = categories.find((category) => category.toLowerCase() === requested.toLowerCase());
  }
}

function showProductLoadError(container, error) {
  if (!container) return;
  container.replaceChildren();
  const state = document.createElement("div");
  state.className = "error-state";
  const heading = document.createElement("h2");
  heading.textContent = "We couldn't load the collection.";
  const message = document.createElement("p");
  message.textContent = "Check that you're using a local web server and try refreshing the page.";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "btn btn-secondary";
  retry.textContent = "Try again";
  retry.addEventListener("click", () => { initializePage().catch((reason) => showProductLoadError(container, reason)); }, { once: true });
  state.append(heading, message, retry);
  container.append(state);
  const count = document.querySelector("[data-product-count]");
  if (count) count.textContent = "Products unavailable";
}

function bindInteractions() {
  const getMatchedElement = (event, selector) => {
    if (event.currentTarget instanceof Element && event.currentTarget !== document) return event.currentTarget;
    return event.target instanceof Element ? event.target.closest(selector) : null;
  };
  const clickSelector = '[data-add-to-cart], [data-quantity-change], [data-remove-product], [data-clear-cart], a[href*="#"]';
  const handleClick = (event) => {
    const target = getMatchedElement(event, clickSelector);
    if (!target) return;

    if (target.matches("[data-add-to-cart]")) addToCart(target.dataset.addToCart);
    else if (target.matches("[data-quantity-change]")) updateQuantity(target.dataset.productId, Number(target.dataset.quantityChange));
    else if (target.matches("[data-remove-product]")) removeFromCart(target.dataset.removeProduct);
    else if (target.matches("[data-clear-cart]")) {
      if (readCart().length && window.confirm("Clear every item from your bag?")) {
        saveCart([]);
        renderCart();
        showNotification("Your bag is now empty.", "success");
      }
    } else {
      const targetUrl = new URL(target.href, window.location.href);
      const section = document.querySelector(targetUrl.hash);
      if (targetUrl.pathname === window.location.pathname && targetUrl.hash && section) {
        event.preventDefault();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) section.scrollIntoView();
        else section.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", targetUrl.hash);
      }
    }

    if (target.matches("[data-add-to-cart], [data-quantity-change], [data-remove-product]")) {
      window.setTimeout(() => installImageFallbacks(document), 0);
    }
  };
  const handleInput = (event) => {
    if (getMatchedElement(event, "#product-search")) {
      filterProducts(document.querySelector("#category-filter")?.value || "all");
    }
  };
  const handleChange = (event) => {
    const target = getMatchedElement(event, "#category-filter, #price-sort");
    if (!target) return;
    if (target.matches("#category-filter")) filterProducts(target.value);
    else sortProducts(target.value);
  };
  const handleSubmit = (event) => {
    const form = getMatchedElement(event, "[data-newsletter], [data-checkout-form]");
    if (!form) return;
    event.preventDefault();

    if (form.matches("[data-newsletter]")) {
      const input = form.elements.email;
      const message = document.querySelector("#newsletter-message");
      input.value = input.value.trim();
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
      try {
        const existing = JSON.parse(localStorage.getItem(NEWSLETTER_STORAGE_KEY) || "[]");
        const emails = Array.isArray(existing) ? existing.filter((email) => typeof email === "string") : [];
        if (!emails.includes(input.value.toLowerCase())) emails.push(input.value.toLowerCase());
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify(emails));
        if (message) message.textContent = "Thanks! This address was saved in this browser for the demo only.";
        form.reset();
        showNotification("You're on the local demo list.", "success");
      } catch (error) {
        console.error("Unable to save the local newsletter demo signup:", error);
        if (message) message.textContent = "Browser storage is unavailable, so this signup was not saved.";
        showNotification("Browser storage is unavailable; signup not saved.", "error");
      }
      return;
    }

    const message = document.querySelector("[data-checkout-message]");
    if (!readCart().length) {
      if (message) {
        message.hidden = false;
        message.className = "checkout-message error";
        message.textContent = "Add something to your bag before placing a demo order.";
      }
      return;
    }
    if (!validateForm(form)) {
      if (message) {
        message.hidden = false;
        message.className = "checkout-message error";
        message.textContent = "Please correct the highlighted details before continuing.";
      }
      return;
    }
    const submit = form.querySelector("[type=submit]");
    if (submit.disabled) return;
    submit.disabled = true;
    if (saveCart([])) {
      form.reset();
      form.hidden = true;
      renderCart();
      if (message) {
        message.hidden = false;
        message.className = "checkout-message success";
        message.textContent = "Demo order confirmed. No payment was processed and your details were not saved.";
      }
      showNotification("Your simulated order is confirmed.", "success");
    }
    submit.disabled = false;
  };

  if (window.jQuery) {
    const $document = window.jQuery(document);
    $document.off(".shopEasy");
    $document.on("click.shopEasy", clickSelector, handleClick);
    $document.on("input.shopEasy", "#product-search", handleInput);
    $document.on("change.shopEasy", "#category-filter, #price-sort", handleChange);
    $document.on("submit.shopEasy", "[data-newsletter], [data-checkout-form]", handleSubmit);
    return;
  }
  if (nativeInteractionsBound) return;
  nativeInteractionsBound = true;
  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);
  document.addEventListener("submit", handleSubmit);
}

async function initializePage() {
  const page = document.body.dataset.page;
  bindInteractions();
  installImageFallbacks(document);
  try {
    await loadProducts();
    if (page === "products") {
      populateCategories();
      filterProducts();
      installImageFallbacks(document);
    } else if (page === "home") {
      displayProducts(allProducts.slice(0, 4), document.querySelector("[data-featured-products]"));
      installImageFallbacks(document);
    } else if (page === "cart") {
      renderCart();
      installImageFallbacks(document);
    }
    updateCartCount();
  } catch (error) {
    showProductLoadError(document.querySelector("[data-product-grid]") || document.querySelector("[data-featured-products]"), error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializePage();
});
