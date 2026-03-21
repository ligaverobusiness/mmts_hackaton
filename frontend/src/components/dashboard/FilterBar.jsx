import { useApp } from "../../context/AppContext";
import styles from "./FilterBar.module.css";

const TYPES = [
  { value: "all", label: "Todos" },
  { value: "contract", label: "Contratos" },
  { value: "civic", label: "Cívico" },
  { value: "bet", label: "Apuestas" },
];

const CATEGORIES = [
  "all",
  "Diseño & Creatividad",
  "Tecnología & Dev",
  "Hogar & Reparaciones",
  "Escritura & Contenido",
  "Marketing & Redes",
  "Legal & Finanzas",
  "Deportes",
  "Entretenimiento",
  "Finanzas & Mercados",
  "Vida cotidiana",
  "Infraestructura",
  "Educación",
  "Otro",
];

export default function FilterBar({ onPublicar }) {
  const { filters, dispatchFilter } = useApp();

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        {/* Tipo */}
        <div className={styles.group}>
          {TYPES.map((t) => (
            <button
              key={t.value}
              className={`${styles.btn} ${filters.type === t.value ? styles.active : ""}`}
              onClick={() =>
                dispatchFilter({ type: "SET_TYPE", value: t.value })
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Categoría */}
        <select
          className={styles.select}
          value={filters.category}
          onChange={(e) =>
            dispatchFilter({ type: "SET_CATEGORY", value: e.target.value })
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Todas las categorías" : c}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.right}>
        {/* Visibilidad toggle */}
        <div className={styles.visGroup}>
          {["all", "public", "private"].map((v) => (
            <button
              key={v}
              className={`${styles.visBtnSmall} ${filters.visibility === v ? styles.visActive : ""}`}
              onClick={() =>
                dispatchFilter({ type: "SET_VISIBILITY", value: v })
              }
            >
              {v === "all"
                ? "Todos"
                : v === "public"
                  ? "◎ Público"
                  : "⬡ Privado"}
            </button>
          ))}
        </div>

        {/* Publicar */}
        <button className={styles.btnPublicar} onClick={onPublicar}>
          ＋ Publicar
        </button>
      </div>
    </div>
  );
}
