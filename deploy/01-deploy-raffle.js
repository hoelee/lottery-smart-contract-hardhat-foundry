const { network, ethers, deployments } = require("hardhat");
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments;
    const { deployer, player } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock;
    const FUND_AMOUNT = ethers.utils.parseEther("1"); // 1 Ether, or 1e18 (10^18) Wei

    // 31337 is the chainId for localhost
    if (developmentChains.includes(network.name)) {
        // Mock Auto Create VRF V2.5 Subscription

        /* // Deprecated 
        vrfCoordinatorV2_5Mock = await get("VRFCoordinatorV2_5Mock");
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address;

        // Get the contract instance at the retrieved address
        const vrfCoordinatorV2_5MockInstance = await ethers.getContractAt(
            "VRFCoordinatorV2_5Mock",
            vrfCoordinatorV2_5Address,
        );        
        */

        // Create a subscription
        vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock");
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address;
        const transactionResponse = await vrfCoordinatorV2_5Mock.createSubscription();
        const createSubReceipt = await transactionResponse.wait(1);
        subscriptionId = createSubReceipt.events[0].args.subId; // Keep as BigNumber

        // Fund the subscription
        await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT);

        const subscription = await vrfCoordinatorV2_5Mock.getSubscription(subscriptionId);

        const balance = subscription.balance;
        console.log(`Subscription balance: ${ethers.utils.formatEther(balance)} Ether`);
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
        const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock");
        await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, raffle.address);

        // Verify if the consumer is added correctly
        const subscription = await vrfCoordinatorV2_5Mock.getSubscription(subscriptionId);
        console.log(`Consumers: ${subscription.consumers}`); // Should now include raffle.address

        /* // Deprecated
        vrfCoordinatorV2_5Mock = await deployments.get("VRFCoordinatorV2_5Mock");
        vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.address;

        // Get the contract instance at the retrieved address
        const vrfCoordinatorV2_5MockInstance = await ethers.getContractAt(
            "VRFCoordinatorV2_5Mock",
            vrfCoordinatorV2_5Address,
        );

        await vrfCoordinatorV2_5MockInstance.addConsumer(subscriptionId, raffle.address);
        */
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
