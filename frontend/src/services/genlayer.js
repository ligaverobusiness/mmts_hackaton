import { createClient } from "genlayer-js";
import { testnetAsimov } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const WORK_VALIDATOR_ADDRESS =
  import.meta.env.VITE_GENLAYER_WORK_VALIDATOR || null;

let client = null;

function getClient() {
  if (!client) {
    client = createClient({ chain: testnetAsimov });
  }
  return client;
}

export async function validateDelivery(validatorAddress, deliveryUrl) {
  const c = getClient();
  const hash = await c.writeContract({
    address: validatorAddress,
    functionName: "validate_delivery",
    args: [deliveryUrl],
  });
  const receipt = await c.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    retries: 100,
    interval: 5000,
  });
  return receipt;
}

export async function getValidationResult(validatorAddress) {
  const c = getClient();
  return c.readContract({
    address: validatorAddress,
    functionName: "get_result",
    args: [],
  });
}

export function pollValidation(validatorAddress, onUpdate, intervalMs = 5000) {
  const timer = setInterval(async () => {
    try {
      const result = await getValidationResult(validatorAddress);
      onUpdate(result);
      if (result.status !== "pending") {
        clearInterval(timer);
      }
    } catch (_) {}
  }, intervalMs);
  return () => clearInterval(timer);
}
