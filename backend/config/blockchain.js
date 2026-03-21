// Configuración de ethers para leer contratos Solidity
// En Bloque 2 solo se configura — las lecturas reales llegan en Bloque 3+
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.org";

// Instancia del provider — se crea una sola vez
let provider = null;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

// Addresses de contratos deployados (se rellenan en Bloque 3)
const CONTRACT_ADDRESSES = {
  BetFactory: process.env.BET_FACTORY_ADDRESS || null,
  WorkFactory: process.env.WORK_FACTORY_ADDRESS || null,
  Civico: process.env.CIVICO_ADDRESS || null,
  USDC: process.env.USDC_ADDRESS || null,
};

// Verifica si los contratos están deployados
function isDeployed(name) {
  return Boolean(CONTRACT_ADDRESSES[name]);
}

module.exports = { getProvider, CONTRACT_ADDRESSES, isDeployed };
