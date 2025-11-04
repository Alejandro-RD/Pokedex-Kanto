// =======================================================================
// 1. CONFIGURACIÓN GLOBAL Y DATOS
// =======================================================================

// La base de datos ahora es una variable vacía que se llenará con la API
let POKEMON_DATA = [];
let filtroActual = 'todos'; 
let filtroTextoActual = 'Todos'; 
let terminoBusqueda = ''; 

/**
 * Genera la URL de la imagen de Pokémon.
 */
const getImageUrl = (id) => {
    const paddedId = String(id).padStart(3, '0');
    return `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${paddedId}.png`;
};

// =======================================================================
// 2. LÓGICA DE INTERFAZ, FILTRADO Y PROGRESO
// =======================================================================

/**
 * Calcula y actualiza la barra de progreso global (basada en los 151 Pokémon).
 */
function actualizarProgresoGlobal() {
    const totalPokemon = 151;
    const totalCapturados = POKEMON_DATA.filter(p => p.capturado).length;
    
    // Calcular el porcentaje
    const porcentaje = Math.round((totalCapturados / totalPokemon) * 100);

    const progressBar = document.getElementById('progreso-total');
    const progressContainer = progressBar.closest('.progress-gba'); 
    
    if (progressBar && progressContainer) {
        // 1. Actualizar ancho de la BARRA INTERNA
        progressBar.style.width = `${porcentaje}%`;
        
        // 2. Actualizar el atributo data-progreso (leído por CSS para el texto estático)
        progressContainer.setAttribute('data-progreso', `${totalCapturados} / ${totalPokemon} (${porcentaje}%)`);

        // 3. Lógica de color de barra (opcional)
        if (porcentaje < 30) {
            progressBar.classList.remove('bg-success');
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.remove('bg-warning');
            progressBar.classList.add('bg-success');
        }
    }
}

/**
 * Dibuja la Pokédex en el DOM, aplicando filtros, búsqueda y el estado de captura.
 */
function renderPokedex() {
    // Si los datos aún no se han cargado, sale
    if (POKEMON_DATA.length === 0) return; 
    
    document.getElementById('loading-spinner').classList.remove('d-none');
    
    setTimeout(() => {
        const listaPokemon = document.getElementById('lista-pokemon');
        listaPokemon.innerHTML = ''; 
        let capturadosCount = 0;

        // 1. FILTRADO: Versión + Búsqueda
        const pokemonFiltrados = POKEMON_DATA.filter(pokemon => {
            const cumpleFiltroVersion = (
                filtroActual === 'todos' ||
                pokemon.exclusivo === filtroActual ||
                pokemon.exclusivo === 'Ambos'
            );
            const cumpleFiltroBusqueda = (
                pokemon.name.toLowerCase().includes(terminoBusqueda) ||
                String(pokemon.id) === terminoBusqueda
            );
            return cumpleFiltroVersion && cumpleFiltroBusqueda;
        });

        // 2. GENERACIÓN DE TARJETAS
        pokemonFiltrados.forEach(pokemon => {
            if (pokemon.capturado) {
                capturadosCount++;
            }

            const estadoClase = pokemon.capturado ? 'bg-success border-success' : 'bg-light border-secondary';
            const colorTexto = pokemon.capturado ? 'text-white' : 'text-dark';
            const infoButtonClass = pokemon.capturado ? 'text-white' : 'text-dark';

            const pokemonCard = `
                <div class="col">
                    <div class="card h-100 shadow-sm ${estadoClase} ${colorTexto}" 
                         style="cursor: pointer; transition: transform 0.2s; position: relative;"
                         onclick="marcarCapturado(${pokemon.id})"> <button class="btn btn-sm btn-outline-light ${infoButtonClass}" 
                                style="position: absolute; top: 5px; right: 5px; z-index: 10; border: none;"
                                data-bs-toggle="modal" 
                                data-bs-target="#pokemonModal" 
                                onclick="event.stopPropagation(); mostrarDetalles(${pokemon.id})"> ⓘ
                        </button>
                        
                        <img src="${getImageUrl(pokemon.id)}" class="card-img-top mx-auto p-2" alt="${pokemon.name}" 
                             style="max-height: 100px; width: auto; opacity: ${pokemon.capturado ? 1 : 0.4};">
                        <div class="card-body p-2 text-center">
                            <h6 class="card-title mb-1">#${String(pokemon.id).padStart(3, '0')} ${pokemon.name}</h6>
                            
                            <div class="mb-1">
                                ${pokemon.type.map(type => `<span class="badge type-${type.toLowerCase()}">${type}</span>`).join(' ')}
                            </div>

                            <p class="card-text small m-0">
                                Estado: ${pokemon.capturado ? 'Capturado ✅' : 'Pendiente ❌'}
                            </p>
                        </div>
                    </div>
                </div>
            `;
            listaPokemon.innerHTML += pokemonCard;
        });

        // 3. Ocultar el Spinner y actualizar contadores
        document.getElementById('loading-spinner').classList.add('d-none');
        document.getElementById('contador-pokedex').textContent = `${capturadosCount}/${pokemonFiltrados.length} Vistos`;
        actualizarProgresoGlobal(); 
        
    }, 50); // Retraso de 50ms (simulación de carga)
}

/**
 * Lee el valor del campo de búsqueda y desencadena la renderización.
 */
function buscarPokemon() {
    const input = document.getElementById('input-busqueda');
    terminoBusqueda = input.value.toLowerCase();
    renderPokedex();
}

/**
 * Limpia el campo de búsqueda y reinicia el filtro de búsqueda.
 */
function limpiarBusqueda() {
    document.getElementById('input-busqueda').value = '';
    terminoBusqueda = '';
    renderPokedex();
}

/**
 * Aplica el filtro de versión y actualiza el botón de forma dinámica.
 */
function aplicarFiltro(version, texto) {
    filtroActual = version;
    filtroTextoActual = texto;
    
    const boton = document.getElementById('dropdownFiltro');
    
    // 1. Limpiar clases de color previas
    boton.classList.remove('btn-danger', 'btn-success', 'btn-dark', 'btn-outline-danger', 'btn-outline-success', 'btn-outline-dark');
    
    // 2. Aplicar nueva clase de color
    if (version === 'RF') {
        boton.classList.add('btn-danger'); // Rojo Fuego
    } else if (version === 'VH') {
        boton.classList.add('btn-success'); // Verde Hoja
    } else {
        boton.classList.add('btn-dark'); // Neutro para 'Todos'
    }
    
    // 3. Restaurar la clase 'dropdown-toggle' y actualizar texto
    boton.classList.add('dropdown-toggle');
    document.getElementById('filtro-texto').textContent = texto;
    
    renderPokedex();
}


// =======================================================================
// 3. LÓGICA DE CAPTURA Y MODAL
// =======================================================================

/**
 * Cambia el estado de captura de un Pokémon y guarda el estado (Acción rápida).
 */
function marcarCapturado(id) { 
    const pokemonIndex = POKEMON_DATA.findIndex(p => p.id === id);
    if (pokemonIndex !== -1) {
        POKEMON_DATA[pokemonIndex].capturado = !POKEMON_DATA[pokemonIndex].capturado;
        savePokedexState();
        renderPokedex();
    }
}

/**
 * Muestra los detalles de un Pokémon en el modal de Bootstrap (Solo información).
 */
function mostrarDetalles(id) {
    const pokemon = POKEMON_DATA.find(p => p.id === id);
    const modalTitle = document.getElementById('pokemonModalLabel');
    const modalBody = document.getElementById('modal-body-contenido');

    if (!pokemon) {
        modalTitle.textContent = "Error";
        modalBody.innerHTML = "<p>Pokémon no encontrado.</p>";
        return;
    }

    modalTitle.textContent = `#${String(pokemon.id).padStart(3, '0')} - ${pokemon.name}`;
    
    // Texto para la versión de exclusividad
    let versionInfo;
    if (pokemon.exclusivo === 'RF') {
        versionInfo = 'Exclusivo de: **Rojo Fuego** 🔥';
    } else if (pokemon.exclusivo === 'VH') {
        versionInfo = 'Exclusivo de: **Verde Hoja** 🌿';
    } else {
        versionInfo = 'Disponible en: **Ambas Versiones** ☯️';
    }

    const contenido = `
        <div class="text-center">
            <img src="${getImageUrl(pokemon.id)}" alt="${pokemon.name}" style="max-height: 150px; margin-bottom: 15px;">
            <div class="mb-3">
                ${pokemon.type.map(type => `<span class="badge type-${type.toLowerCase()}">${type}</span>`).join(' ')}
            </div>
        </div>
        
        <p class="text-center fs-5">${versionInfo}</p>
        
        <hr>
        <p class="text-center text-muted small">Estado de captura: 
            <strong>${pokemon.capturado ? 'Capturado ✅' : 'Pendiente ❌'}</strong>
        </p>
    `;
    
    modalBody.innerHTML = contenido;
}


// =======================================================================
// 4. LÓGICA DE PERSISTENCIA Y CARGA DE DATOS DESDE API
// =======================================================================

/**
 * Guarda el estado actual de captura de la Pokédex en el almacenamiento local del navegador.
 */
function savePokedexState() {
    const estadoCaptura = POKEMON_DATA.map(p => ({
        id: p.id,
        capturado: p.capturado
    }));
    localStorage.setItem('pokedexStateRFVH', JSON.stringify(estadoCaptura));
}

/**
 * Aplica los estados de captura guardados en localStorage sobre los datos de la API.
 */
function loadPokedexState() {
    const savedState = localStorage.getItem('pokedexStateRFVH');
    // Solo aplica el estado si hay datos base cargados
    if (savedState && POKEMON_DATA.length > 0) { 
        const estado = JSON.parse(savedState);
        estado.forEach(savedP => {
            const pokemon = POKEMON_DATA.find(p => p.id === savedP.id);
            if (pokemon) {
                // El campo 'type' puede llegar como string ("Planta,Veneno") desde Flask. Lo convertimos a array si es necesario.
                if (typeof pokemon.type === 'string') {
                    pokemon.type = pokemon.type.split(',');
                }
                pokemon.capturado = savedP.capturado;
            }
        });
    }
}

/**
 * Carga los datos de Pokémon desde la API de Flask.
 */
async function loadPokedexData() {
    try {
        // 1. CARGAR DATOS BASE DESDE EL BACKEND
        const API_URL = 'https://pokedex-api-docker.onrender.com/api/pokemon';
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Error al cargar datos de la API: ${response.statusText}`);
        }
        
        POKEMON_DATA = await response.json(); 
        
        // 2. CARGAR ESTADO DE CAPTURA LOCAL
        loadPokedexState(); 
        
    } catch (error) {
        console.error("❌ No se pudo conectar al backend. Asegúrate de que Flask esté corriendo en http://127.0.0.1:5000:", error);
        alert("Error de conexión con el backend. Revisa la consola (F12).");
    }
}

// =======================================================================
// 5. INICIALIZACIÓN DE LA APLICACIÓN
// =======================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar los datos de la API
    await loadPokedexData(); 
    
    // 2. Aplicar filtro y renderizar solo después de que los datos estén listos
    aplicarFiltro(filtroActual, filtroTextoActual); 
});