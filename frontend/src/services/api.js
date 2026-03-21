import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Interceptor de errores global
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || "Error de red";
    return Promise.reject(new Error(msg));
  },
);

// ── Usuarios ──────────────────────────────────────
export const loginUsuario = (address) =>
  api.post("/api/usuarios/login", { address });

export const getUsuario = (address) => api.get(`/api/usuarios/${address}`);

export const updateUsuario = (address, datos) =>
  api.put(`/api/usuarios/${address}`, datos);

export default api;
