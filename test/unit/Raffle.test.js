const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { expect, assert } = require("chai");
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../../helper-hardhat-config");

const isDevelopment = developmentChains.includes(network.name);

// Run on development chain
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", function () {
          let addressMock, addressRaffle, addressDeployer, addressPlayer;
          let raffle, vrfCoordinatorV2_5Mock, vrfCoordinatorV2_5Address, player;
          let chainId, raffleEntranceFee, interval;

          beforeEach(async () => {
              const namedAccounts = await getNamedAccounts();
              addressDeployer = namedAccounts.deployer;
              addressPlayer = namedAccounts.player;
              await deployments.fixture(["all"]);

              // Implementation for dependencies without "@nomiclabs/hardhat-ethers": "npm:hardhat-deploy-ethers@^0.3.0-beta.13",
              addressMock = (await deployments.get("VRFCoordinatorV2_5Mock")).address;
              addressRaffle = (await deployments.get("Raffle")).address;
              vrfCoordinatorV2_5Mock = await ethers.getContractAt(
                  "VRFCoordinatorV2_5Mock",
                  addressMock,
              );
              raffle = await ethers.getContractAt("Raffle", addressRaffle);

              // raffle = await deployments.get("Raffle"); // Wrong, not the contract instance
              // raffle = await ethers.getContract("Raffle"); // With hardaht-ethers dependency override
              chainId = network.config.chainId;

              raffleEntranceFee = await raffle.getEntranceFee();
              interval = await raffle.getInterval();
          });

          describe("constructor", function () {
              it("initial correct raffle state", async () => {
                  const raffleState = await raffle.getRaffleState();
                  assert.equal(raffleState, 0, "Incorrect raffle state");
              });
              it("initial correct interval", async () => {
                  const interval = (await raffle.getInterval()).toString();
                  const networkConfigInterval = networkConfig[chainId]["keepersUpdateInterval"];
                  assert.equal(interval, networkConfigInterval, "Incorrect interval");
              });
          }); //endof constructor

          describe("enterRaffle", function () {
              it("should revert if not enough payment", async () => {
                  /*
                  const entranceFee = networkConfig[chainId]["raffleEntranceFee"];
                  const entranceFeeString = ethers.utils.formatEther(entranceFee);
                  const entranceFeeWei = ethers.utils.parseEther(entranceFeeString);
                  const insufficientPayment = entranceFeeWei.sub(ethers.utils.parseEther("0.01")); // Set payment less than entrance fee
                    */
                  const entranceFee = await raffle.getEntranceFee();
                  const entranceFeeString = ethers.utils.formatEther(entranceFee);
                  console.log(entranceFeeString); // 0.01
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughETHEntered",
                  );
              });

              it("records player when they enter", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  const contractPlayer = await raffle.getPlayer(0);
                  assert.equal(contractPlayer, addressDeployer);
              });

              it("should emit the correct event on enter", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter",
                  );
              });

              it("not allow entrance when raffle is calculating state", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);

                  // Pretend to be a chainlink upkeep
                  await raffle.performUpkeep([]);
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__RaffleNotOpen",
                  );
              });
          }); //endof enterRaffle

          describe("checkUpkeep", function () {
              it("should return false if nobody send any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  // Static call to not spend gas & modify state
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.isFalse(upkeepNeeded);
              });

              it("should return true if raffle is in calculating state", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);

                  // Pretend to be a chainlink upkeep
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.isTrue(upkeepNeeded);
              });

              it("should return false if raffle is not open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  await raffle.performUpkeep("0x");
                  const raffleState = await raffle.getRaffleState();
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.isFalse(upkeepNeeded);
              });
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]); // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] }); // Alternative to write
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded);
              });
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded);
              });
          }); //endof checkUpkeep

          describe("performUpkeep", function () {
              it("it can only run if checkupkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const tx = await raffle.performUpkeep("0x");

                  assert(tx);
              });
              it("it should revert if checkupkeep is false", async () => {
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded",
                  );
              });
              it("update the raffle sate, emits and event, and call the vrf coordinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const txResponse = await raffle.performUpkeep("0x");

                  const txReceipt = await txResponse.wait(1);
                  const requestId = txReceipt.events[1].args.requestId; // 2nd Event
                  const currentRaffleState = await raffle.getRaffleState();

                  assert(requestId.toNumber() > 0);
                  assert(currentRaffleState == 1);
              });
          });

          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
              });

              it("can only be called after performUpKeep", async () => {
                  const requestId = 0; // Not using
                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(0, raffle.address),
                  ).to.be.revertedWith("InvalidRequest");
              });
          });
      });
