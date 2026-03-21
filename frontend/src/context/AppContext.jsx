import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useReducer,
} from "react";
import { getAllContratos } from "../services/contratos";
import { getAllApuestas } from "../services/apuestas";

const AppContext = createContext(null);

// Normaliza entradas de contratos y apuestas a formato común del dashboard
function normalize(item) {
  if (item.type === "bet") {
    return {
      ...item,
      amount: item.totalPool || 0,
      category: item.category || item.categoria || "Sin categoría",
    };
  }
  return {
    ...item,
    amount: item.bounty || 0,
    category: item.category || item.categoria || "Sin categoría",
  };
}

const FILTERS = {
  type: "all", // all | contract | bet | civic
  category: "all", // all | Deportes | Tecnología...
  visibility: "all", // all | public | private
};

function filterReducer(state, action) {
  switch (action.type) {
    case "SET_TYPE":
      return { ...state, type: action.value };
    case "SET_CATEGORY":
      return { ...state, category: action.value };
    case "SET_VISIBILITY":
      return { ...state, visibility: action.value };
    case "RESET":
      return FILTERS;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [allEntries, setAllEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, dispatchFilter] = useReducer(filterReducer, FILTERS);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [contratos, apuestas] = await Promise.all([
        getAllContratos(),
        getAllApuestas(),
      ]);
      const combined = [
        ...(Array.isArray(contratos) ? contratos : []),
        ...(Array.isArray(apuestas) ? apuestas : []),
      ].map(normalize);
      setAllEntries(combined);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Aplica filtros a las entradas
  const entries = allEntries.filter((e) => {
    if (filters.type !== "all" && e.type !== filters.type) return false;
    if (filters.category !== "all" && e.category !== filters.category)
      return false;
    if (filters.visibility === "public" && e.isPrivate) return false;
    if (filters.visibility === "private" && !e.isPrivate) return false;
    return true;
  });

  // Top 10 contratos por bounty (excluyendo cancelados)
  const top10 = [...allEntries]
    .filter((e) => e.type === "contract" && e.status !== "cancelled")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Categorías disponibles para el filtro
  const categories = [
    "all",
    ...new Set(allEntries.map((e) => e.category).filter(Boolean)),
  ];

  return (
    <AppContext.Provider
      value={{
        entries,
        allEntries,
        top10,
        categories,
        filters,
        dispatchFilter,
        isLoading,
        error,
        refresh: fetchAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
