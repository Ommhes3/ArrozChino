from fastapi import FastAPI
from pydantic import BaseModel

# base de datos
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import sessionmaker

# docker
import os


app = FastAPI()

# base de datos - parametros para poderse conectar a db -------------

# DATABASE_URL = "postgresql://owner:password@localhost/neondb" <- sigue ese formato 
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/neondb")
engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


# modelo de tabla SQL

class ReadingTable(Base):
    __tablename__ = "Lecturas"
    id = Column(Integer, primary_key=True, index=True)
    value = Column(Integer)
    timestamp = Column(Integer)
    deviceName = Column(String)
    units = Column(String)


# modelo de datos -----------------

class Reading(BaseModel):
    value: int
    timestamp: int
    deviceName: str
    units : str

# el dato que el cliente debe mandar para recibirlo por la endpoint (o sea la funcion)
# {
#   "deviceName" : "temp01", "value" : 514, "timestamp" : 200, "units" : "celsius"
# }

# endpoints: a los html que puedo acceder por url

# por ejemplo
# http://localhost:8000/
@app.get("/")
async def root():
    return {"message" : "Hola mundo"}

# http://localhost:8000/example
@app.post("/example")
async def example():
    return {"message":"Adios mundo"}

# el recurso de async permite que la funcion se ejecute de forma asincrona,
# como sucede en los hilos de java

# http://localhost:8000/readings
@app.post("/readings")
async def receive_reading(reading:Reading):

    db = SessionLocal() # abro sesion en db

    # crea el dato a guardar tipo reading 
    reading_to_save = ReadingTable(
        value = reading.value,
        timestamp = reading.timestamp,
        deviceName = reading.deviceName,
        units = reading.units
    )

    db.add(reading_to_save) # add del dato a la tabla
    db.commit() # el commit es como en git
    db.refresh(reading_to_save) # refresh para actualizar dato y aseguarrse que llego a la db
    db.close()

    return {
        "message": "Reading recibida",
        "value": reading.value,
        "timestamp" : reading.timestamp, 
    }

# lista de readings TEST
# [
# {"deviceName" : "temp01", "value" : 514, "timestamp" : 200, "units" : "celsius"},
# {"deviceName" : "temp02", "value" : 489, "timestamp" : 203, "units" : "celsius"},
# {"deviceName" : "temp03", "value" : 324, "timestamp" : 210, "units" : "celsius"}
# ]

# http://localhost:8000/readings/batch

# batch es un arreglo de readings, o sea una lista de objetos del tipo reading
@app.post("/readings/batch")
async def receive_batch(batch:list[Reading]):
    db = SessionLocal()

    readings_to_save = [ReadingTable(
        value = reading.value,
        timestamp = reading.timestamp,
        deviceName = reading.deviceName,
        units = reading.units
    ) for reading in batch]

    db.add_all(readings_to_save) # add del dato a la tabla
    db.commit()
    db.close()


    return {
        "message": "Batch recibida",
    }

# METODO PARA RECIBIR LA LISTA EN LA DB


# metodo ejecucion de la app, eso pa prender la db
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)