import { useEffect, useState } from "react";
import styles from "./ValidadoresPanel.module.css";

const VALIDATOR_NAMES = [
  "Validador Alpha",
  "Validador Beta",
  "Validador Gamma",
  "Validador Delta",
  "Validador Epsilon",
];

// Estados posibles de cada validador
// pending | evaluating | approved | rejected
function buildInitialVotes() {
  return VALIDATOR_NAMES.map((name) => ({
    name,
    status: "pending",
    summary: null,
  }));
}

export default function ValidadoresPanel({
  isValidating, // bool — si está en proceso
  result, // { approved, summary } | null
  requiredApprovals = 3,
}) {
  const [votes, setVotes] = useState(buildInitialVotes);

  // Simula los votos llegando uno a uno durante la validación
  useEffect(() => {
    if (!isValidating) {
      if (result) {
        // Mostrar resultado final
        setVotes((prev) =>
          prev.map((v, i) => ({
            ...v,
            status:
              i < requiredApprovals
                ? result.approved
                  ? "approved"
                  : "rejected"
                : result.approved
                  ? "approved"
                  : "rejected",
          })),
        );
      } else {
        setVotes(buildInitialVotes());
      }
      return;
    }

    // Animación: los validadores votan uno a uno
    setVotes(buildInitialVotes());
    const timers = VALIDATOR_NAMES.map((_, i) =>
      setTimeout(
        () => {
          setVotes((prev) =>
            prev.map((v, j) => (j === i ? { ...v, status: "evaluating" } : v)),
          );
        },
        i * 4000 + 2000,
      ),
    );

    return () => timers.forEach(clearTimeout);
  }, [isValidating, result, requiredApprovals]);

  // Cuando llega el resultado, mostrar votos finales
  useEffect(() => {
    if (result && isValidating) {
      setVotes((prev) =>
        prev.map((v) => ({
          ...v,
          status: result.approved ? "approved" : "rejected",
        })),
      );
    }
  }, [result, isValidating]);

  const countApproved = votes.filter((v) => v.status === "approved").length;
  const countRejected = votes.filter((v) => v.status === "rejected").length;
  const isResolved = result !== null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Panel de Validadores GenLayer</span>
        <span className={styles.req}>Umbral: {requiredApprovals} de 5</span>
      </div>

      {/* Barra de progreso */}
      {(isValidating || isResolved) && (
        <div className={styles.progress}>
          <div
            className={styles.progressFill}
            style={{
              width: `${(countApproved / 5) * 100}%`,
              background: isResolved
                ? result.approved
                  ? "var(--green)"
                  : "var(--red)"
                : "var(--gold-b)",
            }}
          />
        </div>
      )}

      {/* Votos individuales */}
      <div className={styles.votes}>
        {votes.map((v, i) => (
          <div key={i} className={`${styles.vote} ${styles[v.status]}`}>
            <div className={styles.voteIcon}>
              {v.status === "pending" && "○"}
              {v.status === "evaluating" && <span className={styles.spinner} />}
              {v.status === "approved" && "✓"}
              {v.status === "rejected" && "✗"}
            </div>
            <div className={styles.voteName}>{v.name}</div>
            <div className={styles.voteStatus}>
              {v.status === "pending" && "En espera"}
              {v.status === "evaluating" && "Evaluando…"}
              {v.status === "approved" && "Aprobado"}
              {v.status === "rejected" && "Rechazado"}
            </div>
          </div>
        ))}
      </div>

      {/* Resultado final */}
      {isResolved && (
        <div
          className={`${styles.result} ${result.approved ? styles.resultOk : styles.resultNo}`}
        >
          <div className={styles.resultIcon}>{result.approved ? "✓" : "✗"}</div>
          <div>
            <div className={styles.resultTitle}>
              {result.approved ? "Entrega Aprobada" : "Entrega Rechazada"}
            </div>
            <div className={styles.resultSummary}>{result.summary}</div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!isValidating && !isResolved && (
        <div className={styles.idle}>
          Los validadores están en espera de una entrega.
        </div>
      )}
    </div>
  );
}
