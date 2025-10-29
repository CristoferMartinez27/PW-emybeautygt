import { auth } from './firebase-config.js';

const ADMIN_CREDENTIALS = {
    username: 'adminis',
    password: 'EmyMART1908#'
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminLoginTime', Date.now().toString());
        window.location.href = 'admin.html';
    } else {
        errorMessage.textContent = 'Usuario o contraseña incorrectos';
        errorMessage.style.display = 'block';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});

export function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    const loginTime = sessionStorage.getItem('adminLoginTime');
    
    if (!isAuthenticated || !loginTime) {
        window.location.href = 'login.html';
        return false;
    }
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - parseInt(loginTime);
    const fourHours = 4 * 60 * 60 * 1000;
    
    if (elapsedTime > fourHours) {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminLoginTime');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

export function logout() {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminLoginTime');
    window.location.href = 'login.html';
}