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
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import "hardhat/console.sol";

error Raffle__NotEnoughETHEntered();
error Raffle__TransferFailed();
error Raffle__RaffleNotOpen();
error Raffle__IntervalNotPassed();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

contract Raffle is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
    /* Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    } // uint256 0 = OPEN, 1 = CALCULATING

    /* State Variables */
    // Chainlink VRF Variable
    IVRFCoordinatorV2Plus private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint256 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    address payable[] private s_players;
    RaffleState private s_raffleState;
    address private s_recentWinner;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;
    uint256 private immutable i_entranceFee;

    /* Event */
    event RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player);
    event WinnerPicked(address indexed player);

    /* Function */
    constructor(
        address vrfCoordinatorV2,
        uint256 subscriptionId,
        bytes32 gasLane, // keyHash
        uint256 interval,
        uint256 entranceFee,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2Plus(vrfCoordinatorV2) {
        i_vrfCoordinator = IVRFCoordinatorV2Plus(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_interval = interval;
        i_subscriptionId = subscriptionId;
        i_entranceFee = entranceFee;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle() public payable {
        // require(msg.value > i_entranceFee, "ETH too less!");
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETHEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__RaffleNotOpen();
        }
        s_players.push(payable(msg.sender));
        // Emit an event when we update a dynamic array or mapping
        // Named events with the function name reversed
        emit RaffleEnter(msg.sender);
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
        /*
        // Deprecated, Now V2.5 insteads of V2
        i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        */
        if ((block.timestamp - s_lastTimeStamp) <= i_interval) {
            revert Raffle__IntervalNotPassed();
        }
        s_raffleState = RaffleState.CALCULATING;

        // Prepare the ExtraArgs structure
        VRFV2PlusClient.ExtraArgsV1 memory extraArgsV1 = VRFV2PlusClient.ExtraArgsV1({
            nativePayment: true // Set to true or false depending on your use case
        });

        // Encode ExtraArgs to bytes
        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(extraArgsV1);

        // Prepare the RandomWordsRequest structure
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: i_gasLane,
            subId: i_subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: i_callbackGasLimit,
            numWords: NUM_WORDS,
            extraArgs: extraArgs
        });

        // Request random words using the prepared structure
        requestId = i_vrfCoordinator.requestRandomWords(req);
        emit RequestedRaffleWinner(requestId);
    }

    /**
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between raffle runs.
     * 2. The lottery is open.
     * 3. The contract has ETH.
     * 4. Implicity, your subscription is funded with LINK.
     */
    function checkUpkeep(
        bytes memory /* checkData */
    ) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        bool isOpen = RaffleState.OPEN == s_raffleState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0"); // can we comment this out?
    }

    /**
     * @dev Once `checkUpkeep` is returning `true`, this function is called
     * and it kicks off a Chainlink VRF call to get a random winner.
     */
    function performUpkeep(bytes calldata /* performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        // require(upkeepNeeded, "Upkeep not needed");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        s_raffleState = RaffleState.CALCULATING;

        // Prepare the ExtraArgs structure
        VRFV2PlusClient.ExtraArgsV1 memory extraArgsV1 = VRFV2PlusClient.ExtraArgsV1({
            nativePayment: true // Set to true or false depending on your use case
        });

        // Encode ExtraArgs to bytes
        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(extraArgsV1);

        // Prepare the RandomWordsRequest structure
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: i_gasLane,
            subId: i_subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: i_callbackGasLimit,
            numWords: NUM_WORDS,
            extraArgs: extraArgs
        });

        // Request random words using the prepared structure
        uint256 requestId = i_vrfCoordinator.requestRandomWords(req);

        // Quiz... is this redundant?
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] calldata randomWords
    ) internal override {
        // s_players size 10
        // randomNumber 202
        // 202 % 10 ? what's doesn't divide evenly into 202?
        // 20 * 10 = 200
        // 2
        // 202 % 10 = 2
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_players = new address payable[](0);
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        // require(success, "Transfer failed");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
}
