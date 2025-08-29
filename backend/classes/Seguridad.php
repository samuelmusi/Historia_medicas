<?php
// backend/classes/Seguridad.php

class Seguridad {
    
    /**
     * Validar y sanitizar input
     */
    public static function validarInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'validarInput'], $input);
        }
        
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        
        return $input;
    }
    
    /**
     * Hashear contraseña usando password_hash
     */
    public static function hashearContrasena($contrasena) {
        return password_hash($contrasena, PASSWORD_DEFAULT);
    }
    
    /**
     * Verificar contraseña hasheada
     */
    public static function verificarContrasena($contrasena, $hash) {
        return password_verify($contrasena, $hash);
    }
    
    /**
     * Generar token CSRF
     */
    public static function generarTokenCSRF() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Generar nuevo token si no existe o ha expirado
        if (!isset($_SESSION['token_csrf']) || !isset($_SESSION['token_csrf_time']) || 
            (time() - $_SESSION['token_csrf_time']) > CSRF_EXPIRE_TIME) {
            
            $_SESSION['token_csrf'] = bin2hex(random_bytes(32));
            $_SESSION['token_csrf_time'] = time();
        }
        
        return $_SESSION['token_csrf'];
    }
    
    /**
     * Verificar token CSRF
     */
    public static function verificarTokenCSRF($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['token_csrf']) || !isset($_SESSION['token_csrf_time'])) {
            return false;
        }
        
        // Verificar que el token no haya expirado
        if ((time() - $_SESSION['token_csrf_time']) > CSRF_EXPIRE_TIME) {
            unset($_SESSION['token_csrf']);
            unset($_SESSION['token_csrf_time']);
            return false;
        }
        
        // Verificar que el token coincida
        return hash_equals($_SESSION['token_csrf'], $token);
    }
    
    /**
     * Validar email
     */
    public static function validarEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
    
    /**
     * Validar fortaleza de contraseña
     */
    public static function validarFortalezaContrasena($contrasena) {
        $errores = [];
        
        if (strlen($contrasena) < 8) {
            $errores[] = 'La contraseña debe tener al menos 8 caracteres';
        }
        
        if (!preg_match('/[A-Z]/', $contrasena)) {
            $errores[] = 'La contraseña debe contener al menos una letra mayúscula';
        }
        
        if (!preg_match('/[a-z]/', $contrasena)) {
            $errores[] = 'La contraseña debe contener al menos una letra minúscula';
        }
        
        if (!preg_match('/[0-9]/', $contrasena)) {
            $errores[] = 'La contraseña debe contener al menos un número';
        }
        
        if (!preg_match('/[^A-Za-z0-9]/', $contrasena)) {
            $errores[] = 'La contraseña debe contener al menos un símbolo especial';
        }
        
        return $errores;
    }
    
    /**
     * Limpiar nombre de archivo para seguridad
     */
    public static function limpiarNombreArchivo($nombre) {
        // Remover caracteres peligrosos
        $nombre = preg_replace('/[^a-zA-Z0-9._-]/', '', $nombre);
        // Limitar longitud
        $nombre = substr($nombre, 0, 100);
        return $nombre;
    }
    
    /**
     * Validar tipo de archivo
     */
    public static function validarTipoArchivo($tipo) {
        return in_array($tipo, TIPOS_ARCHIVO_PERMITIDOS);
    }
    
    /**
     * Validar tamaño de archivo
     */
    public static function validarTamanioArchivo($tamanio) {
        return $tamanio <= MAX_TAMANIO_ARCHIVO;
    }
}
?>
