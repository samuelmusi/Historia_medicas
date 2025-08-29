// frontend/js/session-security.js
export async function checkSessionStatus() {
  try {
    const res = await fetch('../backend/auth/get_user_session.php');
    const data = await res.json();
    if (!data.success) {
      const protectedPages = ['dashboard.html','pacientes.html','citas.html','historias.html'];
      const current = window.location.pathname.split('/').pop();
      if (protectedPages.includes(current)) window.location.href = 'login.html?error=session_expired';
    }
  } catch (e) {
    console.error(e);
  }
}