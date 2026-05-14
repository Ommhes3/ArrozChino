import { useMemo } from "react";
import { getCurrentUser, logoutUser } from "../../services/userService";

type HeaderProps = {
  logoSrc?: string;
  isLive?: boolean;
};

const guestPhrases = [
  "¡Bienvenido!",
  "¡Mira esos michis!",
  "¡Comedero online!",
  "¡Donar da suerte!",
  "¡Miau en vivo!",
  "¡Hay un perro infiltrado!",
  "¿¡Sabias que Nicol es lesbiana!?",
];

const userPhrases = [
  "¡Hola, {name}!",
  "¡Bienvenido, {name}!",
  "¡Qué hubo, {name}!",
  "¡Michi te saluda, {name}!",
  "¡A donar, {name}!",
  "¡Gracias por volver, {name}!",
  "¡Hay un perro infiltrado, {name}!",
  "¿¡Sabias!? Nicol es lesbiana, {name}",
];

function getRandomItem(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export default function Header({
  logoSrc = "/logoPng.png",
  isLive = true,
}: HeaderProps) {
  const currentUser = getCurrentUser();

  const splashText = useMemo(() => {
    if (currentUser) {
      return getRandomItem(userPhrases).replace("{name}", currentUser.name);
    }

    return getRandomItem(guestPhrases);
  }, [currentUser?.user_id]);

  function handleLogout() {
    logoutUser();
    window.location.href = "/login";
  }

  return (
    <header
      style={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "10px 12px",
        backgroundColor: "#FFFFFF",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 14px",
          border: "4px solid black",
          borderRadius: "24px",
          backgroundColor: "#FFFDF7",
          boxShadow: "5px 5px 0px #000",
          boxSizing: "border-box",
        }}
      >
        {/* Logo + texto */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "black",
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <img
            src={logoSrc}
            alt="Logo gato"
            style={{
              width: "62px",
              height: "62px",
              objectFit: "contain",
              flexShrink: 0,
              transition: "transform 160ms ease",
              filter: "drop-shadow(2px 2px 0px #000)",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "scale(1.14) rotate(-4deg)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "scale(1) rotate(0deg)";
            }}
          />

          <div
            style={{
              minWidth: 0,
              position: "relative",
              paddingTop: "4px",
            }}
          >
            {/* Texto estilo Minecraft splash */}
            <h1
              className="minecraft-splash"
              style={{
                margin: 0,
                color: "#FFE600",
                fontSize: "20px",
                fontWeight: 800,
                lineHeight: 1,
                whiteSpace: "nowrap",
                textShadow:
                  "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000",
                letterSpacing: "-0.5px",
              }}
            >
              {splashText}
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: isLive ? "#2E9E42" : "#6B7280",
                fontSize: "14px",
                fontWeight: 900,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {isLive ? "Transmisión en vivo" : "Modo descanso"}
            </p>
          </div>
        </a>

        {/* Estado + sesión */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 10px",
              border: "3px solid black",
              borderRadius: "18px",
              backgroundColor: "#FFFFFF",
              boxShadow: "2px 2px 0px #000",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                backgroundColor: isLive ? "#39B54A" : "#9CA3AF",
              }}
            />

            <span
              style={{
                color: "black",
                fontSize: "13px",
                fontWeight: 900,
                whiteSpace: "nowrap",
              }}
            >
              {isLive ? "En vivo" : "Descanso"}
            </span>
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "8px 10px",
                border: "3px solid black",
                borderRadius: "18px",
                backgroundColor: "#FFB7D8",
                color: "black",
                fontSize: "13px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "2px 2px 0px #000",
                transition: "transform 160ms ease, box-shadow 160ms ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                  "scale(1.05) rotate(-1deg)";
                event.currentTarget.style.boxShadow = "3px 3px 0px #000";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "scale(1)";
                event.currentTarget.style.boxShadow = "2px 2px 0px #000";
              }}
            >
              Salir
            </button>
          ) : (
            <a
              href="/login"
              style={{
                padding: "8px 10px",
                border: "3px solid black",
                borderRadius: "18px",
                backgroundColor: "#BDEEFF",
                color: "black",
                fontSize: "13px",
                fontWeight: 900,
                textDecoration: "none",
                boxShadow: "2px 2px 0px #000",
                transition: "transform 160ms ease, box-shadow 160ms ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                  "scale(1.05) rotate(-1deg)";
                event.currentTarget.style.boxShadow = "3px 3px 0px #000";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "scale(1)";
                event.currentTarget.style.boxShadow = "2px 2px 0px #000";
              }}
            >
              Ingresar
            </a>
          )}
        </div>
      </div>

      <style>
  {`
    @keyframes splashPulse {
      0% {
        transform: scale(1);
      }

      50% {
        transform: scale(1.08);
      }

      100% {
        transform: scale(1);
      }
    }

    .minecraft-splash {
      animation: splashPulse 1.3s ease-in-out infinite;
      display: inline-block;
    }

    @media (max-width: 560px) {
      .minecraft-splash {
        font-size: 10px !important;
        max-width: 135px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `}
</style>
    </header>
  );
}