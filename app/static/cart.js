const CART_STORAGE_KEY = 'nf_cart';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(slug, variant, quantity) {
    quantity = quantity || 1;
    const cart = getCart();
    const existing = cart.find(item => item.slug === slug && item.variant === variant);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ slug, variant, quantity });
    }
    saveCart(cart);
}

function removeFromCart(slug, variant) {
    saveCart(getCart().filter(item => !(item.slug === slug && item.variant === variant)));
}

function setCartQuantity(slug, variant, quantity) {
    if (quantity <= 0) {
        removeFromCart(slug, variant);
        return;
    }
    const cart = getCart();
    const item = cart.find(i => i.slug === slug && i.variant === variant);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
    }
}

function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartBadge();
}

function cartItemCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = cartItemCount();
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.hidden = false;
    } else {
        badge.hidden = true;
    }
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
