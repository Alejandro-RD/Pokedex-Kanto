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
// 2. LÓGICA DE AUTENTICACIÓN DE GOOGLE (Mantener la función, pero deshabilitarla al inicio)
// ===============================================

/**
 * Función de Callback de Google Sign-In.
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
            
            // 3. Recargar los datos, ahora con el token en el header (esto debería funcionar)
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
 * @param {string} username - El nombre de usuario retornado por el backend.
 */
function actualizarUI_LoginExitoso(username) {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        // En un proyecto real, necesitarías el username desde la respuesta del login
        loginContainer.innerHTML = `<span class="text-white small me-3">Hola, ${username}</span>`;
    }
}

// ===============================================
// 3. CARGA DE DATOS INICIALES (AHORA ACCESO PÚBLICO)
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    // LLAMA A LA CARGA SIN DEPENDER DEL TOKEN AL INICIO
    cargarDatosDelUsuario(); 
});

/**
 * Carga la lista maestra de Pokémon (metadata, ya que la ruta está desprotegida).
 */
async function cargarDatosDelUsuario() {
    mostrarSpinner(true);
    
    // --- LÓGICA CLAVE: QUITAR EL TOKEN PARA LA CARGA INICIAL ---
    // La ruta /api/pokemon ya no requiere token para devolver la metadata base.
    const headers = {
        'Content-Type': 'application/json',
    };
    
    // Si hay token, lo enviamos (para futuras rutas o si el backend vuelve a proteger la ruta)
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
        
        // El JSON de la API desprotegida es el array principal
        listaPokemon = data; 
        
        // Si el login fue exitoso en una sesión anterior, actualiza la UI
        if (AUTH_TOKEN) {
             // (Aquí iría la lógica para obtener el username del token)
        }

        renderizarListaPokemon(listaPokemon);
        actualizarProgresoGlobal(listaPokemon);

    } catch (error) {
        console.error("Error al cargar datos:", error);
        // Mostrar un error visible en el HTML si el fetch falla
        document.getElementById('lista-pokemon').innerHTML = '<p class="text-danger text-center">No se pudo cargar la Pokédex. Revise la consola para errores de CORS/Conexión.</p>';
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
    // Asumimos 'capturado' es falso ya que la ruta no está protegida, pero el backend
    // debe devolver un campo 'is_caught' si queremos reflejar el estado correctamente.
    // Para esta prueba, usaremos solo la metadata.
    const capturado = pokemon.is_caught || false; 
    const claseCapturado = capturado ? 'bg-success' : 'bg-light';
    const opacidadImagen = capturado ? 1 : 0.4;
    
    // ... (Definir spriteUrl y tiposHtml aquí si el backend los devuelve en formato diferente) ...

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

// ... (El resto de las funciones como renderizarListaPokemon, mostrarDetalles, etc. se mantienen) ...


// ===============================================
// 6. MANEJO DE ESTADO (Captura y Progreso)
// ===============================================

/**
 * Alterna el estado de captura de un Pokémon y sincroniza con el backend.
 */
async function toggleCapturado(id, nuevoEstado) {
    if (!AUTH_TOKEN) {
        alert("Debes iniciar sesión con Google para guardar tu progreso.");
        return; 
    }
    // ... (El resto de la lógica de guardado sigue aquí, usando el token para la seguridad) ...
}

// ... (El resto de las funciones) ...