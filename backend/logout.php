<?php
// backend/logout.php
require_once 'conexion.php'; // Incluir conexión para manejo de sesión
require_once 'classes/SessionManager.php';

// Cerrar sesión correctamente
SessionManager::cerrarSesion();

// Redirigir al login con mensaje de éxito
header('Location: ../frontend/login.html?mensaje=sesion_cerrada');
exit();
?>
