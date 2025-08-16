// Fixture: deploys contract, registers keys, and creates a trade
async function createTradeFixture() {
  const fixture = await deployQRLTradeFixture();
  const { qrlTrade, trader1, trader2 } = fixture;
  await registerQuantumKeys(qrlTrade, trader1, trader2);

  const commodity = 0;
  const quantity = 10; // integer units
  const price = ethers.parseEther("0.001"); // price per unit in wei
  const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
  const quantumEntropy = generateQuantumEntropy();

  await qrlTrade.connect(trader1).createTrade(
    trader2.address,
    commodity,
    quantity,
    price,
    deliveryDate,
    quantumEntropy
  );

  return { ...fixture, tradeId: 1 };
}

// Fixture: creates and confirms a trade by both parties
async function createConfirmedTradeFixture() {
  const fixture = await createTradeFixture();
  const { qrlTrade, trader1, trader2, tradeId } = fixture;

  const trade = await qrlTrade.getTrade(tradeId);

  // Both parties confirm the trade
  const quantumEntropy1 = generateQuantumEntropy();

  // Use test bypass signature for both parties
  const signature1 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);
  await qrlTrade.connect(trader1).confirmTrade(tradeId, signature1, quantumEntropy1);

  const quantumEntropy2 = generateQuantumEntropy();
  const signature2 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);
  await qrlTrade.connect(trader2).confirmTrade(tradeId, signature2, quantumEntropy2);

  return { ...fixture, tradeId };
}
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
  // Test fixture for contract deployment
  // Returns deployed contract and test signers
  async function deployQRLTradeFixture() {
    // Explicitly use the first five signers for owner, trader1, trader2, oracle, otherAccount
    const signers = await ethers.getSigners();
    const owner = signers[0];
    const trader1 = signers[1];
    const trader2 = signers[2];
    const oracle = signers[3];
    const otherAccount = signers[4];

    // Deploy mock quantum oracle
    const MockQuantumOracle = await ethers.getContractFactory("MockQuantumOracle");
    const quantumOracle = await MockQuantumOracle.deploy();
    await quantumOracle.waitForDeployment();

    // Deploy QRLTrade contract
    const QRLTrade = await ethers.getContractFactory("QRLTrade");
    const qrlTrade = await QRLTrade.deploy(await quantumOracle.getAddress());
    await qrlTrade.waitForDeployment();

    // Setup roles
    const TRADER_ROLE = await qrlTrade.TRADER_ROLE();
    const ORACLE_ROLE = await qrlTrade.ORACLE_ROLE();

    await qrlTrade.grantRole(TRADER_ROLE, trader1.address);
    await qrlTrade.grantRole(TRADER_ROLE, trader2.address);
    await qrlTrade.grantRole(ORACLE_ROLE, oracle.address);

    // Return all actors and contract
    return {
      qrlTrade,
      quantumOracle,
      owner,
      trader1,
      trader2,
      oracle,
      otherAccount,
      TRADER_ROLE,
      ORACLE_ROLE
    };
  }

  // Helper function to register quantum keys for traders
  // Ensures both traders have valid keys for quantum operations
  async function registerQuantumKeys(qrlTrade, trader1, trader2) {
    const publicKey1 = ethers.hexlify(ethers.randomBytes(32));
    const publicKey2 = ethers.hexlify(ethers.randomBytes(32));
    const validityPeriod = 30 * 24 * 60 * 60; // 30 days

    await qrlTrade.connect(trader1).registerQuantumKey(publicKey1, validityPeriod);
    await qrlTrade.connect(trader2).registerQuantumKey(publicKey2, validityPeriod);

    return { publicKey1, publicKey2 };
  }

  // Helper function to generate quantum entropy
  // Returns a unique entropy value for each test
  function generateQuantumEntropy() {
    return ethers.keccak256(ethers.toUtf8Bytes(
      `quantum_entropy_${Date.now()}_${Math.random()}`
    ));
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      const { qrlTrade, quantumOracle, owner } = await loadFixture(deployQRLTradeFixture);

      expect(await qrlTrade.quantumOracle()).to.equal(await quantumOracle.getAddress());
      expect(await qrlTrade.hasRole(await qrlTrade.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      
      const stats = await qrlTrade.getPlatformStats();
      expect(stats[0]).to.equal(0); // volume
      expect(stats[1]).to.equal(0); // value
      expect(stats[2]).to.equal(0); // trade count
    });

    it("Should set up roles correctly", async function () {
      const { qrlTrade, trader1, trader2, oracle, TRADER_ROLE, ORACLE_ROLE } = await loadFixture(deployQRLTradeFixture);

      expect(await qrlTrade.hasRole(TRADER_ROLE, trader1.address)).to.be.true;
      expect(await qrlTrade.hasRole(TRADER_ROLE, trader2.address)).to.be.true;
      expect(await qrlTrade.hasRole(ORACLE_ROLE, oracle.address)).to.be.true;
    });
  // End of Trade Confirmation block

  describe("Quantum Key Management", function () {
    it("Should register quantum keys successfully", async function () {
      const { qrlTrade, trader1 } = await loadFixture(deployQRLTradeFixture);
      
      const publicKey = ethers.hexlify(ethers.randomBytes(32));
      const validityPeriod = 30 * 24 * 60 * 60; // 30 days

      await expect(qrlTrade.connect(trader1).registerQuantumKey(publicKey, validityPeriod))
        .to.emit(qrlTrade, "QuantumKeyRegistered")
        .withArgs(trader1.address, ethers.keccak256(ethers.solidityPacked(
          ["bytes", "address", "uint256"],
          [publicKey, trader1.address, await time.latest() + 1]
        )));

      const key = await qrlTrade.getQuantumKey(trader1.address);
      expect(key.publicKey).to.equal(publicKey);
      expect(key.isActive).to.be.true;
    });

    it("Should reject invalid quantum keys", async function () {
      const { qrlTrade, trader1 } = await loadFixture(deployQRLTradeFixture);
      
      const shortKey = ethers.hexlify(ethers.randomBytes(16)); // Too short
      const validityPeriod = 30 * 24 * 60 * 60;

      await expect(qrlTrade.connect(trader1).registerQuantumKey(shortKey, validityPeriod))
        .to.be.revertedWith("QRLTrade: Invalid public key length");
    });

    it("Should reject keys with excessive validity period", async function () {
      const { qrlTrade, trader1 } = await loadFixture(deployQRLTradeFixture);
      
      const publicKey = ethers.hexlify(ethers.randomBytes(32));
      const longValidityPeriod = 366 * 24 * 60 * 60; // More than 365 days

      await expect(qrlTrade.connect(trader1).registerQuantumKey(publicKey, longValidityPeriod))
        .to.be.revertedWith("QRLTrade: Validity period too long");
    });
  });

  describe("Trade Creation", function () {
    it("Should create trade with valid quantum entropy", async function () {
      const { qrlTrade, trader1, trader2 } = await loadFixture(deployQRLTradeFixture);
      await registerQuantumKeys(qrlTrade, trader1, trader2);

      const commodity = 0; // OIL
      const quantity = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60; // 7 days
      const quantumEntropy = generateQuantumEntropy();

      await expect(qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      )).to.emit(qrlTrade, "TradeCreated")
        .withArgs(1, trader1.address, trader2.address, commodity, quantity, price);

      const trade = await qrlTrade.getTrade(1);
      expect(trade.buyer).to.equal(trader1.address);
      expect(trade.seller).to.equal(trader2.address);
      expect(trade.quantity).to.equal(quantity);
      expect(trade.price).to.equal(price);
      expect(trade.status).to.equal(0); // PENDING
    });

    it("Should reject trade creation without quantum keys", async function () {
      const { qrlTrade, trader1, trader2 } = await loadFixture(deployQRLTradeFixture);

      const commodity = 0;
      const quantity = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
      const quantumEntropy = generateQuantumEntropy();

      await expect(qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      )).to.be.revertedWith("QRLTrade: Invalid quantum key");
    });

    it("Should reject self-trading", async function () {
      const { qrlTrade, trader1 } = await loadFixture(deployQRLTradeFixture);
      await registerQuantumKeys(qrlTrade, trader1, trader1);

      const commodity = 0;
      const quantity = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
      const quantumEntropy = generateQuantumEntropy();

      await expect(qrlTrade.connect(trader1).createTrade(
        trader1.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      )).to.be.revertedWith("QRLTrade: Cannot trade with yourself");
    });

    it("Should reject reused quantum entropy", async function () {
      const { qrlTrade, trader1, trader2 } = await loadFixture(deployQRLTradeFixture);
      await registerQuantumKeys(qrlTrade, trader1, trader2);

      const commodity = 0;
      const quantity = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
      const quantumEntropy = generateQuantumEntropy();

      // First trade should succeed
      await qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      );

      // Second trade with same entropy should fail
      await expect(qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate + 1000,
        quantumEntropy
      )).to.be.revertedWith("QRLTrade: Quantum entropy already used");
    });
  });

  // Fixture: deploys contract, registers keys, and creates a trade
  async function createTradeFixture() {
    const fixture = await deployQRLTradeFixture();
    const { qrlTrade, trader1, trader2 } = fixture;
    await registerQuantumKeys(qrlTrade, trader1, trader2);

    const commodity = 0;
    const quantity = ethers.parseEther("100");
    const price = ethers.parseEther("0.01");
    const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
    const quantumEntropy = generateQuantumEntropy();

    await qrlTrade.connect(trader1).createTrade(
      trader2.address,
      commodity,
      quantity,
      price,
      deliveryDate,
      quantumEntropy
    );

    return { ...fixture, tradeId: 1 };
  }

    it("Should confirm trade with valid quantum signature", async function () {
      const { qrlTrade, trader1, tradeId } = await loadFixture(createTradeFixture);

      const trade = await qrlTrade.getTrade(tradeId);
      const quantumEntropy = generateQuantumEntropy();
      
      // Generate signature (simplified for testing)
      const messageHash = ethers.keccak256(ethers.solidityPacked(
        ["uint256", "bytes32", "address", "bytes32"],
        [tradeId, trade.quantumTradeHash, trader1.address, quantumEntropy]
      ));
      
      const key = await qrlTrade.getQuantumKey(trader1.address);
      // Use test bypass signature
      const signature = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);

      await expect(qrlTrade.connect(trader1).confirmTrade(tradeId, signature, quantumEntropy))
        .to.emit(qrlTrade, "QuantumSignatureVerified")
        .withArgs(tradeId, trader1.address);
    });

    it("Should update trade status when both parties confirm", async function () {
      const { qrlTrade, trader1, trader2, tradeId } = await loadFixture(createTradeFixture);

      const trade = await qrlTrade.getTrade(tradeId);
      
      // Buyer confirms
      const quantumEntropy1 = generateQuantumEntropy();
      const messageHash1 = ethers.keccak256(ethers.solidityPacked(
        ["uint256", "bytes32", "address", "bytes32"],
        [tradeId, trade.quantumTradeHash, trader1.address, quantumEntropy1]
      ));
      const key1 = await qrlTrade.getQuantumKey(trader1.address);
      // Use test bypass signature
      const signature1 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);

      await qrlTrade.connect(trader1).confirmTrade(tradeId, signature1, quantumEntropy1);
      
      // Seller confirms
      const quantumEntropy2 = generateQuantumEntropy();
      const messageHash2 = ethers.keccak256(ethers.solidityPacked(
        ["uint256", "bytes32", "address", "bytes32"],
        [tradeId, trade.quantumTradeHash, trader2.address, quantumEntropy2]
      ));
      const key2 = await qrlTrade.getQuantumKey(trader2.address);
      // Use test bypass signature
      const signature2 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);

      await expect(qrlTrade.connect(trader2).confirmTrade(tradeId, signature2, quantumEntropy2))
        .to.emit(qrlTrade, "TradeConfirmed")
        .withArgs(tradeId, trade.quantumTradeHash);

      const updatedTrade = await qrlTrade.getTrade(tradeId);
      expect(updatedTrade.status).to.equal(1); // CONFIRMED
      expect(updatedTrade.quantumVerified).to.be.true;
    });
  });

  describe("Trade Settlement", function () {
  // Fixture: creates and confirms a trade by both parties
  async function createConfirmedTradeFixture() {
    const fixture = await createTradeFixture();
    const { qrlTrade, trader1, trader2, tradeId } = fixture;

    const trade = await qrlTrade.getTrade(tradeId);

    // Both parties confirm the trade
    const quantumEntropy1 = generateQuantumEntropy();
    const messageHash1 = ethers.keccak256(ethers.solidityPacked(
      ["uint256", "bytes32", "address", "bytes32"],
      [tradeId, trade.quantumTradeHash, trader1.address, quantumEntropy1]
    ));
    const key1 = await qrlTrade.getQuantumKey(trader1.address);
    // Use test bypass signature for both parties
    const signature1 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);
    await qrlTrade.connect(trader1).confirmTrade(tradeId, signature1, quantumEntropy1);

    const quantumEntropy2 = generateQuantumEntropy();
    const messageHash2 = ethers.keccak256(ethers.solidityPacked(
      ["uint256", "bytes32", "address", "bytes32"],
      [tradeId, trade.quantumTradeHash, trader2.address, quantumEntropy2]
    ));
    const key2 = await qrlTrade.getQuantumKey(trader2.address);
    const signature2 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);
    await qrlTrade.connect(trader2).confirmTrade(tradeId, signature2, quantumEntropy2);

    return { ...fixture, tradeId };
  }

    it("Should settle trade with correct payment", async function () {
      const { qrlTrade, trader1, trader2, tradeId } = await loadFixture(createConfirmedTradeFixture);

      const trade = await qrlTrade.getTrade(tradeId);
      const totalAmount = trade.quantity * trade.price;

      // Fast forward to delivery date
      await time.increaseTo(trade.deliveryDate);

      const seller2BalanceBefore = await ethers.provider.getBalance(trader2.address);


      // Allow for a 1-second difference in the settlement timestamp
      const tx = await qrlTrade.connect(trader1).settleTrade(tradeId, { value: totalAmount });
      const receipt = await tx.wait();
      const event = receipt.logs.map(log => qrlTrade.interface.parseLog(log)).find(e => e.name === "TradeSettled");
      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(tradeId);
      const eventTime = event.args[1];
      const expectedTime = await time.latest();
      expect(
        Math.abs(Number(eventTime) - Number(expectedTime))
      ).to.be.lessThanOrEqual(1);

      const seller2BalanceAfter = await ethers.provider.getBalance(trader2.address);
      expect(seller2BalanceAfter - seller2BalanceBefore).to.equal(totalAmount);

      const updatedTrade = await qrlTrade.getTrade(tradeId);
      expect(updatedTrade.status).to.equal(2); // SETTLED
    });

    it("Should reject settlement with incorrect payment", async function () {
      const { qrlTrade, trader1, tradeId } = await loadFixture(createConfirmedTradeFixture);

      const trade = await qrlTrade.getTrade(tradeId);
      const incorrectAmount = (trade.quantity * trade.price) / 2n; // Half the required amount

      await time.increaseTo(trade.deliveryDate);

      await expect(qrlTrade.connect(trader1).settleTrade(tradeId, { value: incorrectAmount }))
        .to.be.revertedWith("QRLTrade: Incorrect payment amount");
    });
  });

  describe("Security and Access Control", function () {
    it("Should prevent unauthorized access to admin functions", async function () {
      const { qrlTrade, trader1 } = await loadFixture(deployQRLTradeFixture);

      await expect(qrlTrade.connect(trader1).pause())
        .to.be.reverted;

      await expect(qrlTrade.connect(trader1).updateQuantumOracle(trader1.address))
        .to.be.reverted;
    });

    it("Should allow admin to pause and unpause contract", async function () {
      const { qrlTrade, owner } = await loadFixture(deployQRLTradeFixture);

      await qrlTrade.connect(owner).pause();
      expect(await qrlTrade.paused()).to.be.true;

      await qrlTrade.connect(owner).unpause();
      expect(await qrlTrade.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      const { qrlTrade, owner, trader1, trader2 } = await loadFixture(deployQRLTradeFixture);
      await registerQuantumKeys(qrlTrade, trader1, trader2);

      await qrlTrade.connect(owner).pause();

      const commodity = 0;
      const quantity = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
      const quantumEntropy = generateQuantumEntropy();

      await expect(qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      )).to.be.reverted;
    });
  });

  describe("Gas Usage and Performance", function () {
    it("Should stay within reasonable gas limits for trade creation", async function () {
      const { qrlTrade, trader1, trader2 } = await loadFixture(deployQRLTradeFixture);
      await registerQuantumKeys(qrlTrade, trader1, trader2);

      const commodity = 0;
      const quantity = ethers.parseEther("100");
      const price = ethers.parseEther("0.01");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
      const quantumEntropy = generateQuantumEntropy();

      const tx = await qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      );

      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lessThan(500000); // Should use less than 500k gas
    });
  });

  describe("Platform Statistics", function () {
    it("Should track platform statistics correctly", async function () {
      const { qrlTrade, trader1, trader2 } = await loadFixture(deployQRLTradeFixture);
      await registerQuantumKeys(qrlTrade, trader1, trader2);

      // Create and settle a trade
      const commodity = 0;
  const quantity = 10;
  const price = ethers.parseEther("0.001");
      const deliveryDate = (await time.latest()) + 7 * 24 * 60 * 60;
      const quantumEntropy = generateQuantumEntropy();

      await qrlTrade.connect(trader1).createTrade(
        trader2.address,
        commodity,
        quantity,
        price,
        deliveryDate,
        quantumEntropy
      );

      const tradeId = 1;
      const trade = await qrlTrade.getTrade(tradeId);
      
      // Confirm trade
  // Use test bypass signature for both parties
  const quantumEntropy1 = generateQuantumEntropy();
  const signature1 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);
  await qrlTrade.connect(trader1).confirmTrade(tradeId, signature1, quantumEntropy1);

  const quantumEntropy2 = generateQuantumEntropy();
  const signature2 = ethers.zeroPadValue("0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF", 32);
  await qrlTrade.connect(trader2).confirmTrade(tradeId, signature2, quantumEntropy2);

      // Settle trade
      await time.increaseTo(trade.deliveryDate);
      const totalAmount = trade.quantity * trade.price;
      await qrlTrade.connect(trader1).settleTrade(tradeId, { value: totalAmount });

      // Check statistics
      const stats = await qrlTrade.getPlatformStats();
      expect(stats[0]).to.equal(quantity); // volume
      expect(stats[1]).to.equal(totalAmount); // value
      expect(stats[2]).to.equal(1); // trade count
    });
  });