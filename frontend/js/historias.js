// frontend/js/historias.js

class HistoriasManager {
    constructor() {
        this.historias = [];
        this.filteredHistorias = [];
        this.pacientes = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalPages = 1;
        this.selectedPaciente = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistorias();
        this.loadPacientes();
        this.loadMedicos();
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');

        // Botón Nueva Historia Médica - método directo
        const btnNuevaHistoria = document.getElementById('btnNuevaHistoria');
        if (btnNuevaHistoria) {
            btnNuevaHistoria.addEventListener('click', (e) => {
                console.log('Botón Nueva Historia Médica clickeado');
                e.preventDefault();
                this.abrirModalSeleccionarPaciente();
            });
            console.log('✅ Event listener agregado al botón Nueva Historia Médica');
        } else {
            console.error('❌ No se encontró el botón btnNuevaHistoria');
        }

        // Botones de cerrar modales
        const closeModalPaciente = document.getElementById('closeModalPaciente');
        if (closeModalPaciente) {
            closeModalPaciente.addEventListener('click', () => this.cerrarModalSeleccionarPaciente());
        }

        const closeModalHistoria = document.getElementById('closeModalHistoria');
        if (closeModalHistoria) {
            closeModalHistoria.addEventListener('click', () => this.cerrarModalHistoria());
        }

        // Cerrar modales al hacer clic fuera
        const modalSeleccionarPaciente = document.getElementById('modalSeleccionarPaciente');
        if (modalSeleccionarPaciente) {
            modalSeleccionarPaciente.addEventListener('click', (e) => {
                if (e.target.id === 'modalSeleccionarPaciente') this.cerrarModalSeleccionarPaciente();
            });
        }

        const modalHistoria = document.getElementById('modalHistoria');
        if (modalHistoria) {
            modalHistoria.addEventListener('click', (e) => {
                if (e.target.id === 'modalHistoria') this.cerrarModalHistoria();
            });
        }

        // Formulario
        const formHistoria = document.getElementById('formHistoria');
        if (formHistoria) {
            formHistoria.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarHistoria();
            });
        }

        // Búsqueda y filtros
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.buscarHistorias(e.target.value));
        }

        const searchPaciente = document.getElementById('searchPaciente');
        if (searchPaciente) {
            searchPaciente.addEventListener('input', (e) => this.buscarPacientes(e.target.value));
        }

        const filterMedico = document.getElementById('filterMedico');
        if (filterMedico) {
            filterMedico.addEventListener('change', (e) => this.filtrarPorMedico(e.target.value));
        }

        const filterFecha = document.getElementById('filterFecha');
        if (filterFecha) {
            filterFecha.addEventListener('change', (e) => this.filtrarPorFecha(e.target.value));
        }

        // Botón cancelar
        const btnCancelar = document.getElementById('btnCancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => this.cerrarModalHistoria());
        }

        console.log('✅ Todos los event listeners configurados');
    }

    async loadHistorias(page = 1) {
        try {
            const response = await fetch(`../backend/historias/listar.php?page=${page}&limit=${this.itemsPerPage}`);
            const data = await response.json();
            
            if (data.success) {
                this.historias = data.data;
                this.filteredHistorias = [...this.historias];
                this.currentPage = data.pagination.page;
                this.totalPages = data.pagination.pages;
                this.renderHistorias();
                this.renderPagination();
                document.getElementById('totalHistorias').textContent = data.pagination.total;
                this.loadMedicos(); // Recargar médicos para actualizar filtro
            } else {
                this.historias = [];
                this.filteredHistorias = [];
                this.renderHistorias();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Error al cargar historias:', error);
            this.mostrarError('Error al cargar las historias médicas');
        }
    }

    async loadPacientes() {
        try {
            const response = await fetch('../backend/pacientes/listar.php?limit=1000');
            const data = await response.json();
            
            if (data.success) {
                this.pacientes = data.data;
            }
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
        }
    }

    async loadMedicos() {
        try {
            // Obtener médicos únicos de las historias
            const medicos = [...new Set(this.historias.map(h => h.medico_nombre).filter(Boolean))];
            const select = document.getElementById('filterMedico');
            if (!select) return;
            
            // Limpiar opciones excepto la primera
            select.innerHTML = '<option value="">Todos los médicos</option>';
            
            medicos.forEach(medico => {
                const option = document.createElement('option');
                option.value = medico;
                option.textContent = medico;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar médicos:', error);
        }
    }

    renderHistorias() {
        const grid = document.getElementById('historiasGrid');
        
        if (!this.filteredHistorias || this.filteredHistorias.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-medical"></i>
                    <h3>No hay historias médicas registradas</h3>
                    <p>Comienza creando la primera historia médica</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredHistorias.map(historia => {
            // Determinar avatar según género
            let avatar = '../backend/uploads/pacientes/avatar_hombre.jpg';
            if (historia.paciente_genero === 'F') {
                avatar = '../backend/uploads/pacientes/avatar_mujer.jpg';
            } else if (historia.paciente_genero === 'Otro') {
                avatar = '../backend/uploads/pacientes/avatar_otro.png';
            }

            // Formatear fecha
            const fecha = new Date(historia.fecha_creacion);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            return `
                <div class="historia-card">
                    <div class="card-header">
                        <div class="historia-info">
                            <img src="${avatar}" alt="${historia.paciente_nombre}" class="paciente-avatar">
                            <div class="historia-datos">
                                <h4>${historia.paciente_completo}</h4>
                                <p>CI: ${historia.paciente_dni}</p>
                                <p class="fecha-consulta">
                                    <i class="fas fa-calendar"></i> ${historia.fecha_formateada}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="historia-resumen">
                            <div class="resumen-item">
                                <i class="fas fa-stethoscope"></i>
                                <div class="resumen-content">
                                    <div class="resumen-label">Motivo de Consulta</div>
                                    <div class="resumen-value">${historia.motivo_consulta}</div>
                                </div>
                            </div>
                            <div class="resumen-item">
                                <i class="fas fa-diagnoses"></i>
                                <div class="resumen-content">
                                    <div class="resumen-label">Diagnóstico</div>
                                    <div class="resumen-value">${historia.diagnostico || 'Sin diagnóstico'}</div>
                                </div>
                            </div>
                        </div>
                        <div class="medico-info">
                            <div class="medico-header">
                                <i class="fas fa-user-md"></i>
                                <span>Profesional que atendió:</span>
                            </div>
                            <div class="medico-nombre">${historia.medico_nombre}</div>
                            <div style="font-size: 0.8rem; color: var(--gray-500);">${historia.medico_rol}</div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn-icon btn-view" onclick="historiasManager.verHistoria(${historia.id})" title="Ver completo">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-edit" onclick="historiasManager.editarHistoria(${historia.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-pdf" onclick="historiasManager.generarPDF(${historia.id})" title="Generar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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
                    onclick="historiasManager.cambiarPagina(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>`;

        // Números de página
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `<button class="${i === this.currentPage ? 'active' : ''}"
                            onclick="historiasManager.cambiarPagina(${i})">
                            ${i}
                        </button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<span>...</span>';
            }
        }

        // Botón siguiente
        html += `<button ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    onclick="historiasManager.cambiarPagina(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>`;

        pagination.innerHTML = html;
    }

    cambiarPagina(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.loadHistorias(page);
        }
    }

    buscarHistorias(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredHistorias = [...this.historias];
        } else {
            this.filteredHistorias = this.historias.filter(historia =>
                (historia.paciente_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (historia.paciente_dni || '').toString().includes(searchTerm) ||
                (historia.motivo_consulta || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (historia.diagnostico || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        this.renderHistorias();
    }

    buscarPacientes(searchTerm) {
        const pacientesList = document.getElementById('pacientesList');
        
        if (!searchTerm.trim()) {
            this.renderPacientes(this.pacientes);
            return;
        }

        const filtered = this.pacientes.filter(paciente =>
            paciente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            paciente.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
            paciente.dni.includes(searchTerm)
        );

        this.renderPacientes(filtered);
    }

    filtrarPorMedico(medico) {
        if (!medico) {
            this.filteredHistorias = [...this.historias];
        } else {
            this.filteredHistorias = this.historias.filter(historia => historia.medico_nombre === medico);
        }
        this.renderHistorias();
    }

    filtrarPorFecha(filtro) {
        if (!filtro) {
            this.filteredHistorias = [...this.historias];
        } else {
            const hoy = new Date();
            const filtradas = this.historias.filter(historia => {
                const fechaHistoria = new Date(historia.fecha_creacion);
                
                switch(filtro) {
                    case 'hoy':
                        return fechaHistoria.toDateString() === hoy.toDateString();
                    case 'semana':
                        const haceUnaSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return fechaHistoria >= haceUnaSemana;
                    case 'mes':
                        const haceUnMes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
                        return fechaHistoria >= haceUnMes;
                    default:
                        return true;
                }
            });
            this.filteredHistorias = filtradas;
        }
        this.renderHistorias();
    }

    renderPacientes(pacientes) {
        const pacientesList = document.getElementById('pacientesList');
        
        if (!pacientes || pacientes.length === 0) {
            pacientesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No se encontraron pacientes</p>
                </div>
            `;
            return;
        }

        pacientesList.innerHTML = pacientes.map(paciente => {
            // Determinar avatar según género
            let avatar = '../backend/uploads/pacientes/avatar_hombre.jpg';
            if (paciente.genero === 'F') {
                avatar = '../backend/uploads/pacientes/avatar_mujer.jpg';
            } else if (paciente.genero === 'Otro') {
                avatar = '../backend/uploads/pacientes/avatar_otro.png';
            }

            return `
                <div class="paciente-item" onclick="historiasManager.seleccionarPaciente(${paciente.id})">
                    <img src="${paciente.foto_paciente ? `../backend/${paciente.foto_paciente}` : avatar}" 
                        alt="${paciente.nombre}" class="paciente-mini-foto">
                    <div class="paciente-mini-info">
                        <h5>${paciente.nombre} ${paciente.apellidos}</h5>
                        <p>CI: ${paciente.dni}</p>
                        <p style="font-size: 0.75rem; color: var(--gray-500);">
                            ${paciente.edad} años • ${paciente.genero === 'M' ? 'Masculino' : paciente.genero === 'F' ? 'Femenino' : 'Otro'}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }

    abrirModalSeleccionarPaciente() {
        const modal = document.getElementById('modalSeleccionarPaciente');
        modal.style.display = 'flex';
        this.renderPacientes(this.pacientes);
    }

    cerrarModalSeleccionarPaciente() {
        document.getElementById('modalSeleccionarPaciente').style.display = 'none';
    }

    seleccionarPaciente(pacienteId) {
        const paciente = this.pacientes.find(p => p.id === pacienteId);
        if (paciente) {
            this.selectedPaciente = paciente;
            this.cerrarModalSeleccionarPaciente();
            this.abrirModalHistoria();
        }
    }

    abrirModalHistoria(historiaId = null) {
        const modal = document.getElementById('modalHistoria');
        const form = document.getElementById('formHistoria');
        const title = document.getElementById('modalTitle');

        if (historiaId) {
            title.textContent = 'Editar Historia Médica';
            this.cargarDatosHistoria(historiaId);
        } else {
            title.textContent = 'Registrar Nueva Historia Médica';
            form.reset();
            document.getElementById('historiaId').value = '';
            
            if (this.selectedPaciente) {
                this.mostrarInfoPaciente(this.selectedPaciente);
            }
        }

        modal.style.display = 'flex';
    }

    cerrarModalHistoria() {
        document.getElementById('modalHistoria').style.display = 'none';
        this.selectedPaciente = null;
    }

    mostrarInfoPaciente(paciente) {
        const infoDiv = document.getElementById('infoPaciente');
        
        // Determinar avatar según género
        let avatar = '../backend/uploads/pacientes/avatar_hombre.jpg';
        if (paciente.genero === 'F') {
            avatar = '../backend/uploads/pacientes/avatar_mujer.jpg';
        } else if (paciente.genero === 'Otro') {
            avatar = '../backend/uploads/pacientes/avatar_otro.png';
        }

        infoDiv.innerHTML = `
            <img src="${paciente.foto_paciente ? `../backend/${paciente.foto_paciente}` : avatar}" 
                alt="${paciente.nombre}" class="info-paciente-foto">
            <div class="info-paciente-datos">
                <h5>${paciente.nombre} ${paciente.apellidos}</h5>
                <p><strong>CI:</strong> ${paciente.dni}</p>
                <p><strong>Edad:</strong> ${paciente.edad} años</p>
                <p><strong>Género:</strong> ${paciente.genero === 'M' ? 'Masculino' : paciente.genero === 'F' ? 'Femenino' : 'Otro'}</p>
                ${paciente.telefono ? `<p><strong>Teléfono:</strong> ${paciente.telefono}</p>` : ''}
            </div>
        `;
        
        document.getElementById('pacienteId').value = paciente.id;
    }

    async cargarDatosHistoria(id) {
        try {
            const response = await fetch(`../backend/historias/ver.php?id=${id}`);
            const data = await response.json();
            
            if (data.success) {
                const historia = data.data;
                
                // Cargar datos del formulario
                document.getElementById('historiaId').value = historia.id;
                document.getElementById('pacienteId').value = historia.paciente_id;
                
                // Mostrar info del paciente
                const paciente = this.pacientes.find(p => p.id === historia.paciente_id);
                if (paciente) {
                    this.mostrarInfoPaciente(paciente);
                }
                
                // Cargar campos del formulario
                document.getElementById('motivo_consulta').value = historia.motivo_consulta;
                document.getElementById('antecedentes').value = historia.antecedentes || '';
                document.getElementById('diagnostico').value = historia.diagnostico || '';
                document.getElementById('tratamiento').value = historia.tratamiento || '';
                document.getElementById('observaciones').value = historia.observaciones || '';
                document.getElementById('grupo_sanguineo').value = historia.grupo_sanguineo || '';
                document.getElementById('examen_fisico').value = historia.examen_fisico || '';
                document.getElementById('examenes_complementarios').value = historia.examenes_complementarios || '';
            }
        } catch (error) {
            console.error('Error al cargar datos de historia:', error);
            this.mostrarError('Error al cargar los datos de la historia médica');
        }
    }

    async guardarHistoria() {
        const form = document.getElementById('formHistoria');
        const formData = new FormData(form);

        // Validaciones
        const motivoConsulta = formData.get('motivo_consulta');
        const diagnostico = formData.get('diagnostico');
        const tratamiento = formData.get('tratamiento');

        if (!motivoConsulta || !diagnostico || !tratamiento) {
            this.mostrarError('Por favor complete los campos obligatorios: Motivo de consulta, Diagnóstico y Tratamiento');
            return;
        }

        // Validar paciente seleccionado
        if (!formData.get('paciente_id')) {
            this.mostrarError('Seleccione un paciente antes de guardar la historia médica');
            return;
        }

        const btnGuardar = document.getElementById('btnGuardar');
        const textoOriginal = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btnGuardar.disabled = true;

        try {
            const historiaId = formData.get('id');
            const url = historiaId ? '../backend/historias/editar.php' : '../backend/historias/agregar.php';
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarExito(data.message);
                this.cerrarModalHistoria();
                this.loadHistorias();
                
                // Disparar evento para actualizar estadísticas
                localStorage.setItem('historiasUpdated', Date.now().toString());
            } else {
                this.mostrarError(data.error);
            }
        } catch (error) {
            console.error('Error al guardar historia:', error);
            this.mostrarError('Error al guardar la historia médica');
        } finally {
            btnGuardar.innerHTML = textoOriginal;
            btnGuardar.disabled = false;
        }
    }

    verHistoria(id) {
        window.open(`../backend/historias/generar_pdf.php?id=${id}`, '_blank');
    }

    async editarHistoria(id) {
        this.abrirModalHistoria(id);
    }

    generarPDF(id) {
        window.open(`../backend/historias/generar_pdf.php?id=${id}`, '_blank');
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
let historiasManager;
document.addEventListener('DOMContentLoaded', () => {
    historiasManager = new HistoriasManager();
});