import { useState, useRef } from "react";
import {
  subirArchivoIPFS,
  esTipoPermitido,
  fmtTamano,
  TIPOS_PERMITIDOS,
} from "../../services/upload";
import styles from "./FileUploader.module.css";

export default function FileUploader({ onUpload, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFiles = async (files) => {
    const lista = Array.from(files);

    for (const file of lista) {
      if (!esTipoPermitido(file)) {
        alert(`Tipo no permitido: ${file.type || "desconocido"}`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} supera el límite de 10MB`);
        continue;
      }

      setUploading(true);
      try {
        const result = await subirArchivoIPFS(file);

        const entry = {
          fileName: file.name,
          url: result.url,
          tipo: TIPOS_PERMITIDOS[file.type]?.label || "Archivo",
          icon: TIPOS_PERMITIDOS[file.type]?.icon || "📎",
          size: fmtTamano(file.size),
        };

        setUploadedFiles((prev) => [...prev, entry]);
        onUpload(entry);
      } catch (err) {
        alert(`Error subiendo ${file.name}: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.wrap}>
      {/* Zona de drop */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${
          disabled ? styles.disabled : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
          accept={Object.keys(TIPOS_PERMITIDOS).join(",")}
        />

        {uploading ? (
          <div className={styles.uploadingState}>
            <span className={styles.spinner} />
            <span>Subiendo a IPFS…</span>
          </div>
        ) : (
          <>
            <div className={styles.dropIcon}>⬡</div>
            <div className={styles.dropText}>
              Arrastra archivos aquí o{" "}
              <span className={styles.dropLink}>selecciona</span>
            </div>
            <div className={styles.dropTypes}>
              PDF · PNG · JPG · SVG · ZIP · TXT · HTML — máx. 10MB por archivo
            </div>
          </>
        )}
      </div>

      {/* Archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className={styles.fileList}>
          {uploadedFiles.map((f, i) => (
            <div key={i} className={styles.fileItem}>
              <span className={styles.fileIcon}>{f.icon}</span>

              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{f.fileName}</span>

                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.fileUrl}
                >
                  {f.url.length > 52 ? `${f.url.slice(0, 52)}…` : f.url}
                </a>
              </div>

              <span className={styles.fileSize}>{f.size}</span>

              <button
                type="button"
                className={styles.fileRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(i);
                }}
                aria-label={`Eliminar ${f.fileName}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
