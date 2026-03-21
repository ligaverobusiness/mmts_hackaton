import { BrowserRouter } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import { ToastProvider } from "./context/ToastContext";
import { AppProvider } from "./context/AppContext";
import AppRoutes from "./routes/AppRoutes";
import "./styles/index.css";

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <ToastProvider>
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </ToastProvider>
      </WalletProvider>
    </BrowserRouter>
  );
}
