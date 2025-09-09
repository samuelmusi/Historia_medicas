<?php
// backend/historias/editar.php
header('Content-Type: application/json; charset=utf-8');
require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../classes/Seguridad.php';
require_once '../classes/Logger.php';
require_once '../config/constantes.php';

// Verificar autenticación y método POST
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
    
    // Validar que la historia existe
    $stmt = $pdo->prepare("SELECT id, paciente_id FROM historias_clinicas WHERE id = ?");
    $stmt->execute([$id]);
    $historia = $stmt->fetch();
    
    if (!$historia) {
        throw new Exception('Historia médica no encontrada');
    }

    // Validar y sanitizar datos
    $motivo_consulta = Seguridad::validarInput($_POST['motivo_consulta'] ?? '');
    $antecedentes = Seguridad::validarInput($_POST['antecedentes'] ?? '');
    $diagnostico = Seguridad::validarInput($_POST['diagnostico'] ?? '');
    $tratamiento = Seguridad::validarInput($_POST['tratamiento'] ?? '');
    $observaciones = Seguridad::validarInput($_POST['observaciones'] ?? '');
    $grupo_sanguineo = Seguridad::validarInput($_POST['grupo_sanguineo'] ?? '');
    $examen_fisico = Seguridad::validarInput($_POST['examen_fisico'] ?? '');
    $examenes_complementarios = Seguridad::validarInput($_POST['examenes_complementarios'] ?? '');

    // Validaciones obligatorias
    if (empty($motivo_consulta)) {
        throw new Exception('El motivo de consulta es obligatorio');
    }

    // Actualizar historia clínica
    $stmt = $pdo->prepare("
        UPDATE historias_clinicas SET 
        motivo_consulta = ?, antecedentes = ?, diagnostico = ?, 
        tratamiento = ?, observaciones = ?, grupo_sanguineo = ?, 
        examen_fisico = ?, examenes_complementarios = ?
        WHERE id = ?
    ");
    
    $stmt->execute([
        $motivo_consulta, $antecedentes, $diagnostico, $tratamiento,
        $observaciones, $grupo_sanguineo, $examen_fisico,
        $examenes_complementarios, $id
    ]);

    // Log de actividad
    Logger::logActivity('HISTORIA_MEDICA_ACTUALIZADA', "Historia médica actualizada - ID: $id");

    echo json_encode([
        'success' => true,
        'message' => 'Historia médica actualizada exitosamente'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>