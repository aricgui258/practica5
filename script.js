const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));


/* ── Expresiones regulares de validación ── */
const REGEXES = {
  nombre:    /^[A-Za-záéíóúüñÁÉÍÓÚÜÑ\s'-]{2,50}$/,
  apellidos: /^[A-Za-záéíóúüñÁÉÍÓÚÜÑ\s'-]{2,80}$/,
  dni:       /^([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])$/,  // DNI o NIE
  cp:        /^[0-9]{5}$/,
  email:     /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  telefono:  /^[6-9]\d{8}$/,
  ciudad:    /^[A-Za-záéíóúüñÁÉÍÓÚÜÑ\s'-]{2,60}$/,
  direccion: /^.{5,120}$/,
  linkedin:  /^https?:\/\/(www\.)?(linkedin\.com\/.+|[a-z0-9\-]+\.[a-z]{2,}\/.*)$/i,
};

/* ── Mensajes de error ── */
const MSGS = {
  nombre:         'Introduce un nombre válido (letras, 2–50 caracteres).',
  apellidos:      'Introduce apellidos válidos (letras, 2–80 caracteres).',
  fecha_nac:      'Debes ser mayor de 16 años y menor de 70.',
  dni:            'Formato incorrecto. Ejemplo: 12345678A o X1234567B.',
  cp:             'El código postal debe tener exactamente 5 dígitos.',
  email:          'Introduce un correo electrónico válido.',
  telefono:       'Teléfono español de 9 dígitos (empieza por 6, 7, 8 o 9).',
  ciudad:         'Introduce una ciudad válida.',
  direccion:      'La dirección debe tener entre 5 y 120 caracteres.',
  estudios:       'Selecciona tu nivel de estudios.',
  posicion:       'Selecciona la posición de tu interés.',
  experiencia:    'Describe brevemente tu experiencia (o indica que no tienes).',
  motivacion:     'Por favor escribe al menos 50 caracteres.',
  disponibilidad: 'Selecciona al menos una franja horaria.',
  linkedin:       'Introduce una URL válida (https://...).',
};


/* ── Helpers de UI ── */
function showError(id, msg) {
  const errEl = document.getElementById('err-' + id);
  const input = document.getElementById(id);
  if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
  if (input) { input.classList.add('error'); input.classList.remove('ok'); }
}

function clearError(id) {
  const errEl = document.getElementById('err-' + id);
  const input = document.getElementById(id);
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
  if (input) { input.classList.remove('error'); }
}

function markOk(id) {
  const input = document.getElementById(id);
  if (input) { input.classList.add('ok'); input.classList.remove('error'); }
}

/* Intercepción del envio del formulario */
document.getElementById("applicationForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const submitBtn = document.getElementById("submit-btn");
  submitBtn.disabled = true;

  try {
    const response = await fetch("https://aricgui258.app.n8n.cloud/webhook-test/form-candidatos", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      // éxito UX
      alert("Candidatura enviada correctamente");
      form.reset();
      if (window.grecaptcha) grecaptcha.reset();
    } else {
      alert("Error al enviar el formulario");
    }

  } catch (error) {
    console.error(error);
    alert("Error de conexión");
  } finally {
    submitBtn.disabled = false;
  }
});

/* ── Validación de edad ── */
function validateAge(dateStr) {
  if (!dateStr) return false;
  const dob   = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 16 && age <= 70;
}


/* ── Validador por campo ── */
function validateField(id) {
  const el = document.getElementById(id);
  if (!el) return true;
  const val = el.value.trim();

  if (id === 'fecha_nac') {
    if (!val || !validateAge(val)) { showError(id, MSGS.fecha_nac); return false; }
    clearError(id); markOk(id); return true;
  }

  if (id === 'estudios' || id === 'posicion') {
    if (!val) { showError(id, MSGS[id]); return false; }
    clearError(id); markOk(id); return true;
  }

  if (id === 'experiencia') {
    if (val.length < 5) { showError(id, MSGS.experiencia); return false; }
    clearError(id); markOk(id); return true;
  }

  if (id === 'motivacion') {
    if (val.length < 50) { showError(id, MSGS.motivacion); return false; }
    clearError(id); markOk(id); return true;
  }

  if (id === 'telefono') {
    const clean = val.replace(/[\s\-]/g, '');
    if (!REGEXES.telefono.test(clean)) { showError(id, MSGS.telefono); return false; }
    clearError(id); markOk(id); return true;
  }

  if (id === 'linkedin') {
    if (val && !REGEXES.linkedin.test(val)) { showError(id, MSGS.linkedin); return false; }
    clearError(id); if (val) markOk(id); return true;
  }

  if (REGEXES[id]) {
    if (!REGEXES[id].test(val)) { showError(id, MSGS[id]); return false; }
  }

  clearError(id); markOk(id); return true;
}


/* ── Validación en tiempo real (al salir del campo) ── */
const liveFields = [
  'nombre','apellidos','fecha_nac','dni','direccion',
  'ciudad','cp','email','telefono','estudios',
  'posicion','experiencia','motivacion','linkedin'
];
liveFields.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('blur', () => validateField(id));
});

/* Forzar mayúsculas en DNI */
document.getElementById('dni').addEventListener('input', function () {
  this.value = this.value.toUpperCase();
});

/* Solo dígitos en código postal */
document.getElementById('cp').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '');
});

/* Cambios en sección de subida de CV */
document.getElementById('cv').addEventListener('change', function() {
  const file = this.files[0];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (file && file.size > maxSize) {
    document.getElementById('err-cv').textContent = 'El archivo debe ser menor de 2MB';
    this.value = '';
  } else {
    document.getElementById('err-cv').textContent = '';
  }
});

/* ── Control de envío (anti-doble-clic) ── */
let submitted = false;

document.getElementById('applicationForm').addEventListener('submit', function (e) {
  e.preventDefault();

  if (submitted) return; // bloquear envíos múltiples

  // Validar todos los campos obligatorios
  const fieldsToValidate = [
    'nombre','apellidos','fecha_nac','dni','direccion','ciudad',
    'cp','email','telefono','estudios','experiencia','posicion','motivacion','linkedin'
  ];
  let allOk = true;
  fieldsToValidate.forEach(id => { if (!validateField(id)) allOk = false; });

  // Validar checkboxes de disponibilidad
  const checked = document.querySelectorAll('input[name="disponibilidad"]:checked');
  const errDisp = document.getElementById('err-disponibilidad');
  if (checked.length === 0) {
    if (errDisp) { errDisp.textContent = MSGS.disponibilidad; errDisp.classList.add('visible'); }
    allOk = false;
  } else {
    if (errDisp) { errDisp.textContent = ''; errDisp.classList.remove('visible'); }
  }

  if (!allOk) {
    // Hacer scroll hasta el primer error visible
    const firstErr = document.querySelector('.error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Bloquear el botón y mostrar estado de carga
  submitted = true;
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.classList.add('loading');

  // Simular envío asíncrono (sustituir por fetch real)
  setTimeout(() => {
    btn.classList.remove('loading');
    btn.textContent = '✓ Candidatura enviada';
    btn.style.background = 'var(--ok)';

    const banner = document.getElementById('success-banner');
    banner.classList.add('visible');
    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 1800);
});