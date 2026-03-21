import { Link, useLocation } from "react-router-dom";
import WalletButton from "../wallet/WalletButton";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.nav}>
      <Link to="/dashboard" className={styles.logo}>
        El <span>Tablero</span>
      </Link>

      <div className={styles.links}>
        <Link
          to="/dashboard"
          className={`${styles.link} ${pathname === "/dashboard" ? styles.active : ""}`}
        >
          El Tablero
        </Link>
        <Link
          to="/expediente"
          className={`${styles.link} ${pathname === "/expediente" ? styles.active : ""}`}
        >
          Mi Expediente
        </Link>
      </div>

      <WalletButton />
    </nav>
  );
}
