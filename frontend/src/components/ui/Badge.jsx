import styles from "./Badge.module.css";

const CONFIG = {
  open: { label: "ABIERTO", cls: "open" },
  pending: { label: "PENDIENTE", cls: "pending" },
  resolving: { label: "RESOLVIENDO", cls: "resolving" },
  closed: { label: "CERRADO", cls: "closed" },
  cancelled: { label: "CANCELADO", cls: "cancelled" },
};

export default function Badge({ status }) {
  const cfg = CONFIG[status] || { label: status?.toUpperCase(), cls: "closed" };
  return (
    <span className={`${styles.badge} ${styles[cfg.cls]}`}>
      <span className={styles.dot} />
      {cfg.label}
    </span>
  );
}
