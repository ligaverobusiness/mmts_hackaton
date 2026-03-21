const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "https://rpc.sepolia.org";

let provider = null;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

const CONTRACT_ADDRESSES = {
  BetFactory: process.env.BET_FACTORY_ADDRESS || null,
  WorkFactory: process.env.WORK_FACTORY_ADDRESS || null,
  CivicoFactory: process.env.CIVICO_FACTORY_ADDRESS || null,
  USDC: process.env.USDC_ADDRESS || null,
};

function isDeployed(name) {
  return Boolean(CONTRACT_ADDRESSES[name]);
}

module.exports = { getProvider, CONTRACT_ADDRESSES, isDeployed };
