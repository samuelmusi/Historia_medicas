
<?php
// backend/reportes/estadisticas.php

// Establece el tipo de contenido de la respuesta como JSON
header('Content-Type: application/json; charset=utf-8');

// Se incluyen los archivos necesarios para la conexión, constantes y manejo de sesión
require_once '../conexion.php';
require_once __DIR__ . '/../config/constantes.php'; // Incluye las constantes globales, como SESSION_USER_ID
require_once '../classes/SessionManager.php';

// Verificar autenticación (temporalmente deshabilitada para pruebas)
// if (!SessionManager::estaAutenticado()) {
//     http_response_code(401);
//     echo json_encode(['success' => false, 'error' => 'No autorizado']);
//     exit();
// }

try {
    // =============================
    // LÓGICA PARA LA GRÁFICA DE GÉNERO
    // =============================
    // Consulta la cantidad de pacientes por género (solo activos)
    $stmtGenero = $pdo->prepare("
        SELECT
            genero,
            COUNT(*) as cantidad
        FROM pacientes
        WHERE estado = 1
        GROUP BY genero
        ORDER BY genero
    ");
    $stmtGenero->execute();
    $distribucionGenero = $stmtGenero->fetchAll(PDO::FETCH_ASSOC);

    // Inicializa los géneros posibles para asegurar que la gráfica de torta siempre tenga los tres segmentos
    $generoMap = [
        'M' => 0,    // Masculino
        'F' => 0,    // Femenino
        'Otro' => 0  // Otro
    ];
    $totalPacientes = 0;

    // Suma los valores reales de la base de datos a cada género
    foreach ($distribucionGenero as $row) {
        if ($row['genero'] === 'M') {
            $generoMap['M'] = (int)$row['cantidad'];
        } elseif ($row['genero'] === 'F') {
            $generoMap['F'] = (int)$row['cantidad'];
        } else {
            $generoMap['Otro'] += (int)$row['cantidad'];
        }
        $totalPacientes += (int)$row['cantidad'];
    }

    // Prepara los labels y datos en el orden esperado por el frontend para la gráfica de torta
    // Esto garantiza que siempre se muestren los tres géneros, aunque alguno tenga valor 0
    $generoLabels = ['Masculino', 'Femenino', 'Otro'];
    $generoData = [
        $generoMap['M'],
        $generoMap['F'],
        $generoMap['Otro']
    ];

    // Obtener estadísticas mensuales (últimos 6 meses) - Versión simplificada
    $stmtMensual = $pdo->prepare("
        SELECT
            DATE_FORMAT(fecha_registro, '%Y-%m') as mes,
            DATE_FORMAT(fecha_registro, '%b %Y') as mes_formateado,
            COUNT(*) as cantidad
        FROM pacientes
        WHERE estado = 1
        AND fecha_registro >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(fecha_registro, '%Y-%m'), DATE_FORMAT(fecha_registro, '%b %Y')
        ORDER BY mes ASC
    ");
    $stmtMensual->execute();
    $estadisticasMensuales = $stmtMensual->fetchAll(PDO::FETCH_ASSOC);

    // Debug: Verificar qué datos se están obteniendo
    error_log("Estadísticas mensuales obtenidas: " . json_encode($estadisticasMensuales));
    error_log("Fecha actual: " . date('Y-m-d H:i:s'));
    error_log("Hace 6 meses: " . date('Y-m-d H:i:s', strtotime('-6 months')));

    // Formatear datos mensuales para la gráfica - Versión simplificada
    $mensualLabels = [];
    $mensualData = [];

    // Crear array con los últimos 6 meses (formato simplificado)
    for ($i = 5; $i >= 0; $i--) {
        $fecha = new DateTime();
        $fecha->modify("-$i months");
        $mesFormateado = $fecha->format('M Y'); // Formato: "Sep 2024"
        $mensualLabels[] = $mesFormateado;
        $mensualData[] = 0; // Valor por defecto
    }

    // Llenar con datos reales
    foreach ($estadisticasMensuales as $row) {
        $index = array_search($row['mes_formateado'], $mensualLabels);
        if ($index !== false) {
            $mensualData[$index] = (int)$row['cantidad'];
        }
    }

    // Debug adicional
    error_log("Labels generados: " . json_encode($mensualLabels));
    error_log("Datos finales: " . json_encode($mensualData));

    // Obtener estadísticas generales
    $stmtGenerales = $pdo->prepare("
        SELECT
            COUNT(*) as total_pacientes,
            COUNT(CASE WHEN genero = 'M' THEN 1 END) as total_masculino,
            COUNT(CASE WHEN genero = 'F' THEN 1 END) as total_femenino,
            COUNT(CASE WHEN genero = 'Otro' THEN 1 END) as total_otro,
            COUNT(CASE WHEN fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as nuevos_mes
        FROM pacientes
        WHERE estado = 1
    ");
    $stmtGenerales->execute();
    $estadisticasGenerales = $stmtGenerales->fetch(PDO::FETCH_ASSOC);

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => [
            'distribucion_genero' => [
                'labels' => $generoLabels,
                'data' => $generoData,
                'total' => $totalPacientes
            ],
            'estadisticas_mensuales' => [
                'labels' => $mensualLabels,
                'data' => $mensualData
            ],
            'estadisticas_generales' => [
                'total_pacientes' => (int)$estadisticasGenerales['total_pacientes'],
                'total_masculino' => (int)$estadisticasGenerales['total_masculino'],
                'total_femenino' => (int)$estadisticasGenerales['total_femenino'],
                'total_otro' => (int)$estadisticasGenerales['total_otro'],
                'nuevos_mes' => (int)$estadisticasGenerales['nuevos_mes']
            ]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener estadísticas: ' . $e->getMessage()
    ]);
}
?>
