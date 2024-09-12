"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const log = console.log;
async function getIdentityABI() {
    const basepath = "./artifacts/contracts/Identity.sol/Identity.json";
    const data = JSON.parse(fs_1.default.readFileSync(basepath, 'utf8'));
    return data.abi;
}
async function getClaimIssuerABI() {
    const basepath = "./artifacts/contracts/ClaimIssuer.sol/ClaimIssuer.json";
    const data = JSON.parse(fs_1.default.readFileSync(basepath, 'utf8'));
    return data.abi;
}
async function fetchProof(uri) {
    const response = await fetch(uri);
    return response.json();
}
// const TX_ID = "0xd65349179099420697ffa1410dd3ae04b625a20432dc60f27d84eb74b2195a52";
const TX_ID = "0x647bb92deb374cb807a0350e034f9890c9e09149284f1720fa85c7d0b94e83af";
async function main() {
    const provider = ethers_1.ethers.getDefaultProvider('https://rpc-mumbai.maticvigil.com/v1/9cd3d6ce21f0a25bb8f33504a1820d616f700d24');
    const tx = await provider.getTransaction(TX_ID);
    const abi = await getIdentityABI();
    const contract = new ethers_1.ethers.Interface(abi);
    const data = contract.parseTransaction({ data: tx.data, value: tx.value });
    const claim = {
        topic: data.args[0],
        scheme: data.args[1].toString(),
        issuer: data.args[2],
        data: data.args[3],
        signature: data.args[4],
        uri: data.args[5]
    };
    log(chalk_1.default.blue(JSON.stringify(claim, null, 2)));
    log(chalk_1.default.bgYellow.black("\n---------- Fetching Claim ----------"));
    const ZKP = await fetchProof(claim.uri);
    const claimIssuerABI = await getClaimIssuerABI();
    const claimIssuer = new ethers_1.ethers.Contract(claim.issuer, claimIssuerABI, provider);
    let result = await claimIssuer.isClaimValid("0xed57893ed4EB08031eA274793f392ACbcab83c09", claim.topic, claim.data, claim.signature);
    if (result === true) {
        log(chalk_1.default.bgGreen.black.bold(" Claim is valid "));
        log(chalk_1.default.green("Claim Issuer: ") + chalk_1.default.white(ZKP.Issuer));
        log(chalk_1.default.green("Claim Type: ") + chalk_1.default.white(ZKP.MessageType));
        log(chalk_1.default.green("Claim Message: ") + chalk_1.default.white(ZKP.Message));
    }
    else {
        log(chalk_1.default.bgRed.black(" Claim is invalid "));
    }
    const proof = ZKP.Proof;
    log(chalk_1.default.bgYellow.black("\n---------- Verifying ZKP ----------"));
    const verifierData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, "../../zkp/financial-verification-zkp/config/verifierAccreditedInvestorData.json"), "utf-8"));
    const verifierABI = verifierData.abi;
    const verifierAddress = verifierData.address;
    const verifier = new ethers_1.ethers.Contract(verifierAddress, verifierABI, provider);
    result = await verifier.verifyTx(proof.proof);
    if (result === true) {
        log(chalk_1.default.bgGreen.black.bold(" ZKP Proof Verified "));
    }
    else {
        log(chalk_1.default.bgRed.black.bold(`ZKP Proof Verification Failed`));
    }
}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
