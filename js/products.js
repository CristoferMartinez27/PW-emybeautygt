import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { addToCart } from './cart.js';

let allProducts = [];
let currentCategory = 'all';

async function loadProducts() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        allProducts = [];
        querySnapshot.forEach((doc) => {
            allProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="loading">Error al cargar productos. Por favor, intente nuevamente.</div>
        `;
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="loading">No hay productos disponibles en esta categoría.</div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x250?text=Sin+Imagen'">
            <div class="product-info">
                <div class="product-category">${getCategoryName(product.category)}</div>
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">Q ${parseFloat(product.price).toFixed(2)}</span>
                    <button class="btn-add-cart" data-id="${product.id}">Agregar</button>
                </div>
            </div>
        </div>
    `).join('');
    
    const addButtons = document.querySelectorAll('.btn-add-cart');
    addButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                addToCart(product);
                showNotification('Producto agregado al carrito');
            }
        });
    });
}

function getCategoryName(category) {
    const categories = {
        'labiales': 'Labiales',
        'bases': 'Bases',
        'polvos': 'Polvos',
        'delineadores': 'Delineadores',
        'sombras': 'Sombras',
        'shampoos': 'Shampoos/Acondicionadores'
    };
    return categories[category] || category;
}

function filterByCategory(category) {
    currentCategory = category;
    if (category === 'all') {
        displayProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #f7a29e;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
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
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 2000);
}

const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });
}

const categoryLinks = document.querySelectorAll('[data-category]');
categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = e.target.dataset.category;
        filterByCategory(category);
        
        if (categoryFilter) {
            categoryFilter.value = category;
        }
        
        window.scrollTo({ top: 400, behavior: 'smooth' });
    });
});

loadProducts();