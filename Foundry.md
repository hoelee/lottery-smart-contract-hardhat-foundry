## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**
Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## 1. Setup Foundry Development Environment

```
Install Foundry
    curl -L https://foundry.paradigm.xyz | bash
Install ZKsync
    git clone https://github.com/matter-labs/foundry-zksync
    ./install-foundry-zksync
Use of L1 / L2 Compiler
    foundryup
    foundryup-zksync
Start Local Blockchain Node
    anvil
```

### Usage of forge:

```
Library Installation
    forge install smartcontractkit/chainlink-brownie-contracts@1.1.1 --no-commit
    forge install Rari-Capital/solmate --no-commit
    forge install cyfrin/foundry-devops --no-commit
    forge install transmissions11/solmate@v6 --no-commit

Usage
    forge build / forge compile
    forge test
    forge test -mt functionNameWithAnyBehind* -vvvv
    forge coverage --report debug > coverage.txt
    forge create Raffle --rpc-url HTTP://127.0.0.1:7545 --interactive --private-key 0x074a2cf34f5c15acec32ff0f95190b865ee8d2c448ae505e1a791404d6ce1da5
        This should avoid, better with use of keystore
    forge script script/DeployContract.s.sol  --rpc-url HTTP://127.0.0.1:7545 --broadcast --account localAccountName
    forge snapshot
        See Gas Usage For Each Function
```

### Usage of cast:

```
Convert HEX to DEC
    cast --to-base 0x714c2 dec
Encrypt Private Key Locally
    cast wallet import keyStoreName --interactive
Sign Public Transaction (Testnet / Mainnet)
    Ensure .env readed into CMD
        source .env
    Call contract store() function
        cast send 0Xabcdefabcdef "store(uint256)" 123 --rpc-url $RPC_URL --private-key $PRIVATE_KEY
    Call contract retrieve() function, using previous keystore locally (Need enter local password)
        cast call 0xabcdefabcdef "retrieve()" --rpc-url $RPC_URL --account keyStoreName
```

### Flow of the execution

1. Terminal Execution of Command:

    > forge test

    > forge script script/DeployRaffle.s.sol

2. HelperConfig.s.sol Initialized
    > if is local network, chainID == 31337, then create VRF Coordinator MOCK
3. DeployRaffle.s.sol
    > if subscription ID is 0, then use created VRF Coordinator Mock To create subscription, fund it & add consumer
4. If is test command, then will run setUp()

    > add player

    > if local network, then will fund VRF Coordinator

    > Then continue for the rest of test functions()
