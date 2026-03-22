const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const BET_FACTORY_ADDRESS = "0x973FD57eAa52DB63533cA2B88217fDa675D7F901";

  const factory = await ethers.getContractAt(
    "BetFactoryCOFI",
    BET_FACTORY_ADDRESS,
  );
  const tx = await factory.setBridgeReceiver(deployer.address);
  await tx.wait();
  console.log("✅ BetFactory bridgeReceiver configurado:", deployer.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
