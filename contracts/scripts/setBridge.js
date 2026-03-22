const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const WORK_FACTORY_ADDRESS = "0xDB69d628eA3B1f15AaFa526Eae12EAB6Ef36679b";
  const factory = await ethers.getContractAt(
    "WorkFactoryCOFI",
    WORK_FACTORY_ADDRESS,
  );
  const tx = await factory.setBridgeReceiver(deployer.address);
  await tx.wait();
  console.log("✅ WorkFactory bridgeReceiver configurado:", deployer.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
