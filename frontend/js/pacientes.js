// frontend/js/pacientes.js

class PacientesManager {
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
        // Botón nuevo paciente
        document.getElementById('btnNuevoPaciente').addEventListener('click', () => {
            this.abrirModal();
        });

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.cerrarModal();
        });

        document.getElementById('btnCancelar').addEventListener('click', () => {
            this.cerrarModal();
        });

        // Cerrar modal al hacer clic fuera
        document.getElementById('modalPaciente').addEventListener('click', (e) => {
            if (e.target.id === 'modalPaciente') {
                this.cerrarModal();
            }
        });

        // Formulario
        document.getElementById('formPaciente').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarPaciente();
        });

        // Búsqueda en tiempo real
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.buscarPacientes(e.target.value);
        });

        // Filtro por género
        document.getElementById('filterGenero').addEventListener('change', (e) => {
            this.filtrarPorGenero(e.target.value);
        });

        // Preview de foto
        document.getElementById('foto_paciente').addEventListener('change', (e) => {
            this.previewFoto(e.target.files[0]);
        });

        // Click en preview para abrir selector
        document.getElementById('previewFoto').addEventListener('click', () => {
            document.getElementById('foto_paciente').click();
        });
    }

    async loadPacientes(page = 1) {
        try {
            const response = await fetch(`../backend/pacientes/listar.php?page=${page}&limit=${this.itemsPerPage}`);
            const data = await response.json();
            
            if (data.success) {
                this.pacientes = data.data;
                this.filteredPacientes = [...this.pacientes];
                this.currentPage = data.pagination.page;
                this.totalPages = data.pagination.pages;
                
                this.renderPacientes();
                this.renderPagination();
            }
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            this.mostrarError('Error al cargar los pacientes');
        }
    }

    renderPacientes() {
        const grid = document.getElementById('pacientesGrid');
        
        if (this.filteredPacientes.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-slash"></i>
                    <h3>No hay pacientes registrados</h3>
                    <p>Comienza agregando tu primer paciente</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredPacientes.map(paciente => `
            <div class="paciente-card">
                <div class="card-header">
                    <div class="paciente-info">
                        <img src="${paciente.foto_paciente ? `../backend/${paciente.foto_paciente}` : 'https://via.placeholder.com/60x60?text=?'}" 
                             alt="${paciente.nombre}" class="paciente-foto">
                        <div class="paciente-datos">
                            <h4>${paciente.nombre} ${paciente.apellidos}</h4>
                            <p>DNI: ${paciente.dni}</p>
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
                        <span class="info-value">${paciente.genero}</span>
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
                    <button class="btn-icon btn-edit" onclick="pacientesManager.editarPaciente(${paciente.id})" 
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-pdf" onclick="pacientesManager.generarPDF(${paciente.id})" 
                            title="Generar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="pacientesManager.eliminarPaciente(${paciente.id})" 
                            title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
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
            this.filteredPacientes = this.pacientes.filter(paciente => paciente.genero === genero);
        }
        this.renderPacientes();
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
            document.getElementById('previewFoto').src = 'https://via.placeholder.com/150x150?text=?';
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
                
                if (paciente.foto_paciente) {
                    document.getElementById('previewFoto').src = `../backend/${paciente.foto_paciente}`;
                }
            }
        } catch (error) {
            console.error('Error al cargar datos del paciente:', error);
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