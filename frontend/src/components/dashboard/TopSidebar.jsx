import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Badge from "../ui/Badge";
import styles from "./TopSidebar.module.css";

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function TopSidebar() {
  const { top10 } = useApp();
  const navigate = useNavigate();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span>✦ &nbsp;Top 10 de Contratos· Mayor Recompensa</span>
      </div>

      {top10.length === 0 && (
        <div className={styles.empty}>Sin contratos activos</div>
      )}

      {top10.map((e, i) => (
        <div
          key={e.address}
          className={styles.entry}
          onClick={() => navigate(`/contrato/${e.address}`)}
        >
          <div className={`${styles.rank} ${i < 3 ? styles.elite : ""}`}>
            {i + 1}
          </div>
          <div className={styles.info}>
            <div className={styles.name}>
              {e.title.length > 36 ? e.title.substring(0, 36) + "…" : e.title}
            </div>
            <div className={styles.cat}>{e.category}</div>
            <div className={styles.amount}>{fmt(e.amount)}</div>
            <div className={styles.badge}>
              <Badge status={e.status} />
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}
