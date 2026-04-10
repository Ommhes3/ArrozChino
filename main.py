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
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://neondb_owner:npg_Wxv2fpum7VcA@ep-solitary-shadow-aios0gdj-pooler.c-4.us-east-1.aws.neon.tech/neondb"
    )
engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


# modelo de tabla SQL

class ReadingTable(Base):
    __tablename__ = "Lecturas"
    id = Column(Integer, primary_key=True, index=True)
    pesoKg = Column(Integer)
    horaToma = Column(Integer)
    deviceName = Column(String)
    units = Column(String)

# modelo de datos -----------------

class Reading(BaseModel):
    pesoKg: float
    horaToma: int
    deviceName: str
    units: str

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
class Reading(BaseModel):
    pesoKg: float
    horaToma: int
    deviceName: str
    units: str

# lista de readings TEST
# [
# {"deviceName" : "temp01", "value" : 514, "timestamp" : 200, "units" : "celsius"},
# {"deviceName" : "temp02", "value" : 489, "timestamp" : 203, "units" : "celsius"},
# {"deviceName" : "temp03", "value" : 324, "timestamp" : 210, "units" : "celsius"}
# ]


# http://localhost:8000/readings/batch

# batch es un arreglo de readings, o sea una lista de objetos del tipo reading


# METODO PARA RECIBIR LA LISTA EN LA DB


# metodo ejecucion de la app, eso pa prender la db
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)