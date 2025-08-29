<?php
// backend/config/config.php

// Configuración del entorno
define('MODO_DESARROLLO', true); // Cambiar a false en producción

// Configuración de la aplicación
define('APP_NAME', 'Sistema de Historias Médicas');
define('APP_VERSION', '1.0.0');
define('APP_DESCRIPTION', 'Sistema para gestión de historias médicas y pacientes');

// Configuración de seguridad
define('MAX_INTENTOS_LOGIN', 5); // Máximo de intentos de login fallidos
define('TIEMPO_BLOQUEO_LOGIN', 900); // 15 minutos de bloqueo después de máximo intentos

// Configuración de uploads
define('RUTA_UPLOADS', __DIR__ . '/../uploads/');
define('RUTA_PERFILES', RUTA_UPLOADS . 'perfiles/');
define('RUTA_PACIENTES', RUTA_UPLOADS . 'pacientes/');

// Configuración de email (para futuras notificaciones)
define('EMAIL_FROM', 'no-reply@historiamed.com');
define('EMAIL_FROM_NAME', 'Sistema de Historias Médicas');

// Configuración de reportes
define('RUTA_REPORTES', __DIR__ . '/../reportes/');

// Headers de seguridad por defecto
if (!headers_sent()) {
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("X-XSS-Protection: 1; mode=block");
    
    if (MODO_DESARROLLO) {
        // Headers adicionales para desarrollo
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    } else {
        // Headers de seguridad para producción
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
        header("Content-Security-Policy: default-src 'self'");
    }
}

// Manejo de errores según el entorno
if (MODO_DESARROLLO) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    ini_set('log_errors', 1);
}

// Configuración de zona horaria
date_default_timezone_set('America/Caracas');

// Incluir constantes
require_once __DIR__ . '/constantes.php';
?>
