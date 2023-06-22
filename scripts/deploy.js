const hre = require("hardhat");
//npx hardhat run --network localhost scripts/deploy.js 

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function main() {
  const teidoFactory = await hre.ethers.getContractFactory("UniswapFactory");
  const UniswapFactory = await teidoFactory.deploy("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  await UniswapFactory.deployed();

  const teidoRouter02 = await hre.ethers.getContractFactory("UniswapRouter02");
  const UniswapRouter02 = await teidoRouter02.deploy(await UniswapFactory.address, WETH);
  await UniswapRouter02.deployed();

  const testToken = await hre.ethers.getContractFactory("TestSwapToken");
  const TSTtoken = await testToken.deploy();
  await TSTtoken.deployed();



  // WETH mainnet 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  // FACTORY 0x97fd63D049089cd70D9D139ccf9338c81372DE68
  // Router 0xC0BF43A4Ca27e0976195E6661b099742f10507e5
  //TST token 0x43cA9bAe8dF108684E5EAaA720C25e1b32B0A075

  console.log(
    "Router address=>" ,UniswapRouter02.address,
    "Factory address=>",  UniswapFactory.address,
    "Token address=>" ,TSTtoken.address
  );


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});




// async function deployContractFromThirdAddress() {
//   // Get the signers
//   const [deployer, , ] = await ethers.getSigners(); // Assuming the third address is the deployer

//   // Get the contract factory
//   const Contract = await ethers.getContractFactory("ContractName");

//   // Deploy the contract using the deployer's address
//   const deployedContract = await Contract.deploy({ from: deployer.address });

//   console.log("Contract deployed from address:", deployedContract.deployTransaction.from);
// }

