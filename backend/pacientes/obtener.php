<?php
// backend/pacientes/obtener.php
header('Content-Type: application/json; charset=utf-8');
require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../config/constantes.php';

if (!SessionManager::estaAutenticado()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit();
}

$id = intval($_GET['id'] ?? 0);

try {
    $stmt = $pdo->prepare("SELECT * FROM pacientes WHERE id = ? AND estado = 1");
    $stmt->execute([$id]);
    $paciente = $stmt->fetch();
    
    if ($paciente) {
        echo json_encode(['success' => true, 'data' => $paciente]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Paciente no encontrado']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener paciente']);
}
?>