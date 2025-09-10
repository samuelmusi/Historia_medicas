<?php
// backend/historias/agregar.php
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
    // Validar y sanitizar datos
    $paciente_id = intval($_POST['paciente_id'] ?? 0);
    $motivo_consulta = Seguridad::validarInput($_POST['motivo_consulta'] ?? '');
    $antecedentes = Seguridad::validarInput($_POST['antecedentes'] ?? '');
    $diagnostico = Seguridad::validarInput($_POST['diagnostico'] ?? '');
    $tratamiento = Seguridad::validarInput($_POST['tratamiento'] ?? '');
    $observaciones = Seguridad::validarInput($_POST['observaciones'] ?? '');
    $grupo_sanguineo = Seguridad::validarInput($_POST['grupo_sanguineo'] ?? '');
    $examen_fisico = Seguridad::validarInput($_POST['examen_fisico'] ?? '');
    $examenes_complementarios = Seguridad::validarInput($_POST['examenes_complementarios'] ?? '');

    // Validar que el paciente no tenga ya una historia médica
    $stmt = $pdo->prepare("SELECT id FROM historias_clinicas WHERE paciente_id = ? LIMIT 1");
    $stmt->execute([$paciente_id]);
    if ($stmt->fetch()) {
        throw new Exception('Este paciente ya tiene una historia médica registrada.');
    }

    // Validaciones obligatorias
    if (empty($paciente_id) || empty($motivo_consulta)) {
        throw new Exception('El paciente y el motivo de consulta son obligatorios');
    }

    // Verificar que el paciente existe y está activo
    $stmt = $pdo->prepare("SELECT id, nombre, apellidos FROM pacientes WHERE id = ? AND estado = 1");
    $stmt->execute([$paciente_id]);
    $paciente = $stmt->fetch();
    
    if (!$paciente) {
        throw new Exception('Paciente no encontrado o inactivo');
    }

    // Obtener ID del médico actual
    $medico_id = SessionManager::obtenerUserId();

    // Insertar historia clínica
    $stmt = $pdo->prepare("
        INSERT INTO historias_clinicas 
        (paciente_id, medico_id, motivo_consulta, antecedentes, diagnostico, 
        tratamiento, observaciones, grupo_sanguineo, examen_fisico, 
        examenes_complementarios, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $paciente_id, $medico_id, $motivo_consulta, $antecedentes, $diagnostico,
        $tratamiento, $observaciones, $grupo_sanguineo, $examen_fisico,
        $examenes_complementarios
    ]);

    // Log de actividad
    $nombrePaciente = $paciente['nombre'] . ' ' . $paciente['apellidos'];
    Logger::logActivity('HISTORIA_MEDICA_CREADA', "Historia médica creada para: $nombrePaciente - ID: $paciente_id");

    echo json_encode([
        'success' => true,
        'message' => 'Historia médica registrada exitosamente',
        'id' => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>