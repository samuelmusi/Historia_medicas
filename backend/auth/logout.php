<?php
// backend/auth/logout.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

require_once '../conexion.php';
require_once '../classes/SessionManager.php';

try {
    // Cerrar sesión correctamente
    SessionManager::cerrarSesion();
    
    // Respuesta JSON exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Sesión cerrada correctamente',
        'redirect' => '/Historia_medicas/frontend/login.html?mensaje=sesion_cerrada'
    ]);
    
} catch (Exception $e) {
    error_log("[ERROR LOGOUT] " . date('Y-m-d H:i:s') . " - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al cerrar sesión']);
}
?>
