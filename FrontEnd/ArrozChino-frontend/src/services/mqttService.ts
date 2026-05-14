import mqtt from 'mqtt'
 
const BROKER = 'mqtt://broker.emqx.io' //EMQX //WebSockets
const TOPIC  = 'icesi/tel' // icesi/tel

const client = mqtt.connect(BROKER)

client.on('connect', () => {
  console.log('✅ Conectado al broker')

  // Suscribirse para recibir mensajes
  client.subscribe(TOPIC, () => {
    console.log(`📡 Suscrito a: ${TOPIC}`)
  })

  // Publicar un mensaje de prueba después de conectarse
  client.publish(TOPIC, 'El pepe')
  console.log('📤 Mensaje enviado')
})

client.on('message', (topic, message) => {
  console.log(`📨 Mensaje recibido en [${topic}]: ${message.toString()}`)
})