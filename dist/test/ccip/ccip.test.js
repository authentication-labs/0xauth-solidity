"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_network_helpers_1 = require("@nomicfoundation/hardhat-network-helpers");
const hardhat_1 = require("hardhat");
const fixtures_1 = require("../fixtures");
const CCIPLocalSimulatorFork_1 = require("@chainlink/local/scripts/CCIPLocalSimulatorFork");
describe('CCIP - Mock', async () => {
    const { localSimulator } = await (0, hardhat_network_helpers_1.loadFixture)(fixtures_1.deployCcipFixture);
    describe('Something', () => {
        describe('Something', () => {
            it('test', async () => {
                // 1st Terminal: npx hardhat node
                // 2nd Terminal: npx hardhat run ./scripts/myScript.ts --network localhost
                async function main() {
                    const ETHEREUM_SEPOLIA_RPC_URL = process.env.ETHEREUM_SEPOLIA_RPC_URL; // Archive node
                    const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL; // Archive node
                    await hardhat_1.network.provider.request({
                        method: 'hardhat_reset',
                        params: [
                            {
                                forking: {
                                    jsonRpcUrl: ETHEREUM_SEPOLIA_RPC_URL,
                                    blockNumber: 5663645,
                                },
                            },
                        ],
                    });
                    const linkAmountForFees = 5000000000000000000n; // 5 LINK
                    await (0, CCIPLocalSimulatorFork_1.requestLinkFromTheFaucet)(linkTokenAddressSepolia, await CCIPSender_Unsafe.getAddress(), linkAmountForFees);
                    const tx = await CCIPSender_Unsafe.send(CCIPReceiver_Unsafe.target, textToSend, arbSepoliaChainSelector, ccipBnMTokenAddressSepolia, amountToSend);
                    const receipt = await tx.wait();
                    if (!receipt)
                        return;
                    const evm2EvmMessage = (0, CCIPLocalSimulatorFork_1.getEvm2EvmMessage)(receipt);
                    console.log('-------------------------------------------');
                    await hardhat_1.network.provider.request({
                        method: 'hardhat_reset',
                        params: [
                            {
                                forking: {
                                    jsonRpcUrl: ARBITRUM_SEPOLIA_RPC_URL,
                                    blockNumber: 33079804,
                                },
                            },
                        ],
                    });
                    // We must redeploy it because of the network reset but it will be deployed to the same address because of the CREATE opcode: address = keccak256(rlp([sender_address,sender_nonce]))[12:]
                    CCIPReceiver_Unsafe = await CCIPReceiver_UnsafeFactory.deploy(ccipRouterAddressArbSepolia);
                    if (!evm2EvmMessage)
                        return;
                    await (0, CCIPLocalSimulatorFork_1.routeMessage)(ccipRouterAddressArbSepolia, evm2EvmMessage);
                }
            });
        });
    });
});
