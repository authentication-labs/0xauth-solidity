"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const ethers_1 = require("ethers");
const Identity_json_1 = __importDefault(require("../deployments/amoy/Identity.json"));
const IdFactory_json_1 = __importDefault(require("../deployments/amoy/IdFactory.json"));
const ClaimIssuer_json_1 = __importDefault(require("../deployments/amoy/ClaimIssuer.json"));
const ImplementationAuthority_json_1 = __importDefault(require("../deployments/amoy/ImplementationAuthority.json"));
function correctMetadata(metadata) {
    const parsedMetadata = JSON.parse(metadata);
    for (const source in parsedMetadata.sources) {
        if (parsedMetadata.sources[source].license) {
            delete parsedMetadata.sources[source].license;
        }
    }
    const correctedMetadata = {
        language: "Solidity",
        sources: parsedMetadata.sources,
        settings: {
            optimizer: parsedMetadata.settings.optimizer,
            evmVersion: parsedMetadata.settings.evmVersion,
            outputSelection: {
                "*": {
                    "*": ["metadata", "evm.bytecode", "evm.deployedBytecode", "abi"]
                }
            }
        }
    };
    return correctedMetadata;
}
async function verifyContract(contract, address) {
    const apiKey = env.POLYGONSCAN_APIKEY;
    const sourceCode = JSON.parse(contract.metadata);
    const constructorArgs = contract.args || [];
    const abiInterface = new ethers_1.ethers.Interface(contract.abi);
    const encodedConstructorArgs = abiInterface.encodeDeploy(constructorArgs).slice(2);
    console.log(`Verifying contract at address: ${address}`);
    console.log('Constructor Args:', encodedConstructorArgs);
    const correctedMetadata = correctMetadata(contract.metadata);
    const contractFilePath = Object.keys(sourceCode.settings.compilationTarget)[0];
    const contractName = `${contractFilePath}:${sourceCode.settings.compilationTarget[contractFilePath]}`;
    const compilerVersion = "v" + sourceCode.compiler.version;
    const params = {
        apikey: apiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: address,
        sourceCode: JSON.stringify(correctedMetadata),
        constructorArguements: encodedConstructorArgs,
        codeformat: 'solidity-standard-json-input',
        contractname: contractName,
        compilerversion: compilerVersion,
        optimizationUsed: '1',
        runs: '2000'
    };
    try {
        const response = await axios_1.default.post('https://api-amoy.polygonscan.com/api', qs_1.default.stringify(params), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(response.data);
    }
    catch (error) {
        console.error('Error verifying contract:', error);
    }
}
async function main() {
    const identityAddress = Identity_json_1.default.address;
    const factoryAddress = IdFactory_json_1.default.address;
    const claimIssuerAddress = ClaimIssuer_json_1.default.address;
    const implementationAuthorityAddress = claimIssuerAddress;
    await verifyContract(identityAddress, identityAddress);
    await verifyContract(IdFactory_json_1.default, factoryAddress);
    await verifyContract(ClaimIssuer_json_1.default, claimIssuerAddress);
    await verifyContract(ImplementationAuthority_json_1.default, implementationAuthorityAddress);
}
async function checkVerificationStatus() {
    const apiKey = process.env.POLYGONSCAN_APIKEY;
    const params = {
        apikey: apiKey,
        module: 'contract',
        action: 'checkverifystatus',
        guid: "ffjedbsjspt51kkgs9jjrjpzpulbfta7civxsysk8ix4fzqwze"
    };
    try {
        const response = await axios_1.default.get('https://api-amoy.polygonscan.com/api', { params });
        console.log(response.data);
        if (response.data.status === '1') {
            console.log('Verification successful:', response.data.result);
        }
        else {
            console.log('Verification failed or pending:', response.data.result);
        }
    }
    catch (error) {
        console.error('Error checking verification status:', error);
    }
}
main().then(() => process.exit(0));
// checkVerificationStatus().then(() => process.exit(0));
