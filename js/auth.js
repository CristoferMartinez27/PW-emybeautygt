import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Solo ejecutar esto si estamos en la página de login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        // Deshabilitar botón mientras se procesa
        submitButton.disabled = true;
        submitButton.textContent = 'Iniciando sesión...';
        
        try {
            // Intentar iniciar sesión con Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Usuario autenticado:', userCredential.user.email);
            
            // Guardar sesión
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminLoginTime', Date.now().toString());
            
            // Redirigir al panel admin
            window.location.href = 'admin.html';
            
        } catch (error) {
            console.error('Error de autenticación:', error.code, error.message);
            
            let errorText = 'Error al iniciar sesión';
            
            // Mensajes de error personalizados
            switch (error.code) {
                case 'auth/invalid-email':
                    errorText = 'Correo electrónico inválido';
                    break;
                case 'auth/user-not-found':
                    errorText = 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorText = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-credential':
                    errorText = 'Credenciales inválidas';
                    break;
                case 'auth/too-many-requests':
                    errorText = 'Demasiados intentos. Intenta más tarde';
                    break;
                default:
                    errorText = 'Error al iniciar sesión';
            }
            
            errorMessage.textContent = errorText;
            errorMessage.style.display = 'block';
            
            // Habilitar botón nuevamente
            submitButton.disabled = false;
            submitButton.textContent = 'Iniciar Sesión';
            
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    });
}

export function checkAuth() {
    return new Promise((resolve) => {
        // Verificar si hay sesión activa
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Usuario autenticado
                const loginTime = sessionStorage.getItem('adminLoginTime');
                
                if (!loginTime) {
                    sessionStorage.setItem('adminLoginTime', Date.now().toString());
                }
                
                // Verificar timeout de 4 horas
                const currentTime = Date.now();
                const elapsedTime = currentTime - parseInt(loginTime || currentTime);
                const fourHours = 4 * 60 * 60 * 1000;
                
                if (elapsedTime > fourHours) {
                    // Sesión expirada
                    logout();
                    resolve(false);
                } else {
                    resolve(true);
                }
            } else {
                // No hay usuario autenticado
                if (window.location.pathname.includes('admin.html')) {
                    window.location.href = 'login.html';
                }
                resolve(false);
            }
        });
    });
}

export async function logout() {
    try {
        await signOut(auth);
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminLoginTime');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Forzar logout local aunque falle Firebase
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminLoginTime');
        window.location.href = 'login.html';
    }
}