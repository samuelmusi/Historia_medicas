<?php
// backend/auth/get_csrf_token.php
require_once '../conexion.php';
require_once '../classes/Seguridad.php';
require_once '../config/constantes.php';

header('Content-Type: application/json');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

// Solo permitir método GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit();
}

try {
    // Generar token CSRF
    $token = Seguridad::generarTokenCSRF();
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'expires_in' => CSRF_EXPIRE_TIME
    ]);
    
} catch (Exception $e) {
    error_log("[CSRF TOKEN ERROR] " . date('Y-m-d H:i:s') . " - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se pudo generar el token de seguridad.']);
}
?>
