FROM python:3.13-slim        # imagen base: Python 3.13 en Debian mínimo

WORKDIR /app                 # directorio de trabajo dentro del contenedor

COPY requirements.txt .      # copiar dependencias primero (aprovecha caché de capas)
RUN pip install --no-cache-dir -r requirements.txt  # instalar dependencias

COPY main.py .               # copiar el código fuente

EXPOSE 8000                  # documentar que el contenedor escucha en el puerto 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]