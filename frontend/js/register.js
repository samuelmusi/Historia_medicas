// Funcionalidad adicional para el registro
document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidad de foto de perfil mejorada
    const fotoPerfilInput = document.getElementById('foto_perfil');
    const previewImg = document.getElementById('preview-img');
    const photoPreview = document.getElementById('photo-preview');
    
    // Hacer clickeable toda el área de la foto
    photoPreview.addEventListener('click', function() {
        fotoPerfilInput.click();
    });

    // Arrastrar y soltar archivos
    photoPreview.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    photoPreview.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });

    photoPreview.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fotoPerfilInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFileUpload(this.files[0]);
        }
    });

    function handleFileUpload(file) {
        // Validar tipo de archivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showAlert('Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, WEBP)', 'error');
            return;
        }

        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showAlert('La imagen es demasiado grande. Tamaño máximo: 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            photoPreview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }

    // Toggle de contraseñas
    setupPasswordToggle('toggle-password', 'contrasena');
    setupPasswordToggle('toggle-confirm-password', 'confirmar_contrasena');

    function setupPasswordToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        
        if (toggle && input) {
            toggle.addEventListener('click', function() {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                const icon = this.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        }
    }

    // Medidor de fortaleza de contraseña
    const passwordInput = document.getElementById('contrasena');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (passwordInput && strengthFill && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrength(strength);
        });
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return Math.min(score, 4); // Asegurar que no exceda el máximo (0-4)
    }

    function updatePasswordStrength(strength) {
        const levels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Muy fuerte'];
        const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38a169'];
        const widths = [20, 40, 60, 80, 100];

        if (strengthFill && strengthText) {
            strengthFill.style.width = widths[strength] + '%';
            strengthFill.style.background = colors[strength];
            strengthText.textContent = levels[strength];
            strengthText.style.color = colors[strength];
        }
    }

    // Animaciones de inputs
    const inputs = document.querySelectorAll('.input-wrapper input, .select-wrapper select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.input-wrapper, .select-wrapper').classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.closest('.input-wrapper, .select-wrapper').classList.remove('focused');
            }
        });

        if (input.value !== '') {
            input.closest('.input-wrapper, .select-wrapper').classList.add('focused');
        }
    });

    // Validaciones en tiempo real
    setupInputValidation();

    function setupInputValidation() {
        // Validación de nombre completo
        const nombreInput = document.getElementById('nombre_completo');
        const nombreError = document.getElementById('nombre-error');
        
        if (nombreInput && nombreError) {
            nombreInput.addEventListener('blur', function() {
                const nombre = this.value.trim();
                if (nombre && nombre.split(' ').length < 2) {
                    nombreError.textContent = 'Ingresa tu nombre y apellido completos';
                    nombreError.style.display = 'block';
                    this.parentElement.classList.add('error');
                } else {
                    nombreError.style.display = 'none';
                    this.parentElement.classList.remove('error');
                }
            });
        }

        // Validación de correo
        const correoInput = document.getElementById('correo');
        const correoError = document.getElementById('correo-error');
        
        if (correoInput && correoError) {
            correoInput.addEventListener('blur', function() {
                const email = this.value.trim();
                if (email && !isValidEmail(email)) {
                    correoError.textContent = 'Ingresa un correo electrónico válido';
                    correoError.style.display = 'block';
                    this.parentElement.classList.add('error');
                } else {
                    correoError.style.display = 'none';
                    this.parentElement.classList.remove('error');
                }
            });
        }

        // Validación de confirmación de contraseña
        const confirmInput = document.getElementById('confirmar_contrasena');
        const confirmError = document.getElementById('confirmar-contrasena-error');
        
        if (confirmInput && confirmError && passwordInput) {
            confirmInput.addEventListener('blur', function() {
                if (this.value && this.value !== passwordInput.value) {
                    confirmError.textContent = 'Las contraseñas no coinciden';
                    confirmError.style.display = 'block';
                    this.parentElement.classList.add('error');
                } else {
                    confirmError.style.display = 'none';
                    this.parentElement.classList.remove('error');
                }
            });
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showAlert(message, type) {
        const alertElement = document.getElementById('alert-message');
        if (alertElement) {
            alertElement.textContent = message;
            alertElement.className = `alert alert-${type} active`;
            alertElement.style.display = 'flex';
            
            setTimeout(() => {
                alertElement.classList.remove('active');
                setTimeout(() => {
                    alertElement.style.display = 'none';
                }, 300);
            }, 5000);
        }
    }

    // Función para obtener token CSRF
    async function obtenerTokenCSRF() {
        try {
            const response = await fetch('../backend/auth/get_csrf_token.php');
            const data = await response.json();
            if (data.success) {
                document.getElementById('csrf_token').value = data.token;
                return data.token;
            } else {
                throw new Error('Error al obtener token CSRF');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión. Recargue la página e intente de nuevo.', 'error');
            return null;
        }
    }

    // Manejo del envío del formulario
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validar formulario antes de enviar
            if (validateForm()) {
                // Obtener token CSRF si no existe
                let csrfToken = document.getElementById('csrf_token').value;
                if (!csrfToken) {
                    csrfToken = await obtenerTokenCSRF();
                    if (!csrfToken) return;
                }

                // Mostrar estado de carga
                const submitBtn = this.querySelector('.auth-btn');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoading = submitBtn.querySelector('.btn-loading');
                
                btnText.textContent = 'Registrando...';
                btnLoading.classList.add('active');
                submitBtn.disabled = true;

                try {
                    // Crear FormData para enviar datos del formulario
                    const formData = new FormData(this);

                    // Enviar datos al backend
                    const response = await fetch('../backend/registrar.php', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (data.success) {
                        showAlert(data.message, 'success');
                        
                        // Redirigir después de registro exitoso
                        setTimeout(() => {
                            window.location.href = data.redirect || 'login.html';
                        }, 2000);
                    } else {
                        showAlert(data.error || 'Error en el registro', 'error');
                    }

                } catch (error) {
                    console.error('Error:', error);
                    showAlert('Error de conexión. Intente de nuevo.', 'error');
                } finally {
                    // Restaurar botón
                    btnText.textContent = 'Crear Cuenta';
                    btnLoading.classList.remove('active');
                    submitBtn.disabled = false;
                }
            }
        });
    }

    function validateForm() {
        let isValid = true;
        
        // Validar nombre
        const nombreInput = document.getElementById('nombre_completo');
        if (!nombreInput.value.trim() || nombreInput.value.trim().split(' ').length < 2) {
            showAlert('Por favor ingresa tu nombre completo', 'error');
            isValid = false;
        }
        
        // Validar email
        const emailInput = document.getElementById('correo');
        if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
            showAlert('Por favor ingresa un correo electrónico válido', 'error');
            isValid = false;
        }
        
        // Validar contraseña
        const passwordInput = document.getElementById('contrasena');
        if (!passwordInput.value || passwordInput.value.length < 8) {
            showAlert('La contraseña debe tener al menos 8 caracteres', 'error');
            isValid = false;
        }
        
        // Validar confirmación de contraseña
        const confirmInput = document.getElementById('confirmar_contrasena');
        if (passwordInput.value !== confirmInput.value) {
            showAlert('Las contraseñas no coinciden', 'error');
            isValid = false;
        }
        
        // Validar rol
        const rolInput = document.getElementById('rol');
        if (!rolInput.value) {
            showAlert('Por favor selecciona un rol', 'error');
            isValid = false;
        }
        
        return isValid;
    }

    // Seguridad: Evitar que el usuario autenticado regrese al registro
    // Esta parte dependerá de tu implementación backend
    /*
    fetch('../backend/auth/get_user_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'dashboard.html';
            }
        })
        .catch(error => {
            console.error('Error al verificar sesión:', error);
        });
    */
});