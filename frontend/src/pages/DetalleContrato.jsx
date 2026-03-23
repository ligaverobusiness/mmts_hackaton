import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import Navbar from "../components/layout/Navbar";
import { parsearError } from "../utils/errores";

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
import FileUploader from "../components/ui/FileUploader";

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
  const [archivosSubidos, setArchivosSubidos] = useState([]);
  const VALIDATOR_ADDRESS =
    import.meta.env.VITE_GENLAYER_WORK_VALIDATOR || null;

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
          const stopPoll = pollValidation(
            data.genlayerAddress,
            id,
            (result) => {
              if (result.status !== "pending") {
                setIsValidating(false);
                setValidResult(result);
                stopPoll();
              }
            },
          );
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
      toast.error(parsearError(err));
    } finally {
      setTxLoading(false);
    }
  };

  // Solicitar validación IA
  const handleValidar = async () => {
    setTxLoading(true);
    try {
      await solicitarValidacion(id);
      toast.info("Validación iniciada — Los jueces IA están evaluando…");

      const updated = await getContratoById(id);
      setContrato(updated);

      const genlayerAddr = updated.genlayer_address || VALIDATOR_ADDRESS;
      const urlEntrega = updated.deliveryUrl || contrato.deliveryUrl;
      console.log("genlayerAddr:", genlayerAddr);
      console.log("VALIDATOR_ADDRESS:", VALIDATOR_ADDRESS);
      console.log("updated keys:", Object.keys(updated));
      if (genlayerAddr && urlEntrega) {
        await validateDelivery(genlayerAddr, urlEntrega); // ✅ esta línea faltaba
        setIsValidating(true);

        const stopPoll = pollValidation(genlayerAddr, id, (result) => {
          if (result?.status !== "pending") {
            setIsValidating(false);
            setValidResult(result);
            stopPoll();
            setTimeout(async () => {
              const final = await getContratoById(id);
              setContrato(final);
            }, 5000);
          }
        });
      }
    } catch (err) {
      toast.error(err.message || "Error al iniciar validación");
      setIsValidating(false); // ✅ reset si falla validateDelivery
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
      toast.error(parsearError(err));
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
      toast.error(parsearError(err));
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
        <div className={styles.topHeader}>
          <div className={`${styles.hCorner} ${styles.tl}`} />
          <div className={`${styles.hCorner} ${styles.tr}`} />

          <div className={styles.eyebrow}>DETALLE · CONTRATO · ON-CHAIN</div>

          <h1 className={styles.title}>
            EL <span>CONTRATO</span>
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

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Detalles del Contrato</div>
              <div className={styles.kvGrid}>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Referencia</span>
                  <span className={styles.v}>
                    {contrato.no || id.slice(0, 8)}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Categoría</span>
                  <span className={styles.v}>
                    {contrato.category || contrato.categoria}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Participantes</span>
                  <span className={styles.v}>{contrato.participants ?? 0}</span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Creador</span>
                  <span className={styles.v}>
                    {contrato.creator
                      ? `${contrato.creator.slice(0, 6)}…${contrato.creator.slice(-4)}`
                      : "—"}
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Vencimiento</span>
                  <span className={styles.v}>
                    <Countdown expiresAt={contrato.expiresAt} />
                  </span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.k}>Umbral IA</span>
                  <span className={styles.v}>
                    {contrato.requiredApprovals ||
                      contrato.umbral_validadores ||
                      3}{" "}
                    de 5 validadores
                  </span>
                </div>
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
            {contrato?.status === "open" && !isCreator && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>Entregar Trabajo</div>
                <div className={styles.deliveryBox}>
                  <div className={styles.deliveryTitle}>
                    Terminal de Entrega
                  </div>
                  <p className={styles.deliveryCriteria}>
                    {contrato.description || contrato.descripcion_publica}
                  </p>

                  {/* Aviso GenLayer */}
                  <div className={styles.genlayerNotice}>
                    <div className={styles.genlayerNoticeTitle}>
                      ⬡ Cómo evalúa GenLayer tu entrega
                    </div>

                    <div className={styles.genlayerNoticeGrid}>
                      <div className={styles.genlayerNoticeCol}>
                        <div
                          className={styles.genlayerNoticeLabel}
                          style={{ color: "var(--green)" }}
                        >
                          ✓ Lee bien
                        </div>
                        <ul className={styles.genlayerNoticeList}>
                          <li>PDFs con texto seleccionable</li>
                          <li>Páginas web y HTML públicos</li>
                          <li>Código en GitHub (raw)</li>
                          <li>Archivos de texto (TXT, MD)</li>
                          <li>Imágenes con contenido visible claro</li>
                        </ul>
                      </div>

                      <div className={styles.genlayerNoticeCol}>
                        <div
                          className={styles.genlayerNoticeLabel}
                          style={{ color: "var(--amber)" }}
                        >
                          ⚠ Limitaciones
                        </div>
                        <ul className={styles.genlayerNoticeList}>
                          <li>PDFs escaneados (imágenes de texto)</li>
                          <li>Links de Drive sin permiso público</li>
                          <li>Archivos ZIP (no puede leer el interior)</li>
                          <li>Imágenes de baja resolución</li>
                          <li>Links que requieren inicio de sesión</li>
                        </ul>
                      </div>
                    </div>

                    <div className={styles.genlayerNoticeTip}>
                      💡 Para máxima compatibilidad: sube archivos directamente
                      a IPFS con el botón de abajo, o usa links públicos de
                      GitHub, Figma o URLs directas.
                    </div>
                  </div>

                  {/* Bloque 1: Upload IPFS */}
                  <div className={styles.uploadBlock}>
                    <div className={styles.uploadBlockHeader}>
                      <div className={styles.uploadBlockTitle}>
                        Subir archivos a IPFS
                      </div>

                      <a
                        href="https://pinata.cloud"
                        target="_blank"
                        rel="noreferrer"
                        className={styles.pinataTag}
                      >
                        Powered by{" "}
                        <span className={styles.pinataLogo}>Pinata</span>
                      </a>
                    </div>

                    <div className={styles.uploadBlockDesc}>
                      PDF · PNG · JPG · SVG · TXT · HTML — genera una URL
                      permanente y pública que GenLayer puede leer directamente.
                    </div>

                    <FileUploader
                      disabled={txLoading}
                      onUpload={(archivo) => {
                        setArchivosSubidos((prev) => [...prev, archivo]);

                        if (!deliveryUrl.trim()) {
                          setDeliveryUrl(archivo.url);
                        } else {
                          setDeliveryUrl((prev) => prev + "\n" + archivo.url);
                        }
                      }}
                    />
                  </div>

                  {/* Bloque 2: Links manuales */}
                  <div className={styles.uploadBlock}>
                    <div className={styles.uploadBlockTitle}>
                      Links externos
                    </div>

                    <div className={styles.uploadBlockDesc}>
                      GitHub, Figma (link público), sitio web desplegado, raw
                      URL de cualquier archivo accesible. Un link por línea.
                    </div>

                    <textarea
                      className={styles.textarea}
                      rows={3}
                      value={deliveryUrl}
                      onChange={(e) => setDeliveryUrl(e.target.value)}
                      placeholder={
                        "https://raw.githubusercontent.com/usuario/repo/main/archivo.pdf\n" +
                        "https://gateway.pinata.cloud/ipfs/Qm...\n" +
                        "https://www.figma.com/file/..."
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.btnEntregar}
                    onClick={handleEntregar}
                    disabled={txLoading || !deliveryUrl.trim()}
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
