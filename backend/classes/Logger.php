<?php
// backend/classes/Logger.php

class Logger {
    
    /**
     * Registrar actividad del sistema
     */
    public static function logActivity($tipo, $mensaje, $datosAdicionales = []) {
        $logFile = __DIR__ . '/../../logs/actividad.log';
        $logDir = dirname($logFile);
        
        // Crear directorio de logs si no existe
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Formato del mensaje de log
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
        
        $userId = 'Anónimo';
        if (isset($_SESSION[SESSION_USER_ID])) {
            $userId = $_SESSION[SESSION_USER_ID];
        } elseif (isset($_SESSION[SESSION_USER_EMAIL])) {
            $userId = $_SESSION[SESSION_USER_EMAIL];
        }
        
        $logMessage = sprintf(
            "[%s] [%s] [IP: %s] [Usuario: %s] [%s] %s",
            $timestamp,
            $tipo,
            $ip,
            $userId,
            $userAgent,
            $mensaje
        );
        
        // Agregar datos adicionales si existen
        if (!empty($datosAdicionales)) {
            $logMessage .= " [Datos: " . json_encode($datosAdicionales) . "]";
        }
        
        $logMessage .= PHP_EOL;
        
        // Escribir en el archivo de log
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Registrar error del sistema
     */
    public static function logError($mensaje, $exception = null) {
        $logFile = __DIR__ . '/../../logs/errores.log';
        $logDir = dirname($logFile);
        
        // Crear directorio de logs si no existe
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
        
        $logMessage = sprintf(
            "[%s] [ERROR] [IP: %s] %s",
            $timestamp,
            $ip,
            $mensaje
        );
        
        if ($exception instanceof Exception) {
            $logMessage .= sprintf(
                " [Excepción: %s] [Archivo: %s] [Línea: %d]",
                $exception->getMessage(),
                $exception->getFile(),
                $exception->getLine()
            );
            
            // Stack trace (solo en modo desarrollo)
            if (defined('MODO_DESARROLLO') && MODO_DESARROLLO) {
                $logMessage .= " [Stack: " . $exception->getTraceAsString() . "]";
            }
        }
        
        $logMessage .= PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Registrar acceso a la base de datos
     */
    public static function logDatabase($consulta, $parametros = [], $tiempoEjecucion = null) {
        $logFile = __DIR__ . '/../../logs/database.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        
        $logMessage = sprintf(
            "[%s] [DB] [Consulta: %s]",
            $timestamp,
            $consulta
        );
        
        if (!empty($parametros)) {
            $logMessage .= " [Parámetros: " . json_encode($parametros) . "]";
        }
        
        if ($tiempoEjecucion !== null) {
            $logMessage .= sprintf(" [Tiempo: %.4fs]", $tiempoEjecucion);
        }
        
        $logMessage .= PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Registrar intentos de login
     */
    public static function logLoginAttempt($correo, $exitoso, $razon = '') {
        $logFile = __DIR__ . '/../../logs/login_attempts.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
        $estado = $exitoso ? 'EXITOSO' : 'FALLIDO';
        
        $logMessage = sprintf(
            "[%s] [LOGIN_%s] [IP: %s] [Correo: %s]",
            $timestamp,
            $estado,
            $ip,
            $correo
        );
        
        if (!$exitoso && $razon) {
            $logMessage .= " [Razón: $razon]";
        }
        
        $logMessage .= PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
}
?>
