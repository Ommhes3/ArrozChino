import { useEffect, useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Navbar from "../components/layout/Navbar";
import LiveStreamCard from "../components/home/LiveStreamCard";
import FoodLevelCard from "../components/home/FoodLevelCard";
import { getCurrentUser } from "../services/userService";
import {
  calculateDonationStats,
  getDonations,
} from "../services/donationService";
import {
  createFeeder,
  getFeeders,
  type Feeder,
} from "../services/feederService";

type Donation = {
  donation_id?: string;
  user_id?: string | null;
  feeder_id?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  donation_date?: string;
  date?: string;
};

type ChartPoint = {
  label: string;
  total: number;
  count: number;
};

export default function Impact() {
  const [donationsToday, setDonationsToday] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [myDonations, setMyDonations] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [rescuedCats] = useState(8);

  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [feederForm, setFeederForm] = useState({
    feeder_id: "",
    name: "",
    location: "",
    food_limit: "10",
    price_per_donation: "10000",
    portion_per_donation: "0.25",
    stream_url: "http://esp32cam.local/stream",
  });
  const [creatingFeeder, setCreatingFeeder] = useState(false);
  const [feederMessage, setFeederMessage] = useState("");

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const liveVideos = [
    {
      src: "/stream.mp4",
      title: "Vista del comedero",
    },
    {
      src: "/stream1.mp4",
      title: "Zona de gatitos",
    },
    {
      src: "/stream2.mp4",
      title: "Patio de descanso",
    },
  ];

  async function loadImpactStats() {
    const donations = (await getDonations()) as Donation[];

    const stats = calculateDonationStats(
      donations,
      currentUser?.user_id ?? null
    );

    const amount = donations.reduce((sum, donation) => {
      return sum + Number(donation.amount ?? 0);
    }, 0);

    setDonationsToday(stats.donationsToday);
    setMyDonations(stats.myDonations);
    setTotalDonations(donations.length);
    setTotalAmount(amount);
    setChartData(buildDonationChartData(donations));
  }

  async function loadFeeders() {
    try {
      const data = await getFeeders();
      setFeeders(data);
    } catch (error) {
      console.error("Error cargando comederos:", error);
    }
  }

  async function handleCreateFeeder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!feederForm.feeder_id.trim() || !feederForm.name.trim()) {
      setFeederMessage("Debes ingresar el ID y el nombre del comedero.");
      return;
    }

    try {
      setCreatingFeeder(true);
      setFeederMessage("");

      await createFeeder({
        feeder_id: feederForm.feeder_id.trim(),
        name: feederForm.name.trim(),
        location: feederForm.location.trim(),
        food_limit: Number(feederForm.food_limit),
        price_per_donation: Number(feederForm.price_per_donation),
        portion_per_donation: Number(feederForm.portion_per_donation),
        stream_url: feederForm.stream_url.trim(),
      });

      setFeederMessage("Comedero creado correctamente.");

      setFeederForm({
        feeder_id: "",
        name: "",
        location: "",
        food_limit: "10",
        price_per_donation: "10000",
        portion_per_donation: "0.25",
        stream_url: "http://esp32cam.local/stream",
      });

      await loadFeeders();
    } catch (error) {
      console.error("Error creando comedero:", error);

      if (error instanceof Error) {
        setFeederMessage(error.message);
      } else {
        setFeederMessage("No se pudo crear el comedero.");
      }
    } finally {
      setCreatingFeeder(false);
    }
  }

  useEffect(() => {
    loadImpactStats().catch((error) => {
      console.error("Error cargando estadísticas de impacto:", error);
    });

    if (isAdmin) {
      loadFeeders();
    }
  }, []);

  const averageDonation = useMemo(() => {
    if (totalDonations <= 0) return 0;
    return totalAmount / totalDonations;
  }, [totalAmount, totalDonations]);

  const activeFeeders = feeders.filter(
    (feeder) => feeder.is_active !== false
  ).length;

  return (
    <main style={styles.main}>
      <Header />

      <LiveStreamCard
        videos={liveVideos}
        sleepingImageSrc="/logoDormido.png"
      />

      <section style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Impacto del comedero</h1>
          <p style={styles.pageSubtitle}>
            Estado del alimento y estadísticas del apoyo recibido para los
            gatitos.
          </p>
        </div>

        <img src="/icono5.png" alt="Impacto" style={styles.pageIcon} />
      </section>

      <FoodLevelCard />

      {isAdmin && (
        <section style={styles.adminCard}>
          <div style={styles.adminHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Estadísticas administrativas</h2>
              <p style={styles.sectionSubtitle}>
                Resumen general del comedero, donaciones y actividad del sistema.
              </p>
            </div>

            <span style={styles.adminBadge}>ADMIN</span>
          </div>

          <div style={styles.statsGrid}>
            <StatCard
              iconSrc="/icono2.png"
              title="Donaciones hoy"
              value={donationsToday}
              backgroundColor="#FFD6E8"
              scale={1.25}
            />

            <StatCard
              iconSrc="/icono3.png"
              title="Donaciones totales"
              value={totalDonations}
              backgroundColor="#BEEBFF"
              scale={1.25}
            />

            <StatCard
              iconSrc="/icono4.png"
              title="Gatitos beneficiados"
              value={rescuedCats}
              backgroundColor="#B9F871"
              scale={1.05}
            />

            <StatCard
              iconSrc="/icono5.png"
              title="Comederos activos"
              value={activeFeeders}
              backgroundColor="#FFDE59"
              scale={1.15}
            />
          </div>

          <div style={styles.moneyGrid}>
            <div style={styles.moneyCard}>
              <span style={styles.moneyLabel}>Total recaudado</span>
              <strong style={styles.moneyValue}>
                {formatCurrency(totalAmount)}
              </strong>
            </div>

            <div style={styles.moneyCard}>
              <span style={styles.moneyLabel}>Promedio por donación</span>
              <strong style={styles.moneyValue}>
                {formatCurrency(averageDonation)}
              </strong>
            </div>
          </div>

          <section style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>
                  Donaciones a lo largo del tiempo
                </h3>
                <p style={styles.chartSubtitle}>
                  Valores agrupados por día según los registros disponibles.
                </p>
              </div>

              <img src="/icono3.png" alt="Historial" style={styles.chartIcon} />
            </div>

            <DonationBarChart data={chartData} />
          </section>

          <section style={styles.feederAdminCard}>
            <div style={styles.chartHeader}>
              <div>
                <h3 style={styles.chartTitle}>Gestión de comederos</h3>
                <p style={styles.chartSubtitle}>
                  Crea nuevos comederos y consulta los que ya están registrados.
                </p>
              </div>

              <img src="/icono1.png" alt="Comederos" style={styles.chartIcon} />
            </div>

            <form style={styles.feederForm} onSubmit={handleCreateFeeder}>
              <div style={styles.formGrid}>
                <label style={styles.formLabel}>
                  ID del comedero
                  <input
                    style={styles.input}
                    value={feederForm.feeder_id}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        feeder_id: event.target.value,
                      }))
                    }
                    placeholder="feeder-demo-2"
                  />
                </label>

                <label style={styles.formLabel}>
                  Nombre
                  <input
                    style={styles.input}
                    value={feederForm.name}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Comedero norte"
                  />
                </label>

                <label style={styles.formLabel}>
                  Ubicación
                  <input
                    style={styles.input}
                    value={feederForm.location}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Zona principal"
                  />
                </label>

                <label style={styles.formLabel}>
                  Límite de comida
                  <input
                    style={styles.input}
                    type="number"
                    value={feederForm.food_limit}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        food_limit: event.target.value,
                      }))
                    }
                  />
                </label>

                <label style={styles.formLabel}>
                  Precio por donación
                  <input
                    style={styles.input}
                    type="number"
                    value={feederForm.price_per_donation}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        price_per_donation: event.target.value,
                      }))
                    }
                  />
                </label>

                <label style={styles.formLabel}>
                  Porción por donación
                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    value={feederForm.portion_per_donation}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        portion_per_donation: event.target.value,
                      }))
                    }
                  />
                </label>

                <label style={styles.formLabelWide}>
                  URL del stream
                  <input
                    style={styles.input}
                    value={feederForm.stream_url}
                    onChange={(event) =>
                      setFeederForm((prev) => ({
                        ...prev,
                        stream_url: event.target.value,
                      }))
                    }
                    placeholder="http://esp32cam.local/stream"
                  />
                </label>
              </div>

              {feederMessage && (
                <p style={styles.feederMessage}>{feederMessage}</p>
              )}

              <button
                type="submit"
                style={{
                  ...styles.createButton,
                  opacity: creatingFeeder ? 0.75 : 1,
                }}
                disabled={creatingFeeder}
              >
                {creatingFeeder ? "Creando comedero..." : "Crear comedero"}
              </button>
            </form>

            <div style={styles.feedersListHeader}>
              <h4 style={styles.feedersListTitle}>Comederos registrados</h4>

              <button
                type="button"
                style={styles.refreshButton}
                onClick={loadFeeders}
              >
                Actualizar lista
              </button>
            </div>

            {feeders.length === 0 ? (
              <div style={styles.emptyChart}>
                Todavía no hay comederos registrados o no se pudieron cargar.
              </div>
            ) : (
              <div style={styles.feedersGrid}>
                {feeders.map((feeder) => (
                  <article key={feeder.feeder_id} style={styles.feederItem}>
                    <div style={styles.feederItemHeader}>
                      <img
                        src="/icono1.png"
                        alt="Comedero"
                        style={styles.feederItemIcon}
                      />

                      <div>
                        <strong style={styles.feederName}>{feeder.name}</strong>
                        <span style={styles.feederId}>{feeder.feeder_id}</span>
                      </div>
                    </div>

                    <div style={styles.feederInfoGrid}>
                      <span>
                        Ubicación: {feeder.location || "Sin ubicación"}
                      </span>
                      <span>
                        Estado:{" "}
                        {feeder.is_active === false ? "Inactivo" : "Activo"}
                      </span>
                      <span>
                        Comida: {Number(feeder.food_level ?? 0).toFixed(0)} /{" "}
                        {Number(feeder.food_limit ?? 0).toFixed(0)}
                      </span>
                      <span>
                        Donación:{" "}
                        {formatCurrency(
                          Number(feeder.price_per_donation ?? 0)
                        )}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {!isAdmin && (
        <section style={styles.donorCard}>
          <div>
            <h2 style={styles.sectionTitle}>Vista de donante</h2>
            <p style={styles.sectionSubtitle}>
              Como donante puedes consultar el nivel actual de comida del
              comedero. Las estadísticas administrativas solo están disponibles
              para usuarios admin.
            </p>

            <div style={styles.donorMiniStats}>
              <div style={styles.donorMiniCard}>
                <img
                  src="/icono2.png"
                  alt="Mis donaciones"
                  style={styles.donorMiniIcon}
                />
                <div>
                  <strong style={styles.donorValue}>{myDonations}</strong>
                  <span style={styles.donorLabel}>Mis donaciones</span>
                </div>
              </div>

              <div style={styles.donorMiniCard}>
                <img
                  src="/icono4.png"
                  alt="Gatitos apoyados"
                  style={styles.donorMiniIcon}
                />
                <div>
                  <strong style={styles.donorValue}>{rescuedCats}</strong>
                  <span style={styles.donorLabel}>Gatitos apoyados</span>
                </div>
              </div>
            </div>
          </div>

          <img src="/icono2.png" alt="Donar" style={styles.donorIcon} />
        </section>
      )}

      <Navbar active="Impacto" />
    </main>
  );
}

function StatCard({
  iconSrc,
  title,
  value,
  backgroundColor,
  scale = 1,
}: {
  iconSrc: string;
  title: string;
  value: number | string;
  backgroundColor: string;
  scale?: number;
}) {
  return (
    <div style={{ ...styles.statCard, backgroundColor }}>
      <img
        src={iconSrc}
        alt={title}
        style={{
          ...styles.statIcon,
          transform: `scale(${scale})`,
        }}
      />

      <strong style={styles.statValue}>{value}</strong>

      <span style={styles.statLabel}>{title}</span>
    </div>
  );
}

function DonationBarChart({ data }: { data: ChartPoint[] }) {
  const maxValue = Math.max(...data.map((item) => item.total), 1);

  if (data.length === 0) {
    return (
      <div style={styles.emptyChart}>
        Todavía no hay datos suficientes para mostrar la gráfica.
      </div>
    );
  }

  return (
    <div style={styles.chartWrapper}>
      <div style={styles.chartBars}>
        {data.map((item) => {
          const height = Math.max((item.total / maxValue) * 160, 12);

          return (
            <div key={item.label} style={styles.barColumn}>
              <div style={styles.barValue}>
                {formatShortCurrency(item.total)}
              </div>

              <div style={styles.barTrack}>
                <div
                  title={`${item.label}: ${formatCurrency(item.total)} en ${
                    item.count
                  } donación(es)`}
                  style={{
                    ...styles.barFill,
                    height: `${height}px`,
                  }}
                />
              </div>

              <span style={styles.barLabel}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildDonationChartData(donations: Donation[]): ChartPoint[] {
  const grouped: Record<string, ChartPoint> = {};

  donations.forEach((donation) => {
    const rawDate =
      donation.created_at ?? donation.donation_date ?? donation.date ?? "";

    const date = rawDate ? new Date(rawDate) : new Date();

    const label = date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    });

    if (!grouped[label]) {
      grouped[label] = {
        label,
        total: 0,
        count: 0,
      };
    }

    grouped[label].total += Number(donation.amount ?? 0);
    grouped[label].count += 1;
  });

  return Object.values(grouped).slice(-7);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortCurrency(value: number) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }

  return `$${value.toFixed(0)}`;
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    backgroundColor: "#FFFFFF",
    paddingBottom: "140px",
  },

  pageHeader: {
    width: "calc(100% - 32px)",
    maxWidth: "980px",
    margin: "22px auto 4px",
    padding: "22px",
    border: "5px solid black",
    borderRadius: "30px",
    backgroundColor: "#FFF7E8",
    boxShadow: "5px 5px 0px #000",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 900,
    color: "black",
  },

  pageSubtitle: {
    margin: "10px 0 0",
    fontSize: "16px",
    fontWeight: 700,
    color: "#4B5563",
  },

  pageIcon: {
    width: "clamp(78px, 13vw, 118px)",
    height: "clamp(78px, 13vw, 118px)",
    objectFit: "contain",
    transform: "scale(1.25)",
    transformOrigin: "center",
    filter: "drop-shadow(2px 2px 0px #000)",
  },

  adminCard: {
    width: "calc(100% - 32px)",
    maxWidth: "980px",
    margin: "24px auto",
    padding: "22px",
    border: "5px solid black",
    borderRadius: "30px",
    backgroundColor: "#E9F8FF",
    boxShadow: "5px 5px 0px #000",
    boxSizing: "border-box",
  },

  adminHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 900,
    color: "black",
  },

  sectionSubtitle: {
    margin: "8px 0 0",
    fontSize: "15px",
    fontWeight: 700,
    color: "#4B5563",
  },

  adminBadge: {
    backgroundColor: "#FFDE59",
    color: "black",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "3px solid black",
    fontSize: "14px",
    fontWeight: 900,
    boxShadow: "2px 2px 0px #000",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "18px",
  },

  statCard: {
    border: "4px solid black",
    borderRadius: "22px",
    padding: "16px 12px",
    boxShadow: "3px 3px 0px #000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "175px",
    overflow: "hidden",
    textAlign: "center",
  },

  statIcon: {
    width: "clamp(64px, 9vw, 90px)",
    height: "clamp(64px, 9vw, 90px)",
    objectFit: "contain",
    transformOrigin: "center",
    filter: "drop-shadow(1px 1px 0px #000)",
    flexShrink: 0,
  },

  statValue: {
    display: "block",
    fontSize: "34px",
    fontWeight: 900,
    color: "black",
    lineHeight: 1,
  },

  statLabel: {
    display: "block",
    width: "100%",
    maxWidth: "140px",
    fontSize: "14px",
    fontWeight: 900,
    color: "#111827",
    lineHeight: 1.05,
    whiteSpace: "normal",
    overflowWrap: "break-word",
  },

  moneyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },

  moneyCard: {
    backgroundColor: "#FFFFFF",
    border: "4px solid black",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "3px 3px 0px #000",
  },

  moneyLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: 900,
    color: "#4B5563",
  },

  moneyValue: {
    display: "block",
    marginTop: "8px",
    fontSize: "28px",
    fontWeight: 900,
    color: "black",
  },

  chartCard: {
    marginTop: "18px",
    backgroundColor: "#FFFFFF",
    border: "4px solid black",
    borderRadius: "26px",
    padding: "18px",
    boxShadow: "3px 3px 0px #000",
  },

  feederAdminCard: {
    marginTop: "18px",
    backgroundColor: "#FFF7E8",
    border: "4px solid black",
    borderRadius: "26px",
    padding: "18px",
    boxShadow: "3px 3px 0px #000",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "18px",
  },

  chartTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 900,
    color: "black",
  },

  chartSubtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    fontWeight: 700,
    color: "#6B7280",
  },

  chartIcon: {
    width: "clamp(96px, 15vw, 140px)",
    height: "clamp(96px, 15vw, 140px)",
    objectFit: "contain",
    transform: "scale(1.35)",
    transformOrigin: "center",
    filter: "drop-shadow(2px 2px 0px #000)",
  },

  chartWrapper: {
    width: "100%",
    overflowX: "auto",
    paddingBottom: "4px",
  },

  chartBars: {
    minHeight: "230px",
    display: "flex",
    alignItems: "flex-end",
    gap: "14px",
    padding: "8px 6px 0",
  },

  barColumn: {
    minWidth: "82px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px",
  },

  barValue: {
    fontSize: "12px",
    fontWeight: 900,
    color: "black",
    minHeight: "16px",
  },

  barTrack: {
    width: "46px",
    height: "170px",
    border: "3px solid black",
    borderRadius: "999px",
    backgroundColor: "#FFF7E8",
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
    boxShadow: "2px 2px 0px #000",
  },

  barFill: {
    width: "100%",
    background: "linear-gradient(180deg, #FFDE59 0%, #FF8C42 100%)",
    borderRadius: "999px 999px 0 0",
    transition: "height 0.4s ease",
  },

  barLabel: {
    fontSize: "12px",
    fontWeight: 900,
    color: "#111827",
    whiteSpace: "nowrap",
  },

  emptyChart: {
    border: "3px dashed black",
    borderRadius: "20px",
    padding: "28px",
    textAlign: "center",
    fontSize: "15px",
    fontWeight: 800,
    color: "#4B5563",
    backgroundColor: "#FFF7E8",
  },

  feederForm: {
    marginTop: "18px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  formLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 900,
    color: "black",
  },

  formLabelWide: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 900,
    color: "black",
    gridColumn: "1 / -1",
  },

  input: {
    width: "100%",
    border: "3px solid black",
    borderRadius: "14px",
    padding: "10px 12px",
    fontSize: "15px",
    fontWeight: 800,
    outline: "none",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
  },

  feederMessage: {
    margin: "14px 0 0",
    padding: "10px 12px",
    border: "3px solid black",
    borderRadius: "14px",
    backgroundColor: "#FFD6E8",
    fontSize: "14px",
    fontWeight: 900,
    color: "black",
  },

  createButton: {
    width: "100%",
    marginTop: "16px",
    border: "4px solid black",
    backgroundColor: "#B9F871",
    color: "black",
    padding: "12px 16px",
    borderRadius: "18px",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: "17px",
    boxShadow: "3px 3px 0px #000",
  },

  feedersListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    marginBottom: "14px",
  },

  feedersListTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 900,
    color: "black",
  },

  refreshButton: {
    border: "3px solid black",
    backgroundColor: "#BEEBFF",
    color: "black",
    padding: "8px 12px",
    borderRadius: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "2px 2px 0px #000",
  },

  feedersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },

  feederItem: {
    backgroundColor: "#FFFFFF",
    border: "4px solid black",
    borderRadius: "22px",
    padding: "16px",
    boxShadow: "3px 3px 0px #000",
  },

  feederItemHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },

  feederItemIcon: {
    width: "60px",
    height: "60px",
    objectFit: "contain",
    filter: "drop-shadow(1px 1px 0px #000)",
  },

  feederName: {
    display: "block",
    fontSize: "18px",
    fontWeight: 900,
    color: "black",
  },

  feederId: {
    display: "block",
    marginTop: "4px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#4B5563",
  },

  feederInfoGrid: {
    display: "grid",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#374151",
  },

  donorCard: {
    width: "calc(100% - 32px)",
    maxWidth: "980px",
    margin: "24px auto",
    padding: "22px",
    border: "5px solid black",
    borderRadius: "30px",
    backgroundColor: "#FFF7E8",
    boxShadow: "5px 5px 0px #000",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },

  donorIcon: {
    width: "clamp(78px, 13vw, 118px)",
    height: "clamp(78px, 13vw, 118px)",
    objectFit: "contain",
    transform: "scale(1.45)",
    transformOrigin: "center",
    filter: "drop-shadow(2px 2px 0px #000)",
  },

  donorMiniStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  donorMiniCard: {
    backgroundColor: "#FFFFFF",
    border: "4px solid black",
    borderRadius: "20px",
    padding: "14px",
    boxShadow: "3px 3px 0px #000",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  donorMiniIcon: {
    width: "clamp(58px, 10vw, 82px)",
    height: "clamp(58px, 10vw, 82px)",
    objectFit: "contain",
    filter: "drop-shadow(1px 1px 0px #000)",
  },

  donorValue: {
    display: "block",
    fontSize: "28px",
    fontWeight: 900,
    color: "black",
    lineHeight: 1,
  },

  donorLabel: {
    display: "block",
    marginTop: "5px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#4B5563",
  },
};