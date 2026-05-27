import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import mqtt from "mqtt";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const FEEDER_ID = "feeder-demo";
const CAT_METER_IMAGE = "/feederStadistic.png";

const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt";
const COMMAND_TOPIC = "arrozchino/feeder-demo/commands";
const STATUS_TOPIC = "arrozchino/feeder-demo/status";

type Feeder = {
  feeder_id: string;
  name: string;
  location?: string;
  is_active: boolean;
  food_level: number;
  food_limit: number;
  price_per_donation?: number;
  portion_per_donation?: number;
  stream_url?: string;
  created_at?: string;
};

type GetFeederResponse = {
  success: boolean;
  feeder: Feeder;
};

export default function FoodLevelCard() {
  const [feeder, setFeeder] = useState<Feeder | null>(null);
  const [loading, setLoading] = useState(true);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const mqttClientRef = useRef<ReturnType<typeof mqtt.connect> | null>(null);

  async function loadFeeder() {
    try {
      const response = await fetch(`${API_URL}/feeders/${FEEDER_ID}`);

      if (!response.ok) {
        throw new Error("No se pudo consultar el comedero");
      }

      const data: GetFeederResponse = await response.json();
      setFeeder(data.feeder);
    } catch (error) {
      console.error("Error consultando nivel de comida:", error);
    } finally {
      setLoading(false);
    }
  }

  function publishReadFoodCommand() {
    const client = mqttClientRef.current;

    if (!client || !client.connected) {
      console.warn("MQTT no está conectado. Se actualizará solo por GET.");
      return;
    }

    const command = {
      command: "READ_FOOD",
      feeder_id: FEEDER_ID,
      requested_from: "frontend",
      timestamp: new Date().toISOString(),
    };

    client.publish(COMMAND_TOPIC, JSON.stringify(command));
    console.log("Comando MQTT enviado:", command);
  }

  async function handleRefreshClick() {
    setIsRefreshing(true);

    publishReadFoodCommand();

    await loadFeeder();

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  }

  useEffect(() => {
    loadFeeder();

    const interval = window.setInterval(() => {
      loadFeeder();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, {
      clientId: `frontend-food-${Math.random().toString(16).slice(2)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    });

    mqttClientRef.current = client;

    client.on("connect", () => {
      console.log("Frontend conectado a MQTT");
      setMqttConnected(true);

      client.subscribe(STATUS_TOPIC, (error) => {
        if (error) {
          console.error("Error suscribiendo a topic de estado:", error);
        } else {
          console.log("Suscrito a:", STATUS_TOPIC);
        }
      });
    });

    client.on("message", (_topic, payload) => {
      try {
        const message = JSON.parse(payload.toString());

        console.log("Mensaje MQTT recibido:", message);

        if (message.event === "FOOD_READING" || message.food_level !== undefined) {
          setFeeder((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              food_level: Number(message.food_level),
              food_limit: Number(message.food_limit ?? prev.food_limit),
            };
          });
        }
      } catch (error) {
        console.error("Error procesando mensaje MQTT:", error);
      }
    });

    client.on("close", () => {
      setMqttConnected(false);
    });

    client.on("error", (error) => {
      console.error("Error MQTT:", error);
      setMqttConnected(false);
    });

    return () => {
      client.end();
      mqttClientRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <section style={styles.section}>
        <div style={styles.card}>
          <p style={styles.message}>Cargando nivel de comida...</p>
        </div>
      </section>
    );
  }

  if (!feeder) {
    return (
      <section style={styles.section}>
        <div style={styles.card}>
          <p style={styles.message}>No se pudo cargar el nivel de comida.</p>
        </div>
      </section>
    );
  }

  const foodLimit = feeder.food_limit || 0;
  const foodLevel = feeder.food_level || 0;

  const foodPercentage =
    foodLimit > 0 ? Math.min((foodLevel / foodLimit) * 100, 100) : 0;

  const statusText =
    foodPercentage <= 20
      ? "Nivel bajo"
      : foodPercentage <= 60
      ? "Nivel medio"
      : "Nivel suficiente";

  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Nivel de comida</h2>
            <p style={styles.subtitle}>
              {feeder.name} · {feeder.location ?? "Sin ubicación"}
            </p>
          </div>

          <div style={styles.badgesContainer}>
            <span style={styles.badge}>{statusText}</span>

            <span
              style={{
                ...styles.mqttBadge,
                backgroundColor: mqttConnected ? "#B6F5C1" : "#E5E7EB",
              }}
            >
              {mqttConnected ? "MQTT activo" : "MQTT off"}
            </span>
          </div>
        </div>

        <div style={styles.catWrapper}>
          <div style={styles.catContainer}>
            <div style={styles.bellyArea}>
              <div
                style={{
                  ...styles.foodFill,
                  height: `${foodPercentage}%`,
                }}
              />
            </div>

            <img
              src={CAT_METER_IMAGE}
              alt="Medidor de comida"
              style={styles.catImage}
              onError={() => {
                console.log("No se pudo cargar la imagen:", CAT_METER_IMAGE);
              }}
            />

            <div style={styles.percentageText}>
              {foodPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <div style={styles.dataRow}>
          <span>{foodLevel.toFixed(0)} g disponibles</span>
          <span>{foodLimit.toFixed(0)} g capacidad</span>
        </div>

        <p style={styles.helperText}>
          Se actualiza cada 5 minutos y también puede solicitar una lectura por MQTT.
        </p>

        <button
          style={{
            ...styles.button,
            ...(isRefreshing ? styles.buttonActive : {}),
          }}
          onClick={handleRefreshClick}
          disabled={isRefreshing}
        >
          <span style={styles.buttonMainText}>
            {isRefreshing ? "Solicitando lectura..." : "Actualizar ahora"}
          </span>

          <span
            style={{
              ...styles.buttonSubText,
              maxHeight: isRefreshing ? "24px" : "0px",
              opacity: isRefreshing ? 1 : 0,
            }}
          >
            Enviando comando al comedero
          </span>
        </button>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    width: "100%",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    backgroundColor: "#FFF7E8",
    border: "6px solid black",
    borderRadius: "34px",
    padding: "22px",
    boxSizing: "border-box",
    boxShadow: "5px 5px 0px #000",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 900,
    lineHeight: 1,
    color: "black",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: "16px",
    fontWeight: 700,
    color: "#6B7280",
  },
  badgesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: "#FFDE59",
    color: "black",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "3px solid black",
    fontSize: "14px",
    fontWeight: 900,
    boxShadow: "2px 2px 0px #000",
    whiteSpace: "nowrap",
  },
  mqttBadge: {
    color: "black",
    padding: "6px 12px",
    borderRadius: "999px",
    border: "3px solid black",
    fontSize: "12px",
    fontWeight: 900,
    boxShadow: "2px 2px 0px #000",
    whiteSpace: "nowrap",
  },
  catWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "8px",
    marginBottom: "18px",
  },
  catContainer: {
    position: "relative",
    width: "280px",
    height: "280px",
  },
  catImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    zIndex: 3,
    pointerEvents: "none",
  },
  bellyArea: {
    position: "absolute",
    left: "26%",
    top: "49%",
    width: "48%",
    height: "26%",
    borderRadius: "24px",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    zIndex: 2,
  },
  foodFill: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: "100%",
    background: "linear-gradient(180deg, #FFDE59 0%, #FF8C42 100%)",
    transition: "height 0.6s ease",
  },
  percentageText: {
    position: "absolute",
    left: "50%",
    top: "62%",
    transform: "translate(-50%, -50%)",
    zIndex: 4,
    fontSize: "24px",
    fontWeight: 900,
    color: "black",
    textShadow: "2px 2px 0px white",
  },
  dataRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "16px",
    fontWeight: 900,
    color: "black",
  },
  helperText: {
    marginTop: "12px",
    marginBottom: "16px",
    color: "#6B7280",
    fontSize: "15px",
    fontWeight: 700,
  },
  button: {
    width: "100%",
    minHeight: "52px",
    border: "4px solid black",
    backgroundColor: "#FF8C42",
    color: "black",
    padding: "12px 16px",
    borderRadius: "18px",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: "17px",
    boxShadow: "3px 3px 0px #000",
    transition: "all 0.25s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonActive: {
    minHeight: "78px",
    transform: "scale(1.03)",
    backgroundColor: "#FFDE59",
    boxShadow: "6px 6px 0px #000",
  },
  buttonMainText: {
    display: "block",
    lineHeight: 1.2,
  },
  buttonSubText: {
    display: "block",
    fontSize: "13px",
    fontWeight: 800,
    overflow: "hidden",
    transition: "all 0.25s ease",
    marginTop: "4px",
  },
  message: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    color: "black",
    textAlign: "center",
  },
};