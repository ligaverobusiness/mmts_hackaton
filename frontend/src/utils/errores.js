export function parsearError(err) {
  const msg = err?.message || err?.reason || String(err);

  if (
    msg.includes("user rejected") ||
    msg.includes("ACTION_REJECTED") ||
    msg.includes("User denied")
  )
    return "Transacción cancelada por el usuario";
  if (msg.includes("insufficient funds"))
    return "Fondos insuficientes para pagar el gas";
  if (msg.includes("transfer amount exceeds balance"))
    return "USDC insuficiente — obtén más en faucet.circle.com";
  if (msg.includes("allowance"))
    return "Error al aprobar USDC — intenta de nuevo";
  if (msg.includes("execution reverted"))
    return `Transacción rechazada por el contrato: ${err?.reason || "verifica los datos"}`;
  if (msg.includes("network") || msg.includes("could not detect"))
    return "Error de red — verifica que MetaMask está en Sepolia";
  if (msg.includes("nonce"))
    return "Error de nonce — recarga la página e intenta de nuevo";

  return "Error inesperado — intenta de nuevo";
}
