type HeaderProps = {
  isLive?: boolean;
  logoSrc?: string;
};

export default function Header({
  isLive = true,
  logoSrc = "/logoPng.png",
}: HeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "8px 12px 12px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 12px",
          border: "4px solid black",
          borderRadius: "26px",
          backgroundColor: "#FFFFFF",
          boxShadow: "5px 5px 0px #000",
          boxSizing: "border-box",
        }}
      >
        {/* Logo + textos */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
            flex: "1 1 auto",
          }}
        >
          <a
  href="/"
  aria-label="Ir al inicio"
  style={{
    flexShrink: 0,
    display: "block",
    lineHeight: 0,
    cursor: "pointer",
    overflow: "visible",
  }}
>
  <img
    src={logoSrc}
    alt="Logo gatito"
    style={{
      width: "clamp(58px, 13vw, 105px)",
      height: "clamp(58px, 13vw, 105px)",
      objectFit: "contain",
      display: "block",
      transform: "scale(1)",
      transformOrigin: "center",
      transition: "transform 180ms ease, filter 180ms ease",
      filter: "drop-shadow(1px 1px 0px #000)",
    }}
    onMouseEnter={(event) => {
      event.currentTarget.style.transform = "scale(1.22) rotate(-4deg)";
      event.currentTarget.style.filter = "drop-shadow(3px 3px 0px #000)";
    }}
    onMouseLeave={(event) => {
      event.currentTarget.style.transform = "scale(1)";
      event.currentTarget.style.filter = "drop-shadow(1px 1px 0px #000)";
    }}
  />
</a>

          <div
            style={{
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(22px, 5vw, 34px)",
                lineHeight: 1,
                fontWeight: 900,
                color: "black",
                whiteSpace: "nowrap",
              }}
            >
              Bienvenido
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: "clamp(13px, 3.2vw, 18px)",
                lineHeight: 1,
                fontWeight: 900,
                color: isLive ? "#2E9E42" : "#6B7280",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {isLive ? "Transmisión en vivo" : "Transmisión pausada"}
            </p>
          </div>
        </div>

        {/* Estado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "clamp(7px, 2vw, 10px) clamp(9px, 2.5vw, 14px)",
            border: "3px solid black",
            borderRadius: "18px",
            backgroundColor: "white",
            boxShadow: "2px 2px 0px #000",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "clamp(9px, 2.5vw, 12px)",
              height: "clamp(9px, 2.5vw, 12px)",
              borderRadius: "999px",
              backgroundColor: isLive ? "#39B54A" : "#9CA3AF",
            }}
          />

          <span
            style={{
              fontSize: "clamp(12px, 3vw, 16px)",
              fontWeight: 900,
              color: "black",
              whiteSpace: "nowrap",
            }}
          >
            {isLive ? "En vivo" : "Descanso"}
          </span>
        </div>
      </div>
    </header>
  );
}