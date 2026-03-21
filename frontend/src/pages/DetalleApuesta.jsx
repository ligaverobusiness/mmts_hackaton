import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import {
  getApuestaById,
  apostar,
  resolverApuesta,
  reclamarGanancias,
  cancelarApuesta,
  getMisApuestas,
  getGananciaPotencial,
  calcMultiplier,
  calcMultiplierClass,
} from "../services/apuestas";
import Badge from "../components/ui/Badge";
import Countdown from "../components/ui/Countdown";
import styles from "./DetalleApuesta.module.css";

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtUsdc(bn) {
  if (!bn) return "$0";
  try {
    const { ethers } = window;
    const n = parseFloat(bn.toString()) / 1e6;
    return fmt(n);
  } catch (_) {
    return "$?";
  }
}

export default function DetalleApuesta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useWallet();
  const { toast } = useToast();
  const { refresh } = useApp();

  const [apuesta, setApuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedSide, setSelectedSide] = useState(null); // true=A, false=B
  const [stakeAmount, setStakeAmount] = useState("");
  const [misApuestas, setMisApuestas] = useState(null);
  const [ganancia, setGanancia] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getApuestaById(id);
        setApuesta(data);

        if (address) {
          try {
            const mis = await getMisApuestas(id, address);
            setMisApuestas(mis);
            const gan = await getGananciaPotencial(id, address);
            setGanancia(gan);
          } catch (_) {}
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, address]);

  const isCreator =
    address && apuesta?.creator?.toLowerCase() === address.toLowerCase();
  const isActive = apuesta?.status === "open";
  const canResolve =
    isCreator && apuesta?.status === "open" && apuesta?.expiresAt < Date.now();
  const canClaim = apuesta?.isResolved;

  // Calcular totales
  const totalSideA = apuesta?.sides?.[0]?.pool || 0;
  const totalSideB = apuesta?.sides?.[1]?.pool || 0;
  const totalPool = totalSideA + totalSideB;
  const multA = calcMultiplier(totalSideA, totalPool);
  const multB = calcMultiplier(totalSideB, totalPool);
  const pctA = totalPool > 0 ? Math.round((totalSideA / totalPool) * 100) : 50;
  const pctB = 100 - pctA;

  const handleApostar = async () => {
    if (selectedSide === null) {
      toast.error("Selecciona una opción");
      return;
    }
    if (
      !stakeAmount ||
      isNaN(Number(stakeAmount)) ||
      Number(stakeAmount) <= 0
    ) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setTxLoading(true);
    try {
      await apostar(id, selectedSide, Number(stakeAmount));
      toast.success(
        `Apuesta confirmada — $${stakeAmount} USDC en "${selectedSide ? apuesta.sideAName : apuesta.sideBName}"`,
      );
      const updated = await getApuestaById(id);
      setApuesta(updated);
      setStakeAmount("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  const handleResolver = async () => {
    setTxLoading(true);
    try {
      await resolverApuesta(id);
      toast.info("Resolución solicitada — GenLayer está evaluando…");
      const updated = await getApuestaById(id);
      setApuesta(updated);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  const handleReclamar = async () => {
    setTxLoading(true);
    try {
      await reclamarGanancias(id);
      toast.success("Ganancias reclamadas — USDC enviado a tu wallet");
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm("¿Cancelar este mercado?")) return;
    setTxLoading(true);
    try {
      await cancelarApuesta(id);
      toast.success("Mercado cancelado");
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  if (loading)
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando mercado…</p>
      </div>
    );

  if (!apuesta)
    return (
      <div className={styles.loading}>
        <p style={{ color: "var(--red)" }}>Apuesta no encontrada.</p>
      </div>
    );

  const sideAName =
    apuesta.sideAName || apuesta.sides?.[0]?.label || "Opción A";
  const sideBName =
    apuesta.sideBName || apuesta.sides?.[1]?.label || "Opción B";

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button className={styles.back} onClick={() => navigate("/dashboard")}>
          ← Volver
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mainTitle}>{apuesta.title}</div>
            <div className={styles.badges}>
              <span className={styles.ttag}>APUESTA</span>
              <Badge status={apuesta.status} />
              <span className={styles.cat}>
                {apuesta.category || apuesta.categoria}
              </span>
              {apuesta.isPrivate || apuesta.es_privada ? (
                <span className={styles.priv}>⬡ PRIVADO</span>
              ) : (
                <span className={styles.pub}>◎ PÚBLICO</span>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.pool}>{fmt(totalPool)}</div>
            <div className={styles.poolLabel}>Pozo Total USDC</div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.grid}>
          <div className={styles.mainCol}>
            {/* Distribución del pozo */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                Distribución del Pozo y Cuotas
              </div>

              <div className={styles.poolTrack}>
                <div
                  className={styles.poolSegA}
                  style={{ width: `${pctA}%` }}
                />
                <div
                  className={styles.poolSegB}
                  style={{ width: `${pctB}%` }}
                />
              </div>

              <div className={styles.sides}>
                {/* Side A */}
                <div
                  className={`${styles.side} ${selectedSide === true ? styles.sideSelected : ""}`}
                  onClick={() => isActive && setSelectedSide(true)}
                >
                  <div
                    className={styles.sideName}
                    style={{ color: "var(--green)" }}
                  >
                    {sideAName}
                  </div>
                  <div className={styles.sidePool}>
                    {fmt(totalSideA)} en el pozo · {pctA}%
                  </div>
                  <div
                    className={`${styles.sideMult} ${styles[calcMultiplierClass(multA)]}`}
                  >
                    {multA}×
                  </div>
                  <div className={styles.sideMultLabel}>multiplicador</div>
                  {isActive && (
                    <div
                      className={`${styles.sideSelectBtn} ${selectedSide === true ? styles.sideSelectBtnActive : ""}`}
                    >
                      {selectedSide === true ? "✓ Seleccionado" : "Seleccionar"}
                    </div>
                  )}
                </div>

                {/* Side B */}
                <div
                  className={`${styles.side} ${selectedSide === false ? styles.sideSelected : ""}`}
                  onClick={() => isActive && setSelectedSide(false)}
                >
                  <div
                    className={styles.sideName}
                    style={{ color: "var(--red)" }}
                  >
                    {sideBName}
                  </div>
                  <div className={styles.sidePool}>
                    {fmt(totalSideB)} en el pozo · {pctB}%
                  </div>
                  <div
                    className={`${styles.sideMult} ${styles[calcMultiplierClass(multB)]}`}
                  >
                    {multB}×
                  </div>
                  <div className={styles.sideMultLabel}>multiplicador</div>
                  {isActive && (
                    <div
                      className={`${styles.sideSelectBtn} ${selectedSide === false ? styles.sideSelectBtnActive : ""}`}
                    >
                      {selectedSide === false
                        ? "✓ Seleccionado"
                        : "Seleccionar"}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.oddsNote}>
                Multiplicador = Pozo Total ÷ Pozo del Lado. Los ganadores
                reciben su apuesta × multiplicador, distribuido
                proporcionalmente.
              </div>
            </section>

            {/* Detalles */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Detalles del Mercado</div>
              <div className={styles.kvGrid}>
                <span className={styles.k}>Categoría</span>
                <span className={styles.v}>
                  {apuesta.category || apuesta.categoria}
                </span>
                <span className={styles.k}>Participantes</span>
                <span className={styles.v}>
                  {apuesta.participants || apuesta.ops || 0}
                </span>
                <span className={styles.k}>Creador</span>
                <span className={styles.v}>
                  {apuesta.creator
                    ? `${apuesta.creator.slice(0, 6)}…${apuesta.creator.slice(-4)}`
                    : "—"}
                </span>
                <span className={styles.k}>Vencimiento</span>
                <span className={styles.v}>
                  <Countdown expiresAt={apuesta.expiresAt} />
                </span>
                <span className={styles.k}>Criterio de resolución</span>
                <span
                  className={styles.v}
                  style={{ fontStyle: "italic", color: "var(--ink3)" }}
                >
                  {apuesta.resolutionCriteria || "—"}
                </span>
              </div>
            </section>

            {/* Mis apuestas */}
            {misApuestas &&
              (Number(misApuestas.onSideA) > 0 ||
                Number(misApuestas.onSideB) > 0) && (
                <section className={styles.section}>
                  <div className={styles.sectionTitle}>Mis Posiciones</div>
                  <div className={styles.misPos}>
                    {Number(misApuestas.onSideA) > 0 && (
                      <div className={styles.posRow}>
                        <span
                          className={styles.posLabel}
                          style={{ color: "var(--green)" }}
                        >
                          {sideAName}
                        </span>
                        <span className={styles.posAmt}>
                          {fmt(Number(misApuestas.onSideA) / 1e6)}
                        </span>
                      </div>
                    )}
                    {Number(misApuestas.onSideB) > 0 && (
                      <div className={styles.posRow}>
                        <span
                          className={styles.posLabel}
                          style={{ color: "var(--red)" }}
                        >
                          {sideBName}
                        </span>
                        <span className={styles.posAmt}>
                          {fmt(Number(misApuestas.onSideB) / 1e6)}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

            {/* Zona de apuesta */}
            {isActive && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Colocar tu Apuesta</div>
                <div className={styles.betZone}>
                  <div className={styles.betZoneTitle}>
                    ◈ Terminal de Apuestas
                  </div>
                  {selectedSide !== null ? (
                    <div className={styles.betSelected}>
                      Has elegido:{" "}
                      <strong
                        style={{
                          color: selectedSide ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {selectedSide ? sideAName : sideBName}
                      </strong>
                      {" · "}Multiplicador actual:{" "}
                      <strong>{selectedSide ? multA : multB}×</strong>
                    </div>
                  ) : (
                    <div className={styles.betHint}>
                      ← Selecciona una opción arriba para continuar
                    </div>
                  )}
                  <div className={styles.betRow}>
                    <div style={{ flex: 1 }}>
                      <div className={styles.betLabel}>
                        Monto a apostar (USDC)
                      </div>
                      <input
                        className={styles.betInput}
                        type="number"
                        min="1"
                        placeholder="Ej: 10"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                      />
                    </div>
                    <button
                      className={styles.btnApostar}
                      onClick={handleApostar}
                      disabled={txLoading || selectedSide === null}
                    >
                      {txLoading ? (
                        <>
                          <span className={styles.spinner} /> Firmando…
                        </>
                      ) : (
                        "Confirmar Apuesta"
                      )}
                    </button>
                  </div>
                  {selectedSide !== null &&
                    stakeAmount &&
                    Number(stakeAmount) > 0 && (
                      <div className={styles.betPreview}>
                        Ganancia estimada si ganas:{" "}
                        <strong style={{ color: "var(--green)" }}>
                          $
                          {(
                            Number(stakeAmount) * (selectedSide ? multA : multB)
                          ).toFixed(2)}{" "}
                          USDC
                        </strong>
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* Resultado */}
            {apuesta.isResolved && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Resultado Final</div>
                <div
                  className={`${styles.resultBox} ${apuesta.isSideAWinner ? styles.resultA : styles.resultB}`}
                >
                  <div className={styles.resultTitle}>
                    Ganador: {apuesta.isSideAWinner ? sideAName : sideBName}
                  </div>
                  {apuesta.winnerValue && (
                    <div className={styles.resultValue}>
                      {apuesta.winnerValue}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Columna lateral */}
          <div className={styles.sideCol}>
            {/* Reclamar */}
            {canClaim && (
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>Reclamar Ganancias</div>
                <p className={styles.sideCardDesc}>
                  El mercado ha sido resuelto. Si apostaste al lado ganador,
                  reclama aquí.
                </p>
                <button
                  className={styles.btnReclamar}
                  onClick={handleReclamar}
                  disabled={txLoading}
                >
                  {txLoading ? (
                    <span className={styles.spinner} />
                  ) : (
                    "Reclamar USDC →"
                  )}
                </button>
              </div>
            )}

            {/* Resolver */}
            {canResolve && (
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>Resolver Mercado</div>
                <p className={styles.sideCardDesc}>
                  El plazo venció. GenLayer evaluará el criterio y determinará
                  el ganador.
                </p>
                <button
                  className={styles.btnResolver}
                  onClick={handleResolver}
                  disabled={txLoading}
                >
                  {txLoading ? (
                    <>
                      <span className={styles.spinner} /> Resolviendo…
                    </>
                  ) : (
                    "Activar Resolución IA →"
                  )}
                </button>
              </div>
            )}

            {/* Cancelar */}
            {isCreator && isActive && (
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>Cancelar Mercado</div>
                <p className={styles.sideCardDesc}>
                  Solo disponible mientras el plazo no ha vencido.
                </p>
                <button
                  className={styles.btnCancelar}
                  onClick={handleCancelar}
                  disabled={txLoading}
                >
                  Cancelar Mercado
                </button>
              </div>
            )}

            {/* On-chain */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardTitle}>On-Chain</div>

              <a
                href={`https://sepolia.etherscan.io/address/${id}`}
                target="_blank"
                rel="noreferrer"
                className={styles.explorerLink}
              >
                Ver en Etherscan →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
