require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

const RPC_URL_SEPOLIA = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia";
const PRIVATE_KEY_SEPOLIA = process.env.SEPOLIA_PRIVATE_KEY || "0xkey";

const RPC_URL_GANACHE = process.env.LOCAL_RPC_URL || "http://192.168.1.10:7545";
const PRIVATE_KEY_GANACHE = process.env.LOCAL_PRIVATE_KEY || "0xkey";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "Your etherscan API key";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "Your polygonscan API key";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "Your coinmarketcap API key";

const REPORT_GAS = process.env.REPORT_GAS || "true";
const REPORT_PRICE = process.env.REPORT_PRICE || "false";

// optional
const MNEMONIC = process.env.MNEMONIC || "your mnemonic";

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: RPC_URL_SEPOLIA,
            accounts: [PRIVATE_KEY_SEPOLIA],
            chainId: 11155111,
            blockConfirmation: 6,
        },
        ganache: {
            url: RPC_URL_GANACHE,
            accounts: [PRIVATE_KEY_GANACHE],
            chainId: 5777,
            blockConfirmation: 1,
        },
        localhost: {
            // Hardhost similar like ganache, can debug the transaction
            // Start in terminal - yarn hardhat node
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
            blockConfirmation: 1,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        customChains: [],
        /*
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_API_KEY,
        },
        
        customChains: [
            {
                network: "goerli",
                chainId: 5,
                urls: {
                    apiURL: "https://api-goerli.etherscan.io/api",
                    browserURL: "https://goerli.etherscan.io",
                },
            },
        ],
        */
    },
    sourcify: {
        enabled: false,
    },
    gasReporter: {
        enabled: REPORT_GAS === "true",
        offline: REPORT_PRICE === "false",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH", // ETH, BNB, MATIC, AVAX, HT, MOVR - https://www.npmjs.com/package/hardhat-gas-reporter
        currency: "USD",
        //gasPrice: 10, // In case gasPriceApi not working https://etherscan.io/gastracker#chart_gasprice
        gasPriceApi:
            "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=" +
            ETHERSCAN_API_KEY,
        outputFile: "gas-report.txt",
        noColors: true,
    },
    /*
    contractSizer: {
        runOnCompile: false,
        only: ["Raffle"],
    },
    */
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
        player: {
            default: 1,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.24",
            },
        ],
    },
    /*
    mocha: {
        timeout: 500000, // 500 seconds max for running tests
    },
    */
};
