import { useNavigate } from "react-router-dom";
import Badge from "../ui/Badge";
import OddsBar from "../ui/OddsBar";
import Countdown from "../ui/Countdown";
import styles from "./BoardRow.module.css";

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const TYPE_LABELS = {
  contract: { label: "CONTRATO", cls: "contract" },
  bet: { label: "APUESTA", cls: "bet" },
  civic: { label: "CÍVICO", cls: "civic" },
};

export default function BoardRow({ entry, index }) {
  const navigate = useNavigate();
  const typeCfg = TYPE_LABELS[entry.type] || TYPE_LABELS.contract;

  const isActive = entry.status === "open" || entry.status === "pending";
  const canAbort = entry.participants === 0 && isActive;
  const routePath =
    entry.type === "bet"
      ? `/apuesta/${entry.address}`
      : entry.type === "civic"
        ? `/civico/${entry.address}`
        : `/contrato/${entry.address}`;

  return (
    <tr className={styles.row} style={{ animationDelay: `${index * 18}ms` }}>
      {/* Nº */}
      <td className={styles.tdNo}>{entry.no}</td>

      {/* Título */}
      <td>
        <span className={styles.title}>
          {entry.title.length > 40
            ? entry.title.substring(0, 40) + "…"
            : entry.title}
          <span className={styles.cat}>{entry.category}</span>
        </span>
      </td>

      {/* Tipo */}
      <td>
        <span className={`${styles.ttag} ${styles[typeCfg.cls]}`}>
          {typeCfg.label}
        </span>
      </td>

      {/* Monto / Pozo */}
      <td>
        <div className={styles.amount}>{fmt(entry.amount)}</div>
        {entry.type === "bet" && entry.sides && <OddsBar sides={entry.sides} />}
        {entry.type === "civic" && (
          <div className={styles.civicVotes}>
            <span className={styles.yes}>SÍ {entry.votesYes || 0}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.no}>NO {entry.votesNo || 0}</span>
          </div>
        )}
      </td>

      {/* Estado */}
      <td>
        <Badge status={entry.status} />
      </td>

      {/* Categoría */}
      <td className={styles.tdCat}>{entry.category}</td>

      {/* Vencimiento */}
      <td>
        <Countdown expiresAt={entry.expiresAt} />
      </td>

      {/* Participantes */}
      <td className={styles.tdOps}>{entry.participants}</td>

      {/* Visibilidad */}
      <td>
        {entry.isPrivate ? (
          <span className={styles.priv}>⬡ PRIV</span>
        ) : (
          <span className={styles.pub}>◎ PÚB</span>
        )}
      </td>

      {/* Acciones */}
      <td>
        <div className={styles.actions}>
          {isActive && entry.type === "bet" && (
            <button
              className={`${styles.btn} ${styles.btnApostar}`}
              onClick={() => navigate(routePath)}
            >
              Apostar
            </button>
          )}
          {isActive && entry.type === "contract" && (
            <button
              className={`${styles.btn} ${styles.btnEntregar}`}
              onClick={() => navigate(routePath)}
            >
              Entregar
            </button>
          )}
          {isActive && entry.type === "civic" && (
            <button
              className={`${styles.btn} ${styles.btnVotar}`}
              onClick={() => navigate(routePath)}
            >
              Votar
            </button>
          )}
          <button
            className={`${styles.btn} ${styles.btnCancelar}`}
            disabled={!canAbort}
            onClick={() => {
              /* Bloque 3/5 */
            }}
          >
            Cancelar
          </button>
          <button
            className={`${styles.btn} ${styles.btnVer}`}
            onClick={() => navigate(routePath)}
          >
            Ver
          </button>
        </div>
      </td>
    </tr>
  );
}
