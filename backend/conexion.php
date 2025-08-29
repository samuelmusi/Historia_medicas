<?php
// backend/conexion.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configuración de zona horaria
date_default_timezone_set('America/Caracas');

// Parámetros de conexión a la base de datos
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'historia_medicas';
$charset = 'utf8mb4';

// Crear DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

// Opciones de PDO para una conexión robusta
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::ATTR_PERSISTENT         => false,
];

try {
    // Crear conexión PDO
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Configurar variables de sesión del sistema
    if (!isset($_SESSION['system_config'])) {
        $_SESSION['system_config'] = [
            'nombre_sistema' => 'Sistema de Historias Médicas',
            'version' => '1.0.0',
            'timezone' => 'America/Caracas'
        ];
    }
    
} catch (PDOException $e) {
    // Registrar error en log
    error_log("[ERROR DB] " . date('Y-m-d H:i:s') . " - " . $e->getMessage());
    
    // Respuesta según el contexto
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error de conexión a la base de datos']);
        exit();
    } else {
        die('<div style="padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 5px; margin: 20px;">
            <h2>Error de Conexión</h2>
            <p>No se puede conectar a la base de datos. Verifique que:</p>
            <ul>
                <li>MySQL esté ejecutándose en XAMPP</li>
                <li>La base de datos "historia_medicas" exista</li>
                <li>Las credenciales sean correctas</li>
            </ul>
        </div>');
    }
}
?>