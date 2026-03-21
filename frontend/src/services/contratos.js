import api from "./api";
import { ethers } from "ethers";
import { getSigner, getProvider } from "./wallet";

// ABIs mínimos
const WORK_FACTORY_ABI = [
  "function createWork(string title, string descriptionPublic, uint256 bounty, uint256 endDate, uint8 requiredApprovals, bool isPrivate) returns (address)",
  "function getAllWorks() view returns (address[])",
  "function getOpenWorks() view returns (address[])",
  "event WorkCreated(address indexed workAddress, address indexed creator, string title, uint256 bounty, uint256 endDate)",
];

const WORK_ABI = [
  "function deliver(string deliveryUrl)",
  "function requestValidation()",
  "function increaseBounty(uint256 amount)",
  "function cancel()",
  "function getInfo() view returns (address,string,string,string,uint256,uint256,uint256,uint8,bool,uint8,address,bool,string)",
  "function getStatus() view returns (uint8)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

const WORK_FACTORY_ADDRESS = import.meta.env.VITE_WORK_FACTORY_ADDRESS || null;
const USDC_ADDRESS =
  import.meta.env.VITE_USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// ── Lectura via backend ──────────────────────────────
export const getAllContratos = () => api.get("/api/contratos");
export const getContratoById = (address) =>
  api.get(`/api/contratos/${address}`);
export const getCondicionesIA = (address, requester) =>
  api.get(`/api/contratos/${address}/condiciones?requester=${requester}`);

// ── Escritura on-chain ───────────────────────────────

// Convierte USDC (6 decimales) a BigInt
function parseUsdc(amount) {
  return ethers.parseUnits(String(amount), 6);
}

export async function crearContrato({
  title,
  descriptionPublic,
  bounty,
  endDate, // timestamp en ms
  requiredApprovals,
  isPrivate,
  // Datos solo para el backend:
  categoria,
  condicionesIA,
  linkToken,
  executorAddress,
}) {
  if (!WORK_FACTORY_ADDRESS) {
    throw new Error(
      "WorkFactory no deployada aún — configura VITE_WORK_FACTORY_ADDRESS",
    );
  }

  const signer = await getSigner();
  const address = await signer.getAddress();

  // 1. Aprobar USDC
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const amountBn = parseUsdc(bounty);

  const allowance = await usdc.allowance(address, WORK_FACTORY_ADDRESS);
  if (allowance < amountBn) {
    const approveTx = await usdc.approve(WORK_FACTORY_ADDRESS, amountBn);
    await approveTx.wait();
  }

  // 2. Crear contrato on-chain
  const factory = new ethers.Contract(
    WORK_FACTORY_ADDRESS,
    WORK_FACTORY_ABI,
    signer,
  );
  const endDateSec = Math.floor(endDate / 1000);
  const tx = await factory.createWork(
    title,
    descriptionPublic,
    amountBn,
    endDateSec,
    requiredApprovals,
    isPrivate,
  );
  const receipt = await tx.wait();

  // 3. Obtener address del contrato creado del evento
  const event = receipt.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch (_) {
        return null;
      }
    })
    .find((e) => e?.name === "WorkCreated");
  const workAddress = event?.args?.workAddress;

  if (!workAddress)
    throw new Error("No se encontró la address del contrato creado");

  // 4. Guardar metadata en backend (condiciones IA, categoría, etc.)
  await api.post("/api/contratos", {
    address: workAddress,
    categoria,
    descripcion_publica: descriptionPublic,
    condiciones_ia: condicionesIA,
    umbral_validadores: requiredApprovals,
    es_privado: isPrivate,
    link_token: linkToken || null,
    executor_address: executorAddress || null,
  });

  return { workAddress, txHash: tx.hash };
}

export async function entregarTrabajo(workAddress, deliveryUrl) {
  const signer = await getSigner();
  const work = new ethers.Contract(workAddress, WORK_ABI, signer);
  const tx = await work.deliver(deliveryUrl);
  await tx.wait();
  return tx.hash;
}

export async function solicitarValidacion(workAddress) {
  const signer = await getSigner();
  const work = new ethers.Contract(workAddress, WORK_ABI, signer);
  const tx = await work.requestValidation();
  await tx.wait();
  return tx.hash;
}

export async function aumentarMonto(workAddress, monto) {
  const signer = await getSigner();
  const address = await signer.getAddress();
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const amountBn = parseUsdc(monto);

  const allowance = await usdc.allowance(address, workAddress);
  if (allowance < amountBn) {
    const approveTx = await usdc.approve(workAddress, amountBn);
    await approveTx.wait();
  }

  const work = new ethers.Contract(workAddress, WORK_ABI, signer);
  const tx = await work.increaseBounty(amountBn);
  await tx.wait();
  return tx.hash;
}

export async function cancelarContrato(workAddress) {
  const signer = await getSigner();
  const work = new ethers.Contract(workAddress, WORK_ABI, signer);
  const tx = await work.cancel();
  await tx.wait();
  return tx.hash;
}

export async function getContratoOnChain(workAddress) {
  const provider = getProvider();
  const work = new ethers.Contract(workAddress, WORK_ABI, provider);
  return work.getInfo();
}
