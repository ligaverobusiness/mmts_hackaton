import { BrowserRouter } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import AppRoutes from "./routes/AppRoutes";
import "./styles/index.css";

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <AppRoutes />
      </WalletProvider>
    </BrowserRouter>
  );
}
