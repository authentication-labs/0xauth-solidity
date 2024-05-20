import axios from 'axios';
import qs from 'qs';
import { ethers } from 'ethers';
import IDFactory from '../deployments/amoy/IdFactory.json';
import ClaimIssuer from '../deployments/amoy/ClaimIssuer.json';
import ImplementationAuthority from '../deployments/amoy/ImplementationAuthority.json';

function correctMetadata(metadata: any) {
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

async function verifyContract(contract: any, address: string) {
    const apiKey = process.env.POLYGONSCAN_API_KEY;
    const sourceCode = JSON.parse(contract.metadata);
    const constructorArgs = contract.args || [];
    const abiInterface = new ethers.Interface(contract.abi);
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
        const response = await axios.post('https://api-amoy.polygonscan.com/api', qs.stringify(params), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(response.data);
    } catch (error) {
        console.error('Error verifying contract:', error);
    }
}

async function main() {
    const factoryAddress = IDFactory.address
    const claimIssuerAddress = ClaimIssuer.address;
    const implementationAuthorityAddress = claimIssuerAddress

    await verifyContract(IDFactory, factoryAddress);
    await verifyContract(ClaimIssuer, claimIssuerAddress);
    await verifyContract(ImplementationAuthority, implementationAuthorityAddress);
}

async function checkVerificationStatus() {
    const apiKey = process.env.POLYGONSCAN_API_KEY!;

    const params = {
        apikey: apiKey,
        module: 'contract',
        action: 'checkverifystatus',
        guid: "ffjedbsjspt51kkgs9jjrjpzpulbfta7civxsysk8ix4fzqwze"
    };

    try {
        const response = await axios.get('https://api-amoy.polygonscan.com/api', { params });
        console.log(response.data);
        if (response.data.status === '1') {
            console.log('Verification successful:', response.data.result);
        } else {
            console.log('Verification failed or pending:', response.data.result);
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
    }
}



main().then(() => process.exit(0));
// checkVerificationStatus().then(() => process.exit(0));