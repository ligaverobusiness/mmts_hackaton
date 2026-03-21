import { useState, useEffect } from "react";
import styles from "./Countdown.module.css";

function calcTime(expiresAt) {
  const r = expiresAt - Date.now();
  if (r <= 0) return { text: "VENCIDO", expiring: false, expired: true };
  const d = Math.floor(r / 86400000);
  const h = Math.floor((r % 86400000) / 3600000);
  const m = Math.floor((r % 3600000) / 60000);
  const s = Math.floor((r % 60000) / 1000);
  const text =
    d > 0
      ? `${d}d ${String(h).padStart(2, "0")}h`
      : h > 0
        ? `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`
        : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return { text, expiring: r > 0 && r < 7200000, expired: false };
}

export default function Countdown({ expiresAt }) {
  const [state, setState] = useState(() => calcTime(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => setState(calcTime(expiresAt)), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <span
      className={[
        styles.countdown,
        state.expiring ? styles.expiring : "",
        state.expired ? styles.expired : "",
      ].join(" ")}
    >
      {state.text}
    </span>
  );
}
