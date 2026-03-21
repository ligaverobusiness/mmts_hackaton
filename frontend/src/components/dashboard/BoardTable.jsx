import { useApp } from "../../context/AppContext";
import BoardRow from "./BoardRow";
import styles from "./BoardTable.module.css";

export default function BoardTable({ onPublicar }) {
  const { entries, isLoading, error } = useApp();

  if (isLoading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p className={styles.stateText}>Cargando el tablero...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.state}>
        <p className={styles.stateText} style={{ color: "var(--red)" }}>
          Error al cargar: {error}
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>+</div>
        <p className={styles.emptyTitle}>Sin registros</p>
        <p className={styles.emptySub}>El tablero est\u00e1 vac\u00edo.</p>
        <button className={styles.emptyBtn} onClick={onPublicar}>
          + Publicar la primera orden
        </button>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {entries.map((e, i) => (
        <BoardRow key={e.address || i} entry={e} index={i} />
      ))}
    </div>
  );
}
