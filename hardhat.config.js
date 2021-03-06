require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("dotenv").config();

const RINKEBY_URL = process.env.RINKEBY_URL || "https://eth-ropsten";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
const ETHER_SCAN_KEY = process.env.ETHER_SCAN_KEY || "key";
const COINMARKETCAP_KEY = process.env.COINMARKETCAP_KEY || "key";

module.exports = {
    solidity: "0.8.4",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        rinkeby: {
            url: RINKEBY_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    etherscan: {
        apiKey: ETHER_SCAN_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_KEY,
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
};
