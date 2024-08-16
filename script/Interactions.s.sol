// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {Raffle} from "../contracts/Raffle.sol";
import {DevOpsTools} from "foundry-devops/DevOpsTools.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import {LinkToken} from "../test/mocks/LinkToken.sol";
import {CodeConstants} from "./HelperConfig.s.sol";

contract CreateSubscription is Script {
    function createSubscriptionUsingConfig() public returns (uint256, address) {
        HelperConfig helperConfig = new HelperConfig();
        address vrfCoordinatorV2_5 = helperConfig
            .getConfigByChainId(block.chainid)
            .vrfCoordinatorV2_5;
        address myAccount = helperConfig.getConfigByChainId(block.chainid).myAccount;
        return createSubscription(vrfCoordinatorV2_5, myAccount);
    }

    function createSubscription(
        address vrfCoordinatorV2_5,
        address myAccount
    ) public returns (uint256, address) {
        console2.log(unicode"✨✨ CreateSubscription:createSubscription");
        console2.log("  >>> chainId: ", block.chainid);
        vm.startBroadcast(myAccount);
        uint256 subId = VRFCoordinatorV2_5Mock(vrfCoordinatorV2_5).createSubscription();
        vm.stopBroadcast();
        console2.log("  >>> subscription Id is - ", subId);
        console2.log("  >>> Please update the subscriptionId in HelperConfig.s.sol");
        return (subId, vrfCoordinatorV2_5);
    }

    function run() external returns (uint256, address) {
        console2.log(unicode"✨✨ CreateSubscription:run");
        return createSubscriptionUsingConfig();
    }
}

/*
    Fund Subscription Script:
    forge script script/Interactions.s.sol:FundSubscription --rpc-url $SEPOLIA_RPC_URL --broadcast --private-key $SEPOLIA_PRIVATE_KEY
    forge script script/Interactions.s.sol:FundSubscription --rpc-url $SEPOLIA_RPC_URL --broadcast --myAccount hoelee
 */
contract FundSubscription is CodeConstants, Script {
    uint96 public constant FUND_AMOUNT = 3 ether;
    uint96 public constant FUND_AMOUNT_CUSTOM = 2198 ether;

    function fundSubscriptionUsingConfig() public {
        HelperConfig helperConfig = new HelperConfig();
        uint256 subId = helperConfig.getConfig().subscriptionId;
        address vrfCoordinatorV2_5 = helperConfig.getConfig().vrfCoordinatorV2_5;
        address link = helperConfig.getConfig().link;
        address myAccount = helperConfig.getConfig().myAccount;

        if (subId == 0) {
            CreateSubscription createSub = new CreateSubscription();
            (uint256 updatedSubId, address updatedVRFv2) = createSub.run();
            subId = updatedSubId;
            vrfCoordinatorV2_5 = updatedVRFv2;
            console2.log(
                unicode"✨FundSubscription:fundSubscriptionUsingConfig - New SubId Created! "
            );
            console2.log("  >>> subscription id: ", subId);
            console2.log("  >>> VRF Address: ", vrfCoordinatorV2_5);
        }

        fundSubscription(vrfCoordinatorV2_5, subId, link, myAccount);
    }

    function fundSubscription(
        address vrfCoordinatorV2_5,
        uint256 subId,
        address linkToken,
        address myAccount
    ) public {
        console2.log(unicode"✨ FundSubscription:fundSubscription");
        if (block.chainid == LOCAL_CHAIN_ID) {
            vm.startBroadcast(myAccount);
            VRFCoordinatorV2_5Mock(vrfCoordinatorV2_5).fundSubscription(subId, FUND_AMOUNT);
            vm.stopBroadcast();
        } else {
            console2.log("  >>> Sender balance - ", LinkToken(linkToken).balanceOf(msg.sender));
            console2.log("  >>> Sender address:", msg.sender);
            console2.log("  >>> LINK: ", linkToken);
            console2.log("  >>> myAccount: ", myAccount);
            console2.log(
                "  >>> Subscription myAccount:",
                LinkToken(linkToken).balanceOf(address(this))
            );
            console2.log("  >>> Subscription address", address(this));
            vm.startBroadcast(myAccount);
            LinkToken(linkToken).transferAndCall(
                vrfCoordinatorV2_5,
                FUND_AMOUNT,
                abi.encode(subId)
            );
            vm.stopBroadcast();
        }
    }

    function run() external {
        console2.log(unicode"✨✨ FundSubscription:run");
        fundSubscriptionUsingConfig();
    }
}

contract AddConsumer is Script {
    function addConsumerUsingConfig(address mostRecentlyDeployed) public {
        HelperConfig helperConfig = new HelperConfig();
        uint256 subId = helperConfig.getConfig().subscriptionId;
        address vrfCoordinatorV2_5 = helperConfig.getConfig().vrfCoordinatorV2_5;
        address myAccount = helperConfig.getConfig().myAccount;

        addConsumer(mostRecentlyDeployed, vrfCoordinatorV2_5, subId, myAccount);
    }

    function addConsumer(
        address contractToAddToVrf,
        address vrfCoordinator,
        uint256 subId,
        address myAccount
    ) public {
        console2.log(unicode"✨ Interactions:AddConsumer contract: ", contractToAddToVrf);
        console2.log("  >>> Using vrfCoordinator: ", vrfCoordinator);
        console2.log("  >>> On ChainID: ", block.chainid);
        vm.startBroadcast(myAccount);
        VRFCoordinatorV2_5Mock(vrfCoordinator).addConsumer(subId, contractToAddToVrf);
        vm.stopBroadcast();
    }

    function run() external {
        console2.log(unicode"✨✨ AddConsumer:run");
        address mostRecentlyDeployed = DevOpsTools.get_most_recent_deployment(
            "Raffle",
            block.chainid
        );
        addConsumerUsingConfig(mostRecentlyDeployed);
    }
}
