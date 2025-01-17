const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
//require("../contracts/test/VRFCoordinatorV2_5Mock");

// 0.25 or 250000000000000000 is this the premium in LINK
const BASE_FEE = ethers.utils.parseEther("0.25");
// link per gas, is this the gas lane? // 0.000000001 LINK per gas
const GAS_PRICE_LINK = 1e9;
// This should be the conversion rate between Wei and LINK
const WEI_PRE_UNIT_LINK = ethers.utils.parseUnits("1", "ether");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // If we are on a local development network, we need to deploy mocks!
    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...");

        /* // Deprecated
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        });
        */
        await deploy("VRFCoordinatorV2_5Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK, WEI_PRE_UNIT_LINK],
        });

        log("Mocks Deployed!");
        log("----------------------------------------------------------");
        log(
            "You are deploying to a local network, you'll need a local network running to interact",
        );
        log(
            "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!",
        );
        log("----------------------------------------------------------");
    }
};
module.exports.tags = ["all", "mocks"];
