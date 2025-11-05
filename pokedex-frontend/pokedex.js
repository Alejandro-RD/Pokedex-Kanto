// pokedex.js
// Lógica principal del Frontend de la Pokédex Kanto (RF/VH)

// ===============================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ===============================================

// Almacena el token JWT una vez que el usuario inicia sesión.
let AUTH_TOKEN = localStorage.getItem('userToken') || null;

// Lista maestra de Pokémon, cargada desde el backend
let listaPokemon = [];
let filtroActual = 'todos';

// 🚨 ¡IMPORTANTE! REEMPLAZAR con la URL de tu backend en Render
const BACKEND_URL = "https://pokedex-api-docker.onrender.com"; 

// ===============================================
// 2. LÓGICA DE AUTENTICACIÓN DE GOOGLE
// ===============================================

/**
 * Función de Callback de Google Sign-In.
 * Se llama automáticamente cuando Google proporciona las credenciales (JWT).
 * @param {object} response - Objeto de respuesta de Google con el token de ID.
 */
async function handleCredentialResponse(response) {
    const loginUrl = `${BACKEND_URL}/api/login`;

    try {
        const res = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: response.credential }),
        });

        if (res.ok) {
            const data = await res.json();
            
            // 1. Guardar el nuevo token JWT del backend
            AUTH_TOKEN = data.token;
            localStorage.setItem('userToken', AUTH_TOKEN);

            // 2. Actualizar la UI
            actualizarUI_LoginExitoso(data.username); 
            
            // 3. Recargar los datos, ahora con el progreso del usuario
            await cargarDatosDelUsuario(); 
            
        } else {
            console.error("Error en el login del backend:", await res.text());
            alert("Error al iniciar sesión. Inténtalo de nuevo.");
        }
    } catch (error) {
        console.error("Error de red o CORS al contactar al backend:", error);
        alert("No se pudo conectar con el servidor para iniciar sesión.");
    }
}

/**
 * Muestra el nombre del usuario en el navbar y oculta el botón de login.
 * @param {string} username - El nombre de usuario retornado por el backend.
 */
function actualizarUI_LoginExitoso(username) {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        loginContainer.innerHTML = `<span class="text-white small me-3">Hola, ${username}</span>`;
    }
}

// ===============================================
// 3. CARGA DE DATOS INICIALES Y ESPECÍFICOS DEL USUARIO
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDelUsuario();
});

/**
 * Carga la lista maestra de Pokémon y los datos específicos del usuario (capturados).
 */
async function cargarDatosDelUsuario() {
    mostrarSpinner(true);
    
    // Configura los headers de autenticación si hay un token
    const headers = {
        'Content-Type': 'application/json',
    };
    if (AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/pokemon`, { headers: headers });
        if (!response.ok) {
            throw new Error('Error al cargar la Pokédex.');
        }
        
        const data = await response.json();
        listaPokemon = data.pokemon;
        
        // Si hay un usuario logueado, ajustamos la UI
        if (AUTH_TOKEN) {
             // El backend ya nos devolvió el username en la carga inicial si el token es válido
             // Asumiendo que el backend envía 'username' incluso en la ruta /api/pokemon si hay token
             // Si el backend no lo hace, este paso se puede omitir o el backend debe ajustarse
        }

        renderizarListaPokemon(listaPokemon);
        actualizarProgresoGlobal(listaPokemon);

    } catch (error) {
        console.error("Error al cargar datos:", error);
        alert("No se pudo cargar la lista de Pokémon. Asegúrate de que el backend esté corriendo.");
    } finally {
        mostrarSpinner(false);
    }
}


// ===============================================
// 4. RENDERING Y VISUALIZACIÓN DE LA POKÉDEX
// ===============================================

/**
 * Genera el HTML para cada tarjeta de Pokémon.
 * @param {object} pokemon - Datos de un Pokémon.
 * @returns {string} HTML de la tarjeta.
 */
function generarTarjeta(pokemon) {
    const capturado = pokemon.capturado;
    const claseCapturado = capturado ? 'bg-white' : 'bg-light';
    const opacidadImagen = capturado ? 1 : 0.4;

    // Determina el tipo de sprite basado en el filtro actual
    let spriteUrl;
    if (filtroActual === 'RF') {
        spriteUrl = pokemon.sprite_rf;
    } else if (filtroActual === 'VH') {
        spriteUrl = pokemon.sprite_vh;
    } else {
        spriteUrl = pokemon.sprite_rf; // Por defecto, usamos RF si es 'todos'
    }

    return `
        <div class="col pokemon-card" 
             data-id="${pokemon.id}" 
             data-name="${pokemon.nombre.toLowerCase()}" 
             data-filtro="${filtroActual}"
             onclick="mostrarDetalles(${pokemon.id})">
            <div class="card h-100 ${claseCapturado} text-center" style="cursor: pointer;">
                <div class="card-body">
                    <img src="${spriteUrl}" 
                         class="card-img-top mx-auto d-block" 
                         alt="${pokemon.nombre}" 
                         style="width: 96px; height: 96px; opacity: ${opacidadImagen};">
                    <h6 class="card-title mt-2 mb-0">#${String(pokemon.id).padStart(3, '0')}</h6>
                    <p class="card-text fw-bold text-dark">${pokemon.nombre}</p>
                </div>
                ${capturado ? '<span class="badge bg-success position-absolute top-0 start-0 m-1">✔️</span>' : ''}
            </div>
        </div>
    `;
}

/**
 * Renderiza la lista completa de Pokémon en el grid.
 * @param {Array<object>} data - La lista de Pokémon a renderizar.
 */
function renderizarListaPokemon(data) {
    const listaDiv = document.getElementById('lista-pokemon');
    listaDiv.innerHTML = data.map(generarTarjeta).join('');
}

// ===============================================
// 5. MANEJO DE EVENTOS (Filtro, Búsqueda, Modal)
// ===============================================

/**
 * Muestra los detalles de un Pokémon en el Modal.
 * @param {number} id - ID del Pokémon.
 */
function mostrarDetalles(id) {
    const pokemon = listaPokemon.find(p => p.id === id);
    if (!pokemon) return;

    const modalTitle = document.getElementById('pokemonModalLabel');
    const modalBody = document.getElementById('modal-body-contenido');
    
    modalTitle.textContent = `#${String(pokemon.id).padStart(3, '0')} - ${pokemon.nombre}`;
    
    // Determinar la URL del sprite y los tipos para el modal
    const spriteModal = filtroActual === 'VH' ? pokemon.sprite_vh : pokemon.sprite_rf;
    const tiposHtml = pokemon.tipos.map(tipo => `<span class="badge type-${tipo.toLowerCase()} me-1">${tipo}</span>`).join('');
    
    // Contenido del Modal
    modalBody.innerHTML = `
        <div class="text-center mb-3">
            <img src="${spriteModal}" alt="${pokemon.nombre}" style="width: 128px; height: 128px;">
        </div>
        <p class="text-center">${tiposHtml}</p>
        <p><strong>Descripción:</strong> ${pokemon.descripcion}</p>
        <p><strong>Altura:</strong> ${pokemon.altura} m</p>
        <p><strong>Peso:</strong> ${pokemon.peso} kg</p>
        
        <div class="d-grid gap-2 mt-3">
            <button class="btn btn-lg btn-success" onclick="toggleCapturado(${pokemon.id}, true)">Marcar como Capturado</button>
            <button class="btn btn-lg btn-danger" onclick="toggleCapturado(${pokemon.id}, false)">Marcar como NO Capturado</button>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('pokemonModal'));
    modal.show();
}

/**
 * Busca Pokémon por nombre o ID en la lista.
 */
function buscarPokemon() {
    const query = document.getElementById('input-busqueda').value.toLowerCase();
    const resultados = listaPokemon.filter(pokemon => 
        pokemon.nombre.toLowerCase().includes(query) || String(pokemon.id).includes(query)
    );
    renderizarListaPokemon(resultados);
}

/**
 * Limpia la barra de búsqueda y vuelve a mostrar todos los Pokémon.
 */
function limpiarBusqueda() {
    document.getElementById('input-busqueda').value = '';
    renderizarListaPokemon(listaPokemon);
}

/**
 * Aplica un filtro de versión a los sprites mostrados.
 * @param {string} filtro - 'todos', 'RF' o 'VH'.
 * @param {string} texto - Texto a mostrar en el botón del dropdown.
 */
function aplicarFiltro(filtro, texto) {
    filtroActual = filtro;
    document.getElementById('filtro-texto').textContent = texto;
    // Re-renderizar para aplicar el sprite correcto
    renderizarListaPokemon(listaPokemon);
}


// ===============================================
// 6. MANEJO DE ESTADO (Captura y Progreso)
// ===============================================

/**
 * Alterna el estado de captura de un Pokémon y sincroniza con el backend.
 * @param {number} id - ID del Pokémon a modificar.
 * @param {boolean} nuevoEstado - true si está capturado, false si no.
 */
async function toggleCapturado(id, nuevoEstado) {
    if (!AUTH_TOKEN) {
        alert("Debes iniciar sesión con Google para guardar tu progreso.");
        return; 
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/captura`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({ pokemon_id: id, capturado: nuevoEstado })
        });

        if (response.ok) {
            // 1. Actualizar el estado local
            const index = listaPokemon.findIndex(p => p.id === id);
            if (index !== -1) {
                listaPokemon[index].capturado = nuevoEstado;
            }

            // 2. Re-renderizar la lista para reflejar el cambio en la tarjeta
            renderizarListaPokemon(listaPokemon);
            
            // 3. Actualizar la barra de progreso
            actualizarProgresoGlobal(listaPokemon);
            
            // 4. Cerrar el modal
            const modalElement = document.getElementById('pokemonModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

        } else {
            alert("Error al guardar el progreso en el servidor.");
        }
    } catch (error) {
        console.error("Error al sincronizar captura:", error);
        alert("Error de conexión al guardar el progreso.");
    }
}

/**
 * Actualiza la barra de progreso y el contador global.
 * @param {Array<object>} data - La lista de Pokémon.
 */
function actualizarProgresoGlobal(data) {
    const total = 151;
    const capturados = data.filter(p => p.capturado).length;
    const porcentaje = Math.round((capturados / total) * 100);

    const barra = document.getElementById('progreso-total');
    const contador = document.getElementById('contador-pokedex');

    // Actualiza la barra de progreso
    barra.style.width = `${porcentaje}%`;
    barra.setAttribute('aria-valuenow', capturados);
    barra.setAttribute('data-progreso', `${capturados}/${total} (${porcentaje}%)`); // Texto estático en CSS

    // Actualiza el contador
    contador.textContent = `${capturados}/${total} Vistos`;
    
    // Lógica de Tonos de Color (Morado Dinámico)
    barra.classList.remove('progress-tone-1', 'progress-tone-2', 'progress-tone-3', 'progress-tone-4');
    if (porcentaje === 100) {
        barra.classList.add('progress-tone-4'); // Máximo
    } else if (porcentaje >= 75) {
        barra.classList.add('progress-tone-4');
    } else if (porcentaje >= 50) {
        barra.classList.add('progress-tone-3');
    } else if (porcentaje >= 25) {
        barra.classList.add('progress-tone-2');
    } else if (porcentaje > 0) {
        barra.classList.add('progress-tone-1');
    }
}

// ===============================================
// 7. UTILIDADES
// ===============================================

/**
 * Muestra u oculta el spinner de carga.
 * @param {boolean} mostrar - true para mostrar, false para ocultar.
 */
function mostrarSpinner(mostrar) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.toggle('d-none', !mostrar);
    }
}

// Inicializa el contador del navbar con el valor correcto al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Si hay un token guardado, intentamos cargar los datos y el username
    if (AUTH_TOKEN) {
        // En este punto, solo ocultamos el botón de login para evitar el parpadeo
        // La función 'cargarDatosDelUsuario' se encargará de verificar el token
        // y de llamar a 'actualizarUI_LoginExitoso' si es válido.
        // Si no tienes una ruta para obtener solo el username, el backend debe enviarlo
        // junto con la lista de pokémon en la ruta /api/pokemon.
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
            loginContainer.innerHTML = `<span class="text-white small me-3">Cargando progreso...</span>`; 
        }
    }
    cargarDatosDelUsuario();
});