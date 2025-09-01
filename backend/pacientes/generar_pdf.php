<?php
// backend/pacientes/generar_pdf.php
require_once '../config/config.php';
require_once '../classes/SessionManager.php';
require_once '../../vendor/autoload.php'; // Para dompdf

use Dompdf\Dompdf;

// Verificar autenticación
if (!SessionManager::estaAutenticado()) {
    die('No autorizado');
}

try {
    $id = intval($_GET['id'] ?? 0);
    
    $stmt = $pdo->prepare("SELECT * FROM pacientes WHERE id = ? AND estado = 1");
    $stmt->execute([$id]);
    $paciente = $stmt->fetch();
    
    if (!$paciente) {
        die('Paciente no encontrado');
    }

    // Calcular edad
    $fecha_nacimiento = new DateTime($paciente['fecha_nacimiento']);
    $hoy = new DateTime();
    $edad = $hoy->diff($fecha_nacimiento)->y;

    // Crear HTML para PDF
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Ficha del Paciente</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
            .patient-photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #667eea; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #333; }
            .value { color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Ficha del Paciente</h1>
            <p>Generado el ' . date('d/m/Y H:i') . '</p>
        </div>

        <div class="section">
            <h3>Información Personal</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="label">Nombre Completo:</div>
                    <div class="value">' . htmlspecialchars($paciente['nombre'] . ' ' . $paciente['apellidos']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">DNI:</div>
                    <div class="value">' . htmlspecialchars($paciente['dni']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Fecha de Nacimiento:</div>
                    <div class="value">' . date('d/m/Y', strtotime($paciente['fecha_nacimiento'])) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Edad:</div>
                    <div class="value">' . $edad . ' años</div>
                </div>
                <div class="info-item">
                    <div class="label">Género:</div>
                    <div class="value">' . htmlspecialchars($paciente['genero']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Teléfono:</div>
                    <div class="value">' . htmlspecialchars($paciente['telefono']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Dirección:</div>
                    <div class="value">' . htmlspecialchars($paciente['direccion']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Seguro Médico:</div>
                    <div class="value">' . htmlspecialchars($paciente['seguro_medico']) . '</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Información Médica</h3>
            <div class="info-item">
                <div class="label">Alergias:</div>
                <div class="value">' . htmlspecialchars($paciente['alergias'] ?: 'Ninguna') . '</div>
            </div>
            <div class="info-item">
                <div class="label">Medicamentos Actuales:</div>
                <div class="value">' . htmlspecialchars($paciente['medicamentos_actuales'] ?: 'Ninguno') . '</div>
            </div>
        </div>
    </body>
    </html>';

    // Generar PDF
    $dompdf = new Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    
    // Descargar PDF
    $dompdf->stream('ficha_paciente_' . $paciente['dni'] . '.pdf', ['Attachment' => false]);

} catch (Exception $e) {
    die('Error al generar PDF: ' . $e->getMessage());
}
?>