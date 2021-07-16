var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic =
  "gospel interest income funny bind unit village guilt erode drip trigger skirt";
// Mnemonic from ganache-cli


module.exports = {
  networks: {
    development: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: "*",
      gas: 9999999,
    },
  },
  compilers: {
    solc: {
      version: "^0.8.6",
    },
  },
};
