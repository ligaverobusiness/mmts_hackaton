import styles from "./OddsBar.module.css";
import { calcMultiplier, calcMultiplierClass } from "../../services/apuestas";

export default function OddsBar({ sides }) {
  if (!sides || sides.length === 0) return null;
  const total = sides.reduce((s, sd) => s + sd.pool, 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {sides.map((sd, i) => (
          <div
            key={i}
            className={styles.seg}
            style={{
              width: `${total > 0 ? Math.round((sd.pool / total) * 100) : 0}%`,
              background: sd.color,
            }}
          />
        ))}
      </div>
      <div className={styles.labels}>
        {sides.slice(0, 3).map((sd, i) => {
          const m = calcMultiplier(sd.pool, total);
          const cls = calcMultiplierClass(m);
          return (
            <span key={i} className={styles.lbl}>
              <span className={styles.dot} style={{ background: sd.color }} />
              <span className={styles.name}>
                {sd.label.split("—")[0].trim().substring(0, 10)}
              </span>
              <span className={`${styles.mult} ${styles[cls]}`}>{m}×</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
