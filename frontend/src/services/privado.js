import api from "./api";

export const resolverToken = (token) => api.get(`/api/privado/${token}`);
