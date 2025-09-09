<?php
// backend/historias/ver.php
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
    $stmt = $pdo->prepare("SELECT 
                        hc.*,
                        p.nombre as paciente_nombre,
                        p.apellidos as paciente_apellidos,
                        p.dni as paciente_dni,
                        p.fecha_nacimiento,
                        p.genero,
                        p.telefono,
                        p.foto_paciente,
                        u.nombre_completo as medico_nombre,
                        u.rol as medico_rol,
                        DATE_FORMAT(hc.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_formateada,
                        TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) as edad
                        FROM historias_clinicas hc
                        INNER JOIN pacientes p ON hc.paciente_id = p.id
                        INNER JOIN usuarios u ON hc.medico_id = u.id
                        WHERE hc.id = ? AND p.estado = 1");
    $stmt->execute([$id]);
    $historia = $stmt->fetch();
    
    if ($historia) {
        echo json_encode(['success' => true, 'data' => $historia]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Historia médica no encontrada']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error al obtener historia médica']);
}
?>