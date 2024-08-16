# Hoelee Smart Contract - Automate Lottery

## Grand Porject Overview
This Project Smart Contract Created With
1. ```Solidity``` Contract + ```Hardhat``` + ```node.js``` for Test
2. ```Solidity``` Contract & Test + ```Foundry```


># Hardhat Project

A fully functional Smart Contract wrriten with ```solidity```, ```node.js``` and using ```Hardhat``` to show usage of all kinds of standard development features, including:
* running blockchain node in localhost - ```hardhat``` & ```ganache```
* solidity prettier code beautifier setup
* standard of developing Smart Contract with ```solidity```
* standard of developing ```node.js``` script to use ```hardhat``` library efficiently
* check gas fee & gas price in real-time, with usage of ```coverage```
* auto verify contract on Etherscan.io
* creating automate test cases - unit test & staging test
* creating tasks etc.
* refactor codes to reduce gas fee
* write code in best practice, with usage of ```solhint```
* prettier ```solidity``` & ```node.js``` code
* gitea version control

This project mainly to keep as a reference for future Web 3.0 Developments.

>Read More in [Hardhat Project's Note Page](./Hardhat.md).

---

># Foundry Project
Same Lottery Project, Use Of ```Solidity``` to test smart contract, ensure high coverage of function correctness. Feature included:
* Modular Enable Test In Multiple Networks With Different Conditions
* Local Network Using Of Anvil + Mock VRF (Verifiable Randomness Function)
* Testnet Use of Latest V2.5 Chainlink VRF Subscription With Consumer Subscription
* Use of Custom LinkToken on Sepolia Testnet
* Smart Contract Test With High Coverage To Ensure Correctness
* Private Key Encrypted With Keystore, Safer Usage With Password
* Smart Contract Layer-2 Ready (ZKsync)

>Read More In [Foundry Project's Note Page](./Foundry.md).

### Success Deploy & Verified Smart Contract In Sepolia Testnet

0xc2022b56eBC140B5FebCf9FBaB14c17db4C315C4
https://sepolia.etherscan.io/address/0xc2022b56eBC140B5FebCf9FBaB14c17db4C315C4#code
    Via deploy.js
https://sepolia.etherscan.io/address/0x3a827C119e1D746bb3C7bcbbf95c55246C8CcBdd#code 
    Via yarn hardhat deploy --network sepolia

### Public Reported Hacked Code References:

This website is records of all kind previous hacked smart contract:

https://rekt.news/leaderboard/


## 1. Understanding Of Known Vulnerabilities
* Reentrancy Attack
    * Locked with modifier while running withdraw function
    * Update variable immediately before call external function
* Integer Overflow / Underflow
    * Use compiler version >0.8.0 have check in place
* Front-Running
    * Use average gas fee / off peak times
    * Use commit-reveal schema
    * Use submarine send

## 2. Other Explored Features
1. Generate Random Words
    * Create subscription at https://vrf.chain.link/ (MetaMask #1)
    * Add Fund To The Created Subsciption Contract (MetaMask #2)
    * Add Consumer
        * Get Subscription ID
        * Open Remix To Prepare Deploy Consumer Contract https://docs.chain.link/vrf/v2-5/migration-from-v2 
        * Change To Correct gwei limit hash address at https://docs.chain.link/vrf/v2/subscription/supported-networks
        * Adjust Setting - random words count, confirmation blocks etc.
        * Insert Subscription ID - v2 is uint64 BUT **v2.5 is uint256**
        * Deploy And Get hash address (MetaMask #3)
        * Insert in chainlink consumer (Metamask #4)
    * Ready to use, record down the consumer contract address
2. New Time Based Trigger Automation Through Chainlink UpKeep
    * Same As VRF Subscription, V2.5 Optional Reduced Steps
    * Setup At https://automation.chain.link/
    * After Subscription Created, Funded, & Setup Interval:
        * VRFCoordinator will call checkUpkeep(bytes memory checkData)
        * checkUpkeep true will call internal contract performUpkeep(bytes calldata performData)

## 3. Looking Web 3.0 Developer For Your Project?
**Mr Hoelee** is Welcome Web 3.0 Remote Job, Contact Me Immediately Via WhatsApp <a href="https://wa.me/60175885290">+60175885290</a>

Or You can email <a href="mailto:me@hoelee.com">me@hoelee.com</a> now. Thanks.


## 4. Like this project?
If you are feeling generous, buy me a coffee! - <a href="https://buymeacoffee.com/hoelee">buymeacoffee.com/hoelee</a>
