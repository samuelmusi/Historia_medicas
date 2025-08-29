<?php
// backend/classes/SessionManager.php

class SessionManager {
    
    /**
     * Iniciar sesión de usuario
     */
    public static function iniciarSesion($datosUsuario) {
        // Configurar cookie de sesión segura antes de iniciar la sesión
        self::configurarCookieSesion();
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Regenerar ID de sesión para prevenir fixation attacks
        session_regenerate_id(true);
        
        // Establecer datos de usuario en sesión
        $_SESSION[SESSION_USER_ID] = $datosUsuario[SESSION_USER_ID];
        $_SESSION[SESSION_USER_NAME] = $datosUsuario[SESSION_USER_NAME];
        $_SESSION[SESSION_USER_EMAIL] = $datosUsuario[SESSION_USER_EMAIL];
        $_SESSION[SESSION_USER_ROLE] = $datosUsuario[SESSION_USER_ROLE];
        
        // Datos adicionales si existen
        if (isset($datosUsuario['foto_perfil'])) {
            $_SESSION['foto_perfil'] = $datosUsuario['foto_perfil'];
        }
        
        // Establecer tiempo de última actividad
        $_SESSION[SESSION_LAST_ACTIVITY] = time();
    }
    
    /**
     * Configurar cookie de sesión segura
     */
    private static function configurarCookieSesion() {
        // Solo configurar cookies si la sesión no está activa
        if (session_status() === PHP_SESSION_NONE) {
            $params = session_get_cookie_params();
            session_set_cookie_params([
                'lifetime' => $params['lifetime'],
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => true, // Solo HTTPS
                'httponly' => true, // No accesible via JavaScript
                'samesite' => 'Strict' // Prevenir CSRF
            ]);
        }
    }
    
    /**
     * Cerrar sesión
     */
    public static function cerrarSesion() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Limpiar todas las variables de sesión
        $_SESSION = [];
        
        // Destruir la cookie de sesión
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        // Destruir la sesión
        session_destroy();
    }
    
    /**
     * Obtener datos del usuario actual
     */
    public static function obtenerUsuarioActual() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!self::estaAutenticado()) {
            return null;
        }
        
        return [
            SESSION_USER_ID => $_SESSION[SESSION_USER_ID] ?? null,
            SESSION_USER_NAME => $_SESSION[SESSION_USER_NAME] ?? null,
            SESSION_USER_EMAIL => $_SESSION[SESSION_USER_EMAIL] ?? null,
            SESSION_USER_ROLE => $_SESSION[SESSION_USER_ROLE] ?? null,
            'foto_perfil' => $_SESSION['foto_perfil'] ?? null
        ];
    }
    
    /**
     * Verificar si el usuario está autenticado
     */
    public static function estaAutenticado() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION[SESSION_USER_ID]) && 
               isset($_SESSION[SESSION_USER_EMAIL]) &&
               self::verificarExpiracionSesion();
    }
    
    /**
     * Verificar expiración de sesión
     */
    public static function verificarExpiracionSesion() {
        if (!isset($_SESSION[SESSION_LAST_ACTIVITY])) {
            return false;
        }
        
        // Verificar si la sesión ha expirado (30 minutos)
        if ((time() - $_SESSION[SESSION_LAST_ACTIVITY]) > SESSION_EXPIRE_TIME) {
            self::cerrarSesion();
            return false;
        }
        
        // Actualizar tiempo de última actividad
        $_SESSION[SESSION_LAST_ACTIVITY] = time();
        return true;
    }
    
    /**
     * Verificar permisos de rol
     */
    public static function tienePermiso($rolRequerido) {
        if (!self::estaAutenticado()) {
            return false;
        }
        
        $rolUsuario = $_SESSION[SESSION_USER_ROLE] ?? '';
        return $rolUsuario === $rolRequerido;
    }
    
    /**
     * Obtener ID del usuario actual
     */
    public static function obtenerUserId() {
        if (!self::estaAutenticado()) {
            return null;
        }
        
        return $_SESSION[SESSION_USER_ID];
    }
    
    /**
     * Obtener rol del usuario actual
     */
    public static function obtenerUserRol() {
        if (!self::estaAutenticado()) {
            return null;
        }
        
        return $_SESSION[SESSION_USER_ROLE];
    }
}
