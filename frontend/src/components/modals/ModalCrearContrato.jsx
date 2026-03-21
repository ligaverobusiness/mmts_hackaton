import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { useToast } from "../../context/ToastContext";
import { useApp } from "../../context/AppContext";
import { crearContrato } from "../../services/contratos";
import styles from "./ModalCrearContrato.module.css";

const CATEGORIAS = [
  "Diseño & Creatividad",
  "Tecnología & Dev",
  "Hogar & Reparaciones",
  "Escritura & Contenido",
  "Fotografía & Video",
  "Marketing & Redes",
  "Legal & Finanzas",
  "Traducción & Idiomas",
  "Música & Audio",
  "Educación",
  "Otro",
];

const PASOS = ["Información", "Condiciones IA", "Confirmar"];

export default function ModalCrearContrato({ onClose }) {
  const { address } = useWallet();
  const { toast } = useToast();
  const { refresh } = useApp();

  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);

  // Paso 1
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [bounty, setBounty] = useState("");
  const [dias, setDias] = useState(7);
  const [isPrivate, setIsPrivate] = useState(false);
  const [executor, setExecutor] = useState("");

  // Paso 2 — condiciones privadas para la IA
  const [condicionesIA, setCondicionesIA] = useState("");
  const [umbral, setUmbral] = useState(3);

  const endDate = Date.now() + dias * 86400000;

  const validarPaso0 = () => {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return false;
    }
    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return false;
    }
    if (!bounty || isNaN(Number(bounty)) || Number(bounty) <= 0) {
      toast.error("La recompensa debe ser mayor a 0");
      return false;
    }
    return true;
  };

  const validarPaso1 = () => {
    if (!condicionesIA.trim()) {
      toast.error("Las condiciones para la IA son obligatorias");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (paso === 0 && !validarPaso0()) return;
    if (paso === 1 && !validarPaso1()) return;
    setPaso((p) => p + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { workAddress } = await crearContrato({
        title,
        descriptionPublic: descripcion,
        bounty: Number(bounty),
        endDate,
        requiredApprovals: umbral,
        isPrivate,
        categoria,
        condicionesIA,
        linkToken: isPrivate ? crypto.randomUUID() : null,
        executorAddress: executor || null,
      });
      toast.success(`Contrato publicado — ${workAddress.slice(0, 10)}…`);
      await refresh();
      onClose();
    } catch (err) {
      toast.error(err.message || "Error al crear el contrato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>
          ✕
        </button>

        {/* Título */}
        <div className={styles.title}>Publicar Contrato</div>
        <div className={styles.sub}>
          Define el trabajo y las condiciones privadas para los jueces IA.
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {PASOS.map((p, i) => (
            <div key={i} className={styles.step}>
              <div
                className={`${styles.stepDot} ${i <= paso ? styles.stepActive : ""}`}
              >
                {i < paso ? "✓" : i + 1}
              </div>
              <span
                className={`${styles.stepLabel} ${i === paso ? styles.stepLabelActive : ""}`}
              >
                {p}
              </span>
              {i < PASOS.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* ── PASO 0: Información básica ── */}
        {paso === 0 && (
          <div className={styles.body}>
            <div className={styles.group}>
              <label className={styles.label}>Título del Contrato</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Diseña el logo de mi cafetería"
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>Descripción pública</label>
              <div className={styles.hint}>
                Esto es lo que verá el freelancer. No incluyas condiciones de
                evaluación aquí.
              </div>
              <textarea
                className={styles.textarea}
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el trabajo, el entregable esperado, contexto relevante…"
              />
            </div>

            <div className={styles.row}>
              <div className={styles.group}>
                <label className={styles.label}>Categoría</label>
                <select
                  className={styles.select}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Recompensa (USDC)</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={bounty}
                  onChange={(e) => setBounty(e.target.value)}
                  placeholder="Ej: 500"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.group}>
                <label className={styles.label}>Plazo (días)</label>
                <select
                  className={styles.select}
                  value={dias}
                  onChange={(e) => setDias(Number(e.target.value))}
                >
                  {[1, 3, 7, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "día" : "días"}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Visibilidad</label>
                <div className={styles.toggle}>
                  <button
                    className={`${styles.toggleBtn} ${!isPrivate ? styles.toggleActive : ""}`}
                    onClick={() => setIsPrivate(false)}
                  >
                    ◎ Público
                  </button>
                  <button
                    className={`${styles.toggleBtn} ${isPrivate ? styles.toggleActive : ""}`}
                    onClick={() => setIsPrivate(true)}
                  >
                    ⬡ Privado
                  </button>
                </div>
              </div>
            </div>

            {isPrivate && (
              <div className={styles.group}>
                <label className={styles.label}>
                  Dirección del freelancer (privado)
                </label>
                <input
                  className={styles.input}
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                  placeholder="0x… (opcional — deja vacío para acceso por link)"
                />
              </div>
            )}
          </div>
        )}

        {/* ── PASO 1: Condiciones para la IA (privadas) ── */}
        {paso === 1 && (
          <div className={styles.body}>
            <div className={styles.iaWarning}>
              ⬡ &nbsp;Esta sección es <strong>completamente privada</strong>. El
              freelancer no la verá. Solo los jueces IA la usarán para evaluar.
            </div>

            <div className={styles.group}>
              <label className={styles.label}>
                Condiciones específicas para los jueces
              </label>
              <div className={styles.hint}>
                Sé preciso. Ej: "El informe debe tener mínimo 500 palabras,
                portada con título y autor, sin imágenes y al menos 20
                referencias con DOI válido."
              </div>
              <textarea
                className={styles.textarea}
                rows={5}
                value={condicionesIA}
                onChange={(e) => setCondicionesIA(e.target.value)}
                placeholder={
                  "Ej:\n" +
                  "- El logo debe estar en formato SVG\n" +
                  "- Debe incluir versión en colores y en blanco/negro\n" +
                  "- El link de entrega debe ser público y descargable\n" +
                  "- El nombre de la cafetería debe estar visible en el logo"
                }
              />
            </div>

            <div className={styles.group}>
              <label className={styles.label}>
                Umbral de aprobación — ¿Cuántos jueces deben aprobar?
              </label>
              <div className={styles.umbralRow}>
                {[3, 4, 5].map((u) => (
                  <button
                    key={u}
                    className={`${styles.umbralBtn} ${umbral === u ? styles.umbralActive : ""}`}
                    onClick={() => setUmbral(u)}
                  >
                    {u} de 5
                    <span className={styles.umbralSub}>
                      {u === 3 ? "Permisivo" : u === 4 ? "Estricto" : "Máximo"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 2: Confirmar ── */}
        {paso === 2 && (
          <div className={styles.body}>
            <div className={styles.confirmGrid}>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Título</span>
                <span className={styles.confirmVal}>{title}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Categoría</span>
                <span className={styles.confirmVal}>{categoria}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Recompensa</span>
                <span
                  className={styles.confirmVal}
                  style={{ color: "var(--gold)", fontWeight: 700 }}
                >
                  ${Number(bounty).toLocaleString()} USDC
                </span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Plazo</span>
                <span className={styles.confirmVal}>{dias} días</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Visibilidad</span>
                <span className={styles.confirmVal}>
                  {isPrivate ? "⬡ Privado" : "◎ Público"}
                </span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Umbral IA</span>
                <span className={styles.confirmVal}>
                  {umbral} de 5 validadores
                </span>
              </div>
            </div>
            <div className={styles.confirmNote}>
              Al confirmar, MetaMask te pedirá dos firmas: una para aprobar el
              USDC y otra para crear el contrato on-chain.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          {paso > 0 && (
            <button
              className={styles.btnBack}
              onClick={() => setPaso((p) => p - 1)}
              disabled={loading}
            >
              ← Atrás
            </button>
          )}
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          {paso < 2 ? (
            <button className={styles.btnNext} onClick={handleNext}>
              Siguiente →
            </button>
          ) : (
            <button
              className={styles.btnSubmit}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} /> Firmando…
                </>
              ) : (
                "Sellar Contrato"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
