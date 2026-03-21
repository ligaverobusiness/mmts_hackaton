import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";

export default function WalletGuard({ children }) {
  const { isConnected, isLoading } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Espera a que termine el intento de reconexión automática
    if (isLoading) return;
    if (!isConnected) {
      navigate("/", { replace: true, state: { from: location.pathname } });
    }
  }, [isConnected, isLoading, navigate, location]);

  // Mientras verifica la reconexión automática
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--paper)",
          fontFamily: "Cinzel, serif",
          fontSize: "10px",
          letterSpacing: "4px",
          color: "var(--ink3)",
          textTransform: "uppercase",
        }}
      >
        Verificando wallet…
      </div>
    );
  }

  if (!isConnected) return null;

  return children;
}
