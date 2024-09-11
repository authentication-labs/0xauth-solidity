"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func = async function (hre) {
    //   await _deploy(hre);
};
exports.default = func;
func.tags = ['Identity'];
async function _deploy(hre) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployerWallet, aliceWallet } = await getNamedAccounts();
    await deploy('Identity', {
        from: deployerWallet,
        args: [aliceWallet, false],
        log: true,
        autoMine: true,
    });
}
