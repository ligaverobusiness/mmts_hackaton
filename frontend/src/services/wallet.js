import { ethers } from "ethers";

// Red objetivo — puedes cambiarla según el concurso
// Por ahora usamos Sepolia (testnet EVM estándar)
const TARGET_NETWORK = {
  chainId: "0xaa36a7", // Sepolia = 11155111 en hex
  chainName: "Sepolia Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

// Verifica si MetaMask está instalado
export function isMetaMaskInstalled() {
  return typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask);
}

// Conecta MetaMask y retorna la address
export async function connectMetaMask() {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask no está instalado. Instálalo en metamask.io");
  }
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  if (!accounts || accounts.length === 0) {
    throw new Error("No se obtuvo ninguna cuenta");
  }
  return accounts[0].toLowerCase();
}

// Retorna las cuentas actualmente conectadas (sin popup)
export async function getConnectedAccounts() {
  if (!isMetaMaskInstalled()) return [];
  const accounts = await window.ethereum.request({
    method: "eth_accounts",
  });
  return accounts.map((a) => a.toLowerCase());
}

// Retorna el chainId actual
export async function getCurrentChainId() {
  if (!isMetaMaskInstalled()) return null;
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  return chainId;
}

// Cambia a la red objetivo o la agrega si no existe
export async function switchToTargetNetwork() {
  if (!isMetaMaskInstalled()) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_NETWORK.chainId }],
    });
  } catch (err) {
    // Error 4902 = la red no está agregada
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [TARGET_NETWORK],
      });
    } else {
      throw err;
    }
  }
}

// Retorna el provider de ethers
export function getProvider() {
  if (!isMetaMaskInstalled()) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

// Retorna el signer (para firmar transacciones)
export async function getSigner() {
  const provider = getProvider();
  if (!provider) return null;
  return provider.getSigner();
}

// Retorna el balance en ETH formateado
export async function getBalance(address) {
  const provider = getProvider();
  if (!provider || !address) return "0";
  const balance = await provider.getBalance(address);
  return parseFloat(ethers.formatEther(balance)).toFixed(4);
}

// Abrevia una dirección: 0x3f4a...b8c1
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
