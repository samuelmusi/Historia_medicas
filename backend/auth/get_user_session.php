<?php
// backend/auth/get_user_session.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../config/constantes.php';

try {
    // SessionManager already handles session_start()
    
    // Verificar si hay sesión activa
    $userData = SessionManager::obtenerUsuarioActual();

    if (isset($userData[SESSION_USER_ID]) && !empty($userData[SESSION_USER_ID])) {
        
        // Verificar expiración de sesión - CORREGIDO: usar método correcto
        if (!SessionManager::estaAutenticado()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Sesión expirada']);
            exit();
        }
        
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $userData[SESSION_USER_ID],
                'nombre_completo' => $userData[SESSION_USER_NAME],
                'correo' => $userData[SESSION_USER_EMAIL],
                'rol' => $userData[SESSION_USER_ROLE],
                // Solo el nombre del archivo, no la ruta completa
                'foto_perfil' => isset($userData['foto_perfil']) ? basename($userData['foto_perfil']) : null
            ]
        ]);
        
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No hay sesión activa']);
    }
    
} catch (Exception $e) {
    error_log("[ERROR GET USER SESSION] " . date('Y-m-d H:i:s') . " - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error interno del servidor']);
}
?>
