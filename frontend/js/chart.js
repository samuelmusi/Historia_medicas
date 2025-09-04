/* ===== GRÁFICOS DINÁMICOS CON DATOS REALES ===== */
let monthlyChart, genderChart, historiasChart;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar gráficas con datos vacíos
    initializeCharts();

    // Cargar datos reales de las gráficas
    loadChartData();

    // Actualizar gráficas cada 30 segundos
    setInterval(loadChartData, 30000);

    // Escuchar cambios en localStorage para actualización en tiempo real
    window.addEventListener('storage', (e) => {
        if (e.key === 'pacientesUpdated' || e.key === 'pacienteAdded' || e.key === 'pacienteDeleted') {
            loadChartData();
        }
    });
});

// Inicializar gráficas con datos vacíos
function initializeCharts() {
    // Crear etiquetas dinámicas para los últimos 6 meses
    const zeroLabels = [];
    const zeroData = [];
    for (let i = 5; i >= 0; i--) {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() - i);
        const mesFormateado = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        zeroLabels.push(mesFormateado);
        zeroData.push(0);
    }

    // Gráfico de líneas mensual (estadísticas mensuales de pacientes)
    const monthlyCtx = document.getElementById('monthlyChart');
    if (monthlyCtx) {
        monthlyChart = new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: zeroLabels,
                datasets: [{
                    label: 'Pacientes Registrados',
                    data: zeroData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, .2)',
                    tension: .4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Registros Mensuales de Pacientes'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Gráfico de dona género (distribución por género)
    const genderCtx = document.getElementById('genderChart');
    if (genderCtx) {
        genderChart = new Chart(genderCtx, {
            type: 'doughnut',
            data: {
                labels: ['Masculino', 'Femenino', 'Otro'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#667eea', '#f093fb', '#4ecdc4'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: 'Distribución por Género'
                    }
                }
            }
        });
    }

    // Gráfico estático para historias médicas (datos ficticios)
    const historiasCtx = document.getElementById('historiasChart');
    if (historiasCtx) {
        historiasChart = new Chart(historiasCtx, {
            type: 'bar',
            data: {
                labels: zeroLabels,
                datasets: [{
                    label: 'Historias Médicas Registradas',
                    data: [3, 5, 2, 6, 4, 7], // Datos estáticos de ejemplo
                    backgroundColor: '#f093fb'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Registros Mensuales de Historias Médicas (Estático)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Cargar datos reales de las gráficas desde el backend
async function loadChartData() {
    try {
        console.log('Cargando datos de gráficas...');
        const response = await fetch('../backend/reportes/estadisticas.php');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Respuesta cruda de la API:', text); // <-- Para depuración

        const data = JSON.parse(text);

        if (data.success && data.data) {
            console.log('Datos cargados exitosamente:', data.data);

            // Actualizar gráfica de género
            updateGenderChart(data.data.distribucion_genero);

            // Actualizar gráfica mensual
            updateMonthlyChart(data.data.estadisticas_mensuales);

            // Actualizar estadísticas generales si existen
            updateGeneralStats(data.data.estadisticas_generales);

            console.log('Gráficas actualizadas correctamente');
        } else {
            console.error('Error en la respuesta del servidor:', data.error);
        }
    } catch (error) {
        console.error('Error al cargar datos de gráficas:', error);
        // Mostrar mensaje de error al usuario
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar gráficas',
                text: 'No se pudieron cargar los datos de las gráficas. Verifica la conexión con el servidor.'
            });
        }
    }
}

// Actualizar gráfica de género con datos del servidor
function updateGenderChart(generoData) {
    if (genderChart && generoData) {
        genderChart.data.labels = generoData.labels;
        genderChart.data.datasets[0].data = generoData.data;
        genderChart.update();
    }
}

// Actualizar gráfica mensual con datos del servidor
function updateMonthlyChart(mensualData) {
    if (monthlyChart && mensualData) {
        monthlyChart.data.labels = mensualData.labels;
        monthlyChart.data.datasets[0].data = mensualData.data;
        monthlyChart.update();
    }
}

// Actualizar estadísticas generales (opcional)
function updateGeneralStats(generalesData) {
    if (generalesData) {
        // Actualizar contador de pacientes si existe
        const totalPacientesElement = document.getElementById('totalPacientes');
        if (totalPacientesElement) {
            totalPacientesElement.textContent = generalesData.total_pacientes;
        }

        // Actualizar otros contadores si existen
        const nuevosMesElement = document.getElementById('nuevosMes');
        if (nuevosMesElement) {
            nuevosMesElement.textContent = generalesData.nuevos_mes;
        }
    }
}

// Función para actualizar gráficas manualmente (puede ser llamada desde otros scripts)
function updateCharts() {
    loadChartData();
}

// Exponer función global para uso desde otros scripts
window.updateCharts = updateCharts;
