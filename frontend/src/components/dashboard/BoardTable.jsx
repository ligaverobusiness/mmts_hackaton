import { useApp } from "../../context/AppContext";
import BoardRow from "./BoardRow";
import styles from "./BoardTable.module.css";

export default function BoardTable({ onPublicar }) {
  const { entries, isLoading, error } = useApp();

  if (isLoading) {
    return (
      <div className={styles.state}>
        <div className={styles.spinner} />
        <p className={styles.stateText}>Cargando el tablero…</p>
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
        <p className={styles.emptyTitle}>Sin registros</p>
        <p className={styles.emptySub}>El tablero está vacío.</p>
        <button className={styles.emptyBtn} onClick={onPublicar}>
          ＋ Publicar la primera orden
        </button>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th>Nº</th>
            <th>Título / Evento</th>
            <th>Tipo</th>
            <th>Monto / Pozo</th>
            <th>Estado</th>
            <th>Categoría</th>
            <th>Vence en</th>
            <th>Part.</th>
            <th>Vis.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <BoardRow key={e.address} entry={e} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
