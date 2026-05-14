import { useState } from "react";
import type { CSSProperties, SyntheticEvent } from "react";
import { registerUser, saveSession } from "../services/userService";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const data = await registerUser({
        name,
        email,
        password,
        role: "donor",
      });

      saveSession(data.user);
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el usuario"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={headerStyle}>
          <a href="/" style={logoLinkStyle}>
            <img src="/logoPng.png" alt="Logo gato" style={logoStyle} />
          </a>

          <h1 style={titleStyle}>Crear cuenta</h1>

          <p style={subtitleStyle}>
            Regístrate para apoyar a los gatitos
          </p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            Nombre
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Tu nombre"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="correo@test.com"
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
              minLength={6}
              placeholder="Mínimo 6 caracteres"
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
              event.currentTarget.style.transform = "scale(1.02) rotate(-1deg)";
              event.currentTarget.style.boxShadow = "6px 6px 0px #000";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "scale(1)";
              event.currentTarget.style.boxShadow = "4px 4px 0px #000";
            }}
          >
            {isLoading ? "Creando..." : "Registrarme"}
          </button>
        </form>

        <p style={footerTextStyle}>
          ¿Ya tienes cuenta?{" "}
          <a href="/login" style={linkStyle}>
            Inicia sesión
          </a>
        </p>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "460px",
  padding: "24px",
  border: "4px solid black",
  borderRadius: "30px",
  backgroundColor: "#FFFDF7",
  boxShadow: "6px 6px 0px #000",
  boxSizing: "border-box",
};

const headerStyle: CSSProperties = {
  textAlign: "center",
  marginBottom: "20px",
};

const logoLinkStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 0,
};

const logoStyle: CSSProperties = {
  width: "110px",
  height: "110px",
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
  fontWeight: 700,
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
  backgroundColor: "#FFFFFF",
  color: "black",
  fontSize: "16px",
  fontWeight: 700,
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
  fontWeight: 800,
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
  fontWeight: 800,
  color: "black",
};

const linkStyle: CSSProperties = {
  color: "#2E9E42",
  fontWeight: 900,
};