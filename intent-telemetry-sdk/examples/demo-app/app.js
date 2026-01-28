/**
 * Demo Application - Showcases Intent SDK
 */

// Product catalog
const products = [
    { id: 1, name: 'Wireless Headphones', price: 79.99, image: '🎧' },
    { id: 2, name: 'Smart Watch', price: 199.99, image: '⌚' },
    { id: 3, name: 'Laptop Stand', price: 49.99, image: '💻' },
    { id: 4, name: 'USB-C Hub', price: 39.99, image: '🔌' },
    { id: 5, name: 'Wireless Mouse', price: 29.99, image: '🖱️' },
    { id: 6, name: 'Mechanical Keyboard', price: 129.99, image: '⌨️' },
];

// Application state
let cart = [];
let currentSection = 'home';
let sessionId = null;

// Initialize Intent SDK
if (typeof IntentSDK !== 'undefined') {
    const sdk = IntentSDK.IntentSDK.init({
        endpoint: 'http://localhost:8000/api/v1/events/batch',
        debug: true,
        enableAutoTracking: true,
        batchSize: 10,
        flushInterval: 15000, // 15 seconds for demo
    });

    sessionId = sdk.getSessionId();
    console.log('📊 Intent SDK initialized with session:', sessionId);
} else {
    console.warn('Intent SDK not loaded, running in demo mode');
}

// Navigation
function navigateTo(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach((s) => {
        s.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = section;

        // Update URL hash
        window.location.hash = section;
    }
}

// Handle hash navigation
window.addEventListener('hashchange', () => {
    const section = window.location.hash.slice(1) || 'home';
    navigateTo(section);
});

// Load products
function loadProducts() {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = products
        .map(
            (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-emoji">${product.image}</div>
      <h3>${product.name}</h3>
      <p class="product-price">$${product.price}</p>
      <button class="btn btn-primary" onclick="addToCart(${product.id})">
        Add to Cart
      </button>
    </div>
  `
        )
        .join('');
}

// Add to cart
function addToCart(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    cart.push({ ...product, quantity: 1 });
    updateCart();

    // Show feedback
    showToast(`Added ${product.name} to cart!`);
}

// Update cart display
function updateCart() {
    const cartCount = document.getElementById('cart-count');
    cartCount.textContent = cart.length;

    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.style.display = 'none';
    } else {
        cartItems.innerHTML = cart
            .map(
                (item, index) => `
      <div class="cart-item">
        <span class="cart-item-emoji">${item.image}</span>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>$${item.price}</p>
        </div>
        <button class="btn btn-sm" onclick="removeFromCart(${index})">Remove</button>
      </div>
    `
            )
            .join('');

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('total-amount').textContent = total.toFixed(2);
        cartTotal.style.display = 'block';
    }
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// Checkout form
document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    // Simulate processing
    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    setTimeout(() => {
        // Simulate error for demo
        if (Math.random() > 0.5) {
            showToast('❌ Payment failed. Please try again.', 'error');
            btn.textContent = 'Complete Purchase';
            btn.disabled = false;
        } else {
            showToast('✅ Order placed successfully!', 'success');
            cart = [];
            updateCart();
            navigateTo('home');
            btn.textContent = 'Complete Purchase';
            btn.disabled = false;
        }
    }, 2000);
});

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Demo scenarios
function simulateHappyPath() {
    showToast('🎯 Simulating happy path...');

    setTimeout(() => navigateTo('products'), 500);
    setTimeout(() => addToCart(1), 1500);
    setTimeout(() => addToCart(2), 2500);
    setTimeout(() => navigateTo('cart'), 3500);
    setTimeout(() => {
        showToast('✅ Happy path complete! Check insights in ~30 seconds.');
    }, 4500);
}

function simulateFriction() {
    showToast('⚠️ Simulating friction scenario...');

    // Rapid clicks to simulate confusion
    setTimeout(() => navigateTo('products'), 500);
    setTimeout(() => {
        const btn = document.querySelector('.product-card button');
        for (let i = 0; i < 5; i++) {
            setTimeout(() => btn?.click(), i * 100);
        }
    }, 1500);

    // Navigation reversal
    setTimeout(() => navigateTo('checkout'), 3000);
    setTimeout(() => navigateTo('products'), 3500);

    // Form abandonment
    setTimeout(() => {
        addToCart(1);
        navigateTo('cart');
    }, 5000);
    setTimeout(() => navigateTo('checkout'), 6000);
    setTimeout(() => {
        document.getElementById('name').value = 'John';
        document.getElementById('email').value = 'john@example.com';
    }, 7000);
    setTimeout(() => navigateTo('home'), 8000);
    setTimeout(() => {
        showToast('✅ Friction scenario complete! Check insights in ~30 seconds.');
    }, 9000);
}

async function viewInsights() {
    if (!sessionId) {
        showToast('❌ SDK not initialized', 'error');
        return;
    }

    const modal = document.getElementById('insights-modal');
    const content = document.getElementById('insights-content');

    modal.style.display = 'block';
    content.innerHTML = '<p>Loading insights...</p>';

    try {
        // Flush events first
        if (typeof IntentSDK !== 'undefined') {
            await IntentSDK.IntentSDK.getInstance()?.flush();
        }

        // Wait a bit for processing
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch insights
        const response = await fetch(
            `http://localhost:8000/api/v1/insights/${sessionId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const insights = await response.json();

        // Display insights
        content.innerHTML = `
      <div class="insights-section">
        <h3>🎯 Inferred Intent</h3>
        ${insights.intent_hypotheses
                .map(
                    (h) => `
          <div class="insight-item">
            <strong>${h.hypothesis}</strong>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${h.confidence * 100}%"></div>
            </div>
            <p class="confidence-text">Confidence: ${(h.confidence * 100).toFixed(0)}%</p>
            <ul class="evidence-list">
              ${h.supporting_evidence.map((e) => `<li>${e}</li>`).join('')}
            </ul>
          </div>
        `
                )
                .join('')}
      </div>

      <div class="insights-section">
        <h3>⚠️ Friction Patterns</h3>
        ${insights.friction_patterns.length > 0
                ? insights.friction_patterns
                    .map(
                        (f) => `
          <div class="friction-item">
            <strong>${f.pattern_type.replace(/_/g, ' ').toUpperCase()}</strong>
            <p>${f.description}</p>
            <span class="severity severity-${f.severity > 0.7 ? 'high' : f.severity > 0.4 ? 'medium' : 'low'
                            }">
              Severity: ${(f.severity * 100).toFixed(0)}%
            </span>
          </div>
        `
                    )
                    .join('')
                : '<p>No friction detected</p>'
            }
      </div>

      <div class="insights-section">
        <h3>💡 Recommendations</h3>
        <ul class="recommendations-list">
          ${insights.recommendations.map((r) => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="insights-section">
        <p><strong>Overall Confidence:</strong> ${(insights.confidence_score * 100).toFixed(0)}%</p>
      </div>
    `;
    } catch (error) {
        content.innerHTML = `
      <p class="error">Failed to load insights: ${error.message}</p>
      <p>Make sure the intelligence server is running on http://localhost:8000</p>
    `;
    }
}

function closeInsights() {
    document.getElementById('insights-modal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('insights-modal');
    if (e.target === modal) {
        closeInsights();
    }
});

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCart();

    // Navigate to hash if present
    if (window.location.hash) {
        navigateTo(window.location.hash.slice(1));
    }
});
