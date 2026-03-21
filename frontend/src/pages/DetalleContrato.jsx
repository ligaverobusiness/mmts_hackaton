import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import {
  getContratoById,
  getCondicionesIA,
  entregarTrabajo,
  solicitarValidacion,
  aumentarMonto,
  cancelarContrato,
} from "../services/contratos";
import { validateDelivery, pollValidation } from "../services/genlayer";
import ValidadoresPanel from "../components/validadores/ValidadoresPanel";
import Badge from "../components/ui/Badge";
import Countdown from "../components/ui/Countdown";
import styles from "./DetalleContrato.module.css";

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function DetalleContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useWallet();
  const { toast } = useToast();
  const { refresh } = useApp();

  const [contrato, setContrato] = useState(null);
  const [condIa, setCondIa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  // Entrega
  const [deliveryUrl, setDeliveryUrl] = useState("");

  // Aumentar monto
  const [showAumento, setShowAumento] = useState(false);
  const [montoExtra, setMontoExtra] = useState("");

  // Validación GenLayer
  const [isValidating, setIsValidating] = useState(false);
  const [validResult, setValidResult] = useState(null);

  // Cargar datos
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getContratoById(id);
        setContrato(data);

        // Si soy el creador, cargar condiciones IA
        if (address && data.creator?.toLowerCase() === address.toLowerCase()) {
          try {
            const cond = await getCondicionesIA(id, address);
            setCondIa(cond.condiciones_ia);
          } catch (_) {}
        }

        // Si está validando, iniciar polling
        if (data.status === "resolving" && data.genlayerAddress) {
          setIsValidating(true);
          const stopPoll = pollValidation(data.genlayerAddress, (result) => {
            if (result.status !== "pending") {
              setIsValidating(false);
              setValidResult(result);
              stopPoll();
            }
          });
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
    address && contrato?.creator?.toLowerCase() === address.toLowerCase();
  const isExecutor =
    address && contrato?.executor?.toLowerCase() === address.toLowerCase();
  const isActive =
    contrato?.status === "open" || contrato?.status === "pending";

  // Entregar trabajo
  const handleEntregar = async () => {
    if (!deliveryUrl.trim()) {
      toast.error("Ingresa el link o hash de entrega");
      return;
    }
    setTxLoading(true);
    try {
      await entregarTrabajo(id, deliveryUrl);
      toast.success("Entrega enviada on-chain");
      const updated = await getContratoById(id);
      setContrato(updated);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  // Solicitar validación IA
  const handleValidar = async () => {
    setTxLoading(true);
    try {
      await solicitarValidacion(id);
      setIsValidating(true);
      toast.info("Validación iniciada — Los jueces IA están evaluando…");
      const updated = await getContratoById(id);
      setContrato(updated);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  // Aumentar monto
  const handleAumento = async () => {
    if (!montoExtra || isNaN(Number(montoExtra)) || Number(montoExtra) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    setTxLoading(true);
    try {
      await aumentarMonto(id, Number(montoExtra));
      toast.success(`+$${montoExtra} USDC añadido al contrato`);
      setShowAumento(false);
      setMontoExtra("");
      const updated = await getContratoById(id);
      setContrato(updated);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  // Cancelar
  const handleCancelar = async () => {
    if (
      !window.confirm(
        "¿Confirmas cancelar este contrato? Los fondos te serán devueltos.",
      )
    )
      return;
    setTxLoading(true);
    try {
      await cancelarContrato(id);
      toast.success("Contrato cancelado — fondos devueltos");
      await refresh();
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando contrato…</p>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className={styles.loading}>
        <p style={{ color: "var(--red)" }}>Contrato no encontrado.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.back}
              onClick={() => navigate("/dashboard")}
            >
              ← Volver
            </button>
            <div className={styles.mainTitle}>{contrato.title}</div>
            <div className={styles.badges}>
              <span className={styles.ttag}>CONTRATO</span>
              <Badge status={contrato.status} />
              {contrato.isPrivate || contrato.es_privado ? (
                <span className={styles.priv}>⬡ PRIVADO</span>
              ) : (
                <span className={styles.pub}>◎ PÚBLICO</span>
              )}
              <span className={styles.cat}>
                {contrato.category || contrato.categoria}
              </span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.bounty}>
              {fmt(contrato.bounty || contrato.amount || 0)}
            </div>
            <div className={styles.bountyLabel}>Recompensa USDC</div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.grid}>
          <div className={styles.mainCol}>
            {/* Descripción */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Descripción del Trabajo</div>
              <p className={styles.description}>
                {contrato.description ||
                  contrato.descripcion_publica ||
                  "Sin descripción."}
              </p>
            </section>

            {/* Detalles */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Detalles del Contrato</div>
              <div className={styles.kvGrid}>
                <span className={styles.k}>Referencia</span>
                <span className={styles.v}>
                  {contrato.no || id.slice(0, 8)}
                </span>
                <span className={styles.k}>Categoría</span>
                <span className={styles.v}>
                  {contrato.category || contrato.categoria}
                </span>
                <span className={styles.k}>Participantes</span>
                <span className={styles.v}>{contrato.participants ?? 0}</span>
                <span className={styles.k}>Creador</span>
                <span className={styles.v}>
                  {contrato.creator
                    ? `${contrato.creator.slice(0, 6)}…${contrato.creator.slice(-4)}`
                    : "—"}
                </span>
                <span className={styles.k}>Vencimiento</span>
                <span className={styles.v}>
                  <Countdown expiresAt={contrato.expiresAt} />
                </span>
                <span className={styles.k}>Umbral IA</span>
                <span className={styles.v}>
                  {contrato.requiredApprovals ||
                    contrato.umbral_validadores ||
                    3}{" "}
                  de 5 validadores
                </span>
              </div>
            </section>

            {/* Condiciones IA — solo el creador las ve */}
            {isCreator && condIa && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>
                  Condiciones privadas para los Jueces IA
                </div>
                <div className={styles.iaBox}>
                  ⬡ &nbsp;Solo tú ves esto
                  <div className={styles.iaConditions}>{condIa}</div>
                </div>
              </section>
            )}

            {/* Validadores */}
            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                Panel de Validadores GenLayer
              </div>
              <ValidadoresPanel
                isValidating={isValidating}
                result={
                  contrato.status === "closed" ||
                  contrato.status === "cancelled"
                    ? {
                        approved: contrato.isApproved ?? false,
                        summary: contrato.validationSummary || "Sin resumen.",
                      }
                    : validResult
                }
                requiredApprovals={
                  contrato.requiredApprovals || contrato.umbral_validadores || 3
                }
              />
            </section>

            {/* ── Entrega — para el freelancer ── */}
            {isActive && !isCreator && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Entregar Trabajo</div>
                <div className={styles.deliveryBox}>
                  <div className={styles.deliveryTitle}>
                    Terminal de Entrega
                  </div>
                  <p className={styles.deliveryCriteria}>
                    {contrato.description || contrato.descripcion_publica}
                  </p>
                  <label className={styles.label}>
                    Enlace de entrega / Hash / IPFS
                  </label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    placeholder="Pega el link de Drive, GitHub, Figma, IPFS o describe tu entrega…"
                  />
                  <button
                    className={styles.btnEntregar}
                    onClick={handleEntregar}
                    disabled={txLoading}
                  >
                    {txLoading ? (
                      <>
                        <span className={styles.spinner} /> Enviando…
                      </>
                    ) : (
                      "Enviar Entrega"
                    )}
                  </button>
                </div>
              </section>
            )}

            {/* ── Validar — para el creador cuando hay entrega ── */}
            {isCreator && contrato.status === "pending" && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>
                  Validar Entrega con IA
                </div>
                <div className={styles.deliveryBox}>
                  <p className={styles.deliveryCriteria}>
                    El freelancer entregó:{" "}
                    <a
                      href={contrato.deliveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.link}
                    >
                      {contrato.deliveryUrl}
                    </a>
                  </p>
                  <button
                    className={styles.btnValidar}
                    onClick={handleValidar}
                    disabled={txLoading || isValidating}
                  >
                    {isValidating ? (
                      <>
                        <span className={styles.spinner} /> Validando con
                        GenLayer…
                      </>
                    ) : (
                      "Activar Jueces IA →"
                    )}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Columna lateral */}
          <div className={styles.sideCol}>
            {/* Aumentar monto — creador */}
            {isCreator && isActive && (
              <div className={styles.sideCard}>
                <div className={styles.sideCardTitle}>Aumentar Recompensa</div>
                {!showAumento ? (
                  <button
                    className={styles.btnSecondary}
                    onClick={() => setShowAumento(true)}
                  >
                    + Añadir fondos
                  </button>
                ) : (
                  <>
                    <input
                      className={styles.input}
                      type="number"
                      min="1"
                      placeholder="USDC a añadir"
                      value={montoExtra}
                      onChange={(e) => setMontoExtra(e.target.value)}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => setShowAumento(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className={styles.btnValidar}
                        onClick={handleAumento}
                        disabled={txLoading}
                      >
                        Confirmar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cancelar — creador, sin participantes */}
            {isCreator &&
              contrato.status === "open" &&
              (contrato.participants === 0 || !contrato.executor) && (
                <div className={styles.sideCard}>
                  <div className={styles.sideCardTitle}>Cancelar Contrato</div>
                  <p className={styles.sideCardDesc}>
                    Solo disponible si no hay freelancers activos. Los fondos te
                    serán devueltos.
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

            {/* Link a blockchain */}
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
