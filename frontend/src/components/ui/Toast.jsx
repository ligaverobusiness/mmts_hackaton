import { useToast } from "../../context/ToastContext";
import styles from "./Toast.module.css";

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
