"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func = async function (hre) {
    //   await _deploy(hre);
};
exports.default = func;
func.tags = ['ClaimIssuer'];
async function _deploy(hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerWallet, claimIssuerWallet } = await getNamedAccounts();
    await deploy('ClaimIssuer', {
        from: deployerWallet,
        args: [claimIssuerWallet],
        log: true,
        autoMine: true,
    });
}
