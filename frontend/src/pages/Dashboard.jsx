import { useState } from "react";
import TopSidebar from "../components/dashboard/TopSidebar";
import FilterBar from "../components/dashboard/FilterBar";
import BoardTable from "../components/dashboard/BoardTable";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [showPublicar, setShowPublicar] = useState(false);

  // En Bloque 3/4/5 este handler abrirá el modal correspondiente
  const handlePublicar = () => {
    setShowPublicar(true);
    // placeholder: toast('Modal de publicar — disponible en Bloque 3')
    alert("Modal de publicar — se implementa en Bloque 3");
  };

  return (
    <div className={styles.page}>
      {/* Header del dashboard */}
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

      {/* Layout principal: Sidebar + Contenido */}
      <div className={styles.main}>
        {/* Top 10 sidebar */}
        <TopSidebar />

        {/* Contenido central */}
        <div className={styles.content}>
          <FilterBar onPublicar={handlePublicar} />
          <BoardTable onPublicar={handlePublicar} />
        </div>
      </div>
    </div>
  );
}
