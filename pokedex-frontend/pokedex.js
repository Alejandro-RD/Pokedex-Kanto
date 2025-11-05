// pokedex.js
// Lógica principal del Frontend de la Pokédex Kanto (RF/VH)

// ===============================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ===============================================

let AUTH_TOKEN = localStorage.getItem('userToken') || null;
let listaPokemon = [];
let filtroActual = 'todos';

// 🚨 ¡IMPORTANTE! REEMPLAZAR con la URL de tu backend en Render
const BACKEND_URL = "https://pokedex-api-docker.onrender.com"; // EJEMPLO: Usar tu URL real

// ===============================================
// 2. LÓGICA DE AUTENTICACIÓN DE GOOGLE
// ===============================================

/**
 * Función de Callback de Google Sign-In.
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
            
            AUTH_TOKEN = data.token;
            localStorage.setItem('userToken', AUTH_TOKEN);

            actualizarUI_LoginExitoso(data.username); 
            await cargarDatosDelUsuario(); 
            
            alert('¡Inicio de sesión exitoso! Tu progreso ha sido cargado.');

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
 */
function actualizarUI_LoginExitoso(username) {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        loginContainer.innerHTML = `<span class="text-white small me-3">Hola, ${username}</span>`;
    }
}

// ===============================================
// 3. CARGA DE DATOS INICIALES (ACCESO PÚBLICO para diagnóstico)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDelUsuario(); 
});

/**
 * Carga la lista maestra de Pokémon (metadata, ya que la ruta está desprotegida).
 */
async function cargarDatosDelUsuario() {
    mostrarSpinner(true);
    
    // Configura los headers. No enviamos token en la carga inicial ya que es pública.
    const headers = { 'Content-Type': 'application/json' };
    if (AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/pokemon`, { headers: headers });
        if (!response.ok) {
            throw new Error(`Error al cargar la Pokédex. Código: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Asumimos que el backend devuelve un array directo
        listaPokemon = data; 
        
        if (!Array.isArray(listaPokemon)) {
             console.error("Error de datos: El backend no devolvió un array de Pokémon.", data);
             listaPokemon = []; 
        }

        renderizarListaPokemon(listaPokemon);
        actualizarProgresoGlobal(listaPokemon);

    } catch (error) {
        console.error("Error al cargar datos:", error);
        document.getElementById('lista-pokemon').innerHTML = '<p class="text-danger text-center">No se pudo cargar la Pokédex. Revise la URL o si el servidor Flask está funcionando.</p>';
    } finally {
        mostrarSpinner(false);
    }
}

// ===============================================
// 4. RENDERING Y VISUALIZACIÓN DE LA POKÉDEX
// ===============================================

/**
 * Genera el HTML para cada tarjeta de Pokémon.
 */
function generarTarjeta(pokemon) {
    const capturado = pokemon.is_caught || false; 
    const claseCapturado = capturado ? 'bg-success' : 'bg-light'; // Clases de Bootstrap
    const opacidadImagen = capturado ? 1 : 0.4;
    
    // El backend devuelve 'name' y 'id'
    const pokemonName = pokemon.name;
    const pokemonId = pokemon.id;

    return `
        <div class="col pokemon-card" 
             data-id="${pokemonId}" 
             data-name="${pokemonName.toLowerCase()}" 
             onclick="mostrarDetalles(${pokemonId})">
            <div class="card h-100 ${claseCapturado} text-center" style="cursor: pointer;">
                <div class="card-body">
                    <img src="https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(pokemonId).padStart(3, '0')}.png" 
                         class="card-img-top mx-auto d-block" 
                         alt="${pokemonName}" 
                         style="width: 96px; height: 96px; opacity: ${opacidadImagen};">
                    <h6 class="card-title mt-2 mb-0">#${String(pokemonId).padStart(3, '0')}</h6>
                    <p class="card-text fw-bold text-dark">${pokemonName}</p>
                    
                    </div>
                ${capturado ? '<span class="badge bg-success position-absolute top-0 start-0 m-1">✔️</span>' : ''}
            </div>
        </div>
    `;
}

/**
 * Renderiza la lista completa de Pokémon en el grid.
 */
function renderizarListaPokemon(data) {
    const listaDiv = document.getElementById('lista-pokemon');
    if (!Array.isArray(data)) {
        console.error("Error de Renderizado: La lista de Pokémon no es un array.", data);
        listaDiv.innerHTML = '<p class="text-danger text-center">Error interno: Estructura de datos incorrecta.</p>';
        return;
    }
    listaDiv.innerHTML = data.map(generarTarjeta).join('');
}

// ===============================================
// 5. MANEJO DE EVENTOS (Filtro, Búsqueda, Modal)
// ===============================================

// ... (Las funciones buscarPokemon, aplicarFiltro, y mostrarDetalles siguen aquí) ...

/**
 * Busca Pokémon por nombre o ID en la lista.
 */
function buscarPokemon() {
    const query = document.getElementById('input-busqueda').value.toLowerCase();
    const resultados = listaPokemon.filter(pokemon => 
        pokemon.name.toLowerCase().includes(query) || String(pokemon.id).includes(query)
    );
    renderizarListaPokemon(resultados);
}

/**
 * Aplica un filtro de versión a los sprites mostrados.
 */
function aplicarFiltro(filtro, texto) {
    filtroActual = filtro;
    document.getElementById('dropdownFiltro').textContent = texto;
    // La lógica del filtro de versión se aplicaría aquí si el backend devolviera sprites separados
    renderizarListaPokemon(listaPokemon);
}

/**
 * Muestra los detalles de un Pokémon en el Modal.
 */
function mostrarDetalles(id) {
    const pokemon = listaPokemon.find(p => p.id === id);
    if (!pokemon) return;

    // Llenado de modal (Simplificado)
    const modalTitle = document.getElementById('pokemonModalLabel');
    modalTitle.textContent = `#${String(pokemon.id).padStart(3, '0')} - ${pokemon.name}`;
    
    // ... (El resto de la lógica de llenado de modal) ...

    const modal = new bootstrap.Modal(document.getElementById('pokemonModal'));
    modal.show();
}

// ===============================================
// 6. MANEJO DE ESTADO (CAPTURA Y PROGRESO)
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
                listaPokemon[index].is_caught = nuevoEstado;
            }

            // 2. Re-renderizar la lista y barra
            renderizarListaPokemon(listaPokemon);
            actualizarProgresoGlobal(listaPokemon);
            
            // 3. Cerrar el modal (si está abierto)
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
 */
function actualizarProgresoGlobal(data) {
    const total = 151;
    const capturados = data.filter(p => p.is_caught).length;
    const porcentaje = Math.round((capturados / total) * 100);

    const barra = document.getElementById('progreso-total');
    const contador = document.getElementById('contador-pokedex');

    // Actualiza la barra de progreso
    barra.style.width = `${Math.max(porcentaje, 1)}%`; // Corrección del borde cuadrado
    barra.setAttribute('aria-valuenow', capturados);
    barra.setAttribute('data-progreso', `${capturados}/${total} (${porcentaje}%)`);

    // Actualiza el contador
    contador.textContent = `${capturados}/${total} Vistos`;
    
    // Lógica de Tonos de Color (Morado Dinámico)
    const barraClases = ['progress-tone-1', 'progress-tone-2', 'progress-tone-3', 'progress-tone-4'];
    barra.classList.remove(...barraClases);

    if (porcentaje >= 75) {
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
 * Muestra u oculta el spinner de carga. (Añadido para resolver ReferenceError)
 */
function mostrarSpinner(mostrar) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.toggle('d-none', !mostrar);
    }
}