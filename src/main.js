import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];
let categories = [];
let currentCategory = 'all';

async function loadCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error loading categories:', error);
    return;
  }

  categories = data;
}

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading products:', error);
    return;
  }

  allProducts = data;
  
 
  displayProducts();
}

function displayProducts() {
  const featuredContainer = document.getElementById('featuredGrid');
  const allProductsContainer = document.getElementById('allProducts');

  let filteredProducts = allProducts;

  if (currentCategory !== 'all') {
    filteredProducts = allProducts.filter(
      product => product.categories?.slug === currentCategory
    );
  }

  const featuredProducts = filteredProducts.filter(product => product.featured);

  featuredContainer.innerHTML = featuredProducts.length > 0
    ? featuredProducts.map(createProductCard).join('')
    : '<div class="loading">No hay productos destacados</div>';

  allProductsContainer.innerHTML = filteredProducts.length > 0
    ? filteredProducts.map(createProductCard).join('')
    : '<div class="loading">No hay productos disponibles</div>';

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      addToCart(productId);
    });
  });

 
  const featuredGridEl = document.getElementById('featuredGrid');
  const prevBtn = document.getElementById('featuredPrev');
  const nextBtn = document.getElementById('featuredNext');

  if (featuredGridEl) {
    const scrollAmount = Math.round(featuredGridEl.clientWidth * 0.8) || 300;

    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.preventDefault();
        featuredGridEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        featuredGridEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      };
    }
  }
}

function createProductCard(product) {
  return `
    <div class="product-card">
      <img src="${product.image_url}" alt="${product.name}" class="product-image">
      <div class="product-info">
        <div class="product-category">${product.categories?.name || 'Sin categoría'}</div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
          <button class="add-to-cart-btn" data-product-id="${product.id}">
            <i class="fas fa-cart-plus"></i> Agregar
          </button>
        </div>
      </div>
    </div>
  `;
}

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  updateCartCount();
  showNotification('Producto agregado al carrito');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartCount();
  displayCart();
}

function updateQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
    displayCart();
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function displayCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  const totalAmount = document.getElementById('totalAmount');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart">Tu carrito está vacío</div>';
    totalAmount.textContent = '$0.00';
    checkoutBtn.disabled = true;
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartItemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)} c/u</div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="window.updateQuantity('${item.id}', -1)">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="window.updateQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="remove-btn" onclick="window.removeFromCart('${item.id}')">Eliminar</button>
        </div>
      </div>
    </div>
  `).join('');

  totalAmount.textContent = `$${total.toFixed(2)}`;
  checkoutBtn.disabled = false;
}

function openCartModal() {
  displayCart();
  document.getElementById('cartModal').classList.add('active');
}

function closeCartModal() {
  document.getElementById('cartModal').classList.remove('active');
}

function openCheckoutModal() {
  const summaryItems = document.getElementById('summaryItems');
  const checkoutTotal = document.getElementById('checkoutTotal');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  summaryItems.innerHTML = cart.map(item => `
    <div class="summary-item">
      <span class="summary-item-name">${item.name}</span>
      <span class="summary-item-quantity">x${item.quantity}</span>
      <span class="summary-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  checkoutTotal.textContent = `$${total.toFixed(2)}`;

  closeCartModal();
  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

async function processOrder(customerData) {
  try {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        total_amount: total,
        status: 'pending'
      })
      .select()
      .maybeSingle();

    if (orderError) throw orderError;

    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    cart = [];
    saveCart();
    updateCartCount();

    closeCheckoutModal();
    document.getElementById('successModal').classList.add('active');
  } catch (error) {
    console.error('Error processing order:', error);
    alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
  }
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
}

function sortProducts(sortBy) {
  switch (sortBy) {
    case 'price-asc':
      allProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-desc':
      allProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case 'name-asc':
      allProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      allProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  displayProducts();
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--gradient);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 1001;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadProducts();
  updateCartCount();

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      currentCategory = link.dataset.category;
      displayProducts();
    });
  });

  document.querySelector('.nav-link[data-category="all"]').classList.add('active');

  document.getElementById('cartBtn').addEventListener('click', openCartModal);
  document.getElementById('closeCartBtn').addEventListener('click', closeCartModal);
  document.getElementById('modalOverlay').addEventListener('click', closeCartModal);

  document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);
  document.getElementById('closeCheckoutBtn').addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutOverlay').addEventListener('click', closeCheckoutModal);

  document.getElementById('closeSuccessBtn').addEventListener('click', closeSuccessModal);
  document.getElementById('successOverlay').addEventListener('click', closeSuccessModal);

  document.getElementById('sortFilter').addEventListener('change', (e) => {
    sortProducts(e.target.value);
  });

  document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await processOrder({
      name: formData.get('customerName'),
      email: formData.get('customerEmail'),
      phone: formData.get('customerPhone')
    });
    e.target.reset();
  });
});

window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);