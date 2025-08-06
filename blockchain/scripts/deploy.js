/**
 * @title QRLTrade Deployment Script
 * @dev Deploys the quantum-resistant trading contract with proper initialization
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting QRLTrade deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy a mock quantum oracle first (in production, this would be a real oracle)
  console.log("\nDeploying mock quantum oracle...");
  const QuantumOracle = await ethers.getContractFactory("MockQuantumOracle");
  const quantumOracle = await QuantumOracle.deploy();
  await quantumOracle.waitForDeployment();
  const oracleAddress = await quantumOracle.getAddress();
  console.log("Mock Quantum Oracle deployed to:", oracleAddress);
  
  // Deploy the main QRLTrade contract
  console.log("\nDeploying QRLTrade contract...");
  const QRLTrade = await ethers.getContractFactory("QRLTrade");
  const qrlTrade = await QRLTrade.deploy(oracleAddress);
  await qrlTrade.waitForDeployment();
  const contractAddress = await qrlTrade.getAddress();
  console.log("QRLTrade deployed to:", contractAddress);
  
  // Grant oracle role to the quantum oracle
  console.log("\nSetting up roles...");
  const ORACLE_ROLE = await qrlTrade.ORACLE_ROLE();
  await qrlTrade.grantRole(ORACLE_ROLE, oracleAddress);
  console.log("Oracle role granted to:", oracleAddress);
  
  // Grant trader role to deployer for testing
  const TRADER_ROLE = await qrlTrade.TRADER_ROLE();
  await qrlTrade.grantRole(TRADER_ROLE, deployer.address);
  console.log("Trader role granted to deployer:", deployer.address);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const stats = await qrlTrade.getPlatformStats();
  console.log("Platform stats:", {
    volume: stats[0].toString(),
    value: stats[1].toString(),
    tradeCount: stats[2].toString()
  });
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      QRLTrade: contractAddress,
      QuantumOracle: oracleAddress
    },
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };
  
  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Instructions for integration
  console.log("\n=== Integration Instructions ===");
  console.log("1. Update your Node.js backend with the following contract address:");
  console.log(`   QRLTrade: ${contractAddress}`);
  console.log("2. Update your quantum oracle address:");
  console.log(`   Quantum Oracle: ${oracleAddress}`);
  console.log("3. Ensure your backend has the private key for address:", deployer.address);
  console.log("4. Add the ABI files to your backend for contract interaction");
  
  return { qrlTrade: contractAddress, oracle: oracleAddress };
}

// Mock Quantum Oracle contract for testing
const MockQuantumOracleSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockQuantumOracle {
    uint256 private nonce;
    
    event QuantumEntropyGenerated(bytes32 entropy, uint256 timestamp);
    
    function generateQuantumEntropy() external returns (bytes32) {
        nonce++;
        bytes32 entropy = keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            nonce,
            blockhash(block.number - 1),
            msg.sender
        ));
        
        emit QuantumEntropyGenerated(entropy, block.timestamp);
        return entropy;
    }
    
    function getLatestEntropy() external view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            nonce
        ));
    }
}
`;

// Create the mock oracle contract file if it doesn't exist
const fs = require("fs");
const path = require("path");

const mockOracleDir = path.join(__dirname, "../contracts");
const mockOraclePath = path.join(mockOracleDir, "MockQuantumOracle.sol");

if (!fs.existsSync(mockOraclePath)) {
  fs.writeFileSync(mockOraclePath, MockQuantumOracleSource);
  console.log("Created MockQuantumOracle.sol");
}

// Handle both direct execution and module export
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;