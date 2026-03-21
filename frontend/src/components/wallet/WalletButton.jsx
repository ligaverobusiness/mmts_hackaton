import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../../context/WalletContext";
import { shortenAddress } from "../../services/wallet";
import styles from "./WalletButton.module.css";

export default function WalletButton() {
  const {
    address,
    isConnected,
    isLoading,
    balance,
    connectWallet,
    disconnectWallet,
  } = useWallet();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const navigate = useNavigate();

  // Cierra el dropdown si click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConnect = async () => {
    setError("");
    try {
      await connectWallet();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.wrap}>
        <button
          className={styles.btnConnect}
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            "⬡ Conectar Wallet"
          )}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    );
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.btnAddress} onClick={() => setOpen((o) => !o)}>
        <span className={styles.dot} />
        {shortenAddress(address)}
        <span className={styles.caret}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <span className={styles.dropAddr}>{shortenAddress(address)}</span>
            <span className={styles.dropBal}>{balance} ETH</span>
          </div>
          <div className={styles.dropDivider} />
          <button
            className={styles.dropItem}
            onClick={() => {
              navigate("/expediente");
              setOpen(false);
            }}
          >
            Mi Expediente
          </button>
          <button
            className={styles.dropItem}
            onClick={() => {
              navigate(`/perfil/${address}`);
              setOpen(false);
            }}
          >
            Mi Perfil
          </button>
          <div className={styles.dropDivider} />
          <button
            className={`${styles.dropItem} ${styles.dropItemDanger}`}
            onClick={() => {
              disconnectWallet();
              setOpen(false);
            }}
          >
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
}
