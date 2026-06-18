// Global variables
let currentCategory = 'all';
let menuData = null;
let cart = [];

// Load menu on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
});

// Fetch and display menu
async function loadMenu() {
    try {
        const response = await fetch('/api/menu');
        menuData = await response.json();
        renderMenu('all');
    } catch (error) {
        console.error('Error loading menu:', error);
        showNotification('Failed to load menu. Please refresh.', 'error');
    }
}

// Render menu items
function renderMenu(categoryId) {
    const container = document.getElementById('menuContainer');
    container.innerHTML = '';
    
    if (!menuData) {
        container.innerHTML = '<p>Loading menu...</p>';
        return;
    }
    
    let items = [];
    let categoryName = '';
    
    if (categoryId === 'all') {
        menuData.categories.forEach(cat => {
            cat.items.forEach(item => {
                items.push({ ...item, category: cat.name });
            });
        });
    } else {
        const category = menuData.categories.find(c => c.id === categoryId);
        if (category) {
            items = category.items.map(item => ({ ...item, category: category.name }));
            categoryName = category.name;
        }
    }
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;font-size:1.2rem;">No items found</p>';
        return;
    }
    
    items.forEach(item => {
        const card = createMenuCard(item);
        container.appendChild(card);
    });
}

// Create a menu card element
function createMenuCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    
    const tags = [];
    if (item.spicy) tags.push('<span class="tag tag-spicy">🌶️ Spicy</span>');
    if (item.vegetarian) tags.push('<span class="tag tag-veg">🌱 Vegetarian</span>');
    
    card.innerHTML = `
        <div class="menu-card-content">
            <div class="menu-card-header">
                <h3>${item.name}</h3>
                <span class="price">$${item.price.toFixed(2)}</span>
            </div>
            <p class="description">${item.description}</p>
            <div class="tags">
                ${tags.join('')}
                ${item.category ? `<span class="tag" style="background:#e8e8e8;color:#666;">${item.category}</span>` : ''}
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                Add to Cart
            </button>
        </div>
    `;
    
    return card;
}

// Filter by category
function filterCategory(categoryId) {
    currentCategory = categoryId;
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryId) {
            btn.classList.add('active');
        }
    });
    
    renderMenu(categoryId);
}

// Search menu
async function searchMenu() {
    const query = document.getElementById('searchInput').value.trim();
    const container = document.getElementById('menuContainer');
    
    if (!query) {
        renderMenu(currentCategory);
        return;
    }
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        container.innerHTML = '';
        if (data.results.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;font-size:1.2rem;">No items found matching your search</p>';
            return;
        }
        
        data.results.forEach(item => {
            const card = createMenuCard(item);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed', 'error');
    }
}

// Add item to cart
async function addToCart(itemId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ item_id: itemId, quantity: 1 })
        });
        
        const data = await response.json();
        if (response.ok) {
            // Update cart count
            document.getElementById('cart-count').textContent = data.cart_count;
            showNotification('Item added to cart! 🎉', 'success');
            // Refresh cart display
            loadCart();
        } else {
            showNotification(data.error || 'Failed to add item', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showNotification('Failed to add item to cart', 'error');
    }
}

// Load cart
async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        const data = await response.json();
        cart = data.items;
        
        // Update cart count
        document.getElementById('cart-count').textContent = data.count;
        
        // Update cart display if sidebar is open
        const sidebar = document.getElementById('cartSidebar');
        if (sidebar.classList.contains('open')) {
            renderCartItems();
        }
    } catch (error) {
        console.error('Load cart error:', error);
    }
}

// Render cart items in sidebar
function renderCartItems() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        totalElement.textContent = '$0.00';
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalElement.textContent = `$${total.toFixed(2)}`;
}

// Remove item from cart
async function removeFromCart(itemId) {
    try {
        const response = await fetch(`/api/cart/item/${itemId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (response.ok) {
            document.getElementById('cart-count').textContent = data.cart_count;
            document.getElementById('cartTotal').textContent = `$${data.total.toFixed(2)}`;
            // Reload cart
            await loadCart();
            renderCartItems();
            showNotification('Item removed from cart', 'success');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showNotification('Failed to remove item', 'error');
    }
}

// Clear cart
async function clearCart() {
    if (!confirm('Clear your entire cart?')) return;
    
    try {
        const response = await fetch('/api/cart', {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (response.ok) {
            document.getElementById('cart-count').textContent = '0';
            await loadCart();
            renderCartItems();
            showNotification('Cart cleared', 'success');
        }
    } catch (error) {
        console.error('Clear cart error:', error);
        showNotification('Failed to clear cart', 'error');
    }
}

// Toggle cart sidebar
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
    
    if (sidebar.classList.contains('open')) {
        renderCartItems();
    }
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    showNotification(`Order placed! Total: $${total.toFixed(2)}`, 'success');
    clearCart();
    setTimeout(() => {
        toggleCart();
    }, 500);
}

// Show notification
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Enter key for search
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchMenu();
    }
});

// Load cart on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
});
