class Pokemon {
  constructor(datos) {
    this.id = datos.id;
    this.nombre = datos.name;
    this.spriteBack = datos.sprites.back_default;
    this.spriteFront = datos.sprites.front_default;
    this.spriteShiny = datos.sprites.front_shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${datos.id}.png`;
    this.spriteShinyBack = datos.sprites.back_shiny || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${datos.id}.png`;
    this.tipos = datos.types.map((t) => t.type.name);
    this.altura = datos.height / 10; // De decímetros a metros
    this.peso = datos.weight / 10;   // De hectogramos a kilos
    this.experiencia = datos.base_experience;
    this.habilidades = datos.abilities.map((a) => a.ability.name);
    this.stats = {
      hp: datos.stats.find((s) => s.stat.name === "hp")?.base_stat || 0,
      attack: datos.stats.find((s) => s.stat.name === "attack")?.base_stat || 0,
      defense: datos.stats.find((s) => s.stat.name === "defense")?.base_stat || 0,
      specialAttack: datos.stats.find((s) => s.stat.name === "special-attack")?.base_stat || 0,
      specialDefense: datos.stats.find((s) => s.stat.name === "special-defense")?.base_stat || 0,
      speed: datos.stats.find((s) => s.stat.name === "speed")?.base_stat || 0,
    };
  }
}
