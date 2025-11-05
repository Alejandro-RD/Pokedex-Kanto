// pokedex.js
// Lógica principal del Frontend de la Pokédex Kanto (RF/VH)

// ===============================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ===============================================

// Almacena el token JWT una vez que el usuario inicia sesión.
let AUTH_TOKEN = localStorage.getItem('userToken') || null;

// Lista maestra de Pokémon, cargada desde la API
let listaPokemon = [];
let filtroActual = 'todos';

// 🚨 ¡IMPORTANTE! REEMPLAZAR con la URL de tu backend en Render
const BACKEND_URL = "https://pokedex-api-docker.onrender.com"; 

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
            
            // 1. Guardar el nuevo token JWT del backend
            AUTH_TOKEN = data.token;
            localStorage.setItem('userToken', AUTH_TOKEN);

            // 2. Actualizar la UI (asumiendo que el backend retorna 'username')
            actualizarUI_LoginExitoso(data.username); 
            
            // 3. Recargar los datos (Ahora con el token en el header, si el backend está protegido)
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
// 3. CARGA DE DATOS INICIALES (AHORA ACCESO PÚBLICO)
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // La carga inicial ahora es directa, sin esperar el login.
    cargarDatosDelUsuario(); 
});

/**
 * Carga la lista maestra de Pokémon (metadata, ya que la ruta está desprotegida).
 */
async function cargarDatosDelUsuario() {
    mostrarSpinner(true);
    
    // Configura los headers. Aunque la ruta es pública, enviamos el token si existe.
    const headers = {
        'Content-Type': 'application/json',
    };
    if (AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    try {
        // Llama a la ruta /api/pokemon que ahora es de acceso PÚBLICO
        const response = await fetch(`${BACKEND_URL}/api/pokemon`, { headers: headers });
        if (!response.ok) {
            throw new Error(`Error al cargar la Pokédex. Código: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ⚠️ CORRECCIÓN DE TYPERROR: data ahora debe ser la lista que se puede mapear
        listaPokemon = data; 
        
        // Asumiendo que el backend devuelve un array directo
        if (!Array.isArray(listaPokemon)) {
             // Esto sucede si el backend devuelve un objeto que no es la lista.
             // Si el backend devuelve {pokemon: [...]}, necesitas: listaPokemon = data.pokemon
             // Por ahora, asumimos que devuelve el array directo.
             console.error("El backend no devolvió un array de Pokémon.");
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
    // Usamos 'name' y 'id' que viene directo del backend
    const capturado = pokemon.is_caught || false; 
    const claseCapturado = capturado ? 'bg-success' : 'bg-light';
    const opacidadImagen = capturado ? 1 : 0.4;
    
    return `
        <div class="col pokemon-card" 
             data-id="${pokemon.id}" 
             data-name="${pokemon.name.toLowerCase()}" 
             onclick="mostrarDetalles(${pokemon.id})">
            <div class="card h-100 ${claseCapturado} text-center" style="cursor: pointer;">
                <div class="card-body">
                    <img src="https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(pokemon.id).padStart(3, '0')}.png" 
                         class="card-img-top mx-auto d-block" 
                         alt="${pokemon.name}" 
                         style="width: 96px; height: 96px; opacity: ${opacidadImagen};">
                    <h6 class="card-title mt-2 mb-0">#${String(pokemon.id).padStart(3, '0')}</h6>
                    <p class="card-text fw-bold text-dark">${pokemon.name}</p>
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
    // ⚠️ CORRECCIÓN DE TYPERROR: Ahora comprobamos si es un array antes de mapear
    if (!Array.isArray(data)) {
        console.error("Error de Renderizado: La lista de Pokémon no es un array.", data);
        listaDiv.innerHTML = '<p class="text-danger text-center">Error interno: Estructura de datos incorrecta.</p>';
        return;
    }
    listaDiv.innerHTML = data.map(generarTarjeta).join('');
}

// ... (El resto de las funciones como mostrarDetalles, toggleCapturado, etc. siguen aquí) ...


// ===============================================
// 7. UTILIDADES
// ===============================================

/**
 * Muestra u oculta el spinner de carga. (Añadido para resolver ReferenceError)
 * @param {boolean} mostrar - true para mostrar, false para ocultar.
 */
function mostrarSpinner(mostrar) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.classList.toggle('d-none', !mostrar);
    }
}