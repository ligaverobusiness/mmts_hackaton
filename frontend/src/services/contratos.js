import api from "./api";

export const getAllContratos = () => api.get("/api/contratos");
export const getContratoById = (address) =>
  api.get(`/api/contratos/${address}`);
export const getCondicionesIA = (address, requester) =>
  api.get(`/api/contratos/${address}/condiciones?requester=${requester}`);

// Write functions — se implementan en Bloque 3
export const crearContrato = () =>
  Promise.reject(new Error("Disponible en Bloque 3"));
export const entregarTrabajo = () =>
  Promise.reject(new Error("Disponible en Bloque 3"));
export const resolverContrato = () =>
  Promise.reject(new Error("Disponible en Bloque 3"));
export const aumentarMonto = () =>
  Promise.reject(new Error("Disponible en Bloque 3"));
export const cancelarContrato = () =>
  Promise.reject(new Error("Disponible en Bloque 3"));
