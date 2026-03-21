import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { useToast } from "../../context/ToastContext";
import { useApp } from "../../context/AppContext";
import { crearApuesta } from "../../services/apuestas";
import styles from "./ModalCrearContrato.module.css";

const CATEGORIAS = [
  "Deportes",
  "Entretenimiento",
  "Política",
  "Tecnología",
  "Finanzas & Mercados",
  "Vida cotidiana",
  "Cultura & Sociedad",
  "Ciencia & Clima",
  "Otro",
];

const RESOLUTION_TYPES = [
  {
    value: 2,
    label: "Noticias / Evento general",
    desc: "GenLayer busca el resultado en fuentes de noticias",
  },
  {
    value: 0,
    label: "Precio de criptomoneda",
    desc: "GenLayer verifica el precio on-chain",
  },
  {
    value: 1,
    label: "Precio de acción / índice",
    desc: "GenLayer consulta fuentes financieras",
  },
];

const PASOS = ["El Mercado", "Resolución", "Confirmar"];

export default function ModalCrearApuesta({ onClose }) {
  const { address } = useWallet();
  const { toast } = useToast();
  const { refresh } = useApp();

  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState(0);

  // Paso 0
  const [title, setTitle] = useState("");
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [dias, setDias] = useState(7);
  const [isPrivate, setIsPrivate] = useState(false);

  // Paso 1
  const [criteria, setCriteria] = useState("");
  const [resolutionType, setResolutionType] = useState(2);

  const endDate = Date.now() + dias * 86400000;

  const validarPaso0 = () => {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return false;
    }
    if (!sideA.trim()) {
      toast.error("El nombre del lado A es obligatorio");
      return false;
    }
    if (!sideB.trim()) {
      toast.error("El nombre del lado B es obligatorio");
      return false;
    }
    return true;
  };

  const validarPaso1 = () => {
    if (!criteria.trim()) {
      toast.error("Los criterios de resolución son obligatorios");
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
      const { betAddress } = await crearApuesta({
        title,
        resolutionCriteria: criteria,
        sideAName: sideA,
        sideBName: sideB,
        endDate,
        resolutionType,
        categoria,
        isPrivate,
        linkToken: isPrivate ? crypto.randomUUID() : null,
      });
      toast.success(`Mercado publicado — ${betAddress.slice(0, 10)}…`);
      await refresh();
      onClose();
    } catch (err) {
      toast.error(err.message || "Error al crear la apuesta");
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
        <div className={styles.title}>Abrir Mercado de Predicción</div>
        <div className={styles.sub}>
          Define la pregunta y los criterios para que GenLayer resuelva
          automáticamente.
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

        {/* PASO 0 */}
        {paso === 0 && (
          <div className={styles.body}>
            <div className={styles.group}>
              <label className={styles.label}>Pregunta del Mercado</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: ¿Gana Ecuador el próximo partido clasificatorio?"
              />
            </div>
            <div className={styles.row}>
              <div className={styles.group}>
                <label className={styles.label}>Opción A</label>
                <input
                  className={styles.input}
                  value={sideA}
                  onChange={(e) => setSideA(e.target.value)}
                  placeholder="Ej: SÍ — Gana"
                />
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Opción B</label>
                <input
                  className={styles.input}
                  value={sideB}
                  onChange={(e) => setSideB(e.target.value)}
                  placeholder="Ej: NO — No gana"
                />
              </div>
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
                <label className={styles.label}>Plazo de votación</label>
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
        )}

        {/* PASO 1 */}
        {paso === 1 && (
          <div className={styles.body}>
            <div className={styles.group}>
              <label className={styles.label}>Tipo de Resolución</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {RESOLUTION_TYPES.map((rt) => (
                  <div
                    key={rt.value}
                    className={`${styles.umbralBtn} ${resolutionType === rt.value ? styles.umbralActive : ""}`}
                    style={{ textAlign: "left", padding: "12px 16px" }}
                    onClick={() => setResolutionType(rt.value)}
                  >
                    <div
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      {rt.label}
                    </div>
                    <div className={styles.umbralSub}>{rt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>
                Criterios de Resolución para GenLayer
              </label>
              <div className={styles.hint}>
                Describe exactamente qué debe buscar la IA para determinar el
                resultado. Sé específico: fecha, fuente, condición.
              </div>
              <textarea
                className={styles.textarea}
                rows={4}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder={
                  "Ej: Busca el resultado final del partido Ecuador vs. Uruguay del clasificatorio\n" +
                  "sudamericano al Mundial. Si Ecuador ganó (más goles al final del partido), la\n" +
                  "respuesta es SÍ. Si empató o perdió, la respuesta es NO. Usa fuentes como\n" +
                  "ESPN, FIFA o Marca."
                }
              />
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div className={styles.body}>
            <div className={styles.confirmGrid}>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Pregunta</span>
                <span className={styles.confirmVal}>{title}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Opción A</span>
                <span className={styles.confirmVal}>{sideA}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Opción B</span>
                <span className={styles.confirmVal}>{sideB}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Categoría</span>
                <span className={styles.confirmVal}>{categoria}</span>
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
                <span className={styles.confirmKey}>Resolución</span>
                <span className={styles.confirmVal}>
                  {
                    RESOLUTION_TYPES.find((r) => r.value === resolutionType)
                      ?.label
                  }
                </span>
              </div>
            </div>
            <div className={styles.confirmNote}>
              MetaMask pedirá una firma para crear el mercado on-chain. Los
              participantes depositan USDC al apostar.
            </div>
          </div>
        )}

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
                "Abrir Mercado"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
