const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const BET_FACTORY_ADDRESS = "0x461bD2Fa75Eb376cf39988e4bD79fB944D135Ef8";

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
