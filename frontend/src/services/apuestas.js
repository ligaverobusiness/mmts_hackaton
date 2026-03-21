import api from "./api";
import { ethers } from "ethers";
import { getSigner, getProvider } from "./wallet";

const BET_FACTORY_ABI = [
  "function createBet(string title, string resolutionCriteria, string sideAName, string sideBName, uint256 endDate, uint8 resolutionType, bytes resolutionData) returns (address)",
  "function placeBet(address betAddress, bool onSideA, uint256 amount)",
  "function getAllBets() view returns (address[])",
  "event BetCreated(address indexed betAddress, address indexed creator, string title, uint256 endDate)",
];

const BET_ABI = [
  "function resolve()",
  "function claim()",
  "function cancelBet()",
  "function getInfo() view returns (address,string,string,string,string,uint256,uint256,bool,bool,uint256,uint256,uint256,string)",
  "function getUserBets(address user) view returns (uint256 onSideA, uint256 onSideB)",
  "function calculatePotentialWinnings(address user) view returns (uint256 ifSideAWins, uint256 ifSideBWins)",
  "function status() view returns (uint8)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

const BET_FACTORY_ADDRESS = import.meta.env.VITE_BET_FACTORY_ADDRESS || null;
const USDC_ADDRESS =
  import.meta.env.VITE_USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// ── Lectura via backend ──────────────────────────────
export const getAllApuestas = () => api.get("/api/apuestas");
export const getApuestaById = (address) => api.get(`/api/apuestas/${address}`);
export const getOdds = (address) => api.get(`/api/apuestas/${address}/odds`);

// ── Cálculo de odds local ────────────────────────────
export function calcMultiplier(sidePool, totalPool) {
  if (!sidePool || !totalPool) return 1;
  return parseFloat((totalPool / sidePool).toFixed(2));
}

export function calcMultiplierClass(multiplier) {
  if (multiplier >= 3) return "hi";
  if (multiplier >= 1.5) return "mi";
  return "lo";
}

// ── Escritura on-chain ───────────────────────────────
function parseUsdc(amount) {
  return ethers.parseUnits(String(amount), 6);
}

export async function crearApuesta({
  title,
  resolutionCriteria,
  sideAName,
  sideBName,
  endDate,
  resolutionType, // 0=CRYPTO, 1=STOCKS, 2=NEWS
  // metadata backend
  categoria,
  isPrivate,
  linkToken,
}) {
  if (!BET_FACTORY_ADDRESS) {
    throw new Error(
      "BetFactory no deployada — configura VITE_BET_FACTORY_ADDRESS",
    );
  }

  const signer = await getSigner();
  const factory = new ethers.Contract(
    BET_FACTORY_ADDRESS,
    BET_FACTORY_ABI,
    signer,
  );
  const endDateSec = Math.floor(endDate / 1000);

  const tx = await factory.createBet(
    title,
    resolutionCriteria,
    sideAName,
    sideBName,
    endDateSec,
    resolutionType || 2, // default NEWS
    ethers.toUtf8Bytes(resolutionCriteria),
  );
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch (_) {
        return null;
      }
    })
    .find((e) => e?.name === "BetCreated");
  const betAddress = event?.args?.betAddress;

  if (!betAddress) throw new Error("No se encontró la address de la apuesta");

  // Guardar metadata en backend
  await api.post("/api/apuestas", {
    address: betAddress,
    categoria,
    tipo_estructura: "binary",
    nombres_lados: [sideAName, sideBName],
    es_privada: isPrivate,
    link_token: linkToken || null,
  });

  return { betAddress, txHash: tx.hash };
}

export async function apostar(betAddress, onSideA, amount) {
  if (!BET_FACTORY_ADDRESS) throw new Error("BetFactory no deployada");

  const signer = await getSigner();
  const address = await signer.getAddress();
  const amountBn = parseUsdc(amount);

  // Aprobar USDC para la factory
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const allowance = await usdc.allowance(address, BET_FACTORY_ADDRESS);
  if (allowance < amountBn) {
    const approveTx = await usdc.approve(BET_FACTORY_ADDRESS, amountBn);
    await approveTx.wait();
  }

  const factory = new ethers.Contract(
    BET_FACTORY_ADDRESS,
    BET_FACTORY_ABI,
    signer,
  );
  const tx = await factory.placeBet(betAddress, onSideA, amountBn);
  await tx.wait();
  return tx.hash;
}

export async function resolverApuesta(betAddress) {
  const signer = await getSigner();
  const bet = new ethers.Contract(betAddress, BET_ABI, signer);
  const tx = await bet.resolve();
  await tx.wait();
  return tx.hash;
}

export async function reclamarGanancias(betAddress) {
  const signer = await getSigner();
  const bet = new ethers.Contract(betAddress, BET_ABI, signer);
  const tx = await bet.claim();
  await tx.wait();
  return tx.hash;
}

export async function cancelarApuesta(betAddress) {
  const signer = await getSigner();
  const bet = new ethers.Contract(betAddress, BET_ABI, signer);
  const tx = await bet.cancelBet();
  await tx.wait();
  return tx.hash;
}

export async function getMisApuestas(betAddress, userAddress) {
  const provider = getProvider();
  const bet = new ethers.Contract(betAddress, BET_ABI, provider);
  return bet.getUserBets(userAddress);
}

export async function getGananciaPotencial(betAddress, userAddress) {
  const provider = getProvider();
  const bet = new ethers.Contract(betAddress, BET_ABI, provider);
  return bet.calculatePotentialWinnings(userAddress);
}
