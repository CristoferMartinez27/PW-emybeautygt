import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { checkAuth, logout } from './auth.js';

console.log('admin.js cargado correctamente');

const isAuth = checkAuth();
console.log('Usuario autenticado:', isAuth);

if (!isAuth) {
    console.log('Redirigiendo a login...');
    throw new Error('No autorizado');
}

let currentEditId = null;
let products = [];

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        console.log('Cerrando sesión...');
        logout();
    });
}

const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.admin-section');

console.log('Nav items:', navItems.length, 'Secciones:', sections.length);

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = item.dataset.section;
        console.log('Clic en sección:', targetSection);
        
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        
        item.classList.add('active');
        
        // Mapeo directo
        if (targetSection === 'products') {
            document.getElementById('productsSection').classList.add('active');
        } else if (targetSection === 'add-product') {
            document.getElementById('addProductSection').classList.add('active');
        }
        
        console.log('Sección activada');
    });
});

async function loadProducts() {
    console.log('Cargando productos...');
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Productos cargados:', products.length);
        displayProductsTable(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('productsTableBody').innerHTML = `
            <tr><td colspan="5" class="loading-row">Error: ${error.message}</td></tr>
        `;
    }
}

function displayProductsTable(productsArray) {
    const tbody = document.getElementById('productsTableBody');
    
    if (productsArray.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="loading-row">No hay productos</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = productsArray.map(product => `
        <tr>
            <td class="product-img-cell">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/60?text=Sin+Imagen'">
            </td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.category)}</td>
            <td>Q ${parseFloat(product.price).toFixed(2)}</td>
            <td class="product-actions">
                <button class="btn-edit" data-id="${product.id}">Editar</button>
                <button class="btn-delete" data-id="${product.id}">Eliminar</button>
            </td>
        </tr>
    `).join('');
    
    attachActionListeners();
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

function attachActionListeners() {
    const editButtons = document.querySelectorAll('.btn-edit');
    const deleteButtons = document.querySelectorAll('.btn-delete');
    
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            editProduct(e.target.dataset.id);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            confirmDelete(e.target.dataset.id);
        });
    });
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentEditId = productId;
    
    document.getElementById('productId').value = productId;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productDescription').value = product.description;
    
    document.getElementById('formTitle').textContent = 'Editar Producto';
    document.getElementById('submitBtn').textContent = 'Actualizar Producto';
    
    const previewImg = document.getElementById('previewImg');
    previewImg.src = product.image;
    document.getElementById('imagePreview').style.display = 'block';
    
    // Cambiar a la sección de formulario
    navItems.forEach(nav => nav.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    navItems[1].classList.add('active');
    document.getElementById('addProductSection').classList.add('active');
}

function confirmDelete(productId) {
    currentEditId = productId;
    document.getElementById('deleteModal').classList.add('active');
}

document.getElementById('confirmDelete').addEventListener('click', async () => {
    if (!currentEditId) return;
    
    try {
        await deleteDoc(doc(db, 'products', currentEditId));
        document.getElementById('deleteModal').classList.remove('active');
        currentEditId = null;
        await loadProducts();
        showNotification('Producto eliminado', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar: ' + error.message, 'error');
    }
});

document.getElementById('cancelDelete').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.remove('active');
    currentEditId = null;
});

document.getElementById('productImage').addEventListener('input', (e) => {
    const imageUrl = e.target.value;
    if (imageUrl) {
        document.getElementById('previewImg').src = imageUrl;
        document.getElementById('imagePreview').style.display = 'block';
    }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submitBtn').textContent = 'Guardar Producto';
    currentEditId = null;
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        image: document.getElementById('productImage').value.trim(),
        description: document.getElementById('productDescription').value.trim()
    };
    
    console.log('Guardando producto:', productData);
    
    try {
        const productId = document.getElementById('productId').value;
        
        if (productId) {
            await updateDoc(doc(db, 'products', productId), productData);
            showNotification('Producto actualizado', 'success');
        } else {
            const docRef = await addDoc(collection(db, 'products'), productData);
            console.log('Producto creado:', docRef.id);
            showNotification('Producto agregado', 'success');
        }
        
        resetForm();
        await loadProducts();
        
        // Volver a la lista de productos
        navItems.forEach(nav => nav.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        
        navItems[0].classList.add('active');
        document.getElementById('productsSection').classList.add('active');
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error: ' + error.message, 'error');
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

loadProducts();