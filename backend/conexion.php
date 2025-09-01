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
    
    // Para una API, siempre es mejor devolver JSON.
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Error de conexión a la base de datos.',
        'details' => $e->getMessage() // Proporcionar detalles en el log o en modo debug
    ]);
    exit();
}
?>