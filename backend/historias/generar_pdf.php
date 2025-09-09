<?php
// backend/historias/generar_pdf.php
require_once '../conexion.php';
require_once '../classes/SessionManager.php';
require_once '../config/constantes.php';
require_once '../../vendor/autoload.php';

use Dompdf\Dompdf;

// Verificar autenticación
if (!SessionManager::estaAutenticado()) {
    die('No autorizado');
}

try {
    $id = intval($_GET['id'] ?? 0);
    
    // Obtener datos de la historia médica
    $stmt = $pdo->prepare("SELECT 
                        hc.*,
                        p.nombre as paciente_nombre,
                        p.apellidos as paciente_apellidos,
                        p.dni as paciente_dni,
                        p.fecha_nacimiento,
                        p.genero,
                        p.telefono,
                        p.direccion,
                        p.seguro_medico,
                        p.alergias,
                        p.medicamentos_actuales,
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
    
    if (!$historia) {
        die('Historia médica no encontrada');
    }

    // Determinar avatar según género
    $avatar = 'avatar_hombre.jpg';
    if ($historia['genero'] === 'F') {
        $avatar = 'avatar_mujer.jpg';
    } elseif ($historia['genero'] === 'Otro') {
        $avatar = 'avatar_otro.png';
    }

    // Crear HTML para PDF
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Historia Médica - ' . htmlspecialchars($historia['paciente_nombre'] . ' ' . $historia['paciente_apellidos']) . '</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.6;
                color: #333;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #667eea; 
                padding-bottom: 20px; 
            }
            .header h1 {
                color: #667eea;
                margin-bottom: 10px;
            }
            .patient-photo { 
                width: 100px; 
                height: 100px; 
                border-radius: 50%; 
                object-fit: cover; 
                margin-bottom: 10px;
                border: 3px solid #667eea;
            }
            .section { 
                margin-bottom: 25px; 
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #667eea;
            }
            .section h3 { 
                color: #667eea; 
                margin-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 5px;
            }
            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
            }
            .info-item { 
                margin-bottom: 10px; 
            }
            .label { 
                font-weight: bold; 
                color: #495057; 
                display: block;
                margin-bottom: 3px;
            }
            .value { 
                color: #6c757d; 
                background: white;
                padding: 5px 10px;
                border-radius: 5px;
                display: block;
            }
            .medical-data {
                background: white;
                padding: 15px;
                border-radius: 5px;
                margin-top: 10px;
                white-space: pre-wrap;
                border: 1px solid #dee2e6;
            }
            .no-data {
                color: #6c757d;
                font-style: italic;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #667eea;
                text-align: center;
                color: #6c757d;
            }
            .medico-firma {
                margin-top: 40px;
                text-align: right;
            }
            .medico-firma .nombre {
                font-weight: bold;
                color: #667eea;
                border-top: 2px solid #667eea;
                padding-top: 10px;
                display: inline-block;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>HISTORIA MÉDICA</h1>
            <p>Generado el ' . date('d/m/Y H:i') . '</p>
        </div>

        <div class="section">
            <h3><i class="fas fa-user"></i> Información del Paciente</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="label">Nombre Completo:</div>
                    <div class="value">' . htmlspecialchars($historia['paciente_nombre'] . ' ' . $historia['paciente_apellidos']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">DNI:</div>
                    <div class="value">' . htmlspecialchars($historia['paciente_dni']) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Edad:</div>
                    <div class="value">' . $historia['edad'] . ' años</div>
                </div>
                <div class="info-item">
                    <div class="label">Género:</div>
                    <div class="value">' . htmlspecialchars(
                        $historia['genero'] === 'M' ? 'Masculino' :
                        ($historia['genero'] === 'F' ? 'Femenino' : 'Otro')
                    ) . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Teléfono:</div>
                    <div class="value">' . htmlspecialchars($historia['telefono'] ?: 'No especificado') . '</div>
                </div>
                <div class="info-item">
                    <div class="label">Seguro Médico:</div>
                    <div class="value">' . htmlspecialchars($historia['seguro_medico'] ?: 'No especificado') . '</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-stethoscope"></i> Datos Clínicos</h3>
            <div class="info-item">
                <div class="label">Grupo Sanguíneo:</div>
                <div class="value">' . htmlspecialchars($historia['grupo_sanguineo'] ?: 'No especificado') . '</div>
            </div>
            <div class="info-item">
                <div class="label">Alergias:</div>
                <div class="medical-data">' . ($historia['alergias'] ? nl2br(htmlspecialchars($historia['alergias'])) : '<span class="no-data">No se registran alergias</span>') . '</div>
            </div>
            <div class="info-item">
                <div class="label">Medicamentos Actuales:</div>
                <div class="medical-data">' . ($historia['medicamentos_actuales'] ? nl2br(htmlspecialchars($historia['medicamentos_actuales'])) : '<span class="no-data">No se registran medicamentos</span>') . '</div>
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-notes-medical"></i> Consulta Actual</h3>
            <div class="info-item">
                <div class="label">Fecha de Consulta:</div>
                <div class="value">' . htmlspecialchars($historia['fecha_formateada']) . '</div>
            </div>
            <div class="info-item">
                <div class="label">Motivo de Consulta:</div>
                <div class="medical-data">' . nl2br(htmlspecialchars($historia['motivo_consulta'])) . '</div>
            </div>
            <div class="info-item">
                <div class="label">Antecedentes:</div>
                <div class="medical-data">' . ($historia['antecedentes'] ? nl2br(htmlspecialchars($historia['antecedentes'])) : '<span class="no-data">No se registran antecedentes</span>') . '</div>
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-procedures"></i> Evaluación Médica</h3>
            <div class="info-item">
                <div class="label">Examen Físico:</div>
                <div class="medical-data">' . ($historia['examen_fisico'] ? nl2br(htmlspecialchars($historia['examen_fisico'])) : '<span class="no-data">No se registran hallazgos</span>') . '</div>
            </div>
            <div class="info-item">
                <div class="label">Exámenes Complementarios:</div>
                <div class="medical-data">' . ($historia['examenes_complementarios'] ? nl2br(htmlspecialchars($historia['examenes_complementarios'])) : '<span class="no-data">No se registran exámenes</span>') . '</div>
            </div>
        </div>

        <div class="section">
            <h3><i class="fas fa-diagnoses"></i> Diagnóstico y Tratamiento</h3>
            <div class="info-item">
                <div class="label">Diagnóstico:</div>
                <div class="medical-data">' . ($historia['diagnostico'] ? nl2br(htmlspecialchars($historia['diagnostico'])) : '<span class="no-data">Sin diagnóstico</span>') . '</div>
            </div>
            <div class="info-item">
                <div class="label">Tratamiento:</div>
                <div class="medical-data">' . ($historia['tratamiento'] ? nl2br(htmlspecialchars($historia['tratamiento'])) : '<span class="no-data">Sin tratamiento</span>') . '</div>
            </div>
            <div class="info-item">
                <div class="label">Observaciones:</div>
                <div class="medical-data">' . ($historia['observaciones'] ? nl2br(htmlspecialchars($historia['observaciones'])) : '<span class="no-data">Sin observaciones</span>') . '</div>
            </div>
        </div>

        <div class="medico-firma">
            <p>Atendido por:</p>
            <div class="nombre">' . htmlspecialchars($historia['medico_nombre']) . '</div>
            <div>' . htmlspecialchars($historia['medico_rol']) . '</div>
            <div>' . htmlspecialchars($historia['fecha_formateada']) . '</div>
        </div>

        <div class="footer">
            <p>Sistema de Historias Médicas - Documento generado electrónicamente</p>
            <p>Este documento contiene información confidencial y debe ser tratado conforme a las normas de protección de datos médicos.</p>
        </div>
    </body>
    </html>';

    // Generar PDF
    $dompdf = new Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    
    // Descargar PDF
    $nombreArchivo = 'historia_medica_' . $historia['paciente_dni'] . '_' . date('Ymd') . '.pdf';
    $dompdf->stream($nombreArchivo, ['Attachment' => false]);

} catch (Exception $e) {
    die('Error al generar PDF: ' . $e->getMessage());
}
?>
