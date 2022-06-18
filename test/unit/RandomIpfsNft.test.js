const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../hardhat-helper-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", async function () {
          let randomIpfsNft, deployer, vrfCoordinatorV2Mock;

          beforeEach(async () => {
              accounts = await ethers.getSigners();
              deployer = accounts[0];

              await deployments.fixture(["mocks", "nft"]);

              randomIpfsNft = await ethers.getContract("RandomIpfsNft");
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
          });

          describe("constructor", function () {
              it("initializes token uris correctly", async function () {
                  const tokenUri = await randomIpfsNft.getTokenUris(0);
                  const mintFee = await randomIpfsNft.getMintFee();

                  assert(tokenUri.includes("ipfs://"));
                  assert(mintFee > 0);
              });
          });

          describe("requestNft", function () {
              it("rejects less than mint fee", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NotEnoughMintFee"
                  );
              });

              it("emits nft requested event when sufficient fee provided", async function () {
                  const mintFee = randomIpfsNft.getMintFee();
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  );
              });

              it("mints nft successfully", async function () {
                  const beforeBalance = await deployer.getBalance();

                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          console.log("NftMinted event fired...");
                          try {
                              const tokenUri = await randomIpfsNft.getTokenUris(0);
                              const afterBalance = await deployer.getBalance();

                              assert(tokenUri.includes("ipfs://"));
                              assert(afterBalance < beforeBalance);

                              resolve();
                          } catch (e) {
                              reject(e);
                          }
                      });

                      try {
                          const mintFee = await randomIpfsNft.getMintFee();
                          const tx = await randomIpfsNft.requestNft({ value: mintFee });

                          const receipt = await tx.wait(1);
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              receipt.events[1].args.requestId,
                              randomIpfsNft.address
                          );
                      } catch (e) {
                          console.log(e);
                          reject(e);
                      }
                  });
              });
          });
      });
