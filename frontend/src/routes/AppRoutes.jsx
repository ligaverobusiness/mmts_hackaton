import { Routes, Route } from "react-router-dom";
import WalletGuard from "../components/wallet/WalletGuard";
import Landing from "../pages/Landing";

// Placeholders para bloques futuros — los iremos completando
const Dashboard = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Dashboard — Bloque 2
  </div>
);
const DetalleContrato = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Detalle Contrato — Bloque 3
  </div>
);
const DetalleApuesta = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Detalle Apuesta — Bloque 5
  </div>
);
const DetalleCivico = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Detalle Cívico — Bloque 4
  </div>
);
const MiExpediente = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Mi Expediente — Bloque 6
  </div>
);
const Perfil = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Perfil — Bloque 6
  </div>
);
const AccesoPrivado = () => (
  <div style={{ padding: 40, fontFamily: "Cinzel,serif" }}>
    Acceso Privado — Bloque 7
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/" element={<Landing />} />
      <Route path="/privado/:token" element={<AccesoPrivado />} />

      {/* Protegidas — requieren wallet */}
      <Route
        path="/dashboard"
        element={
          <WalletGuard>
            <Dashboard />
          </WalletGuard>
        }
      />
      <Route
        path="/contrato/:id"
        element={
          <WalletGuard>
            <DetalleContrato />
          </WalletGuard>
        }
      />
      <Route
        path="/apuesta/:id"
        element={
          <WalletGuard>
            <DetalleApuesta />
          </WalletGuard>
        }
      />
      <Route
        path="/civico/:id"
        element={
          <WalletGuard>
            <DetalleCivico />
          </WalletGuard>
        }
      />
      <Route
        path="/expediente"
        element={
          <WalletGuard>
            <MiExpediente />
          </WalletGuard>
        }
      />
      <Route
        path="/perfil/:address"
        element={
          <WalletGuard>
            <Perfil />
          </WalletGuard>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              fontFamily: "Cinzel,serif",
              fontSize: "11px",
              letterSpacing: "4px",
              color: "var(--ink3)",
              textTransform: "uppercase",
            }}
          >
            Página no encontrada
          </div>
        }
      />
    </Routes>
  );
}
