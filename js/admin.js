import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { checkAuth, logout } from './auth.js';

console.log('admin.js cargado correctamente');

let products = []; // IMPORTANTE: Declarar la variable aquí al inicio
let currentEditId = null;

// Verificar autenticación de forma asíncrona
(async () => {
    const isAuth = await checkAuth();
    console.log('Usuario autenticado:', isAuth);
    
    if (!isAuth) {
        console.log('Redirigiendo a login...');
        window.location.href = 'login.html';
        return;
    }
    
    // Inicializar admin después de verificar autenticación
    initializeAdmin();
})();

function initializeAdmin() {
    console.log('Inicializando panel de administración...');
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Cerrando sesión...');
            logout();
        });
    }

    // Navigation
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
            
            if (targetSection === 'products') {
                document.getElementById('productsSection').classList.add('active');
            } else if (targetSection === 'add-product') {
                document.getElementById('addProductSection').classList.add('active');
            }
        });
    });

    // Image preview
    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('input', (e) => {
            const imageUrl = e.target.value;
            if (imageUrl) {
                document.getElementById('previewImg').src = imageUrl;
                document.getElementById('imagePreview').style.display = 'block';
            }
        });
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            resetForm();
        });
    }

    // Delete modal buttons
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
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
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            document.getElementById('deleteModal').classList.remove('active');
            currentEditId = null;
        });
    }

    // Product form submit
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('productName').value.trim(),
                order: parseInt(document.getElementById('productOrder').value) || 999,
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
    }

    // Cargar productos al iniciar
    loadProducts();
}

async function loadProducts() {
    console.log('Cargando productos...');
    try {
        const productsRef = collection(db, 'products');
        
        // Intentar primero con order, si falla usar sin ordenar
        let querySnapshot;
        try {
            const q = query(productsRef, orderBy('order', 'asc'));
            querySnapshot = await getDocs(q);
            console.log('Productos ordenados por campo "order"');
        } catch (orderError) {
            console.log('Campo "order" no existe o sin índice, cargando sin ordenar...');
            querySnapshot = await getDocs(productsRef);
        }
        
        products = []; // Limpiar el array
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Ordenar manualmente por order si existe, sino por nombre
        products.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            } else if (a.order !== undefined) {
                return -1;
            } else if (b.order !== undefined) {
                return 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });
        
        console.log('Productos cargados:', products.length);
        displayProductsTable(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        document.getElementById('productsTableBody').innerHTML = `
            <tr><td colspan="6" class="loading-row">Error: ${error.message}</td></tr>
        `;
    }
}

function displayProductsTable(productsArray) {
    const tbody = document.getElementById('productsTableBody');
    
    if (!tbody) {
        console.error('No se encontró el elemento productsTableBody');
        return;
    }
    
    if (productsArray.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="loading-row">No hay productos</td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = productsArray.map(product => `
        <tr>
            <td style="text-align: center; font-weight: 600; color: var(--color5);">${product.order || '999'}</td>
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
    if (!product) {
        console.error('Producto no encontrado:', productId);
        return;
    }
    
    currentEditId = productId;
    
    document.getElementById('productId').value = productId;
    document.getElementById('productName').value = product.name;
    document.getElementById('productOrder').value = product.order || 999;
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
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    
    navItems.forEach(nav => nav.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    navItems[1].classList.add('active');
    document.getElementById('addProductSection').classList.add('active');
}

function confirmDelete(productId) {
    currentEditId = productId;
    document.getElementById('deleteModal').classList.add('active');
}

function resetForm() {
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
    }
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('submitBtn').textContent = 'Guardar Producto';
    currentEditId = null;
}

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