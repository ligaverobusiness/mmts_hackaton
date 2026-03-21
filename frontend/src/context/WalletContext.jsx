import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  connectMetaMask,
  getConnectedAccounts,
  getCurrentChainId,
  switchToTargetNetwork,
  getBalance,
  isMetaMaskInstalled,
} from "../services/wallet";
import { loginUsuario } from "../services/api";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState("0");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Actualiza el balance cuando cambia la address
  const refreshBalance = useCallback(async (addr) => {
    if (!addr) return;
    const bal = await getBalance(addr);
    setBalance(bal);
  }, []);

  // Intenta reconectar si ya había una sesión
  useEffect(() => {
    const tryReconnect = async () => {
      if (!isMetaMaskInstalled()) return;
      const accounts = await getConnectedAccounts();
      if (accounts.length > 0) {
        const addr = accounts[0];
        const chain = await getCurrentChainId();
        setAddress(addr);
        setChainId(chain);
        setIsConnected(true);
        refreshBalance(addr);
      }
    };
    tryReconnect();
  }, [refreshBalance]);

  // Escucha cambios de cuenta y de red en MetaMask
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // Usuario desconectó desde MetaMask
        setAddress(null);
        setIsConnected(false);
        setBalance("0");
      } else {
        const addr = accounts[0].toLowerCase();
        setAddress(addr);
        setIsConnected(true);
        refreshBalance(addr);
      }
    };

    const handleChainChanged = (chain) => {
      setChainId(chain);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [refreshBalance]);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Conectar MetaMask
      const addr = await connectMetaMask();

      // Cambiar a la red correcta
      await switchToTargetNetwork();
      const chain = await getCurrentChainId();

      setAddress(addr);
      setChainId(chain);
      setIsConnected(true);
      refreshBalance(addr);

      // Registrar/actualizar perfil en el backend
      await loginUsuario(addr);
    } catch (err) {
      setError(err.message || "Error al conectar la wallet");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshBalance]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance("0");
    setIsConnected(false);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        balance,
        isConnected,
        isLoading,
        error,
        connectWallet,
        disconnectWallet,
        refreshBalance: () => refreshBalance(address),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Hook de acceso rápido
export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet debe usarse dentro de WalletProvider");
  return ctx;
}
