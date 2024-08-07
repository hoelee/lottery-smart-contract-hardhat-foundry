// SPDX-License-Identifier: Unlicense

/*
Raffle Contract
Enter the lottery (paying some amount)
Pick a random winner (verifiably random)
Winner to be selected every X minutes -> completely automated
Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keeper)
*/
pragma solidity ^0.8.7;

///// UPDATE IMPORTS TO V2.5 /////
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

error Raffle__NotEnoughETHEntered();

contract Raffle is VRFConsumerBaseV2Plus {
    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /* Event */
    event RaffleEnter(address indexed player);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        // require(msg.value > i_entranceFee, "ETH too less!");
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        s_players.push(payable(msg.sender));
        // Events - Update
    }

    function requestRandomWinner() external returns (uint256 requestId) {
        // Use Chainlink VRF V2 & Chainlink keeper
        // https://docs.chain.link/vrf/v2/subscription/examples/get-a-random-number
        // 0xb91d9cab0193d3cda599df11c4889f89c4a9fef9ec403de158ea67ce1f3a9e26
        /**
         * Create subscription at https://vrf.chain.link/ (MetaMask #1)
         * Add Fund To The Created Subsciption Contract (MetaMask #2)
         * Add Consumer
         *     Get Subscription ID
         *     Open Remix To Prepare Deploy Consumer Contract https://docs.chain.link/vrf/v2-5/migration-from-v2
         *     Change To Correct gwei limit hash address at https://docs.chain.link/vrf/v2/subscription/supported-networks
         *     Adjust Setting - random words count, confirmation blocks etc.
         *     Insert Subscription ID - v2 is uint64 BUT **v2.5 is uint256**
         *     Deploy And Get hash address (MetaMask #3)
         *     Insert in chainlink consumer (Metamask #4)
         * Ready to use, record down the consumer contract address
         *         *
         * v2.5 uint256 Subscription ID - 54852953177758767717007928774683925681326589777506065303357242036079980899870
         * Admin Contract Creator address - 0xc9445e993daea4ba3f1fe1080f0f6f8c46b4d967
         * Consumer address - 0x22eec58ce2cee446051337d71d59c89cb004d1c7
         * Admin Approval Contract address - 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B
         */
        // Request Random Number
        //
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {}

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
