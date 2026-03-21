import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { resolverToken } from "../services/privado";
import styles from "./AccesoPrivado.module.css";

export default function AccesoPrivado() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isConnected, connectWallet } = useWallet();

  const [estado, setEstado] = useState("loading"); // loading | ok | error | noWallet
  const [recurso, setRecurso] = useState(null);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setError("Token no válido");
      return;
    }

    const resolver = async () => {
      try {
        const data = await resolverToken(token);
        setRecurso(data);

        if (!isConnected) {
          setEstado("noWallet");
        } else {
          setEstado("ok");
          // Redirige automáticamente
          const ruta =
            data.tipo === "contract"
              ? `/contrato/${data.address}`
              : data.tipo === "bet"
                ? `/apuesta/${data.address}`
                : `/civico/${data.address}`;
          navigate(ruta, { replace: true });
        }
      } catch (_) {
        setEstado("error");
        setError("Este link privado no existe o ya no es válido.");
      }
    };

    resolver();
  }, [token, isConnected]);

  // Si wallet se conecta después, redirige
  useEffect(() => {
    if (isConnected && recurso) {
      const ruta =
        recurso.tipo === "contract"
          ? `/contrato/${recurso.address}`
          : recurso.tipo === "bet"
            ? `/apuesta/${recurso.address}`
            : `/civico/${recurso.address}`;
      navigate(ruta, { replace: true });
    }
  }, [isConnected, recurso]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (_) {
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Esquinas */}
        <div className={`${styles.corner} ${styles.tl}`} />
        <div className={`${styles.corner} ${styles.tr}`} />
        <div className={`${styles.corner} ${styles.bl}`} />
        <div className={`${styles.corner} ${styles.br}`} />

        <div className={styles.logo}>
          El <span>Tablero</span>
        </div>

        {/* Loading */}
        {estado === "loading" && (
          <>
            <div className={styles.spinner} />
            <div className={styles.title}>Verificando acceso…</div>
            <p className={styles.desc}>Comprobando el link privado</p>
          </>
        )}

        {/* Sin wallet */}
        {estado === "noWallet" && (
          <>
            <div className={styles.icon}>⬡</div>
            <div className={styles.title}>Acceso Privado</div>
            <p className={styles.desc}>
              Este contenido es privado. Conecta tu wallet para acceder.
            </p>
            <div className={styles.tipo}>
              {recurso?.tipo === "contract" && "Contrato privado"}
              {recurso?.tipo === "bet" && "Apuesta privada"}
              {recurso?.tipo === "civic" && "Propuesta cívica privada"}
            </div>
            <button
              className={styles.btnConnect}
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <span className={styles.spinnerSm} /> Conectando…
                </>
              ) : (
                "⬡ Conectar MetaMask"
              )}
            </button>
          </>
        )}

        {/* Error */}
        {estado === "error" && (
          <>
            <div className={styles.iconError}>✗</div>
            <div className={styles.title}>Link no válido</div>
            <p className={styles.desc}>{error}</p>
            <button className={styles.btnBack} onClick={() => navigate("/")}>
              Volver al inicio →
            </button>
          </>
        )}

        {/* Ok — se redirige automáticamente */}
        {estado === "ok" && (
          <>
            <div className={styles.iconOk}>✓</div>
            <div className={styles.title}>Acceso concedido</div>
            <p className={styles.desc}>Redirigiendo…</p>
          </>
        )}
      </div>
    </div>
  );
}
