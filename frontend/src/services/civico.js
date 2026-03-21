import api from "./api";
import { ethers } from "ethers";
import { getSigner, getProvider } from "./wallet";

const CIVICO_FACTORY_ABI = [
  "function createProposal(string title, string description, address destinationAddress, uint256 funds, uint256 endDate, bool isPrivate) returns (address)",
  "event ProposalCreated(address indexed proposalAddress, address indexed creator, string title, uint256 funds, uint256 endDate)",
];

const CIVICO_ABI = [
  "function vote(bool inFavor)",
  "function execute()",
  "function cancel()",
  "function getInfo() view returns (address,string,string,address,uint256,uint256,uint256,bool,uint8,uint256,uint256)",
  "function getVoteOf(address voter) view returns (bool voted, bool inFavor)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const CIVICO_FACTORY_ADDRESS =
  import.meta.env.VITE_CIVICO_FACTORY_ADDRESS || null;
const USDC_ADDRESS =
  import.meta.env.VITE_USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// ── Lectura via backend ──────────────────────────────
export const getAllCivicos = () => api.get("/api/civico");
export const getCivicoById = (address) => api.get(`/api/civico/${address}`);

// ── Escritura on-chain ───────────────────────────────

function parseUsdc(amount) {
  return ethers.parseUnits(String(amount), 6);
}

export async function crearPropuesta({
  title,
  description,
  destinationAddress,
  funds,
  endDate,
  isPrivate,
  // metadata backend
  entidad_nombre,
  categoria,
  linkToken,
}) {
  if (!CIVICO_FACTORY_ADDRESS) {
    throw new Error(
      "CivicoFactory no deployada — configura VITE_CIVICO_FACTORY_ADDRESS",
    );
  }

  const signer = await getSigner();
  const address = await signer.getAddress();
  const amountBn = parseUsdc(funds);

  // Aprobar USDC
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const allowance = await usdc.allowance(address, CIVICO_FACTORY_ADDRESS);
  if (allowance < amountBn) {
    const approveTx = await usdc.approve(CIVICO_FACTORY_ADDRESS, amountBn);
    await approveTx.wait();
  }

  // Crear propuesta on-chain
  const factory = new ethers.Contract(
    CIVICO_FACTORY_ADDRESS,
    CIVICO_FACTORY_ABI,
    signer,
  );
  const endDateSec = Math.floor(endDate / 1000);
  const tx = await factory.createProposal(
    title,
    description,
    destinationAddress,
    amountBn,
    endDateSec,
    isPrivate,
  );
  const receipt = await tx.wait();

  // Obtener address del evento
  const event = receipt.logs
    .map((log) => {
      try {
        return factory.interface.parseLog(log);
      } catch (_) {
        return null;
      }
    })
    .find((e) => e?.name === "ProposalCreated");
  const proposalAddress = event?.args?.proposalAddress;

  if (!proposalAddress)
    throw new Error("No se encontró la address de la propuesta");

  // Guardar metadata en backend
  await api.post("/api/civico", {
    address: proposalAddress,
    entidad_nombre,
    categoria,
    descripcion: description,
    direccion_destino: destinationAddress,
    es_privada: isPrivate,
    link_token: linkToken || null,
  });

  return { proposalAddress, txHash: tx.hash };
}

export async function votarPropuesta(proposalAddress, inFavor) {
  const signer = await getSigner();
  const civico = new ethers.Contract(proposalAddress, CIVICO_ABI, signer);
  const tx = await civico.vote(inFavor);
  await tx.wait();
  return tx.hash;
}

export async function ejecutarPropuesta(proposalAddress) {
  const signer = await getSigner();
  const civico = new ethers.Contract(proposalAddress, CIVICO_ABI, signer);
  const tx = await civico.execute();
  await tx.wait();
  return tx.hash;
}

export async function cancelarPropuesta(proposalAddress) {
  const signer = await getSigner();
  const civico = new ethers.Contract(proposalAddress, CIVICO_ABI, signer);
  const tx = await civico.cancel();
  await tx.wait();
  return tx.hash;
}

export async function getMiVoto(proposalAddress, voterAddress) {
  const provider = getProvider();
  const civico = new ethers.Contract(proposalAddress, CIVICO_ABI, provider);
  return civico.getVoteOf(voterAddress);
}
