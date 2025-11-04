# Utiliza una imagen base oficial de Python 3.11
FROM python:3.11-slim

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Instala las dependencias
# Copia el archivo requirements.txt (debe estar en pokedex-backend/)
COPY requirements.txt requirements.txt
# Instala las librerías de forma eficiente
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación (app.py y otros scripts)
COPY . .

# Expone el puerto 8080 (Cloud Run lo requiere por defecto)
EXPOSE 8080

# Comando para iniciar la aplicación usando Gunicorn.
# CMD exec gunicorn:
#   --bind :$PORT: Permite que Gunicorn escuche en el puerto que Cloud Run le asigna.
#   --workers 1: Un solo proceso trabajador, suficiente para la aplicación serverless gratuita.
#   app:app: Indica que ejecute la instancia 'app' dentro del archivo 'app.py'.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app