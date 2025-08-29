-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS historia_medicas;
USE historia_medicas;

-- Tabla para usuarios (médicos y enfermeras)
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('medico', 'enfermera') NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT NULL COMMENT 'Ruta de la foto de perfil',
    estado TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=activo, 0=inactivo',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME DEFAULT NULL COMMENT 'Fecha del último inicio de sesión'
);

-- Tabla para pacientes
CREATE TABLE pacientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dni VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('M', 'F', 'Otro') NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    foto_paciente VARCHAR(255) DEFAULT NULL COMMENT 'Ruta de la foto del paciente',
    alergias TEXT DEFAULT NULL COMMENT 'Alergias del paciente',
    medicamentos_actuales TEXT DEFAULT NULL COMMENT 'Medicamentos que el paciente está tomando actualmente',
    seguro_medico VARCHAR(100) DEFAULT NULL COMMENT 'Información del seguro médico del paciente',
    estado TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1=activo, 0=inactivo',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para historias clínicas
CREATE TABLE historias_clinicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL COMMENT 'ID del médico que creó la historia',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo_consulta TEXT NOT NULL,
    antecedentes TEXT DEFAULT NULL,
    diagnostico TEXT DEFAULT NULL,
    tratamiento TEXT DEFAULT NULL,
    observaciones TEXT DEFAULT NULL,
    grupo_sanguineo ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') DEFAULT NULL,
    examen_fisico TEXT DEFAULT NULL COMMENT 'Resultados del examen físico',
    examenes_complementarios TEXT DEFAULT NULL COMMENT 'Resultados de análisis y exámenes complementarios',
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla para citas
CREATE TABLE citas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    paciente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    estado ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    motivo VARCHAR(255) NOT NULL COMMENT 'Motivo de la cita',
    recordatorio_horas INT NOT NULL DEFAULT 24 COMMENT 'Horas antes de la cita para el recordatorio',
    notificacion_enviada TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=enviada, 0=no enviada',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla para registrar intentos de login (para seguridad de fuerza bruta)
CREATE TABLE intentos_login (
    id INT PRIMARY KEY AUTO_INCREMENT,
    correo VARCHAR(100) NOT NULL,
    exitoso TINYINT(1) NOT NULL COMMENT '1=exitoso, 0=fallido',
    ip VARCHAR(45) DEFAULT NULL COMMENT 'Dirección IP del intento',
    user_agent TEXT DEFAULT NULL COMMENT 'User-Agent del navegador',
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_correo ON usuarios(correo);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_pacientes_dni ON pacientes(dni);
CREATE INDEX idx_pacientes_estado ON pacientes(estado);
CREATE INDEX idx_historias_paciente ON historias_clinicas(paciente_id);
CREATE INDEX idx_historias_medico ON historias_clinicas(medico_id);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_usuario ON citas(usuario_id);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_intentos_correo ON intentos_login(correo);
CREATE INDEX idx_intentos_fecha ON intentos_login(fecha);

