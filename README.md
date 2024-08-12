# Practical Sample   With Hardhat + Solidity

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

---
### Success Deploy & Verified Of This Smart Contract To Sepolia Testnet

0xc2022b56eBC140B5FebCf9FBaB14c17db4C315C4
https://sepolia.etherscan.io/address/0xc2022b56eBC140B5FebCf9FBaB14c17db4C315C4#code
    Via deploy.js
https://sepolia.etherscan.io/address/0x3a827C119e1D746bb3C7bcbbf95c55246C8CcBdd#code 
    Via yarn hardhat deploy --network sepolia

### Public Reported Hacked Code References:

This website is records of all kind previous hacked smart contract:

https://rekt.news/leaderboard/


## 1. Git Version Control
First time initialize:
```
git config --global user.name "hoelee"
git config --global user.email "me@hoelee.com"
git init .
git add .
git checkout -b main
git commit -m "Initial Commit"
git remote set-url origin https://username:accessToken@git.hoelee.com/hoelee/ethers-simple-storage.git
git credential-cache exit // Fix Credential Error
```

Standard Update:
```
git add .
git commit -m "Describe what changes"
git push -u origin main
    // After set this, later easier usage via below line
git push
git pull
```

Development need exlude file can create root file with name .gitignore
```
node_modules
package.json
img
artifacts
cache
coverage
.env
.*
README.md
coverage.json
```

## 2. Setup Visual Studio Code Development Environment

Windows need to download install WSL
```
wsl --set-default Ubuntu-22.04
mkdir theProjectFolderName
cd theProjectFolderName
code .
// Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 16.14.2
nvm install node.js
nvm install 18 // Update node JS to v18
```
Visual Studio need to update code setting
```
"[solidity]": {
        "editor.defaultFormatter":"NomicFoundation.hardhat-solidity"
    }
```
Preparing of solidity development environment:
```
corepack enable // Enable yarn
yarn install solc
yarn add solc@0.8.7fixed
yarn solcjs --bin --abi --include-path node_modules/ --base-path . -o . SimpleStorage.sol
yarn add ethers // Compiler Error, Downgraded to v5.7.2
yarn add fs-extra
yarn add dotenv
yarn add prettier
yarn add prettier-plugin-solidity
```
Preparing of Hardhat Development Environment
```
yarn init 
// Manual delete main: index.js in package.json
yarn add --dev hardhat // Production no need --dev
nvm install 18
nvm use 18
nvm alias default 18
corepack enable // Enable yarn
yarn hardhat
yarn add --dev prettier prettier-plugin-solidity
yarn add --dev dotenv
yarn add --dev @nomiclabs/hardhat-etherscan // Auto verify Etherscan Samrt Contract
yarn add --dev @nomiclabs/hardhat-waffle
yarn add --dev solhint
yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers
yarn add --dev hardhat-gas-reporter
yarn add --dev solidity-coverage
yarn add --dev solhint
```
Other Terminal Useful Command 1:
```
// For Debuging Hardhat
npx hardhat --versose

// For Recompile
yarn hardhat clean // Or manual delete artifacts & cache folder
npm install

// For Listing Hardhat Local Blockchain node
yarn hardhat accounts
yarn hardhat node  // Run in Dedicated Terminal, Getting Blockchain server
yarn hardhat console --network localhost // Short Life To Test Solidity Code In Terminal
yarn hardhat compile
yarn hardhat run scripts/deploy.js --network localhost
yarn hardhat custom-task-name
    // Need create file in /tasks/custom-task-name.js
    // Add import in hardhat.config.js -> requir("/tasks/custom-task-name");
yarn hardhat test
yarn hardhat test --grep customSearchKeyword
    // Only will run the test with describe test that contain "customSearchKeyword"
```
Other Terminal Useful Command 2:
```
// For Getting Gas Used & Gas Price
yarn hardhat test
    // Will create a file in ./gas-report.txt
    // With .env of etherscan API key
// For Getting Coverage
yarn hardhat coverage
    // Checking code usage & tested percentage
// For Checking Code Best Practice
yarn solhint contracts/*.sol
// For Get Fake Price Feed On Localhost & Ganache
yarn hardhat deploy --tags mocks --network localhost
```
Debug ```Node.js``` need to open **Javascript Debug Terminal** first, via ```ctrl + shift + p```

#### Reduce Gas Used:
* Prioritize use ```private``` instead of ```public```
* Use ```constant``` which declare once in constructor
* Use ```immutable ``` which declare once only

This is because blockchain will have higher ```read``` and ```store``` gas fee on storage block, lesser in bytes code block.


## 3. Known Issue
* Dependencies combination is old, need update...
* ...

### Find a bug?
If you found an issue or would like to submit an improvement to this demo project, please submit an issue using the issues tab above.  

## 4. Well-known Vulnerabilities
* Reentrancy Attack
    * Locked with modifier while running withdraw function
    * Update variable immediately before call external function
* Integer Overflow / Underflow
    * Use compiler version >0.8.0 have check in place
* Front-Running
    * Use average gas fee / off peak times
    * Use commit-reveal schema
    * Use submarine send

## 5. Other Explored Features
* Generate Random Words
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


## 6. Looking Web 3.0 Developer For Your Project?
**Mr Hoelee** is Welcome Web 3.0 Remote Job, Contact Me Immediately Via WhatsApp <a href="https://wa.me/60175885290">+60175885290</a>
. 

Or You can email <a href="mailto:me@hoelee.com">me@hoelee.com</a> now. Thanks.

## 7. Like this project?
If you are feeling generous, buy me a coffee! - <a href="https://buymeacoffee.com/hoelee">buymeacoffee.com/hoelee</a>
