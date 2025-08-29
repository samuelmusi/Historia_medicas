/* ===== GRÁFICOS VACÍOS (SE LLENARÁN MÁS ADELANTE) ===== */
document.addEventListener('DOMContentLoaded', () => {
    const zeroLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const zeroData   = [0, 0, 0, 0, 0, 0];

    // Gráfico de líneas mensual
    new Chart(document.getElementById('monthlyChart'), {
        type: 'line',
        data: {
            labels: zeroLabels,
            datasets: [{
                label: 'Registros',
                data: zeroData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, .2)',
                tension: .4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    // Gráfico de dona género
    new Chart(document.getElementById('genderChart'), {
        type: 'doughnut',
        data: {
            labels: ['Masculino', 'Femenino', 'Otro'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#667eea', '#f093fb', '#4ecdc4']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
});