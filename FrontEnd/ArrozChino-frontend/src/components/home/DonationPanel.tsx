import { useState } from "react";

type DonationPanelProps = {
  donationsToday: number;
  myDonations: number;
  rescuedCats: number;
  onDonationSuccess: () => void;
};

export default function DonationPanel({
  donationsToday,
  myDonations,
  rescuedCats,
  onDonationSuccess,
}: DonationPanelProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  function handleOpenPayment() {
    setIsPaymentOpen(true);
  }

  function handleClosePayment() {
    if (isProcessing) return;
    setIsPaymentOpen(false);
  }

  function handleSimulatedPayment() {
    setIsProcessing(true);

    window.setTimeout(() => {
      onDonationSuccess();
      setIsProcessing(false);
      setIsPaymentOpen(false);
    }, 1200);
  }

  return (
    <section
      style={{
        width: "100%",
        padding: "8px 16px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Donaciones hoy */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px 18px",
            border: "4px solid black",
            borderRadius: "24px",
            backgroundColor: "#FFFFFF",
            boxShadow: "4px 4px 0px #000",
          }}
        >
          <img
            src="/icono5.png"
            alt="Icono de donaciones"
            style={{
              width: "clamp(42px, 9vw, 100px)",
              height: "clamp(42px, 9vw, 100px)",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(1px 1px 0px #000)",
            }}
          />

          <p
            style={{
              margin: 0,
              fontSize: "clamp(22px, 5vw, 34px)",
              fontWeight: 900,
              color: "black",
            }}
          >
            {donationsToday} donaciones hoy
          </p>
        </div>

        {/* Botón Donar Ahora */}
        <button
          type="button"
          onClick={handleOpenPayment}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "18px 24px",
            border: "4px solid black",
            borderRadius: "28px",
            backgroundColor: "#B8F45A",
            boxShadow: "5px 5px 0px #000",
            cursor: "pointer",
            transition: "transform 160ms ease, box-shadow 160ms ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "scale(1.02) rotate(-1deg)";
            event.currentTarget.style.boxShadow = "7px 7px 0px #000";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "scale(1)";
            event.currentTarget.style.boxShadow = "5px 5px 0px #000";
          }}
        >
          <img
            src="/icono2.png"
            alt="Icono donar"
            style={{
              width: "clamp(50px, 10vw, 120px)",
              height: "clamp(50px, 10vw, 120px)",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(2px 2px 0px #000)",
            }}
          />

          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "clamp(34px, 8vw, 58px)",
              lineHeight: 1,
              fontWeight: 900,
              color: "black",
            }}
          >
            Donar Ahora
          </span>

          <span
            style={{
              fontSize: "clamp(34px, 8vw, 54px)",
              lineHeight: 1,
              fontWeight: 900,
              color: "black",
            }}
          >
            ›
          </span>
        </button>

        {/* Estadísticas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <StatCard
            background="#FFB7D8"
            iconSrc="/icono2.png"
            value={myDonations}
            label="Tus donaciones"
          />

          <StatCard
            background="#BDEEFF"
            iconSrc="/logoPng.png"
            value={rescuedCats}
            label="Gatos rescatados"
          />
        </div>
      </div>

      {isPaymentOpen && (
        <PaymentSimulationModal
          isProcessing={isProcessing}
          onClose={handleClosePayment}
          onConfirm={handleSimulatedPayment}
        />
      )}
    </section>
  );
}

type StatCardProps = {
  background: string;
  iconSrc: string;
  value: number;
  label: string;
};

function StatCard({ background, iconSrc, value, label }: StatCardProps) {
  return (
    <div
      style={{
        minHeight: "112px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px",
        border: "4px solid black",
        borderRadius: "24px",
        backgroundColor: background,
        boxShadow: "4px 4px 0px #000",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "clamp(54px, 12vw, 178px)",
          height: "clamp(54px, 12vw, 178px)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "4px solid black",
          borderRadius: "999px",
          backgroundColor: "#FFFDF7",
          overflow: "hidden",
        }}
      >
        <img
          src={iconSrc}
          alt={label}
          style={{
            width: "90%",
            height: "90%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "clamp(34px, 8vw, 56px)",
            lineHeight: 0.9,
            fontWeight: 900,
            color: "black",
          }}
        >
          {value}
        </p>

        <p
          style={{
            margin: "8px 0 0",
            fontSize: "clamp(14px, 3.4vw, 22px)",
            lineHeight: 1,
            fontWeight: 900,
            color: "black",
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

type PaymentSimulationModalProps = {
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function PaymentSimulationModal({
  isProcessing,
  onClose,
  onConfirm,
}: PaymentSimulationModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "22px",
          border: "4px solid black",
          borderRadius: "28px",
          backgroundColor: "#FFFDF7",
          boxShadow: "6px 6px 0px #000",
          textAlign: "center",
        }}
      >
        <img
          src="/icono2.png"
          alt="Icono de donación"
          style={{
            width: "186px",
            height: "186px",
            objectFit: "contain",
            display: "block",
            margin: "0 auto",
            filter: "drop-shadow(2px 2px 0px #000)",
          }}
        />

        <h2
          style={{
            margin: "12px 0 0",
            fontSize: "30px",
            fontWeight: 900,
            color: "black",
          }}
        >
          Simulación de pago
        </h2>

        <p
          style={{
            margin: "10px 0 0",
            fontSize: "16px",
            fontWeight: 700,
            color: "#4B5563",
          }}
        >
          Esta acción simula una donación exitosa. Luego se conectará con el
          servicio real de pagos.
        </p>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: "12px",
              border: "3px solid black",
              borderRadius: "18px",
              backgroundColor: "#FFFFFF",
              color: "black",
              fontWeight: 900,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: "12px",
              border: "3px solid black",
              borderRadius: "18px",
              backgroundColor: "#B8F45A",
              color: "black",
              fontWeight: 900,
              cursor: isProcessing ? "wait" : "pointer",
              boxShadow: "3px 3px 0px #000",
            }}
          >
            {isProcessing ? "Procesando..." : "Pagar"}
          </button>
        </div>
      </div>
    </div>
  );
}