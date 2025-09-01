<?php
// backend/pacientes/listar.php
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

    // Construir consulta base
    $baseQuery = "SELECT p.*, 
                  DATE_FORMAT(p.fecha_nacimiento, '%d/%m/%Y') as fecha_nacimiento_formateada,
                  TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) as edad
                  FROM pacientes p 
                  WHERE p.estado = 1";

    // Agregar búsqueda si existe
    if (!empty($search)) {
        $baseQuery .= " AND (p.nombre LIKE :search OR p.apellidos LIKE :search OR p.dni LIKE :search)";
    }

    // Contar total de registros
    $countQuery = "SELECT COUNT(*) as total FROM pacientes p WHERE p.estado = 1";
    if (!empty($search)) {
        $countQuery .= " AND (p.nombre LIKE :search OR p.apellidos LIKE :search OR p.dni LIKE :search)";
    }
    $countStmt = $pdo->prepare($countQuery);
    if (!empty($search)) {
        $searchParam = "%$search%";
        $countStmt->bindParam(':search', $searchParam);
    }
    $countStmt->execute();
    $totalRecords = $countStmt->fetch()['total'];

    // Obtener pacientes con límite
    $query = $baseQuery . " ORDER BY p.fecha_registro DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($query);
    
    if (!empty($search)) {
        $searchParam = "%$search%";
        $stmt->bindParam(':search', $searchParam);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $pacientes = $stmt->fetchAll();

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $pacientes,
        'pagination' => [
            'total' => $totalRecords,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($totalRecords / $limit)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al obtener pacientes']);
}
?>