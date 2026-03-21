import ToastContainer from "../ui/Toast";

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {children}
      <ToastContainer />
    </div>
  );
}
