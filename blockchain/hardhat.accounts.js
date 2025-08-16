// This file is used to set up Hardhat with high balance test accounts for local testing only.
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: "0x59c6995e998f97a5a0044976f7a5e7e3c3c1fae3e6b8a7c6c2c1e7e3c3c1fae3", // owner
          balance: "1000000000000000000000000000000"
        },
        {
          privateKey: "0x8b3a350cf5c34c9194ca3a545d7cedc7c2b6a3c3c1fae3e6b8a7c6c2c1e7e3c3", // trader1
          balance: "1000000000000000000000000000000"
        },
        {
          privateKey: "0x3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c", // trader2
          balance: "1000000000000000000000000000000"
        },
        {
          privateKey: "0x4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d", // oracle
          balance: "1000000000000000000000000000000"
        },
        {
          privateKey: "0x5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e", // otherAccount
          balance: "1000000000000000000000000000000"
        }
      ]
    }
  }
};
