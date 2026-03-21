import api from "./api";

export const getUsuario = (address) => api.get(`/api/usuarios/${address}`);
export const updateUsuario = (address, datos) =>
  api.put(`/api/usuarios/${address}`, datos);
export const getHistorial = (address) =>
  api.get(`/api/usuarios/${address}/historial`);
export const getReputacion = (address) =>
  api.get(`/api/usuarios/${address}/reputacion`);
