import { Routes, Route } from "react-router-dom";
import WalletGuard from "../components/wallet/WalletGuard";
import Layout from "../components/layout/Layout";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import DetalleContrato from "../pages/DetalleContrato";

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

function Protected({ children }) {
  return (
    <WalletGuard>
      <Layout>{children}</Layout>
    </WalletGuard>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privado/:token" element={<AccesoPrivado />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/contrato/:id"
        element={
          <Protected>
            <DetalleContrato />
          </Protected>
        }
      />
      <Route
        path="/apuesta/:id"
        element={
          <Protected>
            <DetalleApuesta />
          </Protected>
        }
      />
      <Route
        path="/civico/:id"
        element={
          <Protected>
            <DetalleCivico />
          </Protected>
        }
      />
      <Route
        path="/expediente"
        element={
          <Protected>
            <MiExpediente />
          </Protected>
        }
      />
      <Route
        path="/perfil/:address"
        element={
          <Protected>
            <Perfil />
          </Protected>
        }
      />
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
