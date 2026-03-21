import api from "./api";

// Convierte un File a base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Sube un archivo a IPFS via backend y devuelve la URL pública
export async function subirArchivoIPFS(file) {
  const fileBase64 = await fileToBase64(file);
  const result = await api.post("/api/upload", {
    fileBase64,
    fileName: file.name,
    mimeType: file.type,
  });
  return result; // { ok, ipfsHash, url, fileName }
}

// Tipos de archivo permitidos para entregas
export const TIPOS_PERMITIDOS = {
  "application/pdf": { label: "PDF", icon: "📄" },
  "image/png": { label: "PNG", icon: "🖼" },
  "image/jpeg": { label: "JPG", icon: "🖼" },
  "image/svg+xml": { label: "SVG", icon: "🎨" },
  "image/gif": { label: "GIF", icon: "🖼" },
  "application/zip": { label: "ZIP", icon: "📦" },
  "text/plain": { label: "TXT", icon: "📝" },
  "text/html": { label: "HTML", icon: "🌐" },
};

export function esTipoPermitido(file) {
  return Object.keys(TIPOS_PERMITIDOS).includes(file.type);
}

export function fmtTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
