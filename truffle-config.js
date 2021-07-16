var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic =
  "gospel interest income funny bind unit village guilt erode drip trigger skirt";
// Mnemonic from ganache-cli

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
  },
  compilers: {
    solc: {
      version: "0.8.6",
    },
  },
};

