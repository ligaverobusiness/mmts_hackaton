import Navbar from "./Navbar";
import ToastContainer from "../ui/Toast";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <Navbar />
      {children}
      <ToastContainer />
    </div>
  );
}
