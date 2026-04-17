Tenemos tres carpetas actualmente:

Anteriores:

    FlujoAPI (era IntroHardware)
    Backend (era DataAcquisition)

Nuevas:

    Docker (para integrar contenerizcion y eso)
    Documentacion (para diagramas, presentacion del problema etc)
    Front end (se debe integrar para simular la donacion, por ahora no)



______ Tareas pendientes ______


- Para el muestreo.

    - Actualmente se toma una muestra cada 5 segundos por efectos de testing, en la implementacion real deberian ser 2 minutos.
    - Como para tomar la hora de la muestra se usa protoclo NTP, y este está dependiente de conectarse a wifi, tenemos que asegurar algunas restricciones en la funcion asincrona que toma las muestras para que tenga en cuenta alguna desconexion wifi. ¿Porque? Para que no envíe datos que no coincidan con el formato a la db.

- Dockerizacion.

    - Crear Dockerfile
    - Armar el docker-compose con los contenedores en red (API, db)
    - Subir imagen del contenedor a dockerhub

    NOTICA: No vamos a usar NEON, como explicó Domi la db debe estar de forma local en el contenedor, usar Neon no cumple con eso porque es remoto, así que toca hacer el localDB.

- Documentacion

    - Diagrama del flujo.
    - Subir la presentacion del problema.
