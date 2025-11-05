from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy 
from flask_cors import CORS 
import os
import jwt
import datetime
from functools import wraps

# Importaciones necesarias para la seguridad de Google Auth
# from google.oauth2 import id_token
# from google.auth.transport import requests as google_requests 
from dotenv import load_dotenv

# Cargar las variables de entorno del archivo .env local
load_dotenv()

# =======================================================
# 1. DATOS ORIGINALES (POKÉDEX KANTO 1-151)
# ⚠️ NOTA: ¡DEBES PEGAR AQUÍ EL ARRAY COMPLETO POKEMON_DATA!
# =======================================================
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


# =======================================================
# 2. CONFIGURACIÓN E INICIALIZACIÓN DE LA APLICACIÓN
# =======================================================
app = Flask(__name__)

# --- CORRECCIÓN FINAL DE CORS: Inicialización Simple y Global ---
# Esto permite que flask-cors maneje la petición OPTIONS automáticamente 
# para cualquier origen, resolviendo el problema de preflight.
CORS(app) 

# --- CONFIGURACIÓN DE SEGURIDAD Y DB ---
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI') 

# Si alguna clave vital no se encuentra (solo para depuración local)
if not app.config['SECRET_KEY'] or not app.config['SQLALCHEMY_DATABASE_URI']:
    print("FATAL: Configuración de DB/SECRET_KEY no encontrada. Revisa tu archivo .env o la configuración de Render.")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# =======================================================
# 3. MODELOS DE DATOS (Se mantienen igual)
# =======================================================

class ListToString(db.TypeDecorator):
    impl = db.String
    def process_bind_param(self, value, dialect):
        return ','.join(value) if value is not None else ''
    def process_result_value(self, value, dialect):
        return value.split(',') if value is not None and isinstance(value, str) else []

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(128), unique=True, nullable=False)
    captures = db.relationship('UserCapture', backref='user', lazy=True)

class PokemonKanto(db.Model):
    __tablename__ = 'pokemon_kanto'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    type = db.Column(ListToString(50), nullable=False)
    exclusivo = db.Column(db.String(10), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type, 
            'exclusivo': self.exclusivo
        }

class UserCapture(db.Model):
    __tablename__ = 'user_captures'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    pokemon_id = db.Column(db.Integer, db.ForeignKey('pokemon_kanto.id'), nullable=False)
    is_caught = db.Column(db.Boolean, default=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'pokemon_id', name='_user_pokemon_uc'),)

# =======================================================
# 4. FUNCIONES DE SEGURIDAD (JWT DECORATOR)
# =======================================================

def generate_auth_token(user_id):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    token = jwt.encode({
        'user_id': user_id,
        'exp': expiration
    }, app.config['SECRET_KEY'], algorithm="HS256")
    return token 

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            try:
                token = request.headers['Authorization'].split(" ")[1]
            except IndexError:
                pass 
        
        if not token and 'x-access-tokens' in request.headers:
            token = request.headers['x-access-tokens']

        if not token:
            return jsonify({'message': 'Token de autenticación faltante.'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except Exception as e:
            return jsonify({'message': 'Token no válido o expirado.'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

# =======================================================
# 5. RUTAS API (Con corrección de método en /api/login)
# =======================================================

@app.route('/api/status', methods=['GET'])
def check_status():
    return jsonify({'status': 'ok', 'message': 'Backend de Pokédex activo.'})

# --- RUTA DE LOGIN (CORRECCIÓN: Solo acepta POST, dejando OPTIONS a Flask-CORS) ---
@app.route('/api/login', methods=['POST']) 
def login_user():

    if request.method == 'OPTIONS':
        return '', 200 
    
    try:
        data = request.get_json()
    except Exception as e:
        # Esto nos dirá si el JSON está mal formado
        print(f"ERROR: No se pudo parsear el JSON de la petición: {e}") 
        return jsonify({'message': 'JSON de entrada inválido.'}), 400

    id_token = data.get('token')
    
    if not id_token:
        return jsonify({'message': 'ID Token de Google no proporcionado.'}), 400
    
    # ⚠️ Esto es TEMPORAL hasta implementar la verificación real del token de Google
    google_id = "temp_google_id_from_" + id_token[:10] 

    try:
        # 1. Buscar o Crear Usuario
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User(google_id=google_id)
            db.session.add(user)
            db.session.commit()

        # 2. Generar Auth Token interno
        token = generate_auth_token(user.id)
        
        return jsonify({
            'message': 'Login exitoso',
            'token': token,
            'username': f'Entrenador #{user.id}'
        }), 200 

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error interno en el login: {str(e)}'}), 500


# --- RUTA PRINCIPAL (PROTEGIDA) ---
@app.route('/api/pokemon', methods=['GET'])
@token_required 
def get_all_pokemon(current_user):
    # Lógica para devolver la lista de Pokémon y el estado de captura del usuario actual
    try:
        pokemon_list = db.session.execute(db.select(PokemonKanto).order_by(PokemonKanto.id)).scalars().all()
        
        captures = UserCapture.query.filter_by(user_id=current_user.id).all()
        capture_map = {c.pokemon_id: c.is_caught for c in captures}

        result = []
        for p in pokemon_list:
            pokemon_dict = p.to_dict()
            pokemon_dict['is_caught'] = capture_map.get(p.id, False) 
            result.append(pokemon_dict)
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar DB: {str(e)}'}), 500

# --- RUTA TEMPORAL PARA INICIALIZACIÓN ---
@app.route('/api/initialize-db', methods=['POST'])
def initialize_database():
    """Ruta para crear TODAS las tablas y poblar la tabla PokemonKanto."""
    with app.app_context():
        try:
            db.create_all()

            if db.session.query(PokemonKanto).count() > 0:
                message = "✅ Base de datos principal ya poblada. Inicialización saltada."
            else:
                for data in POKEMON_DATA:
                    new_pokemon = PokemonKanto(
                        id=data['id'], name=data['name'], type=data['type'], exclusivo=data['exclusivo']
                    )
                    db.session.add(new_pokemon)
                db.session.commit()
                message = "✅ Base de datos inicializada y poblada con 151 Pokémon."
            
            return jsonify({'status': 'success', 'message': message}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': f'Error de inicialización: {str(e)}'}), 500

# =======================================================
# 7. EJECUCIÓN LOCAL
# =======================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000)) 
    app.run(debug=True, port=port)