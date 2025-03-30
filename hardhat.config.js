require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",

      accounts: [
        "0xc5f678ece7c8b6d3cc7c80c8b2e49f45dea4e07bf06bdd0b3dab0c3803813d72",
      ],
    },
  },

}
