// frontend/js/auth.js

document.addEventListener('DOMContentLoaded', function() {
    // Si ya hay sesión activa, redirigir al dashboard automáticamente
    if (window.location.pathname.endsWith('login.html')) {
        fetch('../backend/auth/get_user_session.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.replace('dashboard.html');
                }
            });
    }
    const alertMessage = document.getElementById('alert-message');

    /**
     * Muestra un mensaje de alerta en la interfaz.
     * @param {string} message El mensaje a mostrar.
     * @param {string} type El tipo de alerta ('success', 'error', 'info').
     */
    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type} active`; // Añade 'active' para animar
        alertMessage.style.display = 'flex'; // Cambiado de 'block' a 'flex' para el nuevo diseño
        setTimeout(() => {
            alertMessage.classList.remove('active');
            // Ocultar después de la animación
            setTimeout(() => {
                alertMessage.style.display = 'none';
            }, 300); // Coincide con la duración de la transición CSS
        }, 5000); // Muestra por 5 segundos
    }

    /**
     * Obtiene el token CSRF del backend y lo asigna al campo oculto.
     */
    async function fetchCsrfToken() {
        try {
            const response = await fetch('../backend/auth/get_csrf_token.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.token) {
                const csrfTokenInput = document.getElementById('csrf_token');
                if (csrfTokenInput) {
                    csrfTokenInput.value = data.token;
                }
            } else {
                console.error('Error al obtener el token CSRF:', data.error);
                showAlert('Error de seguridad: No se pudo cargar el token. Recargue la página.', 'error');
            }
        } catch (error) {
            console.error('Error de red al obtener el token CSRF:', error);
            showAlert('Error de conexión. Por favor, intente más tarde.', 'error');
        }
    }

    /**
     * Función para manejar el estado de loading de los botones
     */
    function setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    /**
     * Función para validar email
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Función para mostrar errores en inputs específicos
     */
    function showInputError(inputId, message) {
        const errorElement = document.getElementById(inputId + '-error');
        const inputWrapper = document.getElementById(inputId).closest('.input-wrapper, .select-wrapper');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        if (inputWrapper) {
            inputWrapper.classList.add('error');
        }
    }

    /**
     * Función para limpiar errores en inputs específicos
     */
    function clearInputError(inputId) {
        const errorElement = document.getElementById(inputId + '-error');
        const inputWrapper = document.getElementById(inputId).closest('.input-wrapper, .select-wrapper');
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        if (inputWrapper) {
            inputWrapper.classList.remove('error');
        }
    }

    // --- Lógica para el formulario de REGISTRO ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        fetchCsrfToken(); // Obtener el token CSRF al cargar la página de registro

        const passwordInput = document.getElementById('contrasena');
        const confirmPasswordInput = document.getElementById('confirmar_contrasena');

        // Validación en tiempo real de coincidencia de contraseñas
        if (passwordInput && confirmPasswordInput) {
            const validatePasswords = () => {
                if (confirmPasswordInput.value !== '') {
                    if (passwordInput.value !== confirmPasswordInput.value) {
                        showInputError('confirmar_contrasena', 'Las contraseñas no coinciden.');
                    } else {
                        clearInputError('confirmar_contrasena');
                    }
                }
            };

            passwordInput.addEventListener('input', validatePasswords);
            confirmPasswordInput.addEventListener('input', validatePasswords);
        }

        // Validación de nombre completo en tiempo real
        const nombreInput = document.getElementById('nombre_completo');
        if (nombreInput) {
            nombreInput.addEventListener('blur', function() {
                const nombre = this.value.trim();
                if (nombre && nombre.split(' ').length < 2) {
                    showInputError('nombre_completo', 'Ingresa tu nombre y apellido completos');
                } else {
                    clearInputError('nombre_completo');
                }
            });
        }

        // Validación de correo en tiempo real
        const correoInput = document.getElementById('correo');
        if (correoInput) {
            correoInput.addEventListener('blur', function() {
                const email = this.value.trim();
                if (email && !isValidEmail(email)) {
                    showInputError('correo', 'Ingresa un correo electrónico válido');
                } else {
                    clearInputError('correo');
                }
            });
        }

        // Validación de rol
        const rolSelect = document.getElementById('rol');
        if (rolSelect) {
            rolSelect.addEventListener('change', function() {
                if (this.value === '') {
                    showInputError('rol', 'Selecciona un rol profesional');
                } else {
                    clearInputError('rol');
                }
            });
        }

        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevenir el envío por defecto del formulario

            const submitButton = this.querySelector('button[type="submit"]');
            setButtonLoading(submitButton, true);

            // Limpiar errores previos
            clearInputError('nombre_completo');
            clearInputError('correo');
            clearInputError('contrasena');
            clearInputError('confirmar_contrasena');
            clearInputError('rol');

            let hasErrors = false;

            // Validaciones frontend adicionales antes de enviar
            if (nombreInput.value.trim().split(' ').length < 2) {
                showInputError('nombre_completo', 'Debe ingresar nombre y apellido');
                hasErrors = true;
            }

            if (!isValidEmail(correoInput.value.trim())) {
                showInputError('correo', 'Formato de correo electrónico inválido');
                hasErrors = true;
            }

            if (passwordInput.value !== confirmPasswordInput.value) {
                showInputError('confirmar_contrasena', 'Las contraseñas no coinciden');
                hasErrors = true;
            }

            // Validación de complejidad de contraseña (básica en frontend)
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
            if (!passwordRegex.test(passwordInput.value)) {
                showInputError('contrasena', 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos');
                hasErrors = true;
            }

            if (rolSelect.value === '') {
                showInputError('rol', 'Debe seleccionar un rol profesional');
                hasErrors = true;
            }


            if (hasErrors) {
                setButtonLoading(submitButton, false);
                return;
            }

            const formData = new FormData(registerForm); // Recopilar datos del formulario (incluye archivos)

            try {
                const response = await fetch('../backend/registrar.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json(); // Parsear la respuesta JSON

                if (response.ok && data.success) {
                    showAlert(data.mensaje, 'success');
                    // Limpiar formulario después de éxito
                    registerForm.reset();
                    // Restablecer imagen de previsualización
                    const previewImg = document.getElementById('preview-img');
                    const photoPreview = document.getElementById('photo-preview');
                    if (previewImg) {
                        previewImg.src = 'https://via.placeholder.com/120x120/f0f0f0/cccccc?text=?';
                    }
                    if (photoPreview) {
                        photoPreview.classList.remove('has-image');
                    }
                    // Limpiar estados focused de los inputs
                    const focusedElements = document.querySelectorAll('.focused');
                    focusedElements.forEach(el => el.classList.remove('focused'));
                    
                    // Redirigir al login después de un breve retraso
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000); // 2 segundos para que el usuario lea el mensaje
                } else {
                    // Manejar errores del backend
                    const errorMessage = data.error || 'Ocurrió un error desconocido durante el registro.';
                    showAlert(errorMessage, 'error');
                    fetchCsrfToken(); // Regenerar token CSRF en caso de error de registro
                }
            } catch (error) {
                console.error('Error en la solicitud de registro:', error);
                showAlert('Error de conexión. Por favor, intente más tarde.', 'error');
            } finally {
                setButtonLoading(submitButton, false);
            }
        });
    }

    // --- Lógica para el formulario de LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        fetchCsrfToken(); // Obtener el token CSRF al cargar la página de login

        // Validación de correo en tiempo real para login
        const correoLoginInput = document.getElementById('correo');
        const contrasenaLoginInput = document.getElementById('contrasena');
        
        if (correoLoginInput) {
            correoLoginInput.addEventListener('blur', function() {
                const email = this.value.trim();
                if (email && !isValidEmail(email)) {
                    showInputError('correo', 'Ingresa un correo electrónico válido');
                } else {
                    clearInputError('correo');
                }
            });
        }

        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevenir el envío por defecto del formulario

            const submitButton = this.querySelector('button[type="submit"]');
            setButtonLoading(submitButton, true);

            // Limpiar errores previos
            clearInputError('correo');
            clearInputError('contrasena');

            let hasErrors = false;

            // Validaciones básicas frontend
            if (correoLoginInput && !isValidEmail(correoLoginInput.value.trim())) {
                showInputError('correo', 'Formato de correo electrónico inválido');
                hasErrors = true;
            }

            if (contrasenaLoginInput && !contrasenaLoginInput.value.trim()) {
                showInputError('contrasena', 'La contraseña es requerida');
                hasErrors = true;
            }

            if (hasErrors) {
                setButtonLoading(submitButton, false);
                return;
            }

            const formData = new FormData(loginForm);

            try {
                const response = await fetch('../backend/login.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert(data.mensaje, 'success');
                    setTimeout(() => {
                        window.location.href = data.redirect || 'dashboard.html';
                    }, 1000);
                } else {
                    const errorMessage = data.error || 'Ocurrió un error desconocido durante el inicio de sesión.';
                    showAlert(errorMessage, 'error');
                    fetchCsrfToken(); // Regenerar token CSRF en caso de error de login
                }
            } catch (error) {
                console.error('Error en la solicitud de login:', error);
                showAlert('Error de conexión. Por favor, intente más tarde.', 'error');
            } finally {
                setButtonLoading(submitButton, false);
            }
        });
    }

    // Funcionalidad adicional para el nuevo diseño de inputs
    const inputs = document.querySelectorAll('.input-wrapper input, .select-wrapper select');
    inputs.forEach(input => {
        // Manejar el estado focused de los inputs
        input.addEventListener('focus', function() {
            this.closest('.input-wrapper, .select-wrapper').classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (this.value === '' || (this.tagName === 'SELECT' && this.value === '')) {
                this.closest('.input-wrapper, .select-wrapper').classList.remove('focused');
            }
        });

        // Verificar si el input ya tiene valor al cargar
        if (input.value !== '' && !(input.tagName === 'SELECT' && input.value === '')) {
            input.closest('.input-wrapper, .select-wrapper').classList.add('focused');
        }

        // Para selects, manejar el cambio de valor
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', function() {
                if (this.value !== '') {
                    this.closest('.select-wrapper').classList.add('focused');
                } else {
                    this.closest('.select-wrapper').classList.remove('focused');
                }
            });
        }
    });

    // Funcionalidad de toggle para contraseñas (ya incluida en los HTML individuales)
    // Esta funcionalidad se maneja directamente en cada página para mayor eficiencia

    // Funcionalidad mejorada para foto de perfil (solo en registro)
    const fotoPerfilInput = document.getElementById('foto_perfil');
    const previewImg = document.getElementById('preview-img');
    const photoPreview = document.getElementById('photo-preview');
    
    if (fotoPerfilInput && previewImg && photoPreview) {
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
    }

    // Medidor de fortaleza de contraseña (solo en registro)
    const passwordStrengthInput = document.getElementById('contrasena');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (passwordStrengthInput && strengthFill && strengthText) {
        passwordStrengthInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrength(strength);
        });

        function calculatePasswordStrength(password) {
            let score = 0;
            if (password.length >= 8) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
            return score;
        }

        function updatePasswordStrength(strength) {
            const levels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Muy fuerte'];
            const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38a169'];
            const widths = [20, 40, 60, 80, 100];

            strengthFill.style.width = widths[strength] + '%';
            strengthFill.style.background = colors[strength];
            strengthText.textContent = levels[strength];
            strengthText.style.color = colors[strength];
        }
    }

});