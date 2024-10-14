const ethers = require('v5ethers');
const fs = require('fs');
const path = require('path');
const {
  SubscriptionManager,
  simulateScript,
  ResponseListener,
  ReturnType,
  decodeResult,
  FulfillmentCode,
} = require('@chainlink/functions-toolkit');
const functionsConsumerAbi =
  require('../../deployments/op_sepolia/ProofFunction.json').abi;
require('@chainlink/env-enc').config();

const consumerAddress = '0x8C79fB384C8CE4555dEc9F505895aCeC9Ba71eBf';
const subscriptionId = 232; //

const makeRequest = async () => {
  // hardcoded for OP Sepolia
  const routerAddress = '0xC17094E3A1348E5C7544D4fF8A36c28f2C6AAE28';
  const linkTokenAddress = '0xE4aB69C077896252FAFBD49EFD26B5D171A32410';
  const donId = 'fun-optimism-sepolia-1';
  const explorerUrl = 'https://sepolia-optimism.etherscan.io/';

  // Initialize functions settings
  const source = fs
    .readFileSync(
      path.resolve(
        __dirname,
        '../../chainlink-functions/vc-verify/function.js',
      ),
    )
    .toString();

  const args = ['0x76c01dE889D46F9644A96C47E0a25C8e7Dc31A5c', 'abc123'];

  const gasLimit = 300000;

  // Initialize ethers signer and provider to interact with the contracts onchain
  const privateKey = ethers.Wallet.fromMnemonic(
    process.env.MNEMONIC_OP_SEPOLIA!,
  ).privateKey; // fetch PRIVATE_KEY
  if (!privateKey)
    throw new Error(
      'private key not provided - check your environment variables',
    );

  const rpcUrl = process.env.ETH_NODE_URI_OP_SEPOLIA; // fetch Sepolia RPC URL

  if (!rpcUrl)
    throw new Error(`rpcUrl not provided  - check your environment variables`);

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions

  ///////// START SIMULATION ////////////

  console.log('Start simulation...');

  const response = await simulateScript({
    source: source,
    args: args,

    maxExecutionTimeMs: 15_000,
    numAllowedQueries: 50,
    maxMemoryUsageMb: 1000,
  });

  console.log('Simulation result', response);
  const errorString = response.errorString;
  if (errorString) {
    console.log(`❌ Error during simulation: `, errorString);
  } else {
    const returnType = ReturnType.uint256;
    const responseBytesHexstring = response.responseBytesHexstring;
    if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
      const decodedResponse = decodeResult(
        response.responseBytesHexstring,
        returnType,
      );
      console.log(`✅ Decoded response to ${returnType}: `, decodedResponse);
    }
  }

  //////// ESTIMATE REQUEST COSTS ////////
  console.log('\nEstimate request costs...');
  // Initialize and return SubscriptionManager
  const subscriptionManager = new SubscriptionManager({
    signer: signer,
    linkTokenAddress: linkTokenAddress,
    functionsRouterAddress: routerAddress,
  });
  await subscriptionManager.initialize();

  // estimate costs in Juels

  const gasPriceWei = await signer.getGasPrice(); // get gasPrice in wei

  const estimatedCostInJuels =
    await subscriptionManager.estimateFunctionsRequestCost({
      donId: donId, // ID of the DON to which the Functions request will be sent
      subscriptionId: subscriptionId, // Subscription ID
      callbackGasLimit: gasLimit, // Total gas used by the consumer contract's callback
      gasPriceWei: BigInt(gasPriceWei), // Gas price in gWei
    });

  console.log(
    `Fulfillment cost estimated to ${ethers.utils.formatEther(
      estimatedCostInJuels,
    )} LINK`,
  );

  //////// MAKE REQUEST ////////

  console.log('\nMake request...');

  const functionsConsumer = new ethers.Contract(
    consumerAddress,
    functionsConsumerAbi,
    signer,
  );

  // Actual transaction call
  const transaction = await functionsConsumer.sendRequest(
    args,
    subscriptionId,
    gasLimit,
    ethers.utils.formatBytes32String(donId), // jobId is bytes32 representation of donId
  );

  // Log transaction details
  console.log(
    `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...`,
  );

  console.log(
    `See your request in the explorer ${explorerUrl}/tx/${transaction.hash}`,
  );

  const responseListener = new ResponseListener({
    provider: provider,
    functionsRouterAddress: routerAddress,
  }); // Instantiate a ResponseListener object to wait for fulfillment.
  (async () => {
    try {
      const response: any = await new Promise((resolve, reject) => {
        responseListener
          .listenForResponseFromTransaction(transaction.hash)
          .then((response: any) => {
            resolve(response); // Resolves once the request has been fulfilled.
          })
          .catch((error: any) => {
            reject(error); // Indicate that an error occurred while waiting for fulfillment.
          });
      });

      const fulfillmentCode = response.fulfillmentCode;

      if (fulfillmentCode === FulfillmentCode.FULFILLED) {
        console.log(
          `\n✅ Request ${
            response.requestId
          } successfully fulfilled. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels,
          )} LINK.Complete reponse: `,
          response,
        );
      } else if (fulfillmentCode === FulfillmentCode.USER_CALLBACK_ERROR) {
        console.log(
          `\n⚠️ Request ${
            response.requestId
          } fulfilled. However, the consumer contract callback failed. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels,
          )} LINK.Complete reponse: `,
          response,
        );
      } else {
        console.log(
          `\n❌ Request ${
            response.requestId
          } not fulfilled. Code: ${fulfillmentCode}. Cost is ${ethers.utils.formatEther(
            response.totalCostInJuels,
          )} LINK.Complete reponse: `,
          response,
        );
      }

      const errorString = response.errorString;
      if (errorString) {
        console.log(`\n❌ Error during the execution: `, errorString);
      } else {
        const responseBytesHexstring = response.responseBytesHexstring;
        if (ethers.utils.arrayify(responseBytesHexstring).length > 0) {
          const decodedResponse = decodeResult(
            response.responseBytesHexstring,
            ReturnType.uint256,
          );
          console.log(
            `\n✅ Decoded response to ${ReturnType.uint256}: `,
            decodedResponse,
          );
        }
      }
    } catch (error) {
      console.error('Error listening for response:', error);
    }
  })();
};

makeRequest().catch((e) => {
  console.error(e);
  process.exit(1);
});
