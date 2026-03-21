const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployando con:", deployer.address);

  const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

  const WorkFactory = await ethers.getContractFactory("WorkFactoryCOFI");
  const workFactory = await WorkFactory.deploy(USDC_ADDRESS);
  await workFactory.waitForDeployment();
  console.log("WorkFactoryCOFI deployado en:", await workFactory.getAddress());

  const BetFactory = await ethers.getContractFactory("BetFactoryCOFI");
  const betFactory = await BetFactory.deploy(USDC_ADDRESS);
  await betFactory.waitForDeployment();
  console.log("BetFactoryCOFI deployado en:", await betFactory.getAddress());

  console.log("\n✅ Copia estas addresses en backend/.env y frontend/.env");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
