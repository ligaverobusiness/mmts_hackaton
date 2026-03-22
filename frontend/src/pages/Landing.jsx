import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import styles from "./Landing.module.css";

export default function Landing() {
  const { isConnected, isLoading, connectWallet } = useWallet();
  const [error, setError] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const logoRef = useRef(null);

  useEffect(() => {
    if (isConnected && !transitioning) {
      setTransitioning(true);
      // Wait for the logo animation + wipe to finish before navigating
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1800);
    }
  }, [isConnected, navigate, transitioning]);

  const handleConnect = async () => {
    setError("");
    try {
      await connectWallet();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className={`${styles.page} ${transitioning ? styles.transitioning : ""}`}
    >
      {/* Video background */}
      <video
        className={styles.videoBg}
        src="/1115482_Woman_Indoor_3840x2160.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Dark overlay */}
      <div className={styles.overlay} />

      {/* Floating particles */}
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Eyebrow */}
        <p
          className={`${styles.eyebrow} ${transitioning ? styles.fadeOutUp : ""}`}
        >
          Plataforma descentralizada · Contratos &amp; Mercados
        </p>

        {/* Logo */}
        <div
          ref={logoRef}
          className={`${styles.logoWrap} ${transitioning ? styles.logoTransition : ""}`}
        >
          <img src="/miske_logo.png" alt="Miske" className={styles.logo} />
        </div>

        {/* Subtitle */}
        <p
          className={`${styles.subtitle} ${transitioning ? styles.fadeOutUp : ""}`}
        >
          Contratos · Apuestas · Gobernanza
        </p>

        {/* CTA */}
        <div
          className={`${styles.cta} ${transitioning ? styles.fadeOutDown : ""}`}
        >
          <button
            className={styles.btnConnect}
            onClick={handleConnect}
            disabled={isLoading || transitioning}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Conectando…
              </>
            ) : transitioning ? (
              <>
                <span className={styles.checkmark}>✓</span>
                Conectado
              </>
            ) : (
              <>
                <span className={styles.walletIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="6" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                    <circle cx="18" cy="14" r="1" />
                  </svg>
                </span>
                Conectar MetaMask
              </>
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
        <p
          className={`${styles.footer} ${transitioning ? styles.fadeOutDown : ""}`}
        >
          Powered by GenLayer · Testnet Bradbury
        </p>
      </div>

      {/* Screen wipe overlay for transition */}
      {transitioning && <div className={styles.wipe} />}
    </div>
  );
}
