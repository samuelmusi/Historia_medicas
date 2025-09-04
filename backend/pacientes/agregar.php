<?php
// backend/pacientes/agregar.php
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

    // Verificar cédula única
    $stmt = $pdo->prepare("SELECT id FROM pacientes WHERE dni = ?");
    $stmt->execute([$dni]);
    if ($stmt->fetch()) {
        throw new Exception('Esta cédula ya está registrada');
    }

    // Manejar foto de perfil
    $foto_paciente = null;
    if (isset($_FILES['foto_paciente']) && $_FILES['foto_paciente']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/pacientes/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileInfo = pathinfo($_FILES['foto_paciente']['name']);
        $extension = strtolower($fileInfo['extension']);
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        if (!in_array($extension, $allowedExtensions)) {
            throw new Exception('Formato de imagen no permitido');
        }

        $filename = 'paciente_' . date('Ymd_His') . '_' . uniqid() . '.' . $extension;
        $uploadPath = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['foto_paciente']['tmp_name'], $uploadPath)) {
            $foto_paciente = 'uploads/pacientes/' . $filename;
        }
    } else {
        // Si NO se subió foto, asignar avatar por defecto según género
        // Modificación: aquí se asigna avatar_hombre.jpg o avatar_mujer.jpg automáticamente
        if ($genero === 'M') {
            $foto_paciente = 'uploads/pacientes/avatar_hombre.jpg';
        } elseif ($genero === 'F') {
            $foto_paciente = 'uploads/pacientes/avatar_mujer.jpg';
        } elseif ($genero === 'O' || $genero === 'Otro') {
            $foto_paciente = 'uploads/pacientes/avatar_otro.png';
        } else {
            $foto_paciente = 'uploads/pacientes/avatar_hombre.jpg'; // Por defecto, masculino si no se especifica
        }
        // Fin modificación
    }

    // Insertar paciente
    $stmt = $pdo->prepare("
        INSERT INTO pacientes 
        (dni, nombre, apellidos, fecha_nacimiento, genero, telefono, direccion, 
        foto_paciente, alergias, medicamentos_actuales, seguro_medico, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ");
    
    $stmt->execute([
        $dni, $nombre, $apellidos, $fecha_nacimiento, $genero, 
        $telefono, $direccion, $foto_paciente, $alergias, 
        $medicamentos_actuales, $seguro_medico
    ]);

    // Logger actividad
    Logger::logActivity('PACIENTE_REGISTRADO', "Paciente: $nombre $apellidos - DNI: $dni");

    echo json_encode([
        'success' => true,
        'message' => 'Paciente registrado exitosamente',
        'id' => $pdo->lastInsertId()
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>