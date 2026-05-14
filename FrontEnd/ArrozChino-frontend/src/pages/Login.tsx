import { useEffect, useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import { loginUser, saveSession } from "../services/userService";

const videos = ["/stream.mp4", "/stream1.mp4", "/stream2.mp4"];

export default function Login() {
  const [email, setEmail] = useState("demo@test.com");
  const [password, setPassword] = useState("123456");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 9000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await loginUser({
        email,
        password,
      });

      saveSession(data.user);
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo iniciar sesión"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <section className="login-shell" style={shellStyle}>
        {/* Izquierda: formulario */}
        <div style={formColumnStyle}>
          <div style={headerStyle}>
            <a href="/" style={logoLinkStyle}>
              <img src="/logoPng.png" alt="Logo gato" style={logoStyle} />
            </a>

            <h1 style={titleStyle}>Iniciar sesión</h1>

            <p style={subtitleStyle}>Entra para donar y ver tus aportes</p>
          </div>

          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={labelStyle}>
              Correo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="demo@test.com"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Tu contraseña"
                style={inputStyle}
              />
            </label>

            {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...buttonStyle,
                cursor: isLoading ? "wait" : "pointer",
                opacity: isLoading ? 0.8 : 1,
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                  "scale(1.02) rotate(-1deg)";
                event.currentTarget.style.boxShadow = "6px 6px 0px #000";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "scale(1)";
                event.currentTarget.style.boxShadow = "4px 4px 0px #000";
              }}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p style={footerTextStyle}>
            ¿No tienes cuenta?{" "}
            <a href="/register" style={linkStyle}>
              Regístrate
            </a>
          </p>
        </div>

        {/* Derecha: TV */}
        <div className="login-tv-column" style={tvColumnStyle}>
          <div style={tvWrapperStyle}>
            <div style={videoScreenStyle}>
              <video
                key={videos[currentVideo]}
                src={videos[currentVideo]}
                autoPlay
                muted
                loop
                playsInline
                style={videoStyle}
              />

              <div style={scanLineStyle} />
            </div>

            <img
              src="/tvPng.png"
              alt="Televisor antiguo"
              style={tvImageStyle}
            />
          </div>

          <div style={tvTextBoxStyle}>
            <p style={tvTitleStyle}>Transmisión Michi</p>
            <p style={tvSubtitleStyle}>Conecta para apoyar el comedero</p>
          </div>
        </div>
      </section>

      <style>
        {`
          @media (max-width: 860px) {
            .login-shell {
              grid-template-columns: 1fr !important;
              max-width: 520px !important;
              gap: 18px !important;
            }

            .login-tv-column {
              align-items: center !important;
            }
          }
        `}
      </style>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  backgroundColor: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box",
};

const shellStyle: CSSProperties = {
  width: "100%",
  maxWidth: "980px",
  minHeight: "560px",
  display: "grid",
  gridTemplateColumns: "0.85fr 1.15fr",
  alignItems: "center",
  gap: "28px",
  padding: "28px",
  border: "5px solid black",
  borderRadius: "36px",
  backgroundColor: "#FFFDF7",
  boxShadow: "8px 8px 0px #000",
  boxSizing: "border-box",
};

const formColumnStyle: CSSProperties = {
  width: "100%",
  padding: "22px",
  border: "4px solid black",
  borderRadius: "30px",
  backgroundColor: "#FFFFFF",
  boxShadow: "5px 5px 0px #000",
  boxSizing: "border-box",
};

const tvColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  minWidth: 0,
};

const tvWrapperStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "520px",
  aspectRatio: "1 / 0.9",
};

const videoScreenStyle: CSSProperties = {
  position: "absolute",
  left: "13.5%",
  top: "26.5%",
  width: "43%",
  height: "36%",
  borderRadius: "28px",
  overflow: "hidden",
  backgroundColor: "#000000",
  zIndex: 1,
};

const videoStyle: CSSProperties = {
  width: "110%",
  height: "110%",
  objectFit: "cover",
  display: "block",
  filter: "saturate(1.15) contrast(1.05)",
};

const scanLineStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "repeating-linear-gradient(0deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px)",
  mixBlendMode: "screen",
};

const tvImageStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  zIndex: 2,
  pointerEvents: "none",
  filter: "drop-shadow(5px 5px 0px #000)",
};

const tvTextBoxStyle: CSSProperties = {
  width: "100%",
  maxWidth: "430px",
  padding: "12px 16px",
  border: "4px solid black",
  borderRadius: "22px",
  backgroundColor: "#BDEEFF",
  boxShadow: "4px 4px 0px #000",
  textAlign: "center",
};

const tvTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 900,
  color: "black",
};

const tvSubtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "14px",
  fontWeight: 800,
  color: "#2E9E42",
};

const headerStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
};

const logoLinkStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 0,
  transition: "transform 160ms ease",
};

const logoStyle: CSSProperties = {
  width: "105px",
  height: "105px",
  objectFit: "contain",
  filter: "drop-shadow(2px 2px 0px #000)",
};

const titleStyle: CSSProperties = {
  margin: "10px 0 0",
  fontSize: "34px",
  fontWeight: 900,
  color: "black",
  lineHeight: 1,
};

const subtitleStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "16px",
  fontWeight: 800,
  color: "#2E9E42",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "15px",
  fontWeight: 900,
  color: "black",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "3px solid black",
  borderRadius: "18px",
  backgroundColor: "#FFFDF7",
  color: "black",
  fontSize: "16px",
  fontWeight: 800,
  outline: "none",
  boxSizing: "border-box",
};

const errorStyle: CSSProperties = {
  margin: 0,
  padding: "10px 12px",
  border: "3px solid black",
  borderRadius: "16px",
  backgroundColor: "#FFB7D8",
  color: "black",
  fontWeight: 900,
  fontSize: "14px",
};

const buttonStyle: CSSProperties = {
  marginTop: "8px",
  width: "100%",
  padding: "14px 18px",
  border: "4px solid black",
  borderRadius: "22px",
  backgroundColor: "#B8F45A",
  color: "black",
  fontSize: "22px",
  fontWeight: 900,
  boxShadow: "4px 4px 0px #000",
  transition: "transform 160ms ease, box-shadow 160ms ease",
};

const footerTextStyle: CSSProperties = {
  margin: "18px 0 0",
  textAlign: "center",
  fontSize: "15px",
  fontWeight: 900,
  color: "black",
};

const linkStyle: CSSProperties = {
  color: "#2E9E42",
  fontWeight: 900,
};