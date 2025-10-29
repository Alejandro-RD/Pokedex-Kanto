# pokedex-backend/app.py (Estructura Corregida)

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy 
from flask_cors import CORS # Asegúrate de tener Flask-CORS instalado

# =======================================================
# 1. INICIALIZACIÓN DE LA APLICACIÓN
# =======================================================
app = Flask(__name__)
CORS(app) 

# =======================================================
# 2. CONFIGURACIÓN DE LA BASE DE DATOS (POSTGRESQL)
# =======================================================
# NOTA: ¡VERIFICA TUS CREDENCIALES AQUÍ!
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:asdnlk123zpg45@localhost:5432/pokedex_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# =======================================================
# 3. DEFINICIÓN DEL MODELO DE DATOS (Tablas)
# Las clases de modelo DEBEN estar definidas después de 'db = SQLAlchemy(app)'
# =======================================================

# Helper para convertir listas a texto y viceversa (para almacenar el tipo)
class ListToString(db.TypeDecorator):
    impl = db.String

    def process_bind_param(self, value, dialect):
        return ','.join(value) if value is not None else ''

    def process_result_value(self, value, dialect):
        # Aseguramos que la DB solo devuelve strings y los separamos
        if value is None:
             return []
        # Manejo de la conversión de la DB (string a list)
        return value.split(',') if isinstance(value, str) else value 

class Pokemon(db.Model):
    __tablename__ = 'pokemon'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(ListToString(50), nullable=False)
    exclusivo = db.Column(db.String(10), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type, # Esto usará el método process_result_value
            'exclusivo': self.exclusivo
        }

# =======================================================
# 4. RUTAS API (Backend Logic)
# Las rutas DEBEN ser definidas DESPUÉS de la inicialización de la app
# =======================================================

@app.route('/api/status', methods=['GET'])
def check_status():
    return jsonify({'status': 'ok', 'message': 'Backend activo y conectado.'})

@app.route('/api/pokemon', methods=['GET'])
def get_all_pokemon():
    try:
        # Consulta la DB para obtener todos los Pokémon
        # Asegúrate de que los datos fueron importados con el script import_data.py
        pokemon_list = db.session.execute(db.select(Pokemon).order_by(Pokemon.id)).scalars().all()
        
        # Convierte la lista de objetos Pokemon a una lista de diccionarios (JSON)
        return jsonify([p.to_dict() for p in pokemon_list])
    except Exception as e:
        # Si esta ruta falla, muestra el error en la consola
        print(f"ERROR EN RUTA /api/pokemon: {e}")
        return jsonify({'error': f'Error al consultar DB: {str(e)}'}), 500


# =======================================================
# 5. COMANDO Y EJECUCIÓN
# =======================================================

@app.cli.command('create_db')
def create_db():
    with app.app_context():
        db.create_all()
        print("Tablas de la base de datos creadas.")


if __name__ == '__main__':
    # Usar el servidor de desarrollo de Flask (más fácil para el debug)
    app.run(debug=True)
    
    # Si quieres usar Waitress, el comando sería:
    # waitress-serve --listen=127.0.0.1:5000 app:app