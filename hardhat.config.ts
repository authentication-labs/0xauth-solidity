import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/types';

import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import '@nomiclabs/hardhat-etherscan';

import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-deploy-tenderly';

import { node_url, accounts, addForkConfiguration } from './utils/network';

const config: HardhatUserConfig = {
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
      {
        version: '0.8.20',
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
  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
    },
    localhost: {
      url: node_url('localhost'),
      accounts: accounts(),
    },
    c1: {
      url: node_url('localone'),
      accounts: accounts(),
      chainId: 666,
    },
    c2: {
      url: node_url('localtwo'),
      accounts: accounts(),
      chainId: 999,
    },
    staging: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
    },
    production: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
    },
    mainnet: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
    },
    amoy: {
      url: node_url('amoy'),
      accounts: accounts('amoy'),
    },
    sepolia: {
      url: node_url('sepolia'),
      accounts: accounts('sepolia'),
    },
    op_sepolia: {
      url: node_url('op_sepolia'),
      accounts: accounts('op_sepolia'),
    },
    kovan: {
      url: node_url('kovan'),
      accounts: accounts('kovan'),
    },
    goerli: {
      url: node_url('goerli'),
      accounts: accounts('goerli'),
    },
  }),
  etherscan: {
    apiKey: 'YNJMAXVSKQV8NM8B7XTFW3BRPCUZX6YXPD', // Your Etherscan API key
    customChains: [
      {
        network: 'op_sepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimism.etherscan.io/api',
          browserURL: 'https://sepolia-optimism.etherscan.io',
        },
      },
    ],
  },
  // etherscan: {
  //   apiKey: {
  //     amii: 'WWRR69411YUGCK7ZP3NQE95RSHSDBPHP5C',
  //   },
  //   customChains: [
  //     {
  //       network: "amii",
  //       chainId: 80002,
  //       urls: {
  //         apiURL: "https://api-amoy.polygonscan.com/api",
  //         browserURL: "https://amoy.polygonscan.com"
  //       },
  //     }
  //   ]
  // },
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
    username: process.env.TENDERLY_USERNAME as string,
  },
};

export default config;
