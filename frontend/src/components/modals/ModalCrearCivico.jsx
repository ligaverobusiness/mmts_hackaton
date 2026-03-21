import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { useToast } from "../../context/ToastContext";
import { useApp } from "../../context/AppContext";
import { crearPropuesta } from "../../services/civico";
import CopyButton from "../ui/CopyButton";
import styles from "./ModalCrearContrato.module.css";

const CATEGORIAS = [
  "Infraestructura",
  "Educación",
  "Salud",
  "Medioambiente",
  "Cultura",
  "Seguridad",
  "Tecnología",
  "Otro",
];

const PASOS = ["La Propuesta", "Fondos & Destino", "Confirmar"];

export default function ModalCrearCivico({ onClose }) {
  const { toast } = useToast();
  const { refresh } = useApp();

  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState(0);
  const [linkGenerado, setLinkGenerado] = useState(null);

  const [entidad, setEntidad] = useState("");
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [destino, setDestino] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [funds, setFunds] = useState("");
  const [dias, setDias] = useState(14);
  const [isPrivate, setIsPrivate] = useState(false);

  const endDate = Date.now() + dias * 86400000;

  const validarPaso0 = () => {
    if (!entidad.trim()) {
      toast.error("El nombre de la entidad es obligatorio");
      return false;
    }
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return false;
    }
    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria");
      return false;
    }
    return true;
  };

  const validarPaso1 = () => {
    if (!funds || isNaN(Number(funds)) || Number(funds) <= 0) {
      toast.error("Los fondos deben ser mayor a 0");
      return false;
    }
    if (!destino.trim() || !destino.startsWith("0x")) {
      toast.error("La dirección destino debe ser una wallet válida (0x...)");
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
      const linkToken = isPrivate
        ? crypto.randomUUID().replace(/-/g, "")
        : null;
      const { proposalAddress } = await crearPropuesta({
        title,
        description: descripcion,
        destinationAddress: destino,
        funds: Number(funds),
        endDate,
        isPrivate,
        entidad_nombre: entidad,
        categoria,
        linkToken,
      });

      if (isPrivate && linkToken) {
        setLinkGenerado(`${window.location.origin}/privado/${linkToken}`);
      } else {
        toast.success(`Propuesta publicada — ${proposalAddress.slice(0, 10)}…`);
        await refresh();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Error al crear la propuesta");
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
        <div className={styles.title}>Nueva Propuesta Cívica</div>
        <div className={styles.sub}>
          Deposita fondos que la comunidad decidirá liberar o retener.
        </div>

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

        {paso === 0 && (
          <div className={styles.body}>
            <div className={styles.group}>
              <label className={styles.label}>
                Nombre de la Entidad / Organización
              </label>
              <input
                className={styles.input}
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                placeholder="Ej: Municipio de San Rafael"
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Título de la Propuesta</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Renovación del Parque Central"
              />
            </div>
            <div className={styles.group}>
              <label className={styles.label}>Descripción detallada</label>
              <textarea
                className={styles.textarea}
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe la propuesta, el impacto esperado, y a quién beneficia…"
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
          </div>
        )}

        {paso === 1 && (
          <div className={styles.body}>
            <div
              className={styles.iaWarning}
              style={{
                borderColor: "rgba(92,30,122,0.3)",
                background: "var(--plum-l)",
                color: "var(--plum)",
              }}
            >
              ⬡ &nbsp;Los fondos quedan retenidos on-chain hasta que la
              comunidad vote. Si la mayoría aprueba, se transfieren
              automáticamente a la dirección destino.
            </div>
            <div className={styles.row}>
              <div className={styles.group}>
                <label className={styles.label}>
                  Fondos a depositar (USDC)
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={funds}
                  onChange={(e) => setFunds(e.target.value)}
                  placeholder="Ej: 5000"
                />
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Plazo de votación (días)</label>
                <select
                  className={styles.select}
                  value={dias}
                  onChange={(e) => setDias(Number(e.target.value))}
                >
                  {[7, 14, 21, 30, 60].map((d) => (
                    <option key={d} value={d}>
                      {d} días
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.group}>
              <label className={styles.label}>
                Dirección destino si la propuesta es aprobada
              </label>
              <div className={styles.hint}>
                Esta dirección recibirá los fondos automáticamente si la
                comunidad vota SÍ.
              </div>
              <input
                className={styles.input}
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="0x…"
              />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className={styles.body}>
            <div className={styles.confirmGrid}>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Entidad</span>
                <span className={styles.confirmVal}>{entidad}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Título</span>
                <span className={styles.confirmVal}>{title}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Categoría</span>
                <span className={styles.confirmVal}>{categoria}</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Fondos</span>
                <span
                  className={styles.confirmVal}
                  style={{ color: "var(--gold)", fontWeight: 700 }}
                >
                  ${Number(funds).toLocaleString()} USDC
                </span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Plazo</span>
                <span className={styles.confirmVal}>{dias} días</span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Destino</span>
                <span className={styles.confirmVal}>
                  {destino.slice(0, 10)}…
                </span>
              </div>
              <div className={styles.confirmRow}>
                <span className={styles.confirmKey}>Visibilidad</span>
                <span className={styles.confirmVal}>
                  {isPrivate ? "⬡ Privado" : "◎ Público"}
                </span>
              </div>
            </div>
            <div className={styles.confirmNote}>
              MetaMask pedirá dos firmas: aprobar USDC y crear la propuesta
              on-chain.
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
                "Publicar Propuesta"
              )}
            </button>
          )}
        </div>

        {/* Pantalla de link generado */}
        {linkGenerado && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--paper3)",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              gap: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, color: "var(--green)" }}>✓</div>
            <div className={styles.title} style={{ fontSize: 14 }}>
              Propuesta creada
            </div>
            <p className={styles.sub}>
              Comparte este link para que la comunidad pueda votar:
            </p>
            <div
              style={{
                background: "var(--paper)",
                border: "1px solid var(--bd-hi)",
                padding: "10px 14px",
                fontFamily: "Courier Prime, monospace",
                fontSize: 11,
                color: "var(--ink)",
                wordBreak: "break-all",
                width: "100%",
              }}
            >
              {linkGenerado}
            </div>
            <CopyButton text={linkGenerado} label="Copiar link privado" />
            <button
              className={styles.btnCancel}
              onClick={async () => {
                await refresh();
                onClose();
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
