# Hardhat Smart Contract Project

## 1. Setup Visual Studio Code Development Environment

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

Debug `Node.js` need to open **Javascript Debug Terminal** first, via `ctrl + shift + p`

#### Reduce Gas Used:

-   Prioritize use `private` instead of `public`
-   Use `constant` which declare once in constructor
-   Use `immutable ` which declare once only

This is because blockchain will have higher `read` and `store` gas fee on storage block, lesser in bytes code block.

## 2. Known Issues

-   Dependencies combination is old, require some updates...
-   ...

### Find a bug?

If you found an issue or would like to submit an improvement to this demo project, please submit an issue using the issues tab above.
