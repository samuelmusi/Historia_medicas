<?php
// backend/login.php

// Limpiar cualquier salida previa
if (ob_get_length()) ob_clean();

// Configurar manejo de errores para desarrollo
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en pantalla
ini_set('log_errors', 1);

header('Content-Type: application/json; charset=utf-8');

// Buffer de salida para capturar cualquier error
ob_start();

try {
    require_once 'conexion.php';
    require_once 'config/config.php';
    require_once 'config/constantes.php';
    require_once 'classes/Seguridad.php';
    require_once 'classes/SessionManager.php';
    require_once 'classes/Logger.php';

    // Verificar método POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        exit();
    }

    // Obtener datos del POST
    $correo = Seguridad::validarInput($_POST['correo'] ?? '');
    $contrasena = $_POST['contrasena'] ?? '';
    
    // Validar campos obligatorios
    if (empty($correo) || empty($contrasena)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Correo y contraseña son obligatorios']);
        exit();
    }
    
    // Buscar usuario en la base de datos
    $stmt = $pdo->prepare("SELECT id, nombre_completo, correo, contrasena, rol, foto_perfil FROM usuarios WHERE correo = ? AND estado = 1");
    $stmt->execute([$correo]);
    $usuario = $stmt->fetch();
    
    if ($usuario && Seguridad::verificarContrasena($contrasena, $usuario['contrasena'])) {
        // Iniciar sesión
        SessionManager::iniciarSesion([
            SESSION_USER_ID => $usuario['id'],
            SESSION_USER_NAME => $usuario['nombre_completo'],
            SESSION_USER_EMAIL => $usuario['correo'],
            SESSION_USER_ROLE => $usuario['rol'],
            'foto_perfil' => $usuario['foto_perfil']
        ]);
        
        // Log de actividad
        Logger::logActivity('LOGIN_EXITOSO', "Usuario: {$usuario['correo']}");
        
        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => [
                'id' => $usuario['id'],
                'nombre_completo' => $usuario['nombre_completo'],
                'correo' => $usuario['correo'],
                'rol' => $usuario['rol']
            ],
            'redirect' => '../frontend/dashboard.html'
        ]);
        
    } else {
        // Log de intento fallido
        Logger::logActivity('LOGIN_FALLIDO', "Correo: $correo");
        
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Credenciales incorrectas']);
    }
    
} catch (Exception $e) {
    // Limpiar buffer y enviar error JSON
    ob_clean();
    error_log("[ERROR LOGIN] " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error interno del servidor']);
}

// Limpiar buffer de salida
ob_end_flush();
?>
