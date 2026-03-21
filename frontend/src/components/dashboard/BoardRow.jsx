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

const TYPE_CFG = {
  contract: { label: "CONTRATO", cls: "contract", icon: "\uD83D\uDCCB" },
  bet: { label: "APUESTA", cls: "bet", icon: "\uD83C\uDFB2" },
  civic: { label: "C\u00CDVICO", cls: "civic", icon: "\uD83C\uDFDB" },
};

export default function BoardRow({ entry, index }) {
  const navigate = useNavigate();
  const cfg = TYPE_CFG[entry.type] || TYPE_CFG.contract;

  const isActive = entry.status === "open" || entry.status === "pending";
  const routePath =
    entry.type === "bet"
      ? `/apuesta/${entry.address}`
      : entry.type === "civic"
        ? `/civico/${entry.address}`
        : `/contrato/${entry.address}`;

  const initial = entry.title?.charAt(0)?.toUpperCase() || "?";

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate(routePath)}
    >
      {/* Accent bar */}
      <div className={`${styles.accentBar} ${styles[cfg.cls + "Bar"]}`} />

      {/* Card content */}
      <div className={styles.cardInner}>
        {/* Top: avatar + title */}
        <div className={styles.top}>
          <div className={`${styles.avatar} ${styles[cfg.cls + "Av"]}`}>
            {initial}
          </div>
          <div className={styles.titleWrap}>
            <h3 className={styles.title}>
              {entry.title.length > 45
                ? entry.title.substring(0, 45) + "\u2026"
                : entry.title}
            </h3>
            <span className={`${styles.ttag} ${styles[cfg.cls]}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>{"\uD83D\uDCC1"}</span>
            <span className={styles.detailLabel}>{entry.category}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>{"\uD83D\uDCB0"}</span>
            <span className={styles.amount}>{fmt(entry.amount)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>{"\u23F3"}</span>
            <Countdown expiresAt={entry.expiresAt} />
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>{"\uD83D\uDC65"}</span>
            <span className={styles.detailLabel}>{entry.participants} participantes</span>
          </div>
        </div>

        {/* Type-specific info */}
        {entry.type === "bet" && entry.sides && (
          <div className={styles.extra}>
            <OddsBar sides={entry.sides} />
          </div>
        )}
        {entry.type === "civic" && (
          <div className={styles.civicVotes}>
            <span className={styles.yes}>{"S\u00CD"} {entry.votesYes || 0}</span>
            <span className={styles.sep}>/</span>
            <span className={styles.no}>NO {entry.votesNo || 0}</span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <Badge status={entry.status} />
            {entry.isPrivate ? (
              <span className={styles.priv}>{"\uD83D\uDD12"} Privado</span>
            ) : (
              <span className={styles.pub}>{"\uD83C\uDF0D"} {"P\u00FAblico"}</span>
            )}
          </div>
          <div className={styles.actions}>
            {isActive && entry.type === "bet" && (
              <button
                className={`${styles.btn} ${styles.btnApostar}`}
                onClick={(e) => { e.stopPropagation(); navigate(routePath); }}
              >
                Apostar
              </button>
            )}
            {isActive && entry.type === "contract" && (
              <button
                className={`${styles.btn} ${styles.btnEntregar}`}
                onClick={(e) => { e.stopPropagation(); navigate(routePath); }}
              >
                Entregar
              </button>
            )}
            {isActive && entry.type === "civic" && (
              <button
                className={`${styles.btn} ${styles.btnVotar}`}
                onClick={(e) => { e.stopPropagation(); navigate(routePath); }}
              >
                Votar
              </button>
            )}
            <button
              className={`${styles.btn} ${styles.btnVer}`}
              onClick={(e) => { e.stopPropagation(); navigate(routePath); }}
            >
              Ver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
