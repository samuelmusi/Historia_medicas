/* ===== DATOS DEL USUARIO Y RELOJ ===== */
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    setInterval(actualizarReloj, 1000);
});

/* Cargar nombre y foto desde sesión PHP */
async function cargarDatosUsuario() {
    try {
        const res = await fetch('../backend/auth/get_user_session.php');
        const data = await res.json();

        if (data.success) {
            const { nombre_completo, foto_perfil } = data.user;

            // Nombre completo
            document.getElementById('userName').textContent = nombre_completo;
            document.getElementById('miniUserName').textContent = nombre_completo.split(' ')[0];

            // Foto de perfil
            const pic = foto_perfil
                ? `../backend/uploads/perfiles/${foto_perfil}`
                : 'img/background/default-avatar.png';
            document.getElementById('profilePic').src = pic;
        } else {
            // No hay sesión
            window.location.replace('login.html');
        }
    } catch (err) {
        console.error(err);
        window.location.href = 'login.html';
    }
}

/* Mostrar fecha y hora en tiempo real */
function actualizarReloj() {
    const now = new Date();
    const texto = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ' - ' + now.toLocaleTimeString('es-ES');
    document.getElementById('currentDateTime').textContent = texto;
}