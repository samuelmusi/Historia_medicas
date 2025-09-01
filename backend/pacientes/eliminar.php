<?php
// backend/pacientes/eliminar.php
header('Content-Type: application/json; charset=utf-8');
require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../classes/Logger.php';
require_once '../config/constantes.php';

// Verificar autenticación
if (!SessionManager::estaAutenticado()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit();
}

try {
    $id = intval($_POST['id'] ?? 0);
    
    // Verificar que el paciente existe
    $stmt = $pdo->prepare("SELECT nombre, apellidos, foto_paciente FROM pacientes WHERE id = ? AND estado = 1");
    $stmt->execute([$id]);
    $paciente = $stmt->fetch();
    
    if (!$paciente) {
        throw new Exception('Paciente no encontrado');
    }

    // Soft delete (actualizar estado a 0)
    $stmt = $pdo->prepare("UPDATE pacientes SET estado = 0 WHERE id = ?");
    $stmt->execute([$id]);

    // Eliminar foto si existe
    if ($paciente['foto_paciente'] && file_exists(__DIR__ . '/../' . $paciente['foto_paciente'])) {
        unlink(__DIR__ . '/../' . $paciente['foto_paciente']);
    }

    Logger::logActivity('PACIENTE_ELIMINADO', "Paciente: {$paciente['nombre']} {$paciente['apellidos']} - ID: $id");

    echo json_encode([
        'success' => true,
        'message' => 'Paciente eliminado exitosamente'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>