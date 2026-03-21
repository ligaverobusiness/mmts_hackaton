import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import TopSidebar from "../components/dashboard/TopSidebar";
import FilterBar from "../components/dashboard/FilterBar";
import BoardTable from "../components/dashboard/BoardTable";
import ModalCrearContrato from "../components/modals/ModalCrearContrato";
import ModalCrearCivico from "../components/modals/ModalCrearCivico";
import ModalCrearApuesta from "../components/modals/ModalCrearApuesta";
import WalletButton from "../components/wallet/WalletButton";
import { useApp } from "../context/AppContext";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { filters } = useApp();
  const [showContrato, setShowContrato] = useState(false);
  const [showCivico, setShowCivico] = useState(false);
  const [showApuesta, setShowApuesta] = useState(false);

  const handlePublicar = () => {
    if (filters.type === "civic") setShowCivico(true);
    else if (filters.type === "bet") setShowApuesta(true);
    else setShowContrato(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.hCorner + " " + styles.tl} />
        <div className={styles.hCorner + " " + styles.tr} />
        <div className={styles.headerContent}>
          <div className={styles.eyebrow}>
            Plataforma descentralizada · Contratos &amp; Mercados
          </div>
          <Link to="/dashboard" className={styles.headerLogo}>
            <img src="/minka_logo.png" alt="Minka" className={styles.headerLogoImg} />
          </Link>
          <div className={styles.ornament}>
            <div className={styles.line} />
            <div className={styles.diamond} />
            <div className={`${styles.line} ${styles.lineR}`} />
          </div>
          <p className={styles.sub}>Contratos · Apuestas · Gobernanza</p>
          <div className={styles.headerRight}>
            <WalletButton />
          </div>
        </div>
      </div>

      <Navbar />

      <div className={styles.main}>
        <TopSidebar />
        <div className={styles.content}>
          <FilterBar onPublicar={handlePublicar} />
          <BoardTable onPublicar={handlePublicar} />
        </div>
      </div>

      {showContrato && (
        <ModalCrearContrato onClose={() => setShowContrato(false)} />
      )}
      {showCivico && <ModalCrearCivico onClose={() => setShowCivico(false)} />}
      {showApuesta && (
        <ModalCrearApuesta onClose={() => setShowApuesta(false)} />
      )}
    </div>
  );
}
