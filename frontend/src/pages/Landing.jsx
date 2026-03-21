import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import styles from "./Landing.module.css";

export default function Landing() {
  const { isConnected, isLoading, connectWallet } = useWallet();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Si ya está conectado → ir al dashboard
  useEffect(() => {
    if (isConnected) navigate("/dashboard", { replace: true });
  }, [isConnected, navigate]);

  const handleConnect = async () => {
    setError("");
    try {
      await connectWallet();
      // El useEffect de arriba se encarga del redirect
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.page}>
      {/* Esquinas decorativas */}
      <div className={`${styles.corner} ${styles.tl}`} />
      <div className={`${styles.corner} ${styles.tr}`} />
      <div className={`${styles.corner} ${styles.bl}`} />
      <div className={`${styles.corner} ${styles.br}`} />

      <div className={styles.content}>
        {/* Eyebrow */}
        <p className={styles.eyebrow}>
          Plataforma descentralizada · Contratos &amp; Mercados
        </p>

        {/* Título */}
        <div className={styles.ornament}>
          <div className={styles.line} />
          <div className={styles.diamond} />
          <div className={`${styles.line} ${styles.lineR}`} />
        </div>
        <h1 className={styles.title}>
          El <span>Tablero</span>
        </h1>
        <div className={styles.ornament}>
          <div className={styles.line} />
          <div className={styles.diamond} />
          <div className={`${styles.line} ${styles.lineR}`} />
        </div>

        {/* Subtítulo */}
        <p className={styles.subtitle}>
          Contratos verificados por IA · Apuestas con escrow real
        </p>
        <p className={styles.description}>
          Publica contratos de trabajo que se pagan automáticamente cuando los
          jueces validan la entrega. Participa en mercados de predicción
          descentralizados. Todo on-chain, sin intermediarios.
        </p>

        {/* Tres pilares */}
        <div className={styles.pillars}>
          <div className={styles.pillar}>
            <span className={styles.pillarIcon}>◆</span>
            <span className={styles.pillarTitle}>Contratos</span>
            <span className={styles.pillarDesc}>
              5 jueces IA evalúan la entrega y liberan el pago automáticamente
            </span>
          </div>
          <div className={styles.pillarDivider} />
          <div className={styles.pillar}>
            <span className={styles.pillarIcon}>◈</span>
            <span className={styles.pillarTitle}>Apuestas</span>
            <span className={styles.pillarDesc}>
              Mercados de predicción con odds dinámicos y pozo compartido
            </span>
          </div>
          <div className={styles.pillarDivider} />
          <div className={styles.pillar}>
            <span className={styles.pillarIcon}>⬡</span>
            <span className={styles.pillarTitle}>Gobernanza</span>
            <span className={styles.pillarDesc}>
              Propuestas cívicas con fondos retenidos hasta que la comunidad
              decida
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className={styles.cta}>
          <button
            className={styles.btnConnect}
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Conectando…
              </>
            ) : (
              "⬡ Conectar MetaMask"
            )}
          </button>
          {error && <p className={styles.error}>{error}</p>}
          {!window.ethereum?.isMetaMask && (
            <p className={styles.noMetaMask}>
              No tienes MetaMask instalado.{" "}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                Instálalo aquí →
              </a>
            </p>
          )}
        </div>

        {/* Footer */}
        <p className={styles.footer}>Powered by GenLayer · Testnet Bradbury</p>
      </div>
    </div>
  );
}
