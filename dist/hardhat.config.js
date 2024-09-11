"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-ethers");
require("@typechain/hardhat");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-deploy-tenderly");
const network_1 = require("./utils/network");
const config = {
    solidity: {
        compilers: [
            {
                version: '0.8.17',
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 2000,
                    },
                },
            },
            {
                version: '0.8.19',
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 2000,
                    },
                },
            },
        ],
    },
    namedAccounts: {
        deployerWallet: 0,
        claimIssuerWallet: 1,
        aliceWallet: 2,
        bobWallet: 3,
        carolWallet: 4,
        davidWallet: 5,
        tokenOwnerWallet: 6,
    },
    networks: (0, network_1.addForkConfiguration)({
        hardhat: {
            initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
        },
        localhost: {
            url: (0, network_1.node_url)('localhost'),
            accounts: (0, network_1.accounts)(),
        },
        c1: {
            url: (0, network_1.node_url)('localone'),
            accounts: (0, network_1.accounts)(),
            chainId: 666,
        },
        c2: {
            url: (0, network_1.node_url)('localtwo'),
            accounts: (0, network_1.accounts)(),
            chainId: 999,
        },
        staging: {
            url: (0, network_1.node_url)('rinkeby'),
            accounts: (0, network_1.accounts)('rinkeby'),
        },
        production: {
            url: (0, network_1.node_url)('mainnet'),
            accounts: (0, network_1.accounts)('mainnet'),
        },
        mainnet: {
            url: (0, network_1.node_url)('mainnet'),
            accounts: (0, network_1.accounts)('mainnet'),
        },
        amoy: {
            url: (0, network_1.node_url)('amoy'),
            accounts: (0, network_1.accounts)('amoy'),
        },
        sepolia: {
            url: (0, network_1.node_url)('sepolia'),
            accounts: (0, network_1.accounts)('sepolia'),
        },
        kovan: {
            url: (0, network_1.node_url)('kovan'),
            accounts: (0, network_1.accounts)('kovan'),
        },
        goerli: {
            url: (0, network_1.node_url)('goerli'),
            accounts: (0, network_1.accounts)('goerli'),
        },
    }),
    paths: {
        sources: 'src',
    },
    gasReporter: {
        currency: 'USD',
        gasPrice: 100,
        enabled: process.env.REPORT_GAS ? true : false,
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        maxMethodDiff: 10,
    },
    mocha: {
        timeout: 0,
    },
    external: process.env.HARDHAT_FORK
        ? {
            deployments: {
                // process.env.HARDHAT_FORK will specify the network that the fork is made from.
                // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
                hardhat: ['deployments/' + process.env.HARDHAT_FORK],
                localhost: ['deployments/' + process.env.HARDHAT_FORK],
            },
        }
        : undefined,
    tenderly: {
        project: '0xauth-contracts',
        username: process.env.TENDERLY_USERNAME,
    },
};
exports.default = config;
