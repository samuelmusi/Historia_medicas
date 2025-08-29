<?php
// backend/registrar.php - CORREGIDO: nombre del archivo

require_once 'conexion.php';
require_once 'config/config.php';
require_once 'config/constantes.php';
require_once 'classes/Seguridad.php';
require_once 'classes/Logger.php';

// Headers de seguridad
header('Content-Type: application/json');
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");

// Solo permitir método POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit();
}

// Verificar token CSRF
if (!Seguridad::verificarTokenCSRF($_POST['token_csrf'] ?? '')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Token CSRF inválido. Recargue la página e intente de nuevo.']);
    exit();
}

// Validar y Sanitizar Entradas
$nombre_completo = Seguridad::validarInput($_POST['nombre_completo'] ?? '');
$correo = Seguridad::validarInput($_POST['correo'] ?? '');
$contrasena = $_POST['contrasena'] ?? '';
$confirmar_contrasena = $_POST['confirmar_contrasena'] ?? '';
$rol = Seguridad::validarInput($_POST['rol'] ?? '');

// Validaciones de Campos
if (empty($nombre_completo) || empty($correo) || empty($contrasena) || empty($confirmar_contrasena) || empty($rol)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Todos los campos son obligatorios.']);
    exit();
}

// Validar nombre completo (al menos 2 palabras)
if (str_word_count($nombre_completo) < 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Debe ingresar nombre y apellido.']);
    exit();
}

// Validar formato de correo
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'El formato del correo electrónico es inválido.']);
    exit();
}

// Verificar que las contraseñas coincidan
if ($contrasena !== $confirmar_contrasena) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Las contraseñas no coinciden.']);
    exit();
}

// Validación robusta de contraseña
if (strlen($contrasena) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 8 caracteres.']);
    exit();
}

if (!preg_match('/[A-Z]/', $contrasena)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña debe contener al menos una letra mayúscula.']);
    exit();
}

if (!preg_match('/[a-z]/', $contrasena)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña debe contener al menos una letra minúscula.']);
    exit();
}

if (!preg_match('/[0-9]/', $contrasena)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña debe contener al menos un número.']);
    exit();
}

if (!preg_match('/[^A-Za-z0-9]/', $contrasena)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña debe contener al menos un símbolo especial.']);
    exit();
}

// Validar rol
if (!in_array($rol, [ROL_MEDICO, ROL_ENFERMERA])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Rol inválido. Seleccione médico o enfermera.']);
    exit();
}

try {
    // Verificar si el correo ya existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->execute([$correo]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'error' => 'El correo electrónico ya está registrado.']);
        exit();
    }

    // Manejar subida de foto de perfil
    $foto_perfil = null;
    if (isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] === UPLOAD_ERR_OK) {
        
        // Crear directorio de uploads si no existe - CORREGIDO: usar ruta absoluta correcta
        $dir_uploads = RUTA_PERFILES;
        if (!is_dir($dir_uploads)) {
            if (!mkdir($dir_uploads, 0755, true)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Error al crear directorio de uploads.']);
                exit();
            }
        }

        // Validar tipo de archivo usando la clase Seguridad
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $_FILES['foto_perfil']['tmp_name']);
        finfo_close($finfo);

        if (!Seguridad::validarTipoArchivo($mime_type)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Solo se permiten imágenes JPG, PNG, GIF o WEBP.']);
            exit();
        }

        // Validar tamaño de archivo usando la clase Seguridad
        if (!Seguridad::validarTamanioArchivo($_FILES['foto_perfil']['size'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La imagen es demasiado grande. Tamaño máximo: 5MB.']);
            exit();
        }

        // Generar nombre único para el archivo
        $ext = pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION);
        $nombre_archivo = uniqid('perfil_' . date('Ymd_His') . '_') . '.' . strtolower($ext);
        $ruta_destino_servidor = $dir_uploads . $nombre_archivo;
        $ruta_destino_db = 'uploads/perfiles/' . $nombre_archivo;

        // Mover archivo
        if (!move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $ruta_destino_servidor)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al subir la imagen de perfil.']);
            exit();
        }

        $foto_perfil = $ruta_destino_db;
    }

    // Hashear contraseña
    $contrasena_hasheada = Seguridad::hashearContrasena($contrasena);

    // Insertar usuario en la base de datos
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre_completo, correo, contrasena, rol, estado, foto_perfil, fecha_registro) VALUES (?, ?, ?, ?, 1, ?, NOW())");
    $stmt->execute([$nombre_completo, $correo, $contrasena_hasheada, $rol, $foto_perfil]);

    // Log de registro exitoso
    Logger::logActivity('REGISTRO_EXITOSO', "Nuevo usuario registrado: $correo", [
        'nombre' => $nombre_completo,
        'rol' => $rol
    ]);

    // Regenerar token CSRF para la próxima operación
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    unset($_SESSION['token_csrf']);

    echo json_encode([
        'success' => true,
        'message' => 'Registro exitoso. Ahora puede iniciar sesión.',
        'redirect' => '../frontend/login.html'
    ]);

} catch (PDOException $e) {
    // Log de error de base de datos
    Logger::logError("Error al registrar usuario: " . $e->getMessage(), $e);
    
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al registrar el usuario. Por favor, intente más tarde.']);
} catch (Exception $e) {
    // Log de error general
    Logger::logError("Error inesperado en registro: " . $e->getMessage(), $e);
    
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error inesperado. Por favor, intente más tarde.']);
}
?>
