import { useState } from "react";
import styles from "./CopyButton.module.css";

export default function CopyButton({ text, label = "Copiar link" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  return (
    <button
      className={`${styles.btn} ${copied ? styles.copied : ""}`}
      onClick={handleCopy}
    >
      {copied ? "✓ Copiado" : `⬡ ${label}`}
    </button>
  );
}
