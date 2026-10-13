// ==========================================================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================================================
const formulario = document.querySelector("#formulario-busqueda");
const inputBusqueda = document.querySelector("#busqueda");
const mensaje = document.querySelector("#mensaje");
const resultado = document.querySelector("#resultado");
const botonBuscar = formulario.querySelector("button");
const modal = document.querySelector("#modal-detalles");
const modalCuerpo = document.querySelector("#modal-cuerpo");
const btnCerrarModal = document.querySelector("#btn-cerrar-modal");
const selectTipo = document.querySelector("#filtro-tipo");
const btnCargar = document.querySelector("#btn-cargar");
const btnAleatorio = document.querySelector("#btn-pokemon-aleatorio");
const contenedorAleatorio = document.querySelector("#contenedor-aleatorio");
const contadorResultados = document.querySelector("#contador-resultados");
const contenedorVistas = document.querySelector("#vista-controles");
const btnVistaCuadricula = document.querySelector("#btn-vista-cuadricula");
const btnVistaLista = document.querySelector("#btn-vista-lista");
const btnFiltroFavoritos = document.querySelector("#btn-filtro-favoritos");
const contadorFavoritos = document.querySelector("#contador-favoritos");


// ==========================================================================
// GESTIÓN DE FAVORITOS (localStorage)
// ==========================================================================
let soloFavoritosActivo = false;
const CLAVE_FAVORITOS = "pokedex_favoritos";

// Lee los favoritos almacenados en localStorage
const obtenerFavoritos = () => {
  try {
    const datos = localStorage.getItem(CLAVE_FAVORITOS);
    return datos ? JSON.parse(datos) : [];
  } catch (error) {
    console.error("Error al leer favoritos de localStorage:", error);
    return [];
  }
};

// Guarda el array de favoritos en localStorage
const guardarFavoritos = (favoritos) => {
  try {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (error) {
    console.error("Error al guardar favoritos en localStorage:", error);
  }
};

// Alterna el estado de favorito de un Pokémon por su ID
const alternarFavorito = (id) => {
  let favoritos = obtenerFavoritos();
  const idNum = Number(id);
  const yaEsFavorito = favoritos.includes(idNum);

  if (yaEsFavorito) {
    favoritos = favoritos.filter((favId) => favId !== idNum);
  } else {
    favoritos.push(idNum);
  }

  guardarFavoritos(favoritos);
  actualizarContadorFavoritos();
  return !yaEsFavorito;
};

// Actualiza el contador numérico de favoritos en la interfaz
const actualizarContadorFavoritos = () => {
  if (contadorFavoritos) {
    const total = obtenerFavoritos().length;
    contadorFavoritos.textContent = total;
  }
};


// ==========================================================================
// ESTADO GLOBAL EN MEMORIA Y UTILIDADES
// ==========================================================================
let todosLosPokemon = [];

// Formatea el número del Pokémon con ceros a la izquierda (ej. 25 -> "025")
const formatearId = (id) => {
  return String(id).padStart(3, "0");
};

// Obtiene los tipos únicos de los Pokémon cargados y puebla el elemento <select>
const poblarSelectorTipos = () => {
  const tiposUnicos = new Set();
  todosLosPokemon.forEach((pokemon) => {
    pokemon.tipos.forEach((tipo) => tiposUnicos.add(tipo));
  });

  const tiposOrdenados = Array.from(tiposUnicos).sort();

  selectTipo.innerHTML = '<option value="todos">Todos los tipos</option>';
  tiposOrdenados.forEach((tipo) => {
    const opcion = document.createElement("option");
    opcion.value = tipo;
    opcion.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
    selectTipo.appendChild(opcion);
  });
};

// ==========================================================================
// EFECTOS DE SONIDO RETRO (Web Audio API)
// ==========================================================================
class SonidosPokemon {
  constructor() {
    this.ctx = null;
    this.silenciado = false;
  }

  iniciar() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Tono de bamboleo clásico de Pokéball
  tocarBamboleo() {
    if (this.silenciado || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(340, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (_) {}
  }

  // Clic de confirmación y captura de datos (ping)
  tocarClic() {
    if (this.silenciado || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch (_) {}
  }

  // Fanfarria triunfal de apertura estilo evento Pokémon
  tocarFanfarria() {
    if (this.silenciado || !this.ctx) return;
    try {
      const notas = [523.25, 659.25, 783.99, 1046.5];
      const ahora = this.ctx.currentTime;
      notas.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ahora + idx * 0.09);
        gain.gain.setValueAtTime(0.06, ahora + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + idx * 0.09 + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(ahora + idx * 0.09);
        osc.stop(ahora + idx * 0.09 + 0.17);
      });
    } catch (_) {}
  }

  // Tono de escaneo tecnológico al abrir el visor de detalles
  tocarAbrirModal() {
    if (this.silenciado || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
    } catch (_) {}
  }

  // Tintineo brillante de estrellas al alternar modo Variocolor (Shiny)
  tocarShiny() {
    if (this.silenciado || !this.ctx) return;
    try {
      const notas = [1318.51, 1760.0, 2093.0];
      const ahora = this.ctx.currentTime;
      notas.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ahora + idx * 0.06);
        gain.gain.setValueAtTime(0.09, ahora + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + idx * 0.06 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(ahora + idx * 0.06);
        osc.stop(ahora + idx * 0.06 + 0.15);
      });
    } catch (_) {}
  }
}

const sintetizadorSonidos = new SonidosPokemon();


// ==========================================================================
// ELEMENTOS Y CONTROLES DE LA ANIMACIÓN DE INTRODUCCIÓN
// ==========================================================================
const introOverlay = document.querySelector("#intro-pokemon");
const pokeballLoader = document.querySelector("#pokeball-loader");
const introEstado = document.querySelector("#intro-estado");
const introProgreso = document.querySelector("#intro-progreso");
const introContadorTexto = document.querySelector("#intro-contador-texto");
const introDestellos = document.querySelector("#intro-destellos");
const btnSonidoIntro = document.querySelector("#btn-sonido-intro");
const btnOmitirIntro = document.querySelector("#btn-omitir-intro");
const btnVerIntro = document.querySelector("#btn-ver-intro");
const lentePokedex = document.querySelector(".pokedex-lente");

// Control de sonido en la intro
if (btnSonidoIntro) {
  btnSonidoIntro.addEventListener("click", () => {
    sintetizadorSonidos.iniciar();
    sintetizadorSonidos.silenciado = !sintetizadorSonidos.silenciado;
    btnSonidoIntro.innerHTML = sintetizadorSonidos.silenciado
      ? '<span class="intro-sonido-icono">🔇</span> Sonido: OFF'
      : '<span class="intro-sonido-icono">🔊</span> Sonido: ON';
    btnSonidoIntro.title = sintetizadorSonidos.silenciado
      ? "Activar efectos de sonido retro"
      : "Silenciar efectos de sonido retro";
  });
}

// Botón para omitir la intro al instante
let introOmitida = false;
if (btnOmitirIntro) {
  btnOmitirIntro.addEventListener("click", () => {
    introOmitida = true;
    if (introOverlay) {
      introOverlay.style.opacity = "0";
      setTimeout(() => {
        introOverlay.style.display = "none";
        introOverlay.setAttribute("aria-hidden", "true");
      }, 300);
    }
  });
}

// ==========================================================================
// CARGA CONCURRENTE DE LOS 151 POKÉMON (Promise.all)
// ==========================================================================
// Descarga los datos de los 151 Pokémon en paralelo y los guarda en memoria
const cargarPokemonsEnMemoria = async () => {
  introOmitida = false;
  sintetizadorSonidos.iniciar();

  // Estado 1: Preparando carga (bloqueamos controles y mostramos overlay)
  mensaje.className = "mensaje mensaje--cargando";
  mensaje.textContent = "Cargando los 151 Pokémon de la Pokédex...";
  btnCargar.disabled = true;
  inputBusqueda.disabled = true;
  selectTipo.disabled = true;
  botonBuscar.disabled = true;

  if (introOverlay) {
    introOverlay.style.display = "flex";
    introOverlay.style.opacity = "1";
    introOverlay.setAttribute("aria-hidden", "false");
    if (pokeballLoader) pokeballLoader.classList.remove("abrir");
    if (introDestellos) introDestellos.classList.remove("activo");
    if (introProgreso) introProgreso.style.width = "15%";
    if (introContadorTexto) introContadorTexto.textContent = "0";
    if (introEstado) introEstado.textContent = "CONECTANDO CON SERVIDORES SILPH / POKÉAPI...";
  }

  // Bamboleo sonoro inicial
  sintetizadorSonidos.tocarBamboleo();

  try {
    let cargadosContador = 0;
    const promesas = [];

    // Bucle para crear las peticiones concurrentes (Requisito 4.2)
    for (let i = 1; i <= 151; i++) {
      promesas.push(
        fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
          .then((res) => {
            if (!res.ok) throw new Error(`Error en Pokémon #${i} (Código ${res.status})`);
            return res.json();
          })
          .then((dato) => {
            cargadosContador++;
            // Actualización progresiva en tiempo real del progreso visual
            if (introContadorTexto && !introOmitida) {
              introContadorTexto.textContent = cargadosContador;
            }
            if (introProgreso && !introOmitida) {
              const porcentaje = Math.min(95, Math.floor((cargadosContador / 151) * 90) + 10);
              introProgreso.style.width = `${porcentaje}%`;
            }
            // Pequeño pulso de sonido en hitos
            if (cargadosContador === 50 || cargadosContador === 100) {
              sintetizadorSonidos.tocarBamboleo();
            }
            return dato;
          })
      );
    }

    if (introEstado && !introOmitida) {
      introEstado.textContent = "DESCARGANDO Y SINCRONIZANDO 151 ESPECIES...";
    }

    // Esperamos a que terminen TODAS las peticiones simultáneas
    const datosCrudos = await Promise.all(promesas);

    // Mapeamos los datos crudos de la API a instancias limpias de nuestra clase Pokemon
    todosLosPokemon = datosCrudos.map((dato) => new Pokemon(dato));
    poblarSelectorTipos();

    // Habilitamos controles para el usuario
    btnCargar.style.display = "none";
    if (btnAleatorio) btnAleatorio.style.display = "inline-block";
    contenedorVistas.style.display = "flex";
    actualizarContadorFavoritos();
    inputBusqueda.disabled = false;
    selectTipo.disabled = false;
    botonBuscar.disabled = false;

    // Animación final: La Pokéball se ilumina, suena el clic y se abre con destello y fanfarria
    if (!introOmitida) {
      if (introProgreso) introProgreso.style.width = "100%";
      if (introContadorTexto) introContadorTexto.textContent = "151";
      if (introEstado) introEstado.textContent = "¡POKÉDEX NACIONAL SINCRONIZADA!";
      
      sintetizadorSonidos.tocarClic();

      await new Promise((res) => setTimeout(res, 350));
      if (!introOmitida) {
        if (pokeballLoader) pokeballLoader.classList.add("abrir");
        if (introDestellos) introDestellos.classList.add("activo");
        sintetizadorSonidos.tocarFanfarria();

        // Pausa cinematográfica para contemplar el destello y las estrellas
        await new Promise((res) => setTimeout(res, 850));
      }
    }

    // Desvanecer el overlay de bienvenida suavemente
    if (introOverlay) {
      introOverlay.style.opacity = "0";
      setTimeout(() => {
        introOverlay.style.display = "none";
        introOverlay.setAttribute("aria-hidden", "true");
        if (pokeballLoader) pokeballLoader.classList.remove("abrir");
        if (introDestellos) introDestellos.classList.remove("activo");
      }, 500);
    }

    // Estado 2: Datos cargados correctamente
    mensaje.className = "mensaje mensaje--exito";
    mensaje.textContent = "¡Pokédex lista! Puedes buscar por nombre, número o filtrar por tipo.";
    resultado.innerHTML = todosLosPokemon.map(crearTarjetaHTML).join("");
    activarHoverSprites();
    actualizarContadorResultados(todosLosPokemon.length);
  } catch (error) {
    if (introOverlay) {
      introOverlay.style.opacity = "0";
      setTimeout(() => {
        introOverlay.style.display = "none";
        introOverlay.setAttribute("aria-hidden", "true");
      }, 300);
    }

    // Estado 3: Error de comunicación con PokéAPI
    btnCargar.disabled = false;
    if (btnAleatorio) btnAleatorio.style.display = "none";
    inputBusqueda.disabled = true;
    selectTipo.disabled = true;
    botonBuscar.disabled = true;

    mensaje.className = "mensaje mensaje--error";
    mensaje.innerHTML = `
      <span>Hubo un problema al conectar con PokéAPI. Revisa tu conexión.</span>
      <button id="btn-reintentar" class="btn-reintentar" type="button">Reintentar</button>
    `;
    console.error("Fallo de conexión:", error);

    const btnReintentar = document.querySelector("#btn-reintentar");
    if (btnReintentar) {
      btnReintentar.addEventListener("click", cargarPokemonsEnMemoria);
    }
  }
};

// Función para revivir la animación cinematográfica a petición del usuario
const reproducirIntroCinematica = async () => {
  if (todosLosPokemon.length === 0) {
    cargarPokemonsEnMemoria();
    return;
  }

  introOmitida = false;
  sintetizadorSonidos.iniciar();

  if (introOverlay) {
    introOverlay.style.display = "flex";
    introOverlay.style.opacity = "1";
    introOverlay.setAttribute("aria-hidden", "false");
    if (pokeballLoader) pokeballLoader.classList.remove("abrir");
    if (introDestellos) introDestellos.classList.remove("activo");
    if (introProgreso) introProgreso.style.width = "40%";
    if (introContadorTexto) introContadorTexto.textContent = "151";
    if (introEstado) introEstado.textContent = "ESCANEANDO REGISTRO REGIONAL DE KANTO...";
  }

  sintetizadorSonidos.tocarBamboleo();
  await new Promise((res) => setTimeout(res, 600));

  if (!introOmitida) {
    sintetizadorSonidos.tocarBamboleo();
    if (introProgreso) introProgreso.style.width = "85%";
    await new Promise((res) => setTimeout(res, 500));
  }

  if (!introOmitida) {
    if (introProgreso) introProgreso.style.width = "100%";
    if (introEstado) introEstado.textContent = "¡151 ESPECIES EN LÍNEA!";
    sintetizadorSonidos.tocarClic();

    await new Promise((res) => setTimeout(res, 300));
    if (!introOmitida) {
      if (pokeballLoader) pokeballLoader.classList.add("abrir");
      if (introDestellos) introDestellos.classList.add("activo");
      sintetizadorSonidos.tocarFanfarria();

      await new Promise((res) => setTimeout(res, 850));
    }
  }

  if (introOverlay) {
    introOverlay.style.opacity = "0";
    setTimeout(() => {
      introOverlay.style.display = "none";
      introOverlay.setAttribute("aria-hidden", "true");
      if (pokeballLoader) pokeballLoader.classList.remove("abrir");
      if (introDestellos) introDestellos.classList.remove("activo");
    }, 500);
  }
};

// Conectar botones para reproducir la intro cuando el usuario lo desee
if (lentePokedex) {
  lentePokedex.addEventListener("click", reproducirIntroCinematica);
}

if (btnVerIntro) {
  btnVerIntro.addEventListener("click", reproducirIntroCinematica);
}

// ==========================================================================
// RENDERIZADO DE TARJETA HTML (crearTarjetaHTML)
// ==========================================================================
// Genera el código HTML para representar la tarjeta de un Pokémon
const crearTarjetaHTML = (pokemon) => {
  const tiposHTML = pokemon.tipos
    .map((tipo) => `<span class="tipo tipo--${tipo}">${tipo}</span>`)
    .join("");

  const favoritos = obtenerFavoritos();
  const esFav = favoritos.includes(pokemon.id);
  const tipoPrincipal = pokemon.tipos[0] || "normal";

  return `
    <article class="pokemon pokemon--tipo-${tipoPrincipal}">
      <!-- Botón de favorito con estrella persistente -->
      <button
        class="pokemon__btn-favorito ${esFav ? "activo" : ""}"
        data-id="${pokemon.id}"
        type="button"
        title="${esFav ? "Quitar de favoritos" : "Añadir a favoritos"}"
        aria-label="${esFav ? "Quitar de favoritos" : "Añadir a favoritos"}"
      >
        ${esFav ? "★" : "☆"}
      </button>

      <p class="pokemon__numero">N.º ${formatearId(pokemon.id)}</p>

      <!-- Plataforma del espécimen: empieza de espaldas (Requisito 4.4) -->
      <div class="pokemon__plataforma-imagen">
        <img
          class="pokemon__imagen"
          src="${pokemon.spriteBack}"
          data-back="${pokemon.spriteBack}"
          data-front="${pokemon.spriteFront}"
          alt="Imagen de ${pokemon.nombre}"
        >
      </div>

      <h2 class="pokemon__nombre">${pokemon.nombre}</h2>

      <div class="pokemon__datos">
        <p><strong>Altura</strong><br>${pokemon.altura} m</p>
        <p><strong>Peso</strong><br>${pokemon.peso} kg</p>
      </div>

      <div class="pokemon__tipos">
        ${tiposHTML}
      </div>

      <!-- Botón que activa la ventana modal (Requisito 4.6) -->
      <button class="pokemon__btn-detalles" data-id="${pokemon.id}" type="button">Ver detalles</button>
    </article>
  `;
};


// ==========================================================================
// INTERCAMBIO DE SPRITES EN HOVER (mouseenter / mouseleave)
// ==========================================================================
// Alterna el sprite entre la vista frontal y trasera al pasar el ratón
const activarHoverSprites = () => {
  const tarjetas = document.querySelectorAll(".pokemon");

  tarjetas.forEach((tarjeta) => {
    const img = tarjeta.querySelector(".pokemon__imagen");
    if (!img) return;

    tarjeta.addEventListener("mouseenter", () => {
      if (img.dataset.front) img.src = img.dataset.front;
    });

    tarjeta.addEventListener("mouseleave", () => {
      if (img.dataset.back) img.src = img.dataset.back;
    });
  });
};


// ==========================================================================
// FILTRADO Y BÚSQUEDA EN MEMORIA (filtrarPokemon)
// ==========================================================================
// Actualiza el contador visible de resultados
const actualizarContadorResultados = (total) => {
  if (contadorResultados) {
    contadorResultados.textContent = `${total} resultados`;
    contadorResultados.style.display = "block";
  }
};

// Filtra la lista de Pokémon en memoria según texto, tipo y favoritos
const filtrarPokemon = () => {
  const busqueda = inputBusqueda.value.trim().toLowerCase();
  const tipoSeleccionado = selectTipo.value;
  const favoritos = obtenerFavoritos();

  // Caso 1: Sin filtros aplicados -> Mostramos los 151 Pokémon directamente
  if (!busqueda && tipoSeleccionado === "todos" && !soloFavoritosActivo) {
    mensaje.className = "mensaje mensaje--exito";
    mensaje.textContent = "¡Pokédex lista! Puedes buscar por nombre, número o filtrar por tipo.";
    resultado.innerHTML = todosLosPokemon.map(crearTarjetaHTML).join("");
    activarHoverSprites();
    actualizarContadorResultados(todosLosPokemon.length);
    return;
  }

  // Caso 2: Filtrado combinado con .filter()
  const encontrados = todosLosPokemon.filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda);
    const coincideId = String(p.id) === busqueda || formatearId(p.id) === busqueda;
    const coincideTexto = !busqueda || coincideNombre || coincideId;
    const coincideTipo = tipoSeleccionado === "todos" || p.tipos.includes(tipoSeleccionado);
    const coincideFavorito = !soloFavoritosActivo || favoritos.includes(p.id);

    return coincideTexto && coincideTipo && coincideFavorito;
  });

  // Caso 3: Búsqueda sin resultados (Control de errores visual, Requisito 4.7)
  if (encontrados.length === 0) {
    mensaje.className = "mensaje mensaje--aviso";
    if (soloFavoritosActivo && favoritos.length === 0) {
      mensaje.textContent = "No tienes ningún Pokémon guardado en favoritos. ¡Pulsa la estrella (☆) en cualquier tarjeta para añadirlo!";
    } else {
      const detalleFav = soloFavoritosActivo ? " en tus favoritos" : "";
      const detalleTipo = tipoSeleccionado !== "todos" ? ` de tipo "${tipoSeleccionado}"` : "";
      const detalleTexto = busqueda ? ` con "${busqueda}"` : "";
      mensaje.textContent = `No se han encontrado Pokémon${detalleFav}${detalleTipo}${detalleTexto}.`;
    }
    resultado.innerHTML = "";
    actualizarContadorResultados(0);
    return;
  }

  // Caso 4: Hay coincidencias -> Renderizamos las tarjetas resultantes
  mensaje.className = "mensaje";
  mensaje.textContent = soloFavoritosActivo ? `Mostrando ${encontrados.length} Pokémon favorito(s)` : "";
  resultado.innerHTML = encontrados.map(crearTarjetaHTML).join("");
  activarHoverSprites();
  actualizarContadorResultados(encontrados.length);
};


// ==========================================================================
// ESCUCHADORES DE EVENTOS DE BÚSQUEDA Y VISTAS
// ==========================================================================
// 1. En tiempo real: mientras el usuario teclea en el <input>
inputBusqueda.addEventListener("input", filtrarPokemon);

// 2. Al cambiar la opción en el menú desplegable <select>
selectTipo.addEventListener("change", filtrarPokemon);

// 3. Al pulsar 'Enter' o hacer clic en el botón 'Buscar' del formulario
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault(); // Evita que la página se recargue
  filtrarPokemon();
});

// 4. Iniciar la carga de los 151 Pokémon al pulsar el botón principal
btnCargar.addEventListener("click", cargarPokemonsEnMemoria);

// 5. Alternancia de vista (Cuadrícula / Lista)
btnVistaCuadricula.addEventListener("click", () => {
  resultado.classList.remove("resultado--lista");
  btnVistaCuadricula.classList.add("activo");
  btnVistaLista.classList.remove("activo");
});

btnVistaLista.addEventListener("click", () => {
  resultado.classList.add("resultado--lista");
  btnVistaLista.classList.add("activo");
  btnVistaCuadricula.classList.remove("activo");
});

// 6. Botón de alternar filtro de favoritos
btnFiltroFavoritos.addEventListener("click", () => {
  soloFavoritosActivo = !soloFavoritosActivo;
  btnFiltroFavoritos.classList.toggle("activo", soloFavoritosActivo);
  filtrarPokemon();
});


// ==========================================================================
// CONSULTA DE UN POKÉMON INDIVIDUAL (obtenerPokemon)
// ==========================================================================
// Consulta /api/v2/pokemon/{id} y devuelve una instancia limpia de Pokemon
const obtenerPokemon = async (id) => {
  const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!respuesta.ok) {
    throw new Error(`Error en Pokémon #${id} (Código ${respuesta.status})`);
  }
  const datos = await respuesta.json();
  return new Pokemon(datos);
};


// ==========================================================================
// POKÉMON ALEATORIO FUERA DE LA COLECCIÓN INICIAL (152 - 1025)
// ==========================================================================
let ultimoIdAleatorioIntentado = null;

// Genera un número entero aleatorio entre 152 y 1025, ambos incluidos
const generarIdAleatorio = () => {
  return Math.floor(Math.random() * (1025 - 152 + 1)) + 152;
};

// Renderiza la tarjeta del Pokémon aleatorio sin añadirlo a los 151
const mostrarPokemonAleatorio = (pokemon) => {
  const tiposHTML = pokemon.tipos
    .map((tipo) => `<span class="tipo tipo--${tipo}">${tipo}</span>`)
    .join("");

  const tipoPrincipal = pokemon.tipos[0] || "normal";
  const urlImagen = pokemon.spriteFront || pokemon.spriteBack || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

  contenedorAleatorio.innerHTML = `
    <div class="aleatorio-tarjeta pokemon--tipo-${tipoPrincipal}">
      <div class="aleatorio-tarjeta__cabecera">
        <span class="aleatorio-tarjeta__badge">🎲 POKÉMON ALEATORIO (GEN 2 - 9)</span>
        <button id="btn-cerrar-aleatorio" class="aleatorio-tarjeta__btn-cerrar" type="button" aria-label="Cerrar">✕</button>
      </div>

      <div class="aleatorio-tarjeta__cuerpo">
        <div class="aleatorio-tarjeta__visual">
          <img 
            class="aleatorio-tarjeta__imagen" 
            src="${urlImagen}" 
            alt="Sprite de ${pokemon.nombre}">
        </div>

        <div class="aleatorio-tarjeta__datos">
          <p class="aleatorio-tarjeta__numero">N.º ${formatearId(pokemon.id)}</p>
          <h2 class="aleatorio-tarjeta__nombre">${pokemon.nombre}</h2>
          <div class="aleatorio-tarjeta__tipos">${tiposHTML}</div>
          <div class="aleatorio-tarjeta__medidas">
            <span><strong>Altura:</strong> ${pokemon.altura} m</span>
            <span><strong>Peso:</strong> ${pokemon.peso} kg</span>
          </div>
        </div>
      </div>

      <div class="aleatorio-tarjeta__acciones">
        <button id="btn-otro-aleatorio" class="btn-aleatorio-recargar" type="button">
          Otro Pokémon aleatorio
        </button>
      </div>
    </div>
  `;

  // Listener para cerrar la tarjeta
  const btnCerrar = contenedorAleatorio.querySelector("#btn-cerrar-aleatorio");
  if (btnCerrar) {
    btnCerrar.addEventListener("click", () => {
      contenedorAleatorio.style.display = "none";
      contenedorAleatorio.innerHTML = "";
    });
  }

  // Listener para obtener otro directamente desde la tarjeta
  const btnOtro = contenedorAleatorio.querySelector("#btn-otro-aleatorio");
  if (btnOtro) {
    btnOtro.addEventListener("click", () => consultarPokemonAleatorio());
  }
};

// Consulta /api/v2/pokemon/{id} con id aleatorio sin tocar el array de 151
const consultarPokemonAleatorio = async (idForzado = null) => {
  if (todosLosPokemon.length === 0) return;
  const id = idForzado || generarIdAleatorio();
  ultimoIdAleatorioIntentado = id;

  // Mensaje breve de carga
  contenedorAleatorio.style.display = "block";
  contenedorAleatorio.innerHTML = `
    <div class="aleatorio-tarjeta aleatorio-tarjeta--cargando">
      <p class="mensaje mensaje--cargando">Consultando Pokémon #${id} en PokéAPI...</p>
    </div>
  `;

  if (btnAleatorio) btnAleatorio.disabled = true;

  try {
    // Reutiliza la función que ya obtiene un Pokémon
    const pokemon = await obtenerPokemon(id);

    // Muestra el resultado (número, nombre, sprite y tipos)
    mostrarPokemonAleatorio(pokemon);
  } catch (error) {
    // Aviso y opción de reintentar si falla la petición
    contenedorAleatorio.innerHTML = `
      <div class="aleatorio-tarjeta aleatorio-tarjeta--error">
        <p class="mensaje mensaje--error">⚠️ Fallo de conexión al consultar el Pokémon #${id}.</p>
        <div class="aleatorio-tarjeta__acciones">
          <button id="btn-reintentar-aleatorio" class="btn-reintentar" type="button">
            🔄 Reintentar (#${id})
          </button>
          <button id="btn-probar-otro-aleatorio" class="btn-aleatorio-recargar" type="button">
            Probar otro
          </button>
        </div>
      </div>
    `;

    const btnReintentar = contenedorAleatorio.querySelector("#btn-reintentar-aleatorio");
    if (btnReintentar) {
      btnReintentar.addEventListener("click", () => consultarPokemonAleatorio(id));
    }

    const btnProbarOtro = contenedorAleatorio.querySelector("#btn-probar-otro-aleatorio");
    if (btnProbarOtro) {
      btnProbarOtro.addEventListener("click", () => consultarPokemonAleatorio());
    }
  } finally {
    if (btnAleatorio) btnAleatorio.disabled = false;
  }
};

// Botón para consultar Pokémon aleatorio
if (btnAleatorio) {
  btnAleatorio.addEventListener("click", () => consultarPokemonAleatorio());
}


// ==========================================================================
// VENTANA MODAL DE DETALLES (<dialog> & abrirDetalles)
// ==========================================================================
// Muestra la ventana modal nativa con información detallada del Pokémon
let idPokemonModalActual = null;
let modoShinyModal = false;
let vistaEspaldaModal = false;
let reproductorGritoActual = null;

// Determinar sprite a renderizar según el estado actual (frontal, espalda, normal, shiny)
const obtenerSpriteModal = (pokemon, esShiny, esEspalda) => {
  if (esShiny) {
    return esEspalda
      ? (pokemon.spriteShinyBack || pokemon.spriteShiny || pokemon.spriteBack || pokemon.spriteFront)
      : (pokemon.spriteShiny || pokemon.spriteFront);
  }
  return esEspalda
    ? (pokemon.spriteBack || pokemon.spriteFront)
    : pokemon.spriteFront;
};

// Reproducir el grito/rugido oficial de la especie desde PokéAPI Cries
const reproducirGritoPokemon = (id) => {
  sintetizadorSonidos.iniciar();
  try {
    if (reproductorGritoActual) {
      reproductorGritoActual.pause();
      reproductorGritoActual.currentTime = 0;
    }
    const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`);
    audio.volume = 0.5;
    reproductorGritoActual = audio;
    audio.play().catch(() => {
      // Fallback sónico en caso de falta de conexión
      sintetizadorSonidos.tocarClic();
    });
  } catch (_) {
    sintetizadorSonidos.tocarClic();
  }
};

// Clasificación de poder según el Base Stat Total (BST)
const obtenerRangoBST = (total) => {
  if (total >= 580) return "★ Legendario / Titán";
  if (total >= 500) return "▲ Nivel Muy Alto";
  if (total >= 420) return "◆ Avanzado";
  if (total >= 320) return "● Equilibrado";
  return "○ Inicial / Base";
};

// Muestra la ventana modal con la información ampliada y telemetría del Pokémon
const abrirDetalles = (id, conservarModos = false) => {
  const pokemon = todosLosPokemon.find((p) => p.id === Number(id));
  if (!pokemon) return;

  idPokemonModalActual = pokemon.id;
  if (!conservarModos) {
    modoShinyModal = false;
    vistaEspaldaModal = false;
  } else {
    vistaEspaldaModal = false;
  }

  sintetizadorSonidos.iniciar();
  sintetizadorSonidos.tocarAbrirModal();

  const tipoPrincipal = pokemon.tipos[0] || "normal";

  const tiposHTML = pokemon.tipos
    .map((tipo) => `<span class="tipo tipo--${tipo}">${tipo}</span>`)
    .join("");

  // Formatear habilidades como chips tecnológicos
  const habilidadesHTML = pokemon.habilidades
    .map((h) => `<span class="modal__habilidad-badge"><span class="modal__habilidad-dot"></span>${h.replace(/-/g, " ")}</span>`)
    .join("");

  // Cálculo del Total de Estadísticas Base (BST)
  const totalStats = 
    pokemon.stats.hp +
    pokemon.stats.attack +
    pokemon.stats.defense +
    pokemon.stats.specialAttack +
    pokemon.stats.specialDefense +
    pokemon.stats.speed;

  // Configuración de las barras visuales de estadísticas
  const statsConfig = [
    { sigla: "HP", nombre: "PS (Vida)", valor: pokemon.stats.hp, clase: "hp" },
    { sigla: "ATK", nombre: "Ataque", valor: pokemon.stats.attack, clase: "attack" },
    { sigla: "DEF", nombre: "Defensa", valor: pokemon.stats.defense, clase: "defense" },
    { sigla: "SPA", nombre: "Atq. Especial", valor: pokemon.stats.specialAttack, clase: "sp-attack" },
    { sigla: "SPD", nombre: "Def. Especial", valor: pokemon.stats.specialDefense, clase: "sp-defense" },
    { sigla: "SPE", nombre: "Velocidad", valor: pokemon.stats.speed, clase: "speed" },
  ];

  const statsHTML = statsConfig
    .map((s) => {
      const porcentaje = Math.min(100, Math.round((s.valor / 180) * 100));
      return `
        <div class="modal__stat-fila">
          <div class="modal__stat-info">
            <span class="modal__stat-nombre"><span class="modal__stat-sigla">${s.sigla}</span> ${s.nombre}</span>
            <span class="modal__stat-valor">${s.valor}</span>
          </div>
          <div class="modal__stat-barra-fondo">
            <div class="modal__stat-barra-relleno modal__stat-barra--${s.clase}" style="width: ${porcentaje}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");

  const urlSprite = obtenerSpriteModal(pokemon, modoShinyModal, vistaEspaldaModal);
  const tieneAnterior = pokemon.id > 1;
  const tieneSiguiente = pokemon.id < 151;

  modalCuerpo.innerHTML = `
    <!-- Barra superior de telemetría HUD -->
    <div class="modal__telemetria-barra">
      <div class="modal__telemetria-indicador">
        <span class="modal__led-estado"></span>
        <span class="modal__telemetria-texto">ESCANEO BIOMÉTRICO KANTO</span>
      </div>
      <span class="modal__chip-gen">GEN-1 • KANTO</span>
    </div>

    <!-- Navegación entre Pokémon (◀ Anterior / Especie / Siguiente ▶) -->
    <div class="modal__nav-cabecera">
      <button 
        type="button" 
        class="modal__btn-nav modal__btn-nav--anterior" 
        data-nav-id="${pokemon.id - 1}" 
        ${!tieneAnterior ? "disabled" : ""}
        title="${tieneAnterior ? `Ir a #${formatearId(pokemon.id - 1)} (Flecha Izquierda)` : 'Primer espécimen'}"
        aria-label="Pokémon anterior">
        ◀ #${formatearId(Math.max(1, pokemon.id - 1))}
      </button>

      <div class="modal__nav-identidad">
        <span class="modal__numero-dex">N.º ${formatearId(pokemon.id)}</span>
        <h2 class="modal__nombre">${pokemon.nombre}</h2>
        <div class="modal__tipos">${tiposHTML}</div>
      </div>

      <button 
        type="button" 
        class="modal__btn-nav modal__btn-nav--siguiente" 
        data-nav-id="${pokemon.id + 1}" 
        ${!tieneSiguiente ? "disabled" : ""}
        title="${tieneSiguiente ? `Ir a #${formatearId(pokemon.id + 1)} (Flecha Derecha)` : 'Último espécimen'}"
        aria-label="Pokémon siguiente">
        #${formatearId(Math.min(151, pokemon.id + 1))} ▶
      </button>
    </div>

    <!-- Visor holográfico reactivo al tipo del Pokémon -->
    <div class="modal__visor modal__visor--${tipoPrincipal}">
      <div class="modal__visor-marco">
        <div class="modal__visor-luz modal__visor-luz--tl"></div>
        <div class="modal__visor-luz modal__visor-luz--tr"></div>
        <div class="modal__visor-luz modal__visor-luz--bl"></div>
        <div class="modal__visor-luz modal__visor-luz--br"></div>
        
        <div class="modal__visor-escenario">
          <div class="modal__visor-grid"></div>
          <img 
            id="modal-sprite-img" 
            class="modal__imagen ${modoShinyModal ? 'modal__imagen--shiny' : ''}" 
            src="${urlSprite}" 
            alt="Espécimen ${pokemon.nombre}">
          <div class="modal__visor-sombra"></div>
        </div>
      </div>

      <!-- Barra de herramientas del visor (Shiny, Audio, Girar) -->
      <div class="modal__herramientas">
        <button 
          id="modal-btn-shiny" 
          type="button" 
          class="modal__herramienta-btn ${modoShinyModal ? 'activo' : ''}" 
          title="Alternar apariencia Variocolor (Shiny) [Tecla S]">
          <span class="modal__herramienta-icono">✨</span>
          <span class="modal__herramienta-texto">${modoShinyModal ? 'Variocolor' : 'Normal'}</span>
        </button>

        <button 
          id="modal-btn-audio" 
          type="button" 
          class="modal__herramienta-btn" 
          title="Reproducir rugido oficial del espécimen [Tecla C]">
          <span class="modal__herramienta-icono">🔊</span>
          <span class="modal__herramienta-texto">Rugido</span>
        </button>

        <button 
          id="modal-btn-rotar" 
          type="button" 
          class="modal__herramienta-btn ${vistaEspaldaModal ? 'activo' : ''}" 
          title="Girar perspectiva (Frente / Espalda)">
          <span class="modal__herramienta-icono">🔄</span>
          <span class="modal__herramienta-texto">${vistaEspaldaModal ? 'Espalda' : 'Frente'}</span>
        </button>
      </div>
    </div>

    <!-- Matriz de telemetría física y combate (4 métricas) -->
    <div class="modal__datos">
      <div class="modal__dato-caja">
        <span class="modal__dato-titulo">Altura</span>
        <span class="modal__dato-valor">${pokemon.altura} m</span>
      </div>
      <div class="modal__dato-caja">
        <span class="modal__dato-titulo">Peso</span>
        <span class="modal__dato-valor">${pokemon.peso} kg</span>
      </div>
      <div class="modal__dato-caja">
        <span class="modal__dato-titulo">Exp. Base</span>
        <span class="modal__dato-valor">${pokemon.experiencia || '—'} EXP</span>
      </div>
      <div class="modal__dato-caja modal__dato-caja--destacada">
        <span class="modal__dato-titulo">Total BST</span>
        <span class="modal__dato-valor">${totalStats} PTS</span>
      </div>
    </div>

    <!-- Habilidades pasivas / activas -->
    <div class="modal__habilidades-bloque">
      <span class="modal__habilidades-titulo">Habilidades Registradas</span>
      <div class="modal__habilidades-lista">
        ${habilidadesHTML}
      </div>
    </div>

    <!-- Panel de estadísticas base con BST y clasificación -->
    <div class="modal__stats">
      <div class="modal__stats-cabecera">
        <h3 class="modal__stats-titulo">Estadísticas Base</h3>
        <span class="modal__stats-badge-rango">${obtenerRangoBST(totalStats)}</span>
      </div>
      ${statsHTML}
    </div>

    <!-- Guía rápida de atajos de teclado -->
    <div class="modal__teclado-guia">
      <span class="modal__teclado-item"><kbd>◀</kbd> <kbd>▶</kbd> Navegar</span>
      <span class="modal__teclado-item"><kbd>S</kbd> Variocolor</span>
      <span class="modal__teclado-item"><kbd>C</kbd> Rugido</span>
      <span class="modal__teclado-item"><kbd>Esc</kbd> Cerrar</span>
    </div>
  `;

  if (!modal.open) {
    modal.showModal();
  }
};

// ==========================================================================
// DELEGACIÓN DE EVENTOS (modalCuerpo & resultado)
// ==========================================================================
// 1. Delegación de eventos dentro del modal (Navegación, Shiny, Audio y Rotación)
modalCuerpo.addEventListener("click", (e) => {
  if (!idPokemonModalActual) return;
  const pokemonActual = todosLosPokemon.find((p) => p.id === idPokemonModalActual);
  if (!pokemonActual) return;

  // A. Clic en botón de navegación anterior / siguiente
  const btnNav = e.target.closest(".modal__btn-nav");
  if (btnNav && !btnNav.disabled) {
    const navId = Number(btnNav.dataset.navId);
    if (navId >= 1 && navId <= 151) {
      abrirDetalles(navId, true); // Conserva el modo shiny si estaba activo
    }
    return;
  }

  // B. Clic en botón de Shiny (Variocolor)
  const btnShiny = e.target.closest("#modal-btn-shiny");
  if (btnShiny) {
    modoShinyModal = !modoShinyModal;
    const img = document.querySelector("#modal-sprite-img");
    if (img) {
      img.src = obtenerSpriteModal(pokemonActual, modoShinyModal, vistaEspaldaModal);
      img.classList.toggle("modal__imagen--shiny", modoShinyModal);
      img.classList.remove("modal__imagen--destello");
      void img.offsetWidth; // Forzar reflujo para reiniciar animación de destello
      img.classList.add("modal__imagen--destello");
    }
    btnShiny.classList.toggle("activo", modoShinyModal);
    const txt = btnShiny.querySelector(".modal__herramienta-texto");
    if (txt) txt.textContent = modoShinyModal ? "Variocolor" : "Normal";
    sintetizadorSonidos.tocarShiny();
    return;
  }

  // C. Clic en botón de Audio (Rugido oficial de PokéAPI)
  const btnAudio = e.target.closest("#modal-btn-audio");
  if (btnAudio) {
    reproducirGritoPokemon(pokemonActual.id);
    btnAudio.classList.add("activo");
    setTimeout(() => btnAudio.classList.remove("activo"), 900);
    return;
  }

  // D. Clic en botón de Rotar (Frente / Espalda)
  const btnRotar = e.target.closest("#modal-btn-rotar");
  if (btnRotar) {
    vistaEspaldaModal = !vistaEspaldaModal;
    const img = document.querySelector("#modal-sprite-img");
    if (img) {
      img.src = obtenerSpriteModal(pokemonActual, modoShinyModal, vistaEspaldaModal);
    }
    btnRotar.classList.toggle("activo", vistaEspaldaModal);
    const txt = btnRotar.querySelector(".modal__herramienta-texto");
    if (txt) txt.textContent = vistaEspaldaModal ? "Espalda" : "Frente";
    sintetizadorSonidos.tocarClic();
    return;
  }
});

// Soporte para atajos de teclado mientras el modal está abierto
window.addEventListener("keydown", (e) => {
  if (!modal.open || !idPokemonModalActual) return;

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (idPokemonModalActual > 1) {
      abrirDetalles(idPokemonModalActual - 1, true);
    }
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (idPokemonModalActual < 151) {
      abrirDetalles(idPokemonModalActual + 1, true);
    }
  } else if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    const btnShiny = document.querySelector("#modal-btn-shiny");
    if (btnShiny) btnShiny.click();
  } else if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    const btnAudio = document.querySelector("#modal-btn-audio");
    if (btnAudio) btnAudio.click();
  }
});

// Detener audio al cerrar el modal
modal.addEventListener("close", () => {
  if (reproductorGritoActual) {
    reproductorGritoActual.pause();
    reproductorGritoActual = null;
  }
  idPokemonModalActual = null;
});

// Cerrar el modal al pulsar la 'X' o al hacer clic fuera del cuadro
btnCerrarModal.addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});

// 2. Delegación de eventos en las tarjetas de la cuadrícula de resultados
resultado.addEventListener("click", (evento) => {
  // A. Clic en botón de favorito (Estrella)
  const btnFav = evento.target.closest(".pokemon__btn-favorito");
  if (btnFav) {
    const id = btnFav.dataset.id;
    const esFav = alternarFavorito(id);

    btnFav.classList.toggle("activo", esFav);
    btnFav.textContent = esFav ? "★" : "☆";
    btnFav.title = esFav ? "Quitar de favoritos" : "Añadir a favoritos";
    btnFav.setAttribute("aria-label", btnFav.title);

    // Si estamos en la vista de solo favoritos y se desmarca, se actualiza la lista en pantalla
    if (soloFavoritosActivo) {
      filtrarPokemon();
    }
    return;
  }

  // B. Clic en botón de detalles (Abre el modal)
  const boton = evento.target.closest(".pokemon__btn-detalles");
  if (boton) {
    const id = boton.dataset.id;
    abrirDetalles(id);
  }
});

