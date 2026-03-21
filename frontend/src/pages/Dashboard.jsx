import { useState } from "react";
import TopSidebar from "../components/dashboard/TopSidebar";
import FilterBar from "../components/dashboard/FilterBar";
import BoardTable from "../components/dashboard/BoardTable";
import ModalCrearContrato from "../components/modals/ModalCrearContrato";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [showModalContrato, setShowModalContrato] = useState(false);

  const handlePublicar = () => setShowModalContrato(true);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.hCorner + " " + styles.tl} />
        <div className={styles.hCorner + " " + styles.tr} />
        <div className={styles.eyebrow}>
          Plataforma descentralizada · Contratos &amp; Mercados
        </div>
        <h1 className={styles.title}>
          El <span>Tablero</span>
        </h1>
        <div className={styles.ornament}>
          <div className={styles.line} />
          <div className={styles.diamond} />
          <div className={`${styles.line} ${styles.lineR}`} />
        </div>
        <p className={styles.sub}>Contratos · Apuestas · Gobernanza</p>
      </div>

      <div className={styles.main}>
        <TopSidebar />
        <div className={styles.content}>
          <FilterBar onPublicar={handlePublicar} />
          <BoardTable onPublicar={handlePublicar} />
        </div>
      </div>

      {showModalContrato && (
        <ModalCrearContrato onClose={() => setShowModalContrato(false)} />
      )}
    </div>
  );
}
