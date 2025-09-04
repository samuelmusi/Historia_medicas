<?php
// backend/pacientes/editar.php
header ('Content-Type: application/json; charset=utf-8');
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
    if (empty($dni) || empty($nombre) || empty($apellidos) || empty($fecha_nacimiento) || empty($genero)) {
        throw new Exception('Los campos obligatorios no pueden estar vacíos');
    }

    // Validar formato de cédula venezolana (7-10 dígitos)
    if (!preg_match('/^[0-9]{7,10}$/', $dni)) {
        throw new Exception('La cédula debe contener entre 7 y 10 dígitos numéricos');
    }

    // Verificar cédula única (excepto el actual)
    $stmt = $pdo->prepare("SELECT id FROM pacientes WHERE dni = ? AND id != ?");
    $stmt->execute([$dni, $id]);
    if ($stmt->fetch()) {
        throw new Exception('Esta cédula ya está registrada en otro paciente');
    }

    // Manejar foto de perfil
    $foto_paciente = null;

    // Obtener datos actuales del paciente para comparar
    $stmt = $pdo->prepare("SELECT foto_paciente, genero FROM pacientes WHERE id = ?");
    $stmt->execute([$id]);
    $pacienteActual = $stmt->fetch();

    if (isset($_FILES['foto_paciente']) && $_FILES['foto_paciente']['error'] === UPLOAD_ERR_OK) {
        // Se subió una nueva foto personalizada
        $uploadDir = __DIR__ . '/../uploads/pacientes/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileInfo = pathinfo($_FILES['foto_paciente']['name']);
        $extension = strtolower($fileInfo['extension']);
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($extension, $allowedExtensions)) {
            throw new Exception('Formato de imagen no permitido. Use JPG, PNG, GIF o WebP');
        }

        $filename = 'paciente_' . date('Ymd_His') . '_' . uniqid() . '.' . $extension;
        $uploadPath = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['foto_paciente']['tmp_name'], $uploadPath)) {
            $foto_paciente = 'uploads/pacientes/' . $filename;

            // Eliminar foto anterior solo si no era una imagen por defecto
            if ($pacienteActual['foto_paciente'] &&
                file_exists(__DIR__ . '/../' . $pacienteActual['foto_paciente']) &&
                !preg_match('/avatar_(hombre|mujer|otro)/', $pacienteActual['foto_paciente'])) {
                unlink(__DIR__ . '/../' . $pacienteActual['foto_paciente']);
            }
        } else {
            throw new Exception('Error al subir la nueva foto');
        }
    } else {
        // No se subió nueva foto, verificar si hay cambio de género
        $generoActual = $pacienteActual['genero'];
        $nuevoGenero = $genero;

        // Si cambió el género y la foto actual es un avatar por defecto, actualizar al nuevo avatar
        if ($generoActual !== $nuevoGenero &&
            preg_match('/avatar_(hombre|mujer|otro)/', $pacienteActual['foto_paciente'])) {

            if ($nuevoGenero === 'M') {
                $foto_paciente = 'uploads/pacientes/avatar_hombre.jpg';
            } elseif ($nuevoGenero === 'F') {
                $foto_paciente = 'uploads/pacientes/avatar_mujer.jpg';
            } elseif ($nuevoGenero === 'O' || $nuevoGenero === 'Otro') {
                $foto_paciente = 'uploads/pacientes/avatar_otro.png';
            } else {
                $foto_paciente = 'uploads/pacientes/avatar_hombre.jpg';
            }
        }
        // Si no cambió el género o tiene foto personalizada, mantener la foto actual
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