class PacientesManager {
    async editarPaciente(id) {
        this.abrirModal(id);
    }

    async eliminarPaciente(id) {
        const paciente = this.pacientes.find(p => p.id === id);
        if (!paciente) return;
        const confirmar = await Swal.fire({
            title: '¿Estás seguro?',
            text: `¿Deseas eliminar al paciente ${paciente.nombre} ${paciente.apellidos}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f56565',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (confirmar.isConfirmed) {
            try {
                const formData = new FormData();
                formData.append('id', id);
                const response = await fetch('../backend/pacientes/eliminar.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    this.mostrarExito(data.message);
                    this.loadPacientes();
                    this.updatePacientesCount();
                } else {
                    this.mostrarError(data.error);
                }
            } catch (error) {
                console.error('Error al eliminar paciente:', error);
                this.mostrarError('Error al eliminar el paciente');
            }
        }
    }
    renderPacientes() {
        const grid = document.getElementById('pacientesGrid');
        if (!this.filteredPacientes || this.filteredPacientes.length === 0) {
            grid.innerHTML = `
                <div class="no-pacientes">
                    <img src="../frontend/img/icons/carpeta medica.png" alt="Sin pacientes" style="width: 120px; margin-bottom: 10px;">
                    <p>Comienza agregando tu primer paciente</p>
                </div>
            `;
            return;
        }
        grid.innerHTML = this.filteredPacientes.map(paciente => {
            let avatar = '../backend/uploads/pacientes/avatar_hombre.jpg';
            if (paciente.genero === 'F') {
                avatar = '../backend/uploads/pacientes/avatar_mujer.jpg';
            } else if (paciente.genero === 'O' || paciente.genero === 'Otro') {
                avatar = '../backend/uploads/pacientes/avatar_otro.png';
            }
            let generoLabel = 'Otro'; // Por defecto 'Otro'
            if (paciente.genero === 'M') {
                generoLabel = 'Masculino';
            } else if (paciente.genero === 'F') {
                generoLabel = 'Femenino';
            } else if (paciente.genero === 'Otro') {
                generoLabel = 'Otro';
            } else if (paciente.genero === 'O') {
                generoLabel = 'Otro';
            } else if (typeof paciente.genero === 'string' && paciente.genero.toLowerCase() === 'otro') {
                generoLabel = 'Otro';
            }
            return `
            <div class="paciente-card">
                <div class="card-header">
                    <div class="paciente-info">
                        <img src="${paciente.foto_paciente ? `../backend/${paciente.foto_paciente}` : avatar}" 
                            alt="${paciente.nombre}" class="paciente-foto">
                        <div class="paciente-datos">
                            <h4>${paciente.nombre} ${paciente.apellidos}</h4>
                            <p>Cédula: ${paciente.dni}</p>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-item">
                        <span class="info-label">Edad:</span>
                        <span class="info-value">${paciente.edad} años</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Género:</span>
                        <span class="info-value">${generoLabel}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Teléfono:</span>
                        <span class="info-value">${paciente.telefono || 'No especificado'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Seguro:</span>
                        <span class="info-value">${paciente.seguro_medico || 'No especificado'}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-icon btn-edit" onclick="pacientesManager.editarPaciente(${paciente.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-pdf" onclick="pacientesManager.generarPDF(${paciente.id})" title="Generar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="pacientesManager.eliminarPaciente(${paciente.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }
    setPreviewAvatarByGenero(genero) {
        let avatar = '../backend/uploads/pacientes/avatar_hombre.jpg';
        if (genero === 'F') {
            avatar = '../backend/uploads/pacientes/avatar_mujer.jpg';
        } else if (genero === 'O' || genero === 'Otro') {
            avatar = '../backend/uploads/pacientes/avatar_otro.png';
        }
        document.getElementById('previewFoto').src = avatar;
    }
    constructor() {
        this.pacientes = [];
        this.filteredPacientes = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalPages = 1;
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.loadPacientes();
        this.updatePacientesCount();
    }
    setupEventListeners() {
        document.getElementById('btnNuevoPaciente').addEventListener('click', () => this.abrirModal());
        document.getElementById('closeModal').addEventListener('click', () => this.cerrarModal());
        document.getElementById('btnCancelar').addEventListener('click', () => this.cerrarModal());
        document.getElementById('modalPaciente').addEventListener('click', (e) => {
            if (e.target.id === 'modalPaciente') this.cerrarModal();
        });
        document.getElementById('formPaciente').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarPaciente();
        });
        document.getElementById('searchInput').addEventListener('input', (e) => this.buscarPacientes(e.target.value));
        document.getElementById('filterGenero').addEventListener('change', (e) => this.filtrarPorGenero(e.target.value));

        // Event listener para selección de foto
        document.getElementById('foto_paciente').addEventListener('change', (e) => this.previewFoto(e.target.files[0]));

        // Event listener para cambio de género
        document.getElementById('genero').addEventListener('change', (e) => {
            const fileInput = document.getElementById('foto_paciente');
            // Solo actualizar avatar si no hay foto personalizada seleccionada
            if (!fileInput.files || fileInput.files.length === 0) {
                this.setPreviewAvatarByGenero(e.target.value);
            }
        });

        // Event listener para hacer clic en la imagen de preview (abre selector de archivos)
        document.getElementById('previewFoto').addEventListener('click', () => {
            document.getElementById('foto_paciente').click();
        });

        // Validaciones en tiempo real
        this.setupRealTimeValidations();
    }

    setupRealTimeValidations() {
        // Validación de cédula en tiempo real
        document.getElementById('dni').addEventListener('input', (e) => {
            const value = e.target.value;
            // Solo permitir números
            e.target.value = value.replace(/[^0-9]/g, '');
            // Limitar a 8 caracteres
            if (e.target.value.length > 8) {
                e.target.value = e.target.value.slice(0, 8);
            }
        });

        // Validación de nombre en tiempo real
        document.getElementById('nombre').addEventListener('input', (e) => {
            const value = e.target.value;
            // Solo permitir letras, espacios y caracteres especiales latinos
            e.target.value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            // Limitar a 200 caracteres
            if (e.target.value.length > 200) {
                e.target.value = e.target.value.slice(0, 200);
            }
        });

        // Validación de apellidos en tiempo real
        document.getElementById('apellidos').addEventListener('input', (e) => {
            const value = e.target.value;
            // Solo permitir letras, espacios y caracteres especiales latinos
            e.target.value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            // Limitar a 200 caracteres
            if (e.target.value.length > 200) {
                e.target.value = e.target.value.slice(0, 200);
            }
        });

        // Validación de teléfono en tiempo real
        document.getElementById('telefono').addEventListener('input', (e) => {
            const value = e.target.value;
            // Permitir +58 al inicio y luego solo números
            let cleanValue = value.replace(/^\+58/, '');
            cleanValue = cleanValue.replace(/[^0-9]/g, '');
            // Limitar a 11 dígitos
            if (cleanValue.length > 11) {
                cleanValue = cleanValue.slice(0, 11);
            }
            // Volver a agregar +58 si el usuario lo escribió
            e.target.value = value.startsWith('+58') ? '+58' + cleanValue : cleanValue;
        });

        // Validación de seguro médico en tiempo real
        document.getElementById('seguro_medico').addEventListener('input', (e) => {
            const value = e.target.value;
            // Solo permitir letras
            e.target.value = value.replace(/[^a-zA-Z]/g, '');
            // Limitar a 3 caracteres
            if (e.target.value.length > 3) {
                e.target.value = e.target.value.slice(0, 3);
            }
        });

        // Validación de alergias en tiempo real
        document.getElementById('alergias').addEventListener('input', (e) => {
            const value = e.target.value;
            // Solo permitir letras, espacios, comas y caracteres especiales latinos
            e.target.value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s,]/g, '');
        });

        // Validación de medicamentos en tiempo real
        document.getElementById('medicamentos_actuales').addEventListener('input', (e) => {
            const value = e.target.value;
            // Solo permitir letras, espacios, comas y caracteres especiales latinos
            e.target.value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s,]/g, '');
        });

        // Validación de dirección en tiempo real
        document.getElementById('direccion').addEventListener('input', (e) => {
            const value = e.target.value;
            // Permitir letras, números, espacios y caracteres especiales comunes
            e.target.value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,#\-\.]/g, '');
        });
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        
        // Botón anterior
        html += `<button ${this.currentPage === 1 ? 'disabled' : ''} 
        onclick="pacientesManager.cambiarPagina(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>`;

        // Números de página
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `<button class="${i === this.currentPage ? 'active' : ''}" 
                            onclick="pacientesManager.cambiarPagina(${i})">
                            ${i}
                        </button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<span>...</span>';
            }
        }

        // Botón siguiente
        html += `<button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="pacientesManager.cambiarPagina(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>`;

        pagination.innerHTML = html;
    }

    cambiarPagina(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.loadPacientes(page);
        }
    }

    buscarPacientes(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredPacientes = [...this.pacientes];
        } else {
            this.filteredPacientes = this.pacientes.filter(paciente =>
                paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                paciente.dni.includes(searchTerm)
            );
        }
        this.renderPacientes();
    }

    filtrarPorGenero(genero) {
        if (!genero) {
            this.filteredPacientes = [...this.pacientes];
        } else {
            this.filteredPacientes = this.pacientes.filter(paciente => {
                // Manejar el filtro de "Otro" para que coincida con 'O', 'Otro' o vacío
                if (genero === 'O') {
                    return paciente.genero === 'O' ||
                           paciente.genero === 'Otro' ||
                           (typeof paciente.genero === 'string' && paciente.genero.toLowerCase() === 'otro') ||
                           !paciente.genero || paciente.genero === '';
                }
                // Para otros géneros, comparación directa
                return paciente.genero === genero;
            });
        }
        this.renderPacientes();
    }
    async loadPacientes(page = 1) {
        try {
            const response = await fetch(`../backend/pacientes/listar.php?page=${page}&limit=${this.itemsPerPage}`);
            const data = await response.json();
            if (data.success) {
                this.pacientes = data.data;
                this.filteredPacientes = [...this.pacientes];
                this.currentPage = data.pagination.currentPage;
                this.totalPages = data.pagination.totalPages;
                this.renderPacientes();
                this.renderPagination();
            } else {
                this.pacientes = [];
                this.filteredPacientes = [];
                this.renderPacientes();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            this.pacientes = [];
            this.filteredPacientes = [];
            this.renderPacientes();
            this.renderPagination();
        }
    }

    async updatePacientesCount() {
        try {
            const response = await fetch('../backend/pacientes/listar.php?limit=1000');
            const data = await response.json();
            if (data.success) {
                document.getElementById('totalPacientes').textContent = data.pagination.total;
                // Actualizar también en el dashboard si existe
                const dashboardCount = document.getElementById('totalPacientesDashboard');
                if (dashboardCount) {
                    dashboardCount.textContent = data.pagination.total;
                }
            }
        } catch (error) {
            console.error('Error al actualizar contador:', error);
        }
    }

    abrirModal(pacienteId = null) {
        const modal = document.getElementById('modalPaciente');
        const form = document.getElementById('formPaciente');
        const title = document.getElementById('modalTitle');
        
        if (pacienteId) {
            title.textContent = 'Editar Paciente';
            this.cargarDatosPaciente(pacienteId);
        } else {
            title.textContent = 'Registrar Nuevo Paciente';
            form.reset();
            document.getElementById('pacienteId').value = '';
            // Mostrar avatar según el género seleccionado (por defecto 'M')
            const genero = document.getElementById('genero').value || 'M';
            this.setPreviewAvatarByGenero(genero);
        }
        
        modal.style.display = 'block';
    }

    cerrarModal() {
        document.getElementById('modalPaciente').style.display = 'none';
    }

    async cargarDatosPaciente(id) {
        try {
            const response = await fetch(`../backend/pacientes/obtener.php?id=${id}`);
            const data = await response.json();

            if (data.success) {
                const paciente = data.data;
                document.getElementById('pacienteId').value = paciente.id;
                document.getElementById('dni').value = paciente.dni;
                document.getElementById('nombre').value = paciente.nombre;
                document.getElementById('apellidos').value = paciente.apellidos;
                document.getElementById('fecha_nacimiento').value = paciente.fecha_nacimiento;
                document.getElementById('genero').value = paciente.genero;
                document.getElementById('telefono').value = paciente.telefono || '';
                document.getElementById('direccion').value = paciente.direccion || '';
                document.getElementById('alergias').value = paciente.alergias || '';
                document.getElementById('medicamentos_actuales').value = paciente.medicamentos_actuales || '';
                document.getElementById('seguro_medico').value = paciente.seguro_medico || '';

                // Determinar si el paciente tiene foto personalizada o avatar por defecto
                const tieneFotoPersonalizada = paciente.foto_paciente &&
                    !paciente.foto_paciente.includes('avatar_hombre.jpg') &&
                    !paciente.foto_paciente.includes('avatar_mujer.jpg') &&
                    !paciente.foto_paciente.includes('avatar_otro.png');

                // Mostrar la foto del paciente
                if (tieneFotoPersonalizada) {
                    document.getElementById('previewFoto').src = `../backend/${paciente.foto_paciente}`;
                } else {
                    // Mostrar avatar por defecto según género
                    this.setPreviewAvatarByGenero(paciente.genero);
                }

                // Configurar listener para cambio de género (solo si no tiene foto personalizada)
                const generoInput = document.getElementById('genero');
                const fileInput = document.getElementById('foto_paciente');

                // Remover listeners previos para evitar duplicados
                const newGeneroInput = generoInput.cloneNode(true);
                generoInput.parentNode.replaceChild(newGeneroInput, generoInput);

                // Agregar listener para actualizar preview cuando cambia el género
                newGeneroInput.addEventListener('change', (e) => {
                    // Solo actualizar si no hay foto personalizada subida
                    if (!fileInput.files || fileInput.files.length === 0) {
                        this.setPreviewAvatarByGenero(e.target.value);
                    }
                });

                // También actualizar cuando se selecciona/cambia una foto
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        this.previewFoto(e.target.files[0]);
                    } else {
                        // Si se quita la foto, mostrar avatar por defecto
                        this.setPreviewAvatarByGenero(newGeneroInput.value);
                    }
                });
            }
        } catch (error) {
            console.error('Error al cargar datos del paciente:', error);
            this.mostrarError('Error al cargar los datos del paciente');
        }
    }

    async guardarPaciente() {
        const form = document.getElementById('formPaciente');
        const formData = new FormData(form);

        // Validar campos obligatorios
        const requiredFields = ['dni', 'nombre', 'apellidos', 'fecha_nacimiento', 'genero'];
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                this.mostrarError(`El campo ${field} es obligatorio`);
                return;
            }
        }

        // Validaciones específicas

        // Validar cédula: debe ser exactamente 8 dígitos numéricos, solo números
        const dni = formData.get('dni');
        if (!/^\d{8}$/.test(dni)) {
            this.mostrarError('La cédula debe contener exactamente 8 números (sin letras)');
            return;
        }

        // Validar nombre: máximo 200 caracteres, solo letras
        const nombre = formData.get('nombre');
        if (nombre.length > 200) {
            this.mostrarError('El nombre no puede tener más de 200 caracteres');
            return;
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
            this.mostrarError('El nombre solo puede contener letras y espacios');
            return;
        }

        // Validar apellidos: máximo 200 caracteres, solo letras
        const apellidos = formData.get('apellidos');
        if (apellidos.length > 200) {
            this.mostrarError('Los apellidos no pueden tener más de 200 caracteres');
            return;
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) {
            this.mostrarError('Los apellidos solo pueden contener letras y espacios');
            return;
        }

        // Validar teléfono: debe ser exactamente 11 dígitos numéricos (Venezuela)
        const telefono = formData.get('telefono');
        if (telefono && telefono.trim() !== '') {
            // Permitir +58 al inicio opcionalmente
            const telefonoLimpio = telefono.replace(/^\+58/, '');
            if (!/^\d{11}$/.test(telefonoLimpio)) {
                this.mostrarError('El número de teléfono debe contener exactamente 11 números (puede incluir +58)');
                return;
            }
        }

        // Validar seguro médico: máximo 3 caracteres, solo "si" o "no" (case insensitive), solo letras
        const seguroMedico = formData.get('seguro_medico');
        if (seguroMedico && seguroMedico.trim() !== '') {
            const seguroLower = seguroMedico.toLowerCase();
            if (seguroMedico.length > 3 || (seguroLower !== 'si' && seguroLower !== 'no')) {
                this.mostrarError('El seguro médico debe ser "si" o "no" con máximo 3 caracteres');
                return;
            }
            if (!/^[a-zA-Z]+$/.test(seguroMedico)) {
                this.mostrarError('El seguro médico solo puede contener letras');
                return;
            }
        }

        // Validar alergias: solo letras y espacios
        const alergias = formData.get('alergias');
        if (alergias && alergias.trim() !== '') {
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s,]+$/.test(alergias)) {
                this.mostrarError('Las alergias solo pueden contener letras, espacios y comas');
                return;
            }
        }

        // Validar medicamentos: solo letras y espacios
        const medicamentos = formData.get('medicamentos_actuales');
        if (medicamentos && medicamentos.trim() !== '') {
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s,]+$/.test(medicamentos)) {
                this.mostrarError('Los medicamentos solo pueden contener letras, espacios y comas');
                return;
            }
        }

        // Validar dirección: letras, espacios, números y caracteres especiales comunes
        const direccion = formData.get('direccion');
        if (direccion && direccion.trim() !== '') {
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s,#\-\.]+$/.test(direccion)) {
                this.mostrarError('La dirección contiene caracteres no permitidos');
                return;
            }
        }

        // Si no se seleccionó foto, el backend asignará la imagen por defecto según el género
        if (!formData.get('foto_paciente') || formData.get('foto_paciente').size === 0) {
            formData.delete('foto_paciente');
            // No se envía ningún campo extra, el backend se encarga de asignar la imagen por defecto
        }

        const isEdit = formData.get('id');
        const url = isEdit ? '../backend/pacientes/editar.php' : '../backend/pacientes/agregar.php';

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito(data.message);
                this.cerrarModal();
                this.loadPacientes();
                this.updatePacientesCount();
            } else {
                this.mostrarError(data.error);
            }
        } catch (error) {
            console.error('Error al guardar paciente:', error);
            this.mostrarError('Error al guardar el paciente');
        }
    }

    generarPDF(id) {
        window.open(`../backend/pacientes/generar_pdf.php?id=${id}`, '_blank');
    }

    previewFoto(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('previewFoto').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    mostrarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: mensaje,
            timer: 3000,
            showConfirmButton: false
        });
    }

    mostrarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje
        });
    }
}

// Inicializar cuando el DOM esté listo
let pacientesManager;
document.addEventListener('DOMContentLoaded', () => {
    pacientesManager = new PacientesManager();
});