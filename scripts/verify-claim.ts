import { ethers } from "ethers";
import fs from "fs";
import path from "path";

import chalk from "chalk";

const log = console.log;

type CLAIM = {
    topic: string,
    scheme: number,
    issuer: string,
    data: string,
    signature: string,
    uri: string
}

async function getIdentityABI() {
    const basepath = "./artifacts/contracts/Identity.sol/Identity.json"
    const data = JSON.parse(fs.readFileSync(basepath, 'utf8'));
    return data.abi;
}
async function getClaimIssuerABI() {
    const basepath = "./artifacts/contracts/ClaimIssuer.sol/ClaimIssuer.json"
    const data = JSON.parse(fs.readFileSync(basepath, 'utf8'));
    return data.abi;
}

async function fetchProof(uri: string) {
    const response = await fetch(uri);
    return response.json();
}

// const TX_ID = "0xd65349179099420697ffa1410dd3ae04b625a20432dc60f27d84eb74b2195a52";
const TX_ID = "0x647bb92deb374cb807a0350e034f9890c9e09149284f1720fa85c7d0b94e83af";

async function main() {

    const provider = ethers.getDefaultProvider('https://rpc-mumbai.maticvigil.com/v1/9cd3d6ce21f0a25bb8f33504a1820d616f700d24');
    const tx = await provider.getTransaction(TX_ID);
    const abi = await getIdentityABI();
    const contract = new ethers.utils.Interface(abi)
    const data = contract.parseTransaction({ data: tx.data, value: tx.value });

    const claim = {
        topic: data.args[0],
        scheme: data.args[1].toString(),
        issuer: data.args[2],
        data: data.args[3],
        signature: data.args[4],
        uri: data.args[5]
    } as CLAIM;

    log(chalk.blue(JSON.stringify(claim, null, 2)));

    log(chalk.bgYellow.black("\n---------- Fetching Claim ----------"));

    const ZKP = await fetchProof(claim.uri);
    const claimIssuerABI = await getClaimIssuerABI();

    const claimIssuer = new ethers.Contract(claim.issuer, claimIssuerABI, provider);

    let result = await claimIssuer.isClaimValid("0xed57893ed4EB08031eA274793f392ACbcab83c09", claim.topic, claim.data, claim.signature);
    if (result === true) {
        log(chalk.bgGreen.black.bold(" Claim is valid "));
        log(chalk.green("Claim Issuer: ") + chalk.white(ZKP.Issuer));
        log(chalk.green("Claim Type: ") + chalk.white(ZKP.MessageType));
        log(chalk.green("Claim Message: ") + chalk.white(ZKP.Message));
    } else {
        log(chalk.bgRed.black(" Claim is invalid "));
    }


    const proof = ZKP.Proof;

    log(chalk.bgYellow.black("\n---------- Verifying ZKP ----------"));
    const verifierData = JSON.parse(fs.readFileSync(path.join(__dirname, "../../zkp/financial-verification-zkp/config/verifierAccreditedInvestorData.json"), "utf-8"));
    const verifierABI = verifierData.abi;
    const verifierAddress = verifierData.address;
    const verifier = new ethers.Contract(verifierAddress, verifierABI, provider);

    result = await verifier.verifyTx(proof.proof);
    if (result === true) {
        log(chalk.bgGreen.black.bold(" ZKP Proof Verified "));
    } else {
        log(chalk.bgRed.black.bold(`ZKP Proof Verification Failed`));
    }
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});