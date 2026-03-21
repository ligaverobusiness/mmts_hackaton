import api from "./api";

export const getAllApuestas = () => api.get("/api/apuestas");
export const getApuestaById = (address) => api.get(`/api/apuestas/${address}`);
export const getOdds = (address) => api.get(`/api/apuestas/${address}/odds`);

// Calcula multiplicador local (sin llamar al backend)
export function calcMultiplier(sidePool, totalPool) {
  if (!sidePool || !totalPool) return 1;
  return parseFloat((totalPool / sidePool).toFixed(2));
}

export function calcMultiplierClass(multiplier) {
  if (multiplier >= 3) return "hi";
  if (multiplier >= 1.5) return "mi";
  return "lo";
}

// Write functions — se implementan en Bloque 5
export const crearApuesta = () =>
  Promise.reject(new Error("Disponible en Bloque 5"));
export const apostar = () =>
  Promise.reject(new Error("Disponible en Bloque 5"));
export const resolver = () =>
  Promise.reject(new Error("Disponible en Bloque 5"));
export const reclamar = () =>
  Promise.reject(new Error("Disponible en Bloque 5"));
