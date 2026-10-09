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
const contenedorVistas = document.querySelector("#vista-controles");
const btnVistaCuadricula = document.querySelector("#btn-vista-cuadricula");
const btnVistaLista = document.querySelector("#btn-vista-lista");
const btnFiltroFavoritos = document.querySelector("#btn-filtro-favoritos");
const contadorFavoritos = document.querySelector("#contador-favoritos");

// Estado para filtrar solo favoritos
let soloFavoritosActivo = false;

// Gestión de favoritos con localStorage (Ampliación Voluntaria 10)
const CLAVE_FAVORITOS = "pokedex_favoritos";

const obtenerFavoritos = () => {
  try {
    const datos = localStorage.getItem(CLAVE_FAVORITOS);
    return datos ? JSON.parse(datos) : [];
  } catch (error) {
    console.error("Error al leer favoritos de localStorage:", error);
    return [];
  }
};

const guardarFavoritos = (favoritos) => {
  try {
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (error) {
    console.error("Error al guardar favoritos en localStorage:", error);
  }
};

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

const actualizarContadorFavoritos = () => {
  if (contadorFavoritos) {
    const total = obtenerFavoritos().length;
    contadorFavoritos.textContent = total;
  }
};


// Guardaremos los 151 Pokémon aquí para filtrarlos en memoria rápidamente
let todosLosPokemon = [];

const formatearId = (id) => {
  return String(id).padStart(3, "0");
};

// Obtiene todos los tipos distintos de los 151 Pokémon y rellena el <select>
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
// EFECTOS DE SONIDO RETRO POKÉMON (WEB AUDIO API NATIVA - SIN LIBRERÍAS)
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
      // Arpegio retro: C5, E5, G5, C6
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
}

const sintetizadorSonidos = new SonidosPokemon();

// Elementos de la animación cinemática estilo Evento Pokémon
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

// Función para descargar los 151 Pokémon en segundo plano con animación cinemática
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

    const datosCrudos = await Promise.all(promesas);
    todosLosPokemon = datosCrudos.map((dato) => new Pokemon(dato));
    poblarSelectorTipos();

    // Habilitamos controles para el usuario
    btnCargar.style.display = "none";
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

// Genera el HTML de una tarjeta con sprite trasero inicial y botón de detalles
const crearTarjetaHTML = (pokemon) => {
  const tiposHTML = pokemon.tipos
    .map((tipo) => `<span class="tipo tipo--${tipo}">${tipo}</span>`)
    .join("");

  const favoritos = obtenerFavoritos();
  const esFav = favoritos.includes(pokemon.id);
  const tipoPrincipal = pokemon.tipos[0] || "normal";

  return `
    <article class="pokemon pokemon--tipo-${tipoPrincipal}">
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

      <button class="pokemon__btn-detalles" data-id="${pokemon.id}" type="button">Ver detalles</button>
    </article>
  `;
};

// Alterna entre espalda y frente al pasar el ratón
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

// Función principal de búsqueda en memoria con control de estados y favoritos
const filtrarPokemon = () => {
  const busqueda = inputBusqueda.value.trim().toLowerCase();
  const tipoSeleccionado = selectTipo.value;
  const favoritos = obtenerFavoritos();

  // Si no hay búsqueda, tipo es todos y no está activo soloFavoritos
  if (!busqueda && tipoSeleccionado === "todos" && !soloFavoritosActivo) {
    mensaje.className = "mensaje mensaje--exito";
    mensaje.textContent = "¡Pokédex lista! Puedes buscar por nombre, número o filtrar por tipo.";
    resultado.innerHTML = todosLosPokemon.map(crearTarjetaHTML).join("");
    activarHoverSprites();
    return;
  }

  // Filtramos comprobando todas las condiciones combinadas
  const encontrados = todosLosPokemon.filter((p) => {
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda);
    const coincideId = String(p.id) === busqueda || formatearId(p.id) === busqueda;
    const coincideTexto = !busqueda || coincideNombre || coincideId;
    const coincideTipo = tipoSeleccionado === "todos" || p.tipos.includes(tipoSeleccionado);
    const coincideFavorito = !soloFavoritosActivo || favoritos.includes(p.id);

    return coincideTexto && coincideTipo && coincideFavorito;
  });

  // Estado: Búsqueda sin resultados
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
    return;
  }

  // Hay resultados: actualizamos el mensaje y pintamos tarjetas
  mensaje.className = "mensaje";
  mensaje.textContent = soloFavoritosActivo ? `Mostrando ${encontrados.length} Pokémon favorito(s)` : "";
  resultado.innerHTML = encontrados.map(crearTarjetaHTML).join("");
  activarHoverSprites();
};


// Eventos de búsqueda y filtrado:
// 1. En tiempo real mientras el usuario escribe
inputBusqueda.addEventListener("input", filtrarPokemon);

// 2. Al cambiar el tipo en el selector
selectTipo.addEventListener("change", filtrarPokemon);

// 3. Al enviar el formulario (pulsar Enter o el botón Buscar)
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  filtrarPokemon();
});

// Iniciar la carga de los 151 Pokémon al pulsar el botón (Requisito 4.1)
btnCargar.addEventListener("click", cargarPokemonsEnMemoria);

// Alternar entre vista Cuadrícula y Lista (Ampliación Voluntaria 10)
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

// Alternar filtro de favoritos
btnFiltroFavoritos.addEventListener("click", () => {
  soloFavoritosActivo = !soloFavoritosActivo;
  btnFiltroFavoritos.classList.toggle("activo", soloFavoritosActivo);
  filtrarPokemon();
});


// Muestra la ventana modal con la información ampliada del Pokémon seleccionado
const abrirDetalles = (id) => {
  const pokemon = todosLosPokemon.find((p) => p.id === Number(id));
  if (!pokemon) return;

  const tiposHTML = pokemon.tipos
    .map((tipo) => `<span class="tipo tipo--${tipo}">${tipo}</span>`)
    .join("");

  // Formatear habilidades como badges estilizados
  const habilidadesHTML = pokemon.habilidades
    .map((h) => `<span class="modal__habilidad-badge">${h.replace(/-/g, " ")}</span>`)
    .join("");

  // Configuración de las barras visuales de estadísticas (Ampliación Voluntaria 10)
  const statsConfig = [
    { nombre: "PS (HP)", valor: pokemon.stats.hp, clase: "hp" },
    { nombre: "Ataque", valor: pokemon.stats.attack, clase: "attack" },
    { nombre: "Defensa", valor: pokemon.stats.defense, clase: "defense" },
    { nombre: "Atq. Especial", valor: pokemon.stats.specialAttack, clase: "sp-attack" },
    { nombre: "Def. Especial", valor: pokemon.stats.specialDefense, clase: "sp-defense" },
    { nombre: "Velocidad", valor: pokemon.stats.speed, clase: "speed" },
  ];

  const statsHTML = statsConfig
    .map((s) => {
      // Calculamos el porcentaje sobre 180 (un máximo representativo de la 1ª generación)
      const porcentaje = Math.min(100, Math.round((s.valor / 180) * 100));
      return `
        <div class="modal__stat-fila">
          <div class="modal__stat-info">
            <span class="modal__stat-nombre">${s.nombre}</span>
            <span class="modal__stat-valor">${s.valor}</span>
          </div>
          <div class="modal__stat-barra-fondo">
            <div class="modal__stat-barra-relleno modal__stat-barra--${s.clase}" style="width: ${porcentaje}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");

  modalCuerpo.innerHTML = `
    <p class="pokemon__numero">N.º ${formatearId(pokemon.id)}</p>
    <div class="modal__plataforma-imagen">
      <img class="modal__imagen" src="${pokemon.spriteFront}" alt="Imagen de ${pokemon.nombre}">
    </div>
    <h2 class="pokemon__nombre">${pokemon.nombre}</h2>
    
    <div class="pokemon__tipos">${tiposHTML}</div>

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
        <span class="modal__dato-valor">${pokemon.experiencia} exp</span>
      </div>
    </div>

    <div class="modal__habilidades-bloque">
      <span class="modal__habilidades-titulo">Habilidades</span>
      <div class="modal__habilidades-lista">
        ${habilidadesHTML}
      </div>
    </div>

    <div class="modal__stats">
      <h3 class="modal__stats-titulo">Estadísticas base</h3>
      ${statsHTML}
    </div>
  `;

  modal.showModal();
};

// Cerrar el modal al pulsar la 'X' o al hacer clic fuera del cuadro
btnCerrarModal.addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.close();
});

// Escuchar clics en botones de tarjetas mediante delegación de eventos
resultado.addEventListener("click", (evento) => {
  // Manejo de clic en botón de favoritos
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

  // Manejo de clic en botón de detalles
  const boton = evento.target.closest(".pokemon__btn-detalles");
  if (boton) {
    const id = boton.dataset.id;
    abrirDetalles(id);
  }
});

