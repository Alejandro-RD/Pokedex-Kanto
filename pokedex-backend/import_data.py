import json
from unicodedata import name
from app import app, db, Pokemon # Importa las clases necesarias desde app.py

# =======================================================================
# 1. DATOS ORIGINALES (Copiados de tu pokedex.js)
# NOTA: Se usa 'type' como lista, que el modelo de SQLAlchemy convertirá
# a texto separado por comas (ListToString).
# =======================================================================

POKEMON_DATA = [
    {"id": 1, "name": "Bulbasaur", "type": ["Planta", "Veneno"], "exclusivo": "Ambos"},
    {"id": 2, "name": "Ivysaur", "type": ["Planta", "Veneno"], "exclusivo": "Ambos"},
    {"id": 3, "name": "Venusaur", "type": ["Planta", "Veneno"], "exclusivo": "Ambos"},
    {"id": 4, "name": "Charmander", "type": ["Fuego"], "exclusivo": "Ambos"},
    {"id": 5, "name": "Charmeleon", "type": ["Fuego"], "exclusivo": "Ambos"},
    {"id": 6, "name": "Charizard", "type": ["Fuego", "Volador"], "exclusivo": "Ambos"},
    {"id": 7, "name": "Squirtle", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 8, "name": "Wartortle", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 9, "name": "Blastoise", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 10, "name": "Caterpie", "type": ["Bicho"], "exclusivo": "Ambos"},
    {"id": 11, "name": "Metapod", "type": ["Bicho"], "exclusivo": "Ambos"},
    {"id": 12, "name": "Butterfree", "type": ["Bicho", "Volador"], "exclusivo": "Ambos"},
    {"id": 13, "name": "Weedle", "type": ["Bicho", "Veneno"], "exclusivo": "Ambos"},
    {"id": 14, "name": "Kakuna", "type": ["Bicho", "Veneno"], "exclusivo": "Ambos"},
    {"id": 15, "name": "Beedrill", "type": ["Bicho", "Veneno"], "exclusivo": "Ambos"},
    {"id": 16, "name": "Pidgey", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},
    {"id": 17, "name": "Pidgeotto", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},
    {"id": 18, "name": "Pidgeot", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},
    {"id": 19, "name": "Rattata", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 20, "name": "Raticate", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 21, "name": "Spearow", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},
    {"id": 22, "name": "Fearow", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},

    {"id": 23, "name": "Ekans", "type": ["Veneno"], "exclusivo": "RF"},
    {"id": 24, "name": "Arbok", "type": ["Veneno"], "exclusivo": "RF"},

    {"id": 25, "name": "Pikachu", "type": ["Eléctrico"], "exclusivo": "Ambos"},
    {"id": 26, "name": "Raichu", "type": ["Eléctrico"], "exclusivo": "Ambos"},

    {"id": 27, "name": "Sandshrew", "type": ["Tierra"], "exclusivo": "VH"},
    {"id": 28, "name": "Sandslash", "type": ["Tierra"], "exclusivo": "VH"},

    {"id": 29, "name": "Nidoran♀", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 30, "name": "Nidorina", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 31, "name": "Nidoqueen", "type": ["Veneno", "Tierra"], "exclusivo": "Ambos"},
    {"id": 32, "name": "Nidoran♂", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 33, "name": "Nidorino", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 34, "name": "Nidoking", "type": ["Veneno", "Tierra"], "exclusivo": "Ambos"},
    {"id": 35, "name": "Clefairy", "type": ["Hada"], "exclusivo": "Ambos"},
    {"id": 36, "name": "Clefable", "type": ["Hada"], "exclusivo": "Ambos"},

    {"id": 37, "name": "Vulpix", "type": ["Fuego"], "exclusivo": "VH"},
    {"id": 38, "name": "Ninetales", "type": ["Fuego"], "exclusivo": "VH"},

    {"id": 39, "name": "Jigglypuff", "type": ["Normal", "Hada"], "exclusivo": "Ambos"},
    {"id": 40, "name": "Wigglytuff", "type": ["Normal", "Hada"], "exclusivo": "Ambos"},
    {"id": 41, "name": "Zubat", "type": ["Veneno", "Volador"], "exclusivo": "Ambos"},
    {"id": 42, "name": "Golbat", "type": ["Veneno", "Volador"], "exclusivo": "Ambos"},

    {"id": 43, "name": "Oddish", "type": ["Planta", "Veneno"], "exclusivo": "VH"},
    {"id": 44, "name": "Gloom", "type": ["Planta", "Veneno"], "exclusivo": "VH"},
    {"id": 45, "name": "Vileplume", "type": ["Planta", "Veneno"], "exclusivo": "VH"},

    {"id": 46, "name": "Paras", "type": ["Bicho", "Planta"], "exclusivo": "Ambos"},
    {"id": 47, "name": "Parasect", "type": ["Bicho", "Planta"], "exclusivo": "Ambos"},
    {"id": 48, "name": "Venonat", "type": ["Bicho", "Veneno"], "exclusivo": "Ambos"},
    {"id": 49, "name": "Venomoth", "type": ["Bicho", "Veneno"], "exclusivo": "Ambos"},
    {"id": 50, "name": "Diglett", "type": ["Tierra"], "exclusivo": "Ambos"},
    {"id": 51, "name": "Dugtrio", "type": ["Tierra"], "exclusivo": "Ambos"},

    {"id": 52, "name": "Meowth", "type": ["Normal"], "exclusivo": "VH"},
    {"id": 53, "name": "Persian", "type": ["Normal"], "exclusivo": "VH"},

    {"id": 54, "name": "Psyduck", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 55, "name": "Golduck", "type": ["Agua"], "exclusivo": "Ambos"},

    {"id": 56, "name": "Mankey", "type": ["Lucha"], "exclusivo": "RF"},
    {"id": 57, "name": "Primeape", "type": ["Lucha"], "exclusivo": "RF"},

    {"id": 58, "name": "Growlithe", "type": ["Fuego"], "exclusivo": "RF"},
    {"id": 59, "name": "Arcanine", "type": ["Fuego"], "exclusivo": "RF"},

    {"id": 60, "name": "Poliwag", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 61, "name": "Poliwhirl", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 62, "name": "Poliwrath", "type": ["Agua", "Lucha"], "exclusivo": "Ambos"},
    {"id": 63, "name": "Abra", "type": ["Psíquico"], "exclusivo": "Ambos"},
    {"id": 64, "name": "Kadabra", "type": ["Psíquico"], "exclusivo": "Ambos"},
    {"id": 65, "name": "Alakazam", "type": ["Psíquico"], "exclusivo": "Ambos"},
    {"id": 66, "name": "Machop", "type": ["Lucha"], "exclusivo": "Ambos"},
    {"id": 67, "name": "Machoke", "type": ["Lucha"], "exclusivo": "Ambos"},
    {"id": 68, "name": "Machamp", "type": ["Lucha"], "exclusivo": "Ambos"},

    {"id": 69, "name": "Bellsprout", "type": ["Planta", "Veneno"], "exclusivo": "RF"},
    {"id": 70, "name": "Weepinbell", "type": ["Planta", "Veneno"], "exclusivo": "RF"},
    {"id": 71, "name": "Victreebel", "type": ["Planta", "Veneno"], "exclusivo": "RF"},

    {"id": 72, "name": "Tentacool", "type": ["Agua", "Veneno"], "exclusivo": "Ambos"},
    {"id": 73, "name": "Tentacruel", "type": ["Agua", "Veneno"], "exclusivo": "Ambos"},
    {"id": 74, "name": "Geodude", "type": ["Roca", "Tierra"], "exclusivo": "Ambos"},
    {"id": 75, "name": "Graveler", "type": ["Roca", "Tierra"], "exclusivo": "Ambos"},
    {"id": 76, "name": "Golem", "type": ["Roca", "Tierra"], "exclusivo": "Ambos"},
    {"id": 77, "name": "Ponyta", "type": ["Fuego"], "exclusivo": "Ambos"},
    {"id": 78, "name": "Rapidash", "type": ["Fuego"], "exclusivo": "Ambos"},
    {"id": 79, "name": "Slowpoke", "type": ["Agua", "Psíquico"], "exclusivo": "Ambos"},
    {"id": 80, "name": "Slowbro", "type": ["Agua", "Psíquico"], "exclusivo": "Ambos"},
    {"id": 81, "name": "Magnemite", "type": ["Eléctrico", "Acero"], "exclusivo": "Ambos"},
    {"id": 82, "name": "Magneton", "type": ["Eléctrico", "Acero"], "exclusivo": "Ambos"},
    {"id": 83, "name": "Farfetch'd", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},
    {"id": 84, "name": "Doduo", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},
    {"id": 85, "name": "Dodrio", "type": ["Normal", "Volador"], "exclusivo": "Ambos"},

    {"id": 86, "name": "Seel", "type": ["Agua"], "exclusivo": "RF"},
    {"id": 87, "name": "Dewgong", "type": ["Agua", "Hielo"], "exclusivo": "RF"},

    {"id": 88, "name": "Grimer", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 89, "name": "Muk", "type": ["Veneno"], "exclusivo": "Ambos"},

    {"id": 90, "name": "Shellder", "type": ["Agua"], "exclusivo": "VH"},
    {"id": 91, "name": "Cloyster", "type": ["Agua", "Hielo"], "exclusivo": "VH"},

    {"id": 92, "name": "Gastly", "type": ["Fantasma", "Veneno"], "exclusivo": "Ambos"},
    {"id": 93, "name": "Haunter", "type": ["Fantasma", "Veneno"], "exclusivo": "Ambos"},
    {"id": 94, "name": "Gengar", "type": ["Fantasma", "Veneno"], "exclusivo": "Ambos"},
    {"id": 95, "name": "Onix", "type": ["Roca", "Tierra"], "exclusivo": "Ambos"},
    {"id": 96, "name": "Drowzee", "type": ["Psíquico"], "exclusivo": "Ambos"},
    {"id": 97, "name": "Hypno", "type": ["Psíquico"], "exclusivo": "Ambos"},
    {"id": 98, "name": "Krabby", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 99, "name": "Kingler", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 100, "name": "Voltorb", "type": ["Eléctrico"], "exclusivo": "Ambos"},
    {"id": 101, "name": "Electrode", "type": ["Eléctrico"], "exclusivo": "Ambos"},
    {"id": 102, "name": "Exeggcute", "type": ["Planta", "Psíquico"], "exclusivo": "Ambos"},
    {"id": 103, "name": "Exeggutor", "type": ["Planta", "Psíquico"], "exclusivo": "Ambos"},
    {"id": 104, "name": "Cubone", "type": ["Tierra"], "exclusivo": "Ambos"},
    {"id": 105, "name": "Marowak", "type": ["Tierra"], "exclusivo": "Ambos"},
    {"id": 106, "name": "Hitmonlee", "type": ["Lucha"], "exclusivo": "Ambos"},
    {"id": 107, "name": "Hitmonchan", "type": ["Lucha"], "exclusivo": "Ambos"},
    {"id": 108, "name": "Lickitung", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 109, "name": "Koffing", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 110, "name": "Weezing", "type": ["Veneno"], "exclusivo": "Ambos"},
    {"id": 111, "name": "Rhyhorn", "type": ["Tierra", "Roca"], "exclusivo": "Ambos"},
    {"id": 112, "name": "Rhydon", "type": ["Tierra", "Roca"], "exclusivo": "Ambos"},
    {"id": 113, "name": "Chansey", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 114, "name": "Tangela", "type": ["Planta"], "exclusivo": "Ambos"},
    {"id": 115, "name": "Kangaskhan", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 116, "name": "Horsea", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 117, "name": "Seadra", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 118, "name": "Goldeen", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 119, "name": "Seaking", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 120, "name": "Staryu", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 121, "name": "Starmie", "type": ["Agua", "Psíquico"], "exclusivo": "Ambos"},
    {"id": 122, "name": "Mr. Mime", "type": ["Psíquico", "Hada"], "exclusivo": "Ambos"},

    {"id": 123, "name": "Scyther", "type": ["Bicho", "Volador"], "exclusivo": "RF"},

    {"id": 124, "name": "Jynx", "type": ["Hielo", "Psíquico"], "exclusivo": "Ambos"},

    {"id": 125, "name": "Electabuzz", "type": ["Eléctrico"], "exclusivo": "VH"},
    {"id": 126, "name": "Magmar", "type": ["Fuego"], "exclusivo": "RF"},

    {"id": 127, "name": "Pinsir", "type": ["Bicho"], "exclusivo": "VH"},

    {"id": 128, "name": "Tauros", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 129, "name": "Magikarp", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 130, "name": "Gyarados", "type": ["Agua", "Volador"], "exclusivo": "Ambos"},
    {"id": 131, "name": "Lapras", "type": ["Agua", "Hielo"], "exclusivo": "Ambos"},
    {"id": 132, "name": "Ditto", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 133, "name": "Eevee", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 134, "name": "Vaporeon", "type": ["Agua"], "exclusivo": "Ambos"},
    {"id": 135, "name": "Jolteon", "type": ["Eléctrico"], "exclusivo": "Ambos"},
    {"id": 136, "name": "Flareon", "type": ["Fuego"], "exclusivo": "Ambos"},
    {"id": 137, "name": "Porygon", "type": ["Normal"], "exclusivo": "Ambos"},
    {"id": 138, "name": "Omanyte", "type": ["Roca", "Agua"], "exclusivo": "Ambos"},
    {"id": 139, "name": "Omastar", "type": ["Roca", "Agua"], "exclusivo": "Ambos"},
    {"id": 140, "name": "Kabuto", "type": ["Roca", "Agua"], "exclusivo": "Ambos"},
    {"id": 141, "name": "Kabutops", "type": ["Roca", "Agua"], "exclusivo": "Ambos"},
    {"id": 142, "name": "Aerodactyl", "type": ["Roca", "Volador"], "exclusivo": "Ambos"},
    {"id": 143, "name": "Snorlax", "type": ["Normal"], "exclusivo": "Ambos"},

    {"id": 144, "name": "Articuno", "type": ["Hielo", "Volador"], "exclusivo": "Ambos"},
    {"id": 145, "name": "Zapdos", "type": ["Eléctrico", "Volador"], "exclusivo": "Ambos"},
    {"id": 146, "name": "Moltres", "type": ["Fuego", "Volador"], "exclusivo": "Ambos"},
    {"id": 147, "name": "Dratini", "type": ["Dragón"], "exclusivo": "Ambos"},
    {"id": 148, "name": "Dragonair", "type": ["Dragón"], "exclusivo": "Ambos"},
    {"id": 149, "name": "Dragonite", "type": ["Dragón", "Volador"], "exclusivo": "Ambos"},
    {"id": 150, "name": "Mewtwo", "type": ["Psíquico"], "exclusivo": "Ambos"},
    {"id": 151, "name": "Mew", "type": ["Psíquico"], "exclusivo": "Ambos"}
]

# =======================================================================
# 2. FUNCIÓN DE INSERCIÓN
# =======================================================================

def import_pokemon_data():
    """Importa todos los Pokémon a la tabla de PostgreSQL."""
    with app.app_context():
        try:
            print("Iniciando importación de datos...")
            
            # Verificar si ya hay datos para evitar duplicados
            if db.session.query(Pokemon).count() == 151:
                print("La tabla 'pokemon' ya contiene 151 registros. Saltando la importación.")
                return

            for data in POKEMON_DATA:
                # Crear un nuevo objeto Pokémon usando los datos
                new_pokemon = Pokemon(
                    id=data['id'],
                    name=data['name'],
                    type=data['type'],       # ListToString convierte [t1, t2] a "t1,t2"
                    exclusivo=data['exclusivo']
                )
                db.session.add(new_pokemon)
                
            db.session.commit()
            print(f"✅ ¡Importación completada! {db.session.query(Pokemon).count()} Pokémon insertados.")

        except Exception as e:
            db.session.rollback()
            print(f"❌ Error durante la importación: {e}")

if __name__ == '__main__':
    import_pokemon_data()