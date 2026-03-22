const { ethers } = require("ethers");

const WORK_FACTORY_ABI = [
  "function processBridgeMessage(uint32 sourceChainId, address sender, bytes calldata message)",
];

const BET_FACTORY_ABI = [
  "function processBridgeMessage(uint32 sourceChainId, address sender, bytes calldata message)",
];

function getRelayWallet() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY no configurada");
  return new ethers.Wallet(pk.startsWith("0x") ? pk : `0x${pk}`, provider);
}

// ── Contratos de trabajo ──────────────────────────────
async function submitResolutionToChain(workAddress, approved, summary) {
  const wallet = getRelayWallet();
  const factory = new ethers.Contract(
    process.env.WORK_FACTORY_ADDRESS,
    WORK_FACTORY_ABI,
    wallet,
  );

  const innerMessage = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bool", "string"],
    [workAddress, approved, summary],
  );
  const outerMessage = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bytes"],
    [workAddress, innerMessage],
  );

  const tx = await factory.processBridgeMessage(
    0,
    wallet.address,
    outerMessage,
  );
  await tx.wait();
  console.log(
    `✅ Work resolución on-chain: ${workAddress} — ${approved ? "APROBADO" : "RECHAZADO"}`,
  );
  return tx.hash;
}

// ── Apuestas ──────────────────────────────────────────
async function submitBetResolutionToChain(
  betAddress,
  sideAWins,
  isUndetermined,
  summary,
) {
  const wallet = getRelayWallet();
  const factory = new ethers.Contract(
    process.env.BET_FACTORY_ADDRESS,
    BET_FACTORY_ABI,
    wallet,
  );

  // Codificar exactamente como BetCOFI.setResolution espera:
  // (address betAddress, bool sideAWins, bool isUndetermined, uint256, bytes32, uint256, string)
  const innerMessage = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bool", "bool", "uint256", "bytes32", "uint256", "string"],
    [betAddress, sideAWins, isUndetermined, 0, ethers.ZeroHash, 0, summary],
  );
  const outerMessage = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bytes"],
    [betAddress, innerMessage],
  );

  const tx = await factory.processBridgeMessage(
    0,
    wallet.address,
    outerMessage,
  );
  await tx.wait();
  console.log(
    `✅ Bet resolución on-chain: ${betAddress} — sideAWins: ${sideAWins}`,
  );
  return tx.hash;
}

module.exports = { submitResolutionToChain, submitBetResolutionToChain };
