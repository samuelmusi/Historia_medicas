/* ===== GRÁFICOS DINÁMICOS CON DATOS REALES ===== */
let monthlyChart, genderChart;

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
    const zeroLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const zeroData = [0, 0, 0, 0, 0, 0];

    // Gráfico de líneas mensual (estadísticas mensuales)
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
}

// Cargar datos reales de las gráficas desde el backend
async function loadChartData() {
    try {
        const response = await fetch('../backend/reportes/estadisticas.php');
        const text = await response.text();
        console.log('Respuesta cruda de la API:', text); // <-- Para depuración
        const data = JSON.parse(text);

        if (data.success && data.data) {
            // Actualizar gráfica de género
            updateGenderChart(data.data.distribucion_genero);

            // Actualizar gráfica mensual
            updateMonthlyChart(data.data.estadisticas_mensuales);

            // Actualizar estadísticas generales si existen
            updateGeneralStats(data.data.estadisticas_generales);
        } else {
            console.error('Error en la respuesta del servidor:', data.error);
        }
    } catch (error) {
        console.error('Error al cargar datos de gráficas:', error);
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
