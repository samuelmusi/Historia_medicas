/* ===== CARGA DINÁMICA DE COMPONENTES ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en dashboard.html, evitar volver al login con el botón atrás
    if (window.location.pathname.endsWith('dashboard.html')) {
        history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', function(event) {
            history.pushState(null, '', window.location.href);
        });
    }
    loadComponent('sidebar',  'components/sidebar.html');
    loadComponent('header',   'components/header.html');
    loadComponent('footer',   'components/footer.html');
});

// frontend/js/main.js
const base = window.location.origin + '/Historia_medicas/';

function loadComponent(id, path) {
    fetch(base + 'frontend/' + path)
        .then(r => r.text())
        .then(html => {
            document.getElementById(id).innerHTML = html;
            if (id === 'sidebar') sidebarPostLoad();
            if (id === 'header')  headerPostLoad();
        });
}

/* ===== LÓGICA SIDEBAR ===== */
function sidebarPostLoad() {
    // Delegación de eventos sobre el aside#sidebar para asegurar funcionalidad
    const sidebarAside = document.getElementById('sidebar');
    if (sidebarAside) {
        sidebarAside.addEventListener('click', function(e) {
            // Buscar el enlace con id logout-sidebar dentro del sidebar
            let target = e.target;
            // Si el click fue en el icono o span, subir hasta el <a>
            if (target && target.id !== 'logout-sidebar') {
                target = target.closest('a#logout-sidebar');
            }
            if (target && target.id === 'logout-sidebar') {
                e.preventDefault();
                cerrarSesion();
            }
        });
    }
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const menuBtn = document.getElementById('menu-toggle');

    // Colapsar/expandir
    toggleBtn?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    menuBtn?.addEventListener('click',   () => sidebar.classList.toggle('collapsed'));
}

/* ===== LÓGICA HEADER ===== */
function headerPostLoad() {
    // Botón cerrar sesión en header (dropdown notificaciones)
    const logoutHeaderBtn = document.getElementById('logout-header');
    if (logoutHeaderBtn) {
        logoutHeaderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cerrarSesion();
        });
    }
// Función para cerrar sesión
function cerrarSesion() {
    // Detectar ruta relativa para fetch correcto
    let logoutUrl = '';
    if (window.location.pathname.includes('/frontend/')) {
        logoutUrl = '../backend/auth/logout.php';
    } else {
        logoutUrl = 'backend/auth/logout.php';
    }
    fetch(logoutUrl, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Limpiar historial para no poder volver atrás
                window.location.href = 'login.html';
                setTimeout(() => {
                    window.location.replace('login.html');
                }, 100);
            } else {
                alert('Error al cerrar sesión.');
            }
        })
        .catch(() => alert('Error de red al cerrar sesión.'));
}
    const themeBtn = document.getElementById('theme-toggle');
    const notifBtn = document.getElementById('notification-btn');
    const dropdown = document.getElementById('notification-dropdown');

    // Cambiar tema
    themeBtn?.addEventListener('click', toggleTheme);

    // Mostrar/ocultar notificaciones
    notifBtn?.addEventListener('click', () => dropdown.classList.toggle('hidden'));

    // Cerrar dropdown si se hace clic fuera
    document.addEventListener('click', e => {
        if (!e.target.closest('.notification-wrapper')) dropdown?.classList.add('hidden');
    });
}

/* ===== FUNCIONES AUXILIARES ===== */
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = document.body.classList.contains('dark')
            ? 'fas fa-sun'
            : 'fas fa-moon';
    }
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

(function restoreTheme() {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
})();











