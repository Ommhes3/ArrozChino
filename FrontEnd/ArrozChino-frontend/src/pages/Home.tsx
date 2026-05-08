import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Video,
  Users,
  TrendingUp,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type MqttMessage = {
  topic: string;
  payload: {
    deviceId: string;
    foodLevel: number;
    weight: number;
    status: string;
    timestamp: string;
  };
};

export function Home() {
  const navigate = useNavigate();

  const [showDonationAlert, setShowDonationAlert] = useState(false);
  const [viewerCount, setViewerCount] = useState(127);

  const [mqttConnected, setMqttConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MqttMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<MqttMessage[]>([]);

  const brokerUrl = "ws://localhost:9001";
  const topic = "feeder/status";

  // Simulación de donación aleatoria
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setShowDonationAlert(true);
        setTimeout(() => setShowDonationAlert(false), 3000);
        setViewerCount((prev) => prev + Math.floor(Math.random() * 5));
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Simulación temporal de MQTT
  // Luego esto se reemplaza por una conexión real con mqtt.js
  useEffect(() => {
    setMqttConnected(true);

    const interval = setInterval(() => {
      const simulatedMessage: MqttMessage = {
        topic: "feeder/status",
        payload: {
          deviceId: "feeder_01",
          foodLevel: Math.floor(Math.random() * 100),
          weight: Math.floor(Math.random() * 800),
          status: Math.random() > 0.2 ? "active" : "warning",
          timestamp: new Date().toISOString(),
        },
      };

      setLastMessage(simulatedMessage);
      setMessageHistory((prev) => [simulatedMessage, ...prev].slice(0, 5));
    }, 4000);

    return () => {
      clearInterval(interval);
      setMqttConnected(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-white">Bienvenido</h1>
            <p className="text-white/80">Transmisión en vivo</p>
          </div>

          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm">En vivo</span>
          </div>
        </div>

        {/* Live Stream */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Video className="w-16 h-16 text-white/30" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-sm opacity-70 mb-2">Vista del comedero</p>

                <div className="flex items-center gap-2 justify-center">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{viewerCount} viendo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Donation Alert */}
          <AnimatePresence>
            {showDonationAlert && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="absolute top-4 right-4 bg-primary text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2"
              >
                <Heart className="w-5 h-5 fill-current" />
                <div>
                  <p className="text-sm font-medium">¡Nueva donación!</p>
                  <p className="text-xs opacity-90">Alimentando gatito...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2 flex-1">
              <TrendingUp className="w-4 h-4" />
              <span>24 donaciones hoy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Donate Button */}
      <div className="px-6 -mt-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/donate")}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3"
        >
          <Heart className="w-6 h-6 fill-current" />
          <span className="text-lg font-medium">Donar Ahora</span>
        </motion.button>
      </div>

      {/* MQTT Test Panel */}
      <div className="px-6 mt-6">
        <div className="bg-card p-4 rounded-xl shadow-md border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-foreground">
                Panel de prueba MQTT
              </h3>
              <p className="text-xs text-muted-foreground">
                Datos recibidos en tiempo real desde el comedero
              </p>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs ${
                mqttConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {mqttConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}

              <span>{mqttConnected ? "Conectado" : "Desconectado"}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <p>
              <span className="font-medium">Broker:</span> {brokerUrl}
            </p>
            <p>
              <span className="font-medium">Topic:</span> {topic}
            </p>
          </div>

          <div className="bg-black text-green-400 rounded-lg p-3 text-xs overflow-auto max-h-56">
            <pre>
              {lastMessage
                ? JSON.stringify(lastMessage, null, 2)
                : "Esperando mensajes MQTT..."}
            </pre>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 mt-6 grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/history")}
          className="bg-card p-4 rounded-xl shadow-md border border-border"
        >
          <div className="text-3xl text-primary mb-1">156</div>
          <div className="text-sm text-muted-foreground">Tus donaciones</div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/wikicats")}
          className="bg-card p-4 rounded-xl shadow-md border border-border"
        >
          <div className="text-3xl text-primary mb-1">8</div>
          <div className="text-sm text-muted-foreground">Gatos rescatados</div>
        </motion.button>
      </div>

      {/* Recent Activity */}
      <div className="px-6 mt-6">
        <h3 className="mb-4">Actividad reciente</h3>

        <div className="space-y-3">
          {[
            { name: "Michi", time: "Hace 5 min", amount: "1 ración" },
            { name: "Pelusa", time: "Hace 12 min", amount: "2 raciones" },
            { name: "Garfield", time: "Hace 25 min", amount: "1 ración" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-4 rounded-xl shadow-sm border border-border flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </div>

                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>

              <div className="text-sm text-primary font-medium">
                {item.amount}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MQTT Message History */}
      <div className="px-6 mt-6">
        <h3 className="mb-4">Historial MQTT</h3>

        <div className="space-y-3">
          {messageHistory.length === 0 ? (
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border text-sm text-muted-foreground">
              Aún no se han recibido mensajes.
            </div>
          ) : (
            messageHistory.map((message, index) => (
              <div
                key={index}
                className="bg-card p-4 rounded-xl shadow-sm border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">{message.topic}</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Dispositivo: {message.payload.deviceId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nivel de comida: {message.payload.foodLevel}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Peso: {message.payload.weight} g
                </p>
                <p className="text-xs text-muted-foreground">
                  Estado: {message.payload.status}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}