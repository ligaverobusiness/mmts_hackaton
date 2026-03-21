import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { getUsuario } from "../services/usuarios";
import Badge from "../components/ui/Badge";
import styles from "./Perfil.module.css";

export default function Perfil() {
  const { address: paramAddress } = useParams();
  const { address: myAddress } = useWallet();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [alias, setAlias] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const targetAddress = paramAddress || myAddress;
  const isOwn = myAddress?.toLowerCase() === targetAddress?.toLowerCase();

  useEffect(() => {
    if (!targetAddress) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUsuario(targetAddress);
        setUsuario(data);
        setAlias(data.alias || "");
        setBio(data.bio || "");
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [targetAddress]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updateUsuario } = await import("../services/usuarios");
      const updated = await updateUsuario(targetAddress, { alias, bio });
      setUsuario(updated);
      setEditMode(false);
    } catch (_) {
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando perfil…</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className={styles.loading}>
        <p style={{ color: "var(--red)" }}>Perfil no encontrado.</p>
      </div>
    );
  }

  const addr = targetAddress || "";
  const short = `${addr.slice(0, 8)}…${addr.slice(-6)}`;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          ← Volver
        </button>

        {/* Perfil card */}
        <div className={styles.profileCard}>
          {/* Avatar generado con inicial */}
          <div className={styles.avatar}>
            {(usuario.alias || addr).slice(0, 2).toUpperCase()}
          </div>

          <div className={styles.profileInfo}>
            {editMode ? (
              <>
                <input
                  className={styles.editInput}
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Tu nombre o alias"
                  maxLength={32}
                />
                <textarea
                  className={styles.editTextarea}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos sobre ti…"
                  rows={3}
                  maxLength={200}
                />
                <div className={styles.editActions}>
                  <button
                    className={styles.btnCancel}
                    onClick={() => setEditMode(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.btnSave}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.name}>{usuario.alias || "Anónimo"}</div>
                <div className={styles.address}>{short}</div>
                {usuario.bio && <p className={styles.bio}>{usuario.bio}</p>}
                {isOwn && (
                  <button
                    className={styles.btnEdit}
                    onClick={() => setEditMode(true)}
                  >
                    ✏ Editar perfil
                  </button>
                )}
              </>
            )}
          </div>

          {/* Score */}
          <div className={styles.scoreBox}>
            <div className={styles.scoreVal}>
              {usuario.reputacion_score || 0}
            </div>
            <div className={styles.scoreLbl}>Reputación</div>
            <div
              className={styles.scoreNivel}
              style={{ color: usuario.nivel?.color || "var(--ink3)" }}
            >
              {usuario.nivel?.label || "Principiante"}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statVal}>
              {usuario.contratos_creados || 0}
            </div>
            <div className={styles.statLbl}>Contratos creados</div>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <div className={styles.statVal}>
              {usuario.contratos_completados || 0}
            </div>
            <div className={styles.statLbl}>Contratos completados</div>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <div className={styles.statVal}>
              {usuario.apuestas_ganadas || 0}
            </div>
            <div className={styles.statLbl}>Apuestas ganadas</div>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <div className={styles.statVal}>
              {new Date(usuario.creado_en).toLocaleDateString("es-ES", {
                month: "short",
                year: "numeric",
              })}
            </div>
            <div className={styles.statLbl}>Miembro desde</div>
          </div>
        </div>

        {/* Insignias */}
        {usuario.insignias?.length > 0 && (
          <div className={styles.insigniasWrap}>
            <div className={styles.insigniasTitle}>Insignias Obtenidas</div>
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

        {/* Desglose de reputación */}
        <div className={styles.reputacionWrap}>
          <div className={styles.reputacionTitle}>
            Cómo se calcula tu reputación
          </div>
          <div className={styles.reputacionGrid}>
            <div className={styles.reputacionRow}>
              <span className={styles.reputacionKey}>
                Contratos completados
              </span>
              <span className={styles.reputacionVal}>× 10 pts</span>
              <span
                className={styles.reputacionTotal}
                style={{ color: "var(--green)" }}
              >
                +{(usuario.contratos_completados || 0) * 10}
              </span>
            </div>
            <div className={styles.reputacionRow}>
              <span className={styles.reputacionKey}>Contratos creados</span>
              <span className={styles.reputacionVal}>× 3 pts</span>
              <span
                className={styles.reputacionTotal}
                style={{ color: "var(--navy)" }}
              >
                +{(usuario.contratos_creados || 0) * 3}
              </span>
            </div>
            <div className={styles.reputacionRow}>
              <span className={styles.reputacionKey}>Apuestas ganadas</span>
              <span className={styles.reputacionVal}>× 2 pts</span>
              <span
                className={styles.reputacionTotal}
                style={{ color: "var(--plum)" }}
              >
                +{(usuario.apuestas_ganadas || 0) * 2}
              </span>
            </div>
          </div>
        </div>

        {/* Link expediente si es propio */}
        {isOwn && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button
              className={styles.btnExpediente}
              onClick={() => navigate("/expediente")}
            >
              Ver mi Expediente completo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
