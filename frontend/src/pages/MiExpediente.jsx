import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import { getUsuario } from "../services/usuarios";
import Badge from "../components/ui/Badge";
import Countdown from "../components/ui/Countdown";
import styles from "./MiExpediente.module.css";

function fmt(n) {
  if (!n) return "$0";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

export default function MiExpediente() {
  const { address } = useWallet();
  const { toast } = useToast();
  const { allEntries } = useApp();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contratos");

  useEffect(() => {
    if (!address) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsuario(address);
        setUsuario(data);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [address]);

  // Filtrar entradas del usuario actual
  const misContratos = allEntries.filter(
    (e) =>
      e.type === "contract" &&
      e.creator?.toLowerCase() === address?.toLowerCase(),
  );

  const misApuestas = allEntries.filter(
    (e) => e.type === "bet",
    // En producción filtraríamos por participación on-chain
    // Por ahora mostramos todas las apuestas públicas como demo
  );

  const misCivicos = allEntries.filter(
    (e) =>
      e.type === "civic" && e.creator?.toLowerCase() === address?.toLowerCase(),
  );

  const contratosComoFreelancer = allEntries.filter(
    (e) =>
      e.type === "contract" &&
      e.executor?.toLowerCase() === address?.toLowerCase(),
  );

  // Stats
  const totalCreado = misContratos.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCivico = misCivicos.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando expediente…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.hCorner + " " + styles.tl} />
          <div className={styles.hCorner + " " + styles.tr} />
          <div className={styles.eyebrow}>Expediente Personal</div>
          <h1 className={styles.title}>
            Mi <span>Expediente</span>
          </h1>
          <div className={styles.ornament}>
            <div className={styles.line} />
            <div className={styles.diamond} />
            <div className={styles.lineR} />
          </div>
          <p className={styles.addr}>
            {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "—"}
          </p>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLbl}>Reputación</div>
            <div className={styles.statVal} style={{ color: "var(--gold)" }}>
              {usuario?.reputacion_score || 0}
            </div>
            <div className={styles.statSub}>
              {usuario?.nivel?.label || "Principiante"}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLbl}>Contratos creados</div>
            <div className={styles.statVal}>{misContratos.length}</div>
            <div className={styles.statSub}>
              {fmt(totalCreado)} en recompensas
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLbl}>Como freelancer</div>
            <div className={styles.statVal}>
              {contratosComoFreelancer.length}
            </div>
            <div className={styles.statSub}>Contratos tomados</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLbl}>Propuestas cívicas</div>
            <div className={styles.statVal} style={{ color: "var(--plum)" }}>
              {misCivicos.length}
            </div>
            <div className={styles.statSub}>{fmt(totalCivico)} depositados</div>
          </div>
        </div>

        {/* Insignias */}
        {usuario?.insignias?.length > 0 && (
          <div className={styles.insigniasWrap}>
            <div className={styles.insigniasTitle}>Insignias</div>
            <div className={styles.insignias}>
              {usuario.insignias.map((ins) => (
                <div key={ins.id} className={styles.insignia}>
                  <span className={styles.insigniaIcon}>{ins.icon}</span>
                  <span className={styles.insigniaLabel}>{ins.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            {
              id: "contratos",
              label: "Mis Contratos",
              count: misContratos.length,
            },
            {
              id: "freelancer",
              label: "Como Freelancer",
              count: contratosComoFreelancer.length,
            },
            { id: "apuestas", label: "Apuestas", count: misApuestas.length },
            { id: "civicos", label: "Propuestas", count: misCivicos.length },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Contenido de tabs */}
        <div className={styles.tabContent}>
          {/* Mis Contratos creados */}
          {activeTab === "contratos" && (
            <div className={styles.list}>
              {misContratos.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>Sin contratos publicados</p>
                  <p className={styles.emptySub}>
                    Publica tu primer contrato desde el tablero.
                  </p>
                  <button
                    className={styles.emptyBtn}
                    onClick={() => navigate("/dashboard")}
                  >
                    Ir al Tablero →
                  </button>
                </div>
              ) : (
                misContratos.map((e) => (
                  <div
                    key={e.address}
                    className={styles.entry}
                    onClick={() => navigate(`/contrato/${e.address}`)}
                  >
                    <div className={styles.entryLeft}>
                      <div className={styles.entryTitle}>{e.title}</div>
                      <div className={styles.entryMeta}>
                        <Badge status={e.status} />
                        <span className={styles.metaCat}>{e.category}</span>
                        <Countdown expiresAt={e.expiresAt} />
                      </div>
                    </div>
                    <div className={styles.entryRight}>
                      <div className={styles.entryAmt}>{fmt(e.amount)}</div>
                      <div className={styles.entryAmtLbl}>Recompensa</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Como Freelancer */}
          {activeTab === "freelancer" && (
            <div className={styles.list}>
              {contratosComoFreelancer.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>Sin contratos tomados</p>
                  <p className={styles.emptySub}>
                    Entrega trabajo en contratos del tablero para ganar
                    reputación.
                  </p>
                  <button
                    className={styles.emptyBtn}
                    onClick={() => navigate("/dashboard")}
                  >
                    Ver Contratos →
                  </button>
                </div>
              ) : (
                contratosComoFreelancer.map((e) => (
                  <div
                    key={e.address}
                    className={styles.entry}
                    onClick={() => navigate(`/contrato/${e.address}`)}
                  >
                    <div className={styles.entryLeft}>
                      <div className={styles.entryTitle}>{e.title}</div>
                      <div className={styles.entryMeta}>
                        <Badge status={e.status} />
                        <span className={styles.metaCat}>{e.category}</span>
                      </div>
                    </div>
                    <div className={styles.entryRight}>
                      <div className={styles.entryAmt}>{fmt(e.amount)}</div>
                      <div className={styles.entryAmtLbl}>
                        {e.status === "closed" ? "Ganado" : "En curso"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Apuestas */}
          {activeTab === "apuestas" && (
            <div className={styles.list}>
              {misApuestas.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>Sin apuestas</p>
                  <p className={styles.emptySub}>
                    Participa en mercados de predicción desde el tablero.
                  </p>
                  <button
                    className={styles.emptyBtn}
                    onClick={() => navigate("/dashboard")}
                  >
                    Ver Apuestas →
                  </button>
                </div>
              ) : (
                misApuestas.map((e) => {
                  const total = e.totalPool || e.amount || 0;
                  return (
                    <div
                      key={e.address}
                      className={styles.entry}
                      onClick={() => navigate(`/apuesta/${e.address}`)}
                    >
                      <div className={styles.entryLeft}>
                        <div className={styles.entryTitle}>{e.title}</div>
                        <div className={styles.entryMeta}>
                          <Badge status={e.status} />
                          <span className={styles.metaCat}>{e.category}</span>
                          <Countdown expiresAt={e.expiresAt} />
                        </div>
                      </div>
                      <div className={styles.entryRight}>
                        <div
                          className={styles.entryAmt}
                          style={{ color: "var(--plum)" }}
                        >
                          {fmt(total)}
                        </div>
                        <div className={styles.entryAmtLbl}>Pozo total</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Propuestas cívicas */}
          {activeTab === "civicos" && (
            <div className={styles.list}>
              {misCivicos.length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>Sin propuestas cívicas</p>
                  <p className={styles.emptySub}>
                    Crea una propuesta cívica desde el tablero.
                  </p>
                  <button
                    className={styles.emptyBtn}
                    onClick={() => navigate("/dashboard")}
                  >
                    Ir al Tablero →
                  </button>
                </div>
              ) : (
                misCivicos.map((e) => (
                  <div
                    key={e.address}
                    className={styles.entry}
                    onClick={() => navigate(`/civico/${e.address}`)}
                  >
                    <div className={styles.entryLeft}>
                      <div className={styles.entryTitle}>{e.title}</div>
                      <div className={styles.entryMeta}>
                        <Badge status={e.status} />
                        <span className={styles.metaCat}>{e.category}</span>
                        <Countdown expiresAt={e.expiresAt} />
                      </div>
                      <div className={styles.voteBar}>
                        <div
                          className={styles.voteBarYes}
                          style={{
                            width: `${
                              (e.votesYes || 0) > 0 || (e.votesNo || 0) > 0
                                ? Math.round(
                                    ((e.votesYes || 0) /
                                      ((e.votesYes || 0) + (e.votesNo || 0))) *
                                      100,
                                  )
                                : 50
                            }%`,
                          }}
                        />
                      </div>
                      <div className={styles.voteCounts}>
                        <span style={{ color: "var(--green)" }}>
                          SÍ {e.votesYes || 0}
                        </span>
                        <span style={{ color: "var(--red)" }}>
                          NO {e.votesNo || 0}
                        </span>
                      </div>
                    </div>
                    <div className={styles.entryRight}>
                      <div
                        className={styles.entryAmt}
                        style={{ color: "var(--amber)" }}
                      >
                        {fmt(e.amount)}
                      </div>
                      <div className={styles.entryAmtLbl}>Fondos</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
