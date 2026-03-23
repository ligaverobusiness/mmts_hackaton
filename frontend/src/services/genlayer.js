import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import api from "./api";

const VALIDATOR_ADDRESS = import.meta.env.VITE_GENLAYER_WORK_VALIDATOR || null;
const ORACLE_ADDRESS = import.meta.env.VITE_GENLAYER_BET_ORACLE || null;

let client = null;

function getClient() {
  if (!client) {
    const privateKey = import.meta.env.VITE_GENLAYER_PRIVATE_KEY;
    const account = createAccount(privateKey);
    client = createClient({
      chain: testnetAsimov,
      account,
    });
    console.log("GenLayer account:", account.address); // guarda esta dirección
  }
  return client;
}

// ── Contratos de trabajo ──────────────────────────────

export async function validateDelivery(validatorAddress, deliveryUrl) {
  const addr = validatorAddress || VALIDATOR_ADDRESS;
  if (!addr) throw new Error("No hay contrato GenLayer configurado");

  const c = getClient();
  const hash = await c.writeContract({
    address: addr,
    functionName: "validate_delivery",
    args: [deliveryUrl],
  });

  console.log("✅ validate_delivery enviado, hash:", hash);
  return hash;
}
export async function getValidationResult(validatorAddress) {
  const addr = validatorAddress || VALIDATOR_ADDRESS;
  if (!addr) throw new Error("No hay contrato GenLayer configurado");

  const c = getClient();
  const result = await c.readContract({
    address: addr,
    functionName: "get_result",
    args: [],
  });
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch (_) {
      return { status: "pending" };
    }
  }
  return result;
}

export function pollValidation(
  validatorAddress,
  workAddress,
  onUpdate,
  intervalMs = 5000,
) {
  const addr = validatorAddress || VALIDATOR_ADDRESS;
  const timer = setInterval(async () => {
    try {
      const result = await getValidationResult(addr);
      console.log("Poll result:", result); // ← agrega esto

      onUpdate(result);
      if (result?.status !== "pending") {
        clearInterval(timer);
        if (workAddress) {
          try {
            await api.post("/api/genlayer/resolve", {
              workAddress,
              approved: result.is_approved,
              summary: result.summary || "",
            });
            console.log("✅ Work resultado relayado a Solidity");
          } catch (err) {
            console.error("Error relay work:", err.message);
          }
        }
      }
    } catch (_) {}
  }, intervalMs);
  return () => clearInterval(timer);
}

export async function deployWorkValidator() {
  return VALIDATOR_ADDRESS;
}

// ── Apuestas ──────────────────────────────────────────

export async function resolveBetOracle(oracleAddress) {
  const addr = oracleAddress || ORACLE_ADDRESS;
  if (!addr) throw new Error("No hay oracle GenLayer configurado");

  const c = getClient();
  const hash = await c.writeContract({
    address: addr,
    functionName: "resolve",
    args: [],
  });
  return c.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    retries: 100,
    interval: 5000,
  });
}

export async function getBetOracleResult(oracleAddress) {
  const addr = oracleAddress || ORACLE_ADDRESS;
  if (!addr) throw new Error("No hay oracle GenLayer configurado");

  const c = getClient();
  const result = await c.readContract({
    address: addr,
    functionName: "get_result",
    args: [],
  });
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch (_) {
      return { status: "pending" };
    }
  }
  return result;
}

export function pollBetOracle(
  oracleAddress,
  betAddress,
  onUpdate,
  intervalMs = 5000,
) {
  const addr = oracleAddress || ORACLE_ADDRESS;
  const timer = setInterval(async () => {
    try {
      const result = await getBetOracleResult(addr);
      onUpdate(result);
      if (result?.status !== "pending") {
        clearInterval(timer);
        if (betAddress) {
          try {
            await api.post("/api/genlayer/resolve-bet", {
              betAddress,
              sideAWins: result.side_a_wins,
              isUndetermined: result.status === "undetermined",
              summary: result.summary || "",
            });
            console.log("✅ Bet resultado relayado a Solidity");
          } catch (err) {
            console.error("Error relay bet:", err.message);
          }
        }
      }
    } catch (_) {}
  }, intervalMs);
  return () => clearInterval(timer);
}
