import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import mqtt from "mqtt";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const FEEDER_ID = "feeder-demo";
const CAT_METER_IMAGE = "/feederStadistic.png";

const MQTT_URL =
  import.meta.env.VITE_MQTT_URL ?? "wss://broker.hivemq.com:8884/mqtt";

/*
  Según tu ESP/comedor:

  inbound  = topic donde el comedor ESCUCHA comandos.
  outbound = topic donde el comedor PUBLICA la lectura.

  Entonces:
  frontend publica POSTSINGLE en inbound.
  frontend escucha la respuesta en outbound.
*/
const COMMAND_TOPIC = "ArrozChino/inbound";
const STATUS_TOPIC = "ArrozChino/outbound";

type Feeder = {
  success?: boolean;
  feeder_id: string;
  name: string;
  location?: string;
  is_active: boolean;
  food_level: number;
  food_limit: number;
  price_per_donation?: number;
  portion_per_donation?: number;
  stream_url?: string;
  model?: string;
  timestamp?: string | null;
};

type PendingRequest = {
  resolve: () => void;
  reject: () => void;
  timeoutId: number;
};

export default function FoodLevelCard() {
  const [feeder, setFeeder] = useState<Feeder | null>(null);
  const [loading, setLoading] = useState(true);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const mqttClientRef = useRef<ReturnType<typeof mqtt.connect> | null>(null);
  const pendingRequestRef = useRef<PendingRequest | null>(null);

  async function loadFeeder() {
    try {
      const response = await fetch(`${API_URL}/device/${FEEDER_ID}/status`);

      if (!response.ok) {
        throw new Error("No se pudo consultar el estado del comedero");
      }

      const data: Feeder = await response.json();
      setFeeder(data);
    } catch (error) {
      console.error("Error consultando nivel de comida:", error);
    } finally {
      setLoading(false);
    }
  }

  function forceFoodReadingByMqtt(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = mqttClientRef.current;

      if (!client || !client.connected) {
        reject();
        return;
      }

      const timeoutId = window.setTimeout(() => {
        pendingRequestRef.current = null;
        reject();
      }, 7000);

      pendingRequestRef.current = {
        resolve,
        reject,
        timeoutId,
      };

      /*
        Aquí se envía el comando real que espera el ESP/comedor.
        Se manda como texto plano:
        POSTSINGLE
      */
      client.publish(COMMAND_TOPIC, "POSTSINGLE", { qos: 0 }, (error) => {
        if (error) {
          window.clearTimeout(timeoutId);
          pendingRequestRef.current = null;
          reject();
          return;
        }

        console.log("Comando MQTT POSTSINGLE enviado como texto plano");
        console.log("Topic de envío:", COMMAND_TOPIC);
      });
    });
  }

  async function handleRefreshClick() {
    setIsRefreshing(true);
    setLastAction("Enviando POSTSINGLE por MQTT...");

    try {
      await forceFoodReadingByMqtt();
      setLastAction("Lectura recibida por MQTT.");
    } catch {
      console.warn("No llegó respuesta MQTT. Se usará GET como respaldo.");
      setLastAction("MQTT no respondió, actualizando por backend...");
      await loadFeeder();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 900);
    }
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
          console.log("Suscrito a topic de respuesta:", STATUS_TOPIC);
        }
      });
    });

    client.on("message", (topic, payload) => {
      const rawMessage = payload.toString();

      console.log("Mensaje MQTT recibido");
      console.log("Topic recibido:", topic);
      console.log("Payload recibido:", rawMessage);

      if (topic !== STATUS_TOPIC) {
        return;
      }

      try {
        const message = parseMqttFoodMessage(rawMessage);

        if (!message) {
          console.warn(
            "Mensaje MQTT recibido, pero no contiene nivel de comida interpretable."
          );
          return;
        }

        setFeeder((prev) => {
          if (!prev) {
            return {
              feeder_id: message.feeder_id ?? FEEDER_ID,
              name: "Comedero Demo",
              location: "Zona principal",
              is_active: true,
              food_level: Number(message.food_level ?? 0),
              food_limit: Number(message.food_limit ?? 10),
              timestamp: message.timestamp ?? null,
            };
          }

          return {
            ...prev,
            food_level: Number(message.food_level ?? prev.food_level),
            food_limit: Number(message.food_limit ?? prev.food_limit),
            timestamp: message.timestamp ?? prev.timestamp,
          };
        });

        const pendingRequest = pendingRequestRef.current;

        if (pendingRequest) {
          window.clearTimeout(pendingRequest.timeoutId);
          pendingRequest.resolve();
          pendingRequestRef.current = null;
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
      if (pendingRequestRef.current) {
        window.clearTimeout(pendingRequestRef.current.timeoutId);
        pendingRequestRef.current = null;
      }

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
          Se actualiza cada 5 minutos.
        </p>

        {lastAction && <p style={styles.lastAction}>{lastAction}</p>}

        <button
          style={{
            ...styles.button,
            ...(isRefreshing ? styles.buttonActive : {}),
          }}
          onClick={handleRefreshClick}
          disabled={isRefreshing}
        >
          <span style={styles.buttonMainText}>
            {isRefreshing ? "Enviando POSTSINGLE..." : "Forzar lectura ahora"}
          </span>

          <span
            style={{
              ...styles.buttonSubText,
              maxHeight: isRefreshing ? "24px" : "0px",
              opacity: isRefreshing ? 1 : 0,
            }}
          >
            Ordenando lectura al comedero
          </span>
        </button>
      </div>
    </section>
  );
}

function parseMqttFoodMessage(rawMessage: string): Partial<Feeder> | null {
  /*
    Caso 1:
    El comedor responde JSON:
    {
      "food_level": 7,
      "food_limit": 10
    }

    También acepta:
    {
      "foodLevel": 7,
      "foodLimit": 10
    }
  */
  try {
    const json = JSON.parse(rawMessage);

    if (
      json.food_level !== undefined ||
      json.foodLevel !== undefined ||
      json.food !== undefined ||
      json.level !== undefined
    ) {
      return {
        feeder_id: json.feeder_id ?? FEEDER_ID,
        food_level: Number(
          json.food_level ?? json.foodLevel ?? json.food ?? json.level ?? 0
        ),
        food_limit: Number(json.food_limit ?? json.foodLimit ?? 10),
        timestamp: json.timestamp ?? new Date().toISOString(),
      };
    }
  } catch {
    /*
      Si no es JSON, seguimos intentando interpretar texto plano.
    */
  }

  /*
    Caso 2:
    El comedor responde solo un número:
    7
  */
  const numberOnly = Number(rawMessage);

  if (!Number.isNaN(numberOnly)) {
    return {
      feeder_id: FEEDER_ID,
      food_level: numberOnly,
      food_limit: 10,
      timestamp: new Date().toISOString(),
    };
  }

  /*
    Caso 3:
    El comedor responde algo tipo:
    food_level:7
    food_level=7
    food:7
    level=7
  */
  const match = rawMessage.match(
    /(?:food_level|food|level)\s*[:=]\s*(\d+(\.\d+)?)/i
  );

  if (match) {
    return {
      feeder_id: FEEDER_ID,
      food_level: Number(match[1]),
      food_limit: 10,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
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
    marginBottom: "8px",
    color: "#6B7280",
    fontSize: "15px",
    fontWeight: 700,
  },

  lastAction: {
    marginTop: "0px",
    marginBottom: "14px",
    color: "black",
    backgroundColor: "#BEEBFF",
    border: "3px solid black",
    borderRadius: "14px",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 900,
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