/* ===== DATOS DEL USUARIO Y RELOJ ===== */
document.addEventListener('DOMContentLoaded', () => {
    cargarDatosUsuario();
    setInterval(actualizarReloj, 1000);
    // Actualizar contador de pacientes cada 30 segundos
    setInterval(actualizarContadorPacientes, 30000);
    // Escuchar cambios en localStorage para actualización en tiempo real
    window.addEventListener('storage', (e) => {
        if (e.key === 'pacientesUpdated') {
            actualizarContadorPacientes();
        }
    });
});

/* Cargar nombre y foto desde sesión PHP */
async function cargarDatosUsuario() {
    try {
        const res = await fetch('/Historia_medicas/backend/auth/get_user_session.php');
        const data = await res.json();

        if (data.success) {
            const { nombre_completo, foto_perfil } = data.user;

            // Nombre completo
            document.getElementById('userName').textContent = nombre_completo;

            // Foto de perfil
            const pic = foto_perfil
                ? `/Historia_medicas/backend/uploads/perfiles/${foto_perfil}`
                : 'img/background/default-avatar.png';
            document.getElementById('profilePic').src = pic;

            // Actualizar contador de pacientes después de cargar usuario
            actualizarContadorPacientes();
        } else {
            // No hay sesión
            window.location.replace('/Historia_medicas/frontend/login.html');
        }
    } catch (err) {
        console.error(err);
        window.location.href = '/Historia_medicas/frontend/login.html';
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

// Actualizar contador de pacientes en dashboard
async function actualizarContadorPacientes() {
    try {
        const response = await fetch('../backend/pacientes/listar.php?limit=1');
        const data = await response.json();
        if (data.success) {
            document.getElementById('totalPacientes').textContent = data.pagination.total;
        }
    } catch (error) {
        console.error('Error al actualizar contador de pacientes:', error);
    }
}

// Llamar a la función después de cargar datos del usuario
actualizarContadorPacientes();
