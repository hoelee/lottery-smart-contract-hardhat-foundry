const { network, ethers } = require("hardhat");
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock;

    if (chainId == 31337) {
        const FUND_AMOUNT = ethers.utils.parseEther("1"); // 1 Ether, or 1e18 (10^18) Wei

        // Mock Auto Create VRF V2.5 Subscription

        /* // Deprecated 
        //vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address;
        const transactionResponse = await vrfCoordinatorV2_5Mock.createSubscription();
        */

        vrfCoordinatorV2_5Mock = await get("VRFCoordinatorV2_5Mock");
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address;

        // Get the contract instance at the retrieved address
        const vrfCoordinatorV2_5MockInstance = await ethers.getContractAt(
            "VRFCoordinatorV2_5Mock",
            vrfCoordinatorV2_5Address,
        );

        // Create a subscription
        const createSubTx = await vrfCoordinatorV2_5MockInstance.createSubscription();
        const createSubReceipt = await createSubTx.wait(1);
        subscriptionId = createSubReceipt.events[0].args.subId; // Keep as BigNumber

        const formattedSubscriptionId = ethers.BigNumber.from(subscriptionId);
        // Fund the subscription
        await vrfCoordinatorV2_5MockInstance.fundSubscription(formattedSubscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2_5Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS;

    log("----------------------------------------------------");
    const arguments = [
        vrfCoordinatorV2_5Address,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["keepersUpdateInterval"],
        networkConfig[chainId]["raffleEntranceFee"],
        networkConfig[chainId]["callbackGasLimit"],
    ];

    // Actual Deploy Of the Smart Contract
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    });

    // Ensure the Raffle contract is a valid consumer of the VRFCoordinatorV2Mock contract.

    if (developmentChains.includes(network.name)) {
        /* // Deprecated
        //const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        //await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, raffle.address);
        */

        vrfCoordinatorV2_5Mock = await get("VRFCoordinatorV2_5Mock");
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address;

        // Get the contract instance at the retrieved address
        const vrfCoordinatorV2_5MockInstance = await ethers.getContractAt(
            "VRFCoordinatorV2_5Mock",
            vrfCoordinatorV2_5Address,
        );

        vrfCoordinatorV2_5MockInstance.addConsumer(subscriptionId, raffle.address);
    }

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(raffle.address, arguments);
    }

    log("Enter lottery with command:");
    const networkName = network.name == "hardhat" ? "localhost" : network.name;
    log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`);
    log("----------------------------------------------------");
};

module.exports.tags = ["all", "raffle"];