<?php
// backend/pacientes/editar.php
header('Content-Type: application/json; charset=utf-8');
require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../classes/Seguridad.php';
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
    
    // Validar que el paciente existe
    $stmt = $pdo->prepare("SELECT id FROM pacientes WHERE id = ? AND estado = 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        throw new Exception('Paciente no encontrado');
    }

    // Obtener y validar datos
    $dni = Seguridad::validarInput($_POST['dni'] ?? '');
    $nombre = Seguridad::validarInput($_POST['nombre'] ?? '');
    $apellidos = Seguridad::validarInput($_POST['apellidos'] ?? '');
    $fecha_nacimiento = $_POST['fecha_nacimiento'] ?? '';
    $genero = Seguridad::validarInput($_POST['genero'] ?? '');
    $telefono = Seguridad::validarInput($_POST['telefono'] ?? '');
    $direccion = Seguridad::validarInput($_POST['direccion'] ?? '');
    $alergias = Seguridad::validarInput($_POST['alergias'] ?? '');
    $medicamentos_actuales = Seguridad::validarInput($_POST['medicamentos_actuales'] ?? '');
    $seguro_medico = Seguridad::validarInput($_POST['seguro_medico'] ?? '');

    // Validaciones
    if (empty($dni) || empty($nombre) || empty($apellidos)) {
        throw new Exception('Los campos obligatorios no pueden estar vacíos');
    }

    // Verificar DNI único (excepto el actual)
    $stmt = $pdo->prepare("SELECT id FROM pacientes WHERE dni = ? AND id != ?");
    $stmt->execute([$dni, $id]);
    if ($stmt->fetch()) {
        throw new Exception('El DNI ya está registrado en otro paciente');
    }

    // Manejar foto de perfil
    $foto_paciente = null;
    if (isset($_FILES['foto_paciente']) && $_FILES['foto_paciente']['error'] === UPLOAD_ERR_OK) {
        // Eliminar foto anterior si existe
        $stmt = $pdo->prepare("SELECT foto_paciente FROM pacientes WHERE id = ?");
        $stmt->execute([$id]);
        $oldPhoto = $stmt->fetch()['foto_paciente'];
        
        if ($oldPhoto && file_exists(__DIR__ . '/../' . $oldPhoto)) {
            unlink(__DIR__ . '/../' . $oldPhoto);
        }

        // Subir nueva foto
        $uploadDir = __DIR__ . '/../uploads/pacientes/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileInfo = pathinfo($_FILES['foto_paciente']['name']);
        $extension = strtolower($fileInfo['extension']);
        $filename = 'paciente_' . date('Ymd_His') . '_' . uniqid() . '.' . $extension;
        $uploadPath = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['foto_paciente']['tmp_name'], $uploadPath)) {
            $foto_paciente = 'uploads/pacientes/' . $filename;
        }
    }

    // Actualizar paciente
    $query = "UPDATE pacientes SET 
              dni = ?, nombre = ?, apellidos = ?, fecha_nacimiento = ?, 
              genero = ?, telefono = ?, direccion = ?, 
              alergias = ?, medicamentos_actuales = ?, seguro_medico = ?";
    
    $params = [
        $dni, $nombre, $apellidos, $fecha_nacimiento, $genero,
        $telefono, $direccion, $alergias, $medicamentos_actuales, $seguro_medico
    ];

    // Solo actualizar foto si se subió una nueva
    if ($foto_paciente) {
        $query .= ", foto_paciente = ?";
        $params[] = $foto_paciente;
    }

    $query .= " WHERE id = ?";
    $params[] = $id;

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    Logger::logActivity('PACIENTE_ACTUALIZADO', "Paciente: $nombre $apellidos - ID: $id");

    echo json_encode([
        'success' => true,
        'message' => 'Paciente actualizado exitosamente'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>