import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import Navbar from "../components/layout/Navbar";
import { parsearError } from "../utils/errores";

import {
  getCivicoById,
  votarPropuesta,
  ejecutarPropuesta,
  cancelarPropuesta,
  getMiVoto,
} from "../services/civico";
import Badge from "../components/ui/Badge";
import Countdown from "../components/ui/Countdown";
import styles from "./DetalleCivico.module.css";

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function DetalleCivico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useWallet();
  const { toast } = useToast();
  const { refresh } = useApp();

  const [propuesta, setPropuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [miVoto, setMiVoto] = useState(null); // null | 'yes' | 'no'

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCivicoById(id);
        setPropuesta(data);

        if (address) {
          try {
            const voto = await getMiVoto(id, address);
            if (voto.voted) setMiVoto(voto.inFavor ? "yes" : "no");
          } catch (_) {}
        }
      } catch (err) {
        toast.error(parsearError(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, address]);

  const isCreator =
    address && propuesta?.creator?.toLowerCase() === address.toLowerCase();
  const isVoting = propuesta?.status === "open";
  const canExecute = isVoting && propuesta?.expiresAt < Date.now();
  const canCancel =
    isCreator &&
    isVoting &&
    propuesta?.votesYes === 0 &&
    propuesta?.votesNo === 0;

  const totalVotos = (propuesta?.votesYes || 0) + (propuesta?.votesNo || 0);
  const pctYes =
    totalVotos > 0 ? Math.round((propuesta.votesYes / totalVotos) * 100) : 0;
  const pctNo = 100 - pctYes;

  const handleVotar = async (inFavor) => {
    setTxLoading(true);
    try {
      await votarPropuesta(id, inFavor);
      setMiVoto(inFavor ? "yes" : "no");
      toast.success(
        inFavor ? "Voto SÍ registrado on-chain" : "Voto NO registrado on-chain",
      );
      const updated = await getCivicoById(id);
      setPropuesta(updated);
    } catch (err) {
      toast.error(parsearError(err));
    } finally {
      setTxLoading(false);
    }
  };

  const handleEjecutar = async () => {
    setTxLoading(true);
    try {
      await ejecutarPropuesta(id);
      toast.success("Propuesta ejecutada — resultado registrado on-chain");
      await refresh();
      const updated = await getCivicoById(id);
      setPropuesta(updated);
    } catch (err) {
      toast.error(parsearError(err));
    } finally {
      setTxLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (
      !window.confirm(
        "¿Confirmas cancelar esta propuesta? Los fondos te serán devueltos.",
      )
    )
      return;
    setTxLoading(true);
    try {
      await cancelarPropuesta(id);
      toast.success("Propuesta cancelada — fondos devueltos");
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      toast.error(parsearError(err));
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando propuesta…</p>
      </div>
    );
  }

  if (!propuesta) {
    return (
      <div className={styles.loading}>
        <p style={{ color: "var(--red)" }}>Propuesta no encontrada.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.topHeader}>
          <div className={`${styles.hCorner} ${styles.tl}`} />
          <div className={`${styles.hCorner} ${styles.tr}`} />

          <div className={styles.eyebrow}>DETALLE · CÍVICO · ON-CHAIN</div>

          <h1 className={styles.title}>
            <span>CÍVICO</span>
          </h1>

          <div className={styles.ornament}>
            <div className={styles.line}></div>
            <div className={styles.diamond}></div>
            <div className={`${styles.line} ${styles.lineR}`}></div>
          </div>

          <div className={styles.sub}>VALIDACIÓN · ENTREGA · GENLAYER</div>
        </div>
        <Navbar />
        {/* Header */}

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.back}
              onClick={() => navigate("/dashboard")}
            >
              ← Volver
            </button>
            <div className={styles.entidad}>
              {propuesta.entidad_nombre || "Propuesta Cívica"}
            </div>
            <div className={styles.mainTitle}>{propuesta.title}</div>
            <div className={styles.badges}>
              <span className={styles.ttag}>CÍVICO</span>
              <Badge status={propuesta.status} />
              <span className={styles.cat}>
                {propuesta.categoria || propuesta.category}
              </span>
              {propuesta.isPrivate || propuesta.es_privada ? (
                <span className={styles.priv}>⬡ PRIVADO</span>
              ) : (
                <span className={styles.pub}>◎ PÚBLICO</span>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.funds}>
              {fmt(propuesta.totalFunds || propuesta.amount || 0)}
            </div>
            <div className={styles.fundsLabel}>Fondos Retenidos USDC</div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.grid}>
          <div className={styles.mainCol}>
            {/* Descripción */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                Descripción de la Propuesta
              </div>
              <p className={styles.description}>
                {propuesta.description ||
                  propuesta.descripcion ||
                  "Sin descripción."}
              </p>
            </section>

            {/* Detalles */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Detalles</div>
              <div className={styles.kvGrid}>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Entidad</span>
                  <span className={styles.v}>
                    {propuesta.entidad_nombre || "—"}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Categoría</span>
                  <span className={styles.v}>
                    {propuesta.categoria || propuesta.category}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Dirección destino</span>
                  <span className={styles.v}>
                    {propuesta.destinationAddress
                      ? `${propuesta.destinationAddress.slice(0, 8)}…${propuesta.destinationAddress.slice(-6)}`
                      : "—"}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Creador</span>
                  <span className={styles.v}>
                    {propuesta.creator
                      ? `${propuesta.creator.slice(0, 6)}…${propuesta.creator.slice(-4)}`
                      : "—"}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Cierre de votación</span>
                  <span className={styles.v}>
                    <Countdown expiresAt={propuesta.expiresAt} />
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Total votos</span>
                  <span className={styles.v}>{totalVotos}</span>
                </div>
              </div>
            </section>

            {/* Resultados de votación */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Distribución de Votos</div>
              <div className={styles.voteTrackWrap}>
                <div className={styles.voteTrack}>
                  <div
                    className={styles.voteSegYes}
                    style={{ width: `${pctYes}%` }}
                  />
                  <div
                    className={styles.voteSegNo}
                    style={{ width: `${pctNo}%` }}
                  />
                </div>
                <div className={styles.voteLabels}>
                  <span className={styles.voteLblYes}>
                    SÍ — {propuesta.votesYes || 0} votos ({pctYes}%)
                  </span>
                  <span className={styles.voteLblNo}>
                    NO — {propuesta.votesNo || 0} votos ({pctNo}%)
                  </span>
                </div>
              </div>

              {/* Mi voto */}
              {miVoto && (
                <div
                  className={`${styles.miVoto} ${miVoto === "yes" ? styles.miVotoYes : styles.miVotoNo}`}
                >
                  Tu voto: <strong>{miVoto === "yes" ? "SÍ ✓" : "NO ✗"}</strong>{" "}
                  — registrado on-chain
                </div>
              )}
            </section>

            {/* Zona de votación */}
            {isVoting && !miVoto && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Emitir tu Voto</div>
                <div className={styles.voteZone}>
                  <div className={styles.voteZoneTitle}>
                    ¿Apruebas esta propuesta?
                  </div>
                  <p className={styles.voteZoneDesc}>
                    Si la mayoría vota SÍ, los fondos se transferirán
                    automáticamente a la dirección destino al cerrar el plazo.
                  </p>
                  <div className={styles.voteBtns}>
                    <button
                      className={styles.btnSi}
                      onClick={() => handleVotar(true)}
                      disabled={txLoading}
                    >
                      {txLoading ? (
                        <span className={styles.spinner} />
                      ) : (
                        "✓ Votar SÍ"
                      )}
                    </button>
                    <button
                      className={styles.btnNo}
                      onClick={() => handleVotar(false)}
                      disabled={txLoading}
                    >
                      {txLoading ? (
                        <span className={styles.spinner} />
                      ) : (
                        "✗ Votar NO"
                      )}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Ejecutar resultado */}
            {canExecute && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Ejecutar Resultado</div>
                <div className={styles.executeBox}>
                  <p>
                    El plazo de votación ha vencido. Cualquiera puede ejecutar
                    el resultado para que los fondos se muevan automáticamente
                    según la decisión de la comunidad.
                  </p>
                  <button
                    className={styles.btnEjecutar}
                    onClick={handleEjecutar}
                    disabled={txLoading}
                  >
                    {txLoading ? (
                      <>
                        <span className={styles.spinner} /> Ejecutando…
                      </>
                    ) : (
                      "Ejecutar Resultado On-Chain →"
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Columna lateral */}
          <div className={styles.sideCol}>
            {/* Resultado si ya resuelto */}
            {propuesta.status === "closed" && (
              <div className={`${styles.sideCard} ${styles.sideCardApproved}`}>
                <div
                  className={styles.sideCardTitle}
                  style={{ color: "var(--green)" }}
                >
                  ✓ Propuesta Aprobada
                </div>
                <p className={styles.sideCardDesc}>
                  Los fondos fueron transferidos a la dirección destino
                  on-chain.
                </p>
                <a
                  href={`https://sepolia.etherscan.io/address/${propuesta.destinationAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.explorerLink}
                >
                  Ver destino en Etherscan →
                </a>
              </div>
            )}

            {propuesta.status === "cancelled" && (
              <div className={`${styles.sideCard} ${styles.sideCardRejected}`}>
                <div
                  className={styles.sideCardTitle}
                  style={{ color: "var(--red)" }}
                >
                  ✗ Propuesta Rechazada
                </div>
                <p className={styles.sideCardDesc}>
                  Los fondos fueron devueltos al creador on-chain.
                </p>
              </div>
            )}

            {/* Cancelar */}
            {canCancel && (
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>Cancelar Propuesta</div>
                <p className={styles.sideCardDesc}>
                  Solo disponible antes de que alguien vote. Los fondos te serán
                  devueltos.
                </p>
                <button
                  className={styles.btnCancelar}
                  onClick={handleCancelar}
                  disabled={txLoading}
                >
                  Cancelar y devolver fondos
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
                Ver propuesta en Etherscan →
              </a>
              {propuesta.destinationAddress && (
                <a
                  href={`https://sepolia.etherscan.io/address/${propuesta.destinationAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.explorerLink}
                  style={{ marginTop: 8, display: "block" }}
                >
                  Ver dirección destino →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
