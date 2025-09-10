<?php
// backend/historias/listar.php
header('Content-Type: application/json; charset=utf-8');
require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../config/constantes.php';

// Verificar autenticación
if (!SessionManager::estaAutenticado()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autorizado']);
    exit();
}

try {
    // Obtener parámetros de búsqueda y paginación
    $search = $_GET['search'] ?? '';
    $page = intval($_GET['page'] ?? 1);
    $limit = intval($_GET['limit'] ?? 10);
    $offset = ($page - 1) * $limit;

    // Construir consulta base con JOIN para obtener nombre del paciente y médico
    $baseQuery = "SELECT
                  hc.id,
                  hc.paciente_id,
                  hc.medico_id,
                  hc.fecha_creacion,
                  hc.motivo_consulta,
                  hc.diagnostico,
                  hc.tratamiento,
                  hc.antecedentes,
                  hc.observaciones,
                  hc.examen_fisico,
                  hc.examenes_complementarios,
                  hc.grupo_sanguineo,
                  p.nombre as paciente_nombre,
                  p.apellidos as paciente_apellidos,
                  p.dni as paciente_dni,
                  p.genero as paciente_genero,
                  p.foto_paciente,
                  CONCAT(p.nombre, ' ', p.apellidos) as paciente_completo,
                  u.nombre_completo as medico_nombre,
                  u.rol as medico_rol,
                  DATE_FORMAT(hc.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_formateada
                  FROM historias_clinicas hc
                  INNER JOIN pacientes p ON hc.paciente_id = p.id
                  INNER JOIN usuarios u ON hc.medico_id = u.id
                  WHERE p.estado = 1";

    // Agregar búsqueda si existe
    $params = [];
    if (!empty($search)) {
        $baseQuery .= " AND (p.nombre LIKE :search OR p.apellidos LIKE :search OR p.dni LIKE :search OR hc.motivo_consulta LIKE :search OR hc.diagnostico LIKE :search)";
        $params[':search'] = "%$search%";
    }

    // Contar total de registros
    $countQuery = "SELECT COUNT(*) as total FROM historias_clinicas hc
                   INNER JOIN pacientes p ON hc.paciente_id = p.id
                   WHERE p.estado = 1";
    
    if (!empty($search)) {
        $countQuery .= " AND (p.nombre LIKE :search OR p.apellidos LIKE :search OR p.dni LIKE :search OR hc.motivo_consulta LIKE :search OR hc.diagnostico LIKE :search)";
    }

    $countStmt = $pdo->prepare($countQuery);
    if (!empty($search)) {
        $countStmt->bindParam(':search', $params[':search']);
    }
    $countStmt->execute();
    $totalRecords = $countStmt->fetch()['total'];

    // Obtener historias con límite
    $query = $baseQuery . " ORDER BY hc.fecha_creacion DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($query);
    
    if (!empty($search)) {
        $stmt->bindParam(':search', $params[':search']);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $historias = $stmt->fetchAll();

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $historias,
        'pagination' => [
            'total' => $totalRecords,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($totalRecords / $limit)
        ]
    ]);

} catch (Exception $e) {
    error_log("[ERROR LISTAR HISTORIAS] " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al obtener historias médicas']);
}
?>