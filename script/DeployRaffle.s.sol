// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {Raffle} from "contracts/Raffle.sol";
import {AddConsumer, CreateSubscription, FundSubscription} from "./Interactions.s.sol";

contract DeployRaffle is Script {
    function run() external returns (Raffle, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig(); // This comes with our mocks!
        AddConsumer addConsumer = new AddConsumer();
        HelperConfig.NetworkConfig memory config = helperConfig.getConfig();

        console2.log(unicode"✨ ✨DeployRaffle:run");
        console2.log("  >>> subscriptionId - ", config.subscriptionId);
        console2.log("  >>> link - ", config.link);
        console2.log("  >>> myAccount - ", config.myAccount);

        if (config.subscriptionId == 0) {
            CreateSubscription createSubscription = new CreateSubscription();
            (config.subscriptionId, config.vrfCoordinatorV2_5) = createSubscription
                .createSubscription(config.vrfCoordinatorV2_5, config.myAccount);

            FundSubscription fundSubscription = new FundSubscription();
            fundSubscription.fundSubscription(
                config.vrfCoordinatorV2_5,
                config.subscriptionId,
                config.link,
                config.myAccount
            );

            helperConfig.setConfig(block.chainid, config);
        }

        vm.startBroadcast(config.myAccount);
        Raffle raffle = new Raffle(
            config.vrfCoordinatorV2_5,
            config.subscriptionId,
            config.gasLane,
            config.automationUpdateInterval,
            config.raffleEntranceFee,
            config.callbackGasLimit
        );
        vm.stopBroadcast();

        // We already have a broadcast in here
        addConsumer.addConsumer(
            address(raffle),
            config.vrfCoordinatorV2_5,
            config.subscriptionId,
            config.myAccount
        );
        return (raffle, helperConfig);
    }
}
