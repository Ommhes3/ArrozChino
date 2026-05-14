type NavItem = {
  label: string;
  href: string;
  iconSrc: string;
  scale?: number;
};

const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/",
    iconSrc: "/icono1.png",
    scale: 1.55,
  },
  {
    label: "Donar",
    href: "/donar",
    iconSrc: "/icono2.png",
    scale: 1.55,
  },
  {
    label: "Historial",
    href: "/historial",
    iconSrc: "/icono3.png",
    scale: 1.55,
  },
  {
    label: "WikiCATS",
    href: "/wikicats",
    iconSrc: "/icono4.png",
    scale: 1.12,
  },
  {
    label: "Impacto",
    href: "/impacto",
    iconSrc: "/icono5.png",
    scale: 1.28,
  },
];

type NavbarProps = {
  active?: string;
};

export default function Navbar({ active = "Inicio" }: NavbarProps) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        padding: "8px 12px 12px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "4px",
          padding: "12px 10px 14px",
          border: "4px solid black",
          borderRadius: "28px",
          backgroundColor: "#FFFFFF",
          boxShadow: "5px 5px 0px #000",
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        {navItems.map((item) => {
          const isActive = item.label === active;
          const baseScale = item.scale ?? 1;

          return (
            <a
              key={item.label}
              href={item.href}
              aria-label={item.label}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                minWidth: 0,
                textDecoration: "none",
                color: "black",
                fontWeight: 900,
                overflow: "visible",
              }}
            >
              <img
                src={item.iconSrc}
                alt={item.label}
                style={{
                  width: "clamp(58px, 10vw, 82px)",
                  height: "clamp(58px, 10vw, 82px)",
                  objectFit: "contain",
                  display: "block",
                  transform: `scale(${isActive ? baseScale + 0.08 : baseScale})`,
                  transformOrigin: "center",
                  transition:
                    "transform 180ms ease, filter 180ms ease",
                  filter: isActive
                    ? "drop-shadow(2px 2px 0px #000)"
                    : "drop-shadow(1px 1px 0px #000)",
                  cursor: "pointer",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = `scale(${baseScale + 0.35}) rotate(-4deg)`;
                  event.currentTarget.style.filter =
                    "drop-shadow(3px 3px 0px #000)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = `scale(${
                    isActive ? baseScale + 0.08 : baseScale
                  })`;
                  event.currentTarget.style.filter = isActive
                    ? "drop-shadow(2px 2px 0px #000)"
                    : "drop-shadow(1px 1px 0px #000)";
                }}
              />

              <span
                style={{
                  fontSize: "clamp(12px, 2.8vw, 18px)",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: "black",
                  fontWeight: 900,
                }}
              >
                {item.label}
              </span>

              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: "16%",
                    right: "16%",
                    bottom: "-8px",
                    height: "7px",
                    borderRadius: "999px",
                    backgroundColor: "#39B54A",
                  }}
                />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}