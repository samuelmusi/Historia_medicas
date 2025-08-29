<?php
// backend/config/constantes.php

// Constantes para manejo de sesiones
define('SESSION_USER_ID', 'user_id');
define('SESSION_USER_NAME', 'user_name');
define('SESSION_USER_EMAIL', 'user_email');
define('SESSION_USER_ROLE', 'user_role');
define('SESSION_LAST_ACTIVITY', 'last_activity');

// Constantes para roles de usuarios
define('ROL_MEDICO', 'medico');
define('ROL_ENFERMERA', 'enfermera');

// Constantes para estados
define('ESTADO_ACTIVO', 1);
define('ESTADO_INACTIVO', 0);

// Constantes para tipos de archivos permitidos
define('TIPOS_ARCHIVO_PERMITIDOS', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Constante para tamaño máximo de archivo (5MB)
define('MAX_TAMANIO_ARCHIVO', 5 * 1024 * 1024);

// Constante para tiempo de expiración de sesión (30 minutos)
define('SESSION_EXPIRE_TIME', 1800);

// Constante para tiempo de expiración de token CSRF (1 hora)
define('CSRF_EXPIRE_TIME', 3600);
?>
