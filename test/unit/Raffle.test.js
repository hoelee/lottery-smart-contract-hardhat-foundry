const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { expect, assert } = require("chai");
const {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../../helper-hardhat-config");

// Run on development chain
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Test", function () {
          let addressMock, addressRaffle, addressDeployer, addressPlayer;
          let raffle, vrfCoordinatorV2_5Mock, namedAccounts, subscriptionId;
          let chainId, raffleEntranceFee, interval;

          beforeEach(async () => {
              namedAccounts = await getNamedAccounts();
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
              raffle = await ethers.getContractAt("Raffle", addressRaffle); // Default

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

                  assert.isFalse(upkeepNeeded);
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
              let subscriptionId;
              beforeEach(async () => {
                  //raffle = await raffle.connect(addressPlayer); // Test
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);

                  const subIdArr = await vrfCoordinatorV2_5Mock.getActiveSubscriptionIds(0, 100);
                  subscriptionId = subIdArr[0];
              });

              it("can only be called after performUpKeep", async () => {
                  const requestId = 0; // Not using
                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(0, raffle.address),
                  ).to.be.revertedWith("InvalidRequest");

                  await expect(
                      vrfCoordinatorV2_5Mock.fulfillRandomWords(1, raffle.address), // reverts if not fulfilled
                  ).to.be.revertedWith("InvalidRequest");
              });

              // Complete Test
              it("picks a winner, reset the raffle, and send money to the winner", async () => {
                  const additionalEntrances = 3;
                  const startingAccountIndex = 2; // deployer = 0, player = 1
                  let accounts = await ethers.getSigners(); // Many accounts
                  // getNamedAccounts() is not working here, because only 2 accounts are named

                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrances;
                      i++
                  ) {
                      const accountConnectedRaffle = await raffle.connect(accounts[i]);
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee });
                  }
                  const startingTimeStamp = await raffle.getLastTimeStamp();
                  // This will be more important for our staging tests...
                  await new Promise(async (resolve, reject) => {
                      // just a promise to handle the event listener
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!");
                          // assert throws an error if it fails, so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          try {
                              // Now lets get the ending values...
                              const recentWinner = await raffle.getRecentWinner();
                              const raffleState = await raffle.getRaffleState();
                              const winnerBalance = await accounts[2].getBalance();
                              const endingTimeStamp = await raffle.getLastTimeStamp();
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              // Comparisons to check if our ending values are correct:
                              assert.equal(recentWinner.toString(), accounts[2].address);
                              assert.equal(raffleState, 0);
                              assert.equal(
                                  winnerBalance.toString(),
                                  startingBalance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                                      .add(
                                          raffleEntranceFee
                                              .mul(additionalEntrances)
                                              .add(raffleEntranceFee),
                                      )
                                      .toString(),
                              );
                              assert(endingTimeStamp > startingTimeStamp);
                              resolve(); // if try passes, resolves the promise
                          } catch (e) {
                              reject(e); // if try fails, rejects the promise
                          }
                      });
                      // kicking off the event by mocking the chainlink keepers and vrf coordinator
                      try {
                          const tx = await raffle.performUpkeep("0x");
                          const txReceipt = await tx.wait(1);
                          startingBalance = await accounts[2].getBalance();

                          const subscription =
                              await vrfCoordinatorV2_5Mock.getSubscription(subscriptionId);
                          const balance = subscription.balance;
                          const owner = subscription.owner;
                          const consumers = subscription.consumers;

                          console.log(`Subscription ID: ${subscriptionId}`);
                          console.log(`Subscription Owner: ${owner}`);
                          console.log(
                              `Subscription Balance: ${ethers.utils.formatEther(balance)} ETH`,
                          );
                          console.log(`Consumers: ${consumers}`); // This should include your Raffle contract address

                          // Verify the Raffle contract address matches the consumer
                          assert(
                              consumers.includes(raffle.address),
                              "Raffle contract not authorized as a consumer!",
                          );

                          // Log post-fulfillment details
                          const updatedSubscription =
                              await vrfCoordinatorV2_5Mock.getSubscription(subscriptionId);
                          console.log(
                              `Updated Subscription Balance: ${ethers.utils.formatEther(updatedSubscription.balance)} ETH`,
                          );

                          // Here cannot run, always InsufficientBalance()
                          await vrfCoordinatorV2_5Mock.fulfillRandomWords(
                              txReceipt.events[1].args.requestId,
                              raffle.address,
                          );
                      } catch (e) {
                          reject(e);
                      }
                  });
              });
          });
      });
